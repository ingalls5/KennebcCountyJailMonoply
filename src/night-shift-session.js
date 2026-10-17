import {taskGames} from '../public/night-shift/tasks.js';
import {sabotages,sabotageFor,sabotageCooldown,poweredGames} from '../public/night-shift/sabotage-rules.js';
import {roomTaskLocation,taskObstacles} from './night-shift-assignments.js';
import {validateLayout,passageLanding} from '../public/night-shift/layout.js';
import {worldSpawn,worldWalkable,lineClear,center,distance,liftAt,stepsAt,tunnelEndpoints,jammedDoors} from '../public/night-shift/world.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const colors=['#65a5b8','#cc8f80','#c6b674','#8fb698','#ad99be','#ce9d68'];
const cleanName=data=>{const name=typeof data.name==='string'?data.name.trim():'';if(!name||name.length>24)fail(400,'Enter a name with 1 to 24 characters.');return name;};
export function createStations(layout){
 const rooms=shuffle(layout.floors.flatMap((f,floor)=>f.rooms.map(room=>({room,floor,point:roomTaskLocation(room,f,Math.random,taskObstacles(layout,floor))}))).filter(r=>r.point));if(!rooms.length)fail(400,'Add accessible rooms before creating a game.');
 const games=shuffle(taskGames.filter(g=>g.id!=='auto')),stations=[];
 for(let i=0;i<Math.max(20,rooms.length);i++){const {room,floor}=rooms[i%rooms.length],point=roomTaskLocation(room,layout.floors[floor],Math.random,[...taskObstacles(layout,floor),...stations.filter(s=>s.floor===floor).map(s=>({...s,point:true}))]),game=games[i%games.length];stations.push({id:crypto.randomUUID(),name:game.name,game:game.id,roomId:room.id,roomName:room.name,floor,...point});}
 const access=stations.find(s=>s.game==='keypad');if(access&&!jammedDoors(layout,access).length){const target=stations.find(s=>jammedDoors(layout,s).length);if(target){const keys=['floor','roomId','roomName','x','y'];const swap=Object.fromEntries(keys.map(k=>[k,access[k]]));for(const k of keys){access[k]=target[k];target[k]=swap[k];}}}return stations;
}
function personalTasks(stations){const groups=shuffle([0,1,2,3]).map(f=>shuffle(stations.filter(s=>s.floor===f))),chosen=[];for(let i=0;chosen.length<6;i++){const list=groups[i%4],pick=list.find(s=>!chosen.includes(s)&&!chosen.some(t=>t.game===s.game))||list.find(s=>!chosen.includes(s));if(pick)chosen.push(pick);if(i>100)fail(400,'Add more task stations before starting.');}return chosen.map(s=>({...s,stationId:s.id,id:crypto.randomUUID()}));}
const publicEffect=s=>s?{id:s.id,type:s.type,stationId:s.stationId,floor:s.floor,roomName:s.roomName,doors:s.doors||[],startedAt:s.startedAt}:null;
export function projectSession(room,member,now=Date.now()){
 return {code:room.code,status:room.status,round:room.round,revision:room.revision,serverTime:now,host:room.host===member.id,mapRevision:room.mapRevision,stations:room.stations,sabotage:publicEffect(room.sabotage),
  members:room.members.map(p=>({id:p.id,name:p.name,color:p.color,position:p.position,working:!!p.work&&p.work.expiresAt>now,online:now-p.seenAt<15000})),
  me:{id:member.id,name:member.name,role:member.role,position:member.position,tasks:member.tasks,completed:member.completed,sabotageCount:member.sabotageCount,cooldownUntil:member.cooldownUntil,workId:member.work?.id||null},
  };
}
export async function handleSession(ctx,request){
 try{
  const path=new URL(request.url).pathname.slice('/session/'.length),now=Date.now();const data=request.method==='POST'?(path==='init'?await request.json():await smallBody(request)):null;let room=await ctx.storage.get('session');
  if(path==='init'&&request.method==='POST'){
   if(room)fail(409,'That room code is already in use.');const layout=validateLayout(data.layout),name=cleanName(data);worldSpawn(layout);
   const member={id:crypto.randomUUID(),token:token(),name,color:colors[0],position:worldSpawn(layout),role:null,tasks:[],completed:[],sabotageCount:0,cooldownUntil:0,seenAt:now,lastMoveAt:now,work:null};
   room={code:data.code,mapRevision:data.mapRevision,layout,host:member.id,status:'lobby',round:0,revision:1,members:[member],stations:createStations(layout),sabotage:null,nextSabotageAt:0};await save(ctx,room);return json({...projectSession(room,member,now),token:member.token},201);
  }
  if(!room)fail(404,'This game has ended or the room code is incorrect.');
  if(path==='join'&&request.method==='POST'){
   if(room.status!=='lobby')fail(409,'This game has started. Reconnect using the device you joined with.');if(room.members.length>=6)fail(409,'This room already has six players.');const name=cleanName(data);if(room.members.some(p=>p.name.toLowerCase()===name.toLowerCase()))fail(400,'Choose a different player name.');
   const member={id:crypto.randomUUID(),token:token(),name,color:colors.find(c=>!room.members.some(p=>p.color===c)),position:worldSpawn(room.layout),role:null,tasks:[],completed:[],sabotageCount:0,cooldownUntil:0,seenAt:now,lastMoveAt:now,work:null};room.members.push(member);room.revision++;await save(ctx,room);return json({...projectSession(room,member,now),token:member.token},201);
  }
  const credential=request.headers.get('Authorization')?.replace(/^Bearer /,''),member=room.members.find(p=>p.token===credential);if(!member)fail(401,'Your room seat could not be verified. Rejoin the room.');
  if(path==='map'&&request.method==='GET')return json({layout:room.layout,revision:room.mapRevision});
  if(path==='state'&&request.method==='GET')return json(projectSession(room,member,now));
  if(request.method!=='POST')fail(405,'Use a valid game action.');member.seenAt=now;
  if(path==='end'){
   if(room.host!==member.id)fail(403,'Only the host can end this game.');await ctx.storage.deleteAll();await ctx.storage.deleteAlarm?.();return json({ended:true});
  }
  if(path==='leave'){
   if(room.status!=='lobby')fail(409,'Your seat is saved for reconnection. The host can end the game.');room.members=room.members.filter(p=>p.id!==member.id);if(!room.members.length){await ctx.storage.deleteAll();return json({left:true});}if(room.host===member.id)room.host=room.members[0].id;room.revision++;await save(ctx,room);return json({left:true});
  }
  if(path==='start'){
   if(room.host!==member.id)fail(403,'Only the host can start this game.');if(room.status!=='lobby')fail(409,'The game has already started.');if(room.members.length<3)fail(400,'At least three players must join before starting.');
   const killer=shuffle(room.members)[0].id;room.status='playing';room.round++;room.sabotage=null;room.nextSabotageAt=now+10000;
   room.members.forEach(p=>{p.role=p.id===killer?'killer':'officer';p.position=worldSpawn(room.layout);p.lastMoveAt=now;p.work=null;p.completed=[];p.cooldownUntil=room.nextSabotageAt;p.sabotageCount=0;p.tasks=p.role==='killer'?sabotages.map(s=>{const station=room.stations.find(t=>t.game===s.game);return {...station,stationId:station.id,id:crypto.randomUUID(),sabotageType:s.id};}):personalTasks(room.stations);});room.revision++;
  }else if(path==='sync'){
   let corrected=false;if(member.work?.expiresAt<=now)member.work=null;
   if(room.status==='playing'&&data.position){const p=data.position,elapsed=Math.min(1.5,Math.max(.1,(now-member.lastMoveAt)/1000)),current=member.position;const standing=distance(current,p)<.1;const trail=Array.isArray(data.path)&&data.path.length<=64?data.path:[];const points=[current,...trail,p];let length=0,clear=true;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(!Number.isFinite(b?.x)||!Number.isFinite(b?.y)){clear=false;break;}length+=distance(a,b);if(!lineClear(room.layout,current.floor,a,b,room.sabotage)){clear=false;break;}}
    if(Number.isInteger(p.floor)&&p.floor===current.floor&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!member.work&&length<=190*elapsed+15&&(standing||clear)){member.position={floor:p.floor,x:p.x,y:p.y};}else if(!standing||p.floor!==current.floor)corrected=true;member.lastMoveAt=now;
   }
   if(member.work?.expiresAt<=now)member.work=null;await save(ctx,room);return json({...projectSession(room,member,now),corrected});
  }else{
   if(room.status!=='playing')fail(409,'Wait for the host to start the game.');if(data.round!==room.round)fail(409,'This game changed. Reload to reconnect.');
   if(path==='travel')travel(room,member,data,now);
   else if(path==='begin'){
    const station=room.stations.find(s=>s.id===data.stationId);if(!station)fail(400,'Choose a task station.');const kind=data.kind;if(!['task','sabotage','repair'].includes(kind))fail(400,'Choose a valid station action.');
    if(kind==='sabotage'){
     if(member.role!=='killer')fail(403,'Only the killer can sabotage stations.');const def=sabotageFor(data.type);if(!def||station.game!==def.game)fail(400,'That sabotage belongs at its matching task station.');if(room.sabotage)fail(409,'One sabotage is already active.');if(now<room.nextSabotageAt)fail(409,'Wait for the sabotage cooldown.');if(def.id==='doors'&&!jammedDoors(room.layout,station).length)fail(409,'This floor has no room doors to jam.');
    }
    if(kind==='repair'&&(!room.sabotage||data.effectId!==room.sabotage.id||station.id!==room.sabotage.stationId))fail(409,'That sabotage has already been repaired.');
    const atDoor=kind==='repair'&&room.sabotage.type==='doors'&&room.sabotage.doors.some(d=>d.floor===member.position.floor&&distance(member.position,center(d))<90);
    if(!atDoor&&(station.floor!==member.position.floor||distance(station,member.position)>78||!lineClear(room.layout,station.floor,member.position,station,room.sabotage)))fail(403,'Walk to this station before working on it.');
    if(kind==='task'&&room.sabotage?.type==='power'&&poweredGames.has(station.game))fail(409,'Power is out. Restore the breaker before starting this equipment.');
    member.work={id:crypto.randomUUID(),kind,stationId:station.id,type:kind==='sabotage'?data.type:null,effectId:kind==='repair'?room.sabotage.id:null,startedAt:now,expiresAt:now+20*60*1000};await save(ctx,room);return json({...projectSession(room,member,now),workId:member.work.id});
   }else if(path==='cancel'){if(member.work?.id===data.workId)member.work=null;}
   else if(path==='finish'){
    if(member.lastFinished===data.workId)return json(projectSession(room,member,now));const work=member.work;if(!work||work.id!==data.workId||work.expiresAt<=now)fail(409,'Reopen this station to continue.');const station=room.stations.find(s=>s.id===work.stationId);
    if(work.kind==='sabotage'){
     if(member.role!=='killer')fail(403,'Only the killer can sabotage.');if(room.sabotage)fail(409,'Another sabotage is already active.');if(now<room.nextSabotageAt)fail(409,'Wait for the sabotage cooldown.');room.sabotage={id:crypto.randomUUID(),type:work.type,stationId:station.id,floor:station.floor,roomName:station.roomName,startedAt:now,...(work.type==='doors'?{doors:jammedDoors(room.layout,station)}:{})};member.sabotageCount++;room.nextSabotageAt=now+sabotageCooldown;member.cooldownUntil=room.nextSabotageAt;
    }else if(work.kind==='repair'){
     if(room.sabotage?.id===work.effectId){room.sabotage=null;room.nextSabotageAt=Math.max(room.nextSabotageAt,now+10000);for(const p of room.members)if(p.role==='killer')p.cooldownUntil=room.nextSabotageAt;}
    }else{
     if(room.sabotage?.type==='power'&&poweredGames.has(station.game))fail(409,'The station has no power. Restore the breaker, then retry saving.');const task=member.role==='officer'&&member.tasks.find(t=>t.stationId===station.id);if(task&&!member.completed.includes(task.id))member.completed.push(task.id);
    }
    member.lastFinished=work.id;member.work=null;room.revision++;
   }else fail(404,'Game action not found.');
  }
  await save(ctx,room);return json(projectSession(room,member,now));
 }catch(error){return json({error:error.message||'Could not update the game.'},error.status||400);}
}
async function smallBody(request){const raw=await request.text();if(raw.length>3000)fail(413,'That request is too large.');try{const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{fail(400,'Send a valid game request.');}}
async function save(ctx,room){await ctx.storage.put('session',room);await ctx.storage.setAlarm?.(Date.now()+24*60*60*1000);}
function travel(room,member,data,now){
 if(member.work)fail(409,'Close the task before traveling.');const current=member.position,floor=current.floor,destination=Number(data.floor),layout=room.layout;let point;
 if(data.kind==='tunnel'){
  if(member.role!=='killer')fail(403,'Only killers can use Skidgel tunnels.');const endpoint=tunnelEndpoints(layout,floor).find(e=>e.id===data.passageId);if(!endpoint||distance(current,endpoint.point)>=65)fail(403,'Walk to the tunnel grate first.');const target=endpoint.to,r=layout.floors[target.floor].rooms.find(r=>r.id===target.roomId);point={floor:target.floor,...passageLanding(r,p=>worldWalkable(layout,target.floor,p.x,p.y))};
 }else if(data.kind==='elevator'){
  const source=liftAt(layout,floor),target=liftAt(layout,destination);if(!source||!target||distance(current,center(source))>=90)fail(403,'Walk to the elevator first.');point={floor:destination,...center(target)};
 }else if(data.kind==='stairs'){
  const source=stepsAt(layout,floor).find(s=>s.id===data.stairId),target=source&&(stepsAt(layout,destination).find(s=>s.id===source.id)||stepsAt(layout,destination).find(s=>s.name===source.name));if(!source||!target||distance(current,center(source))>=85)fail(403,'Walk to a connected stairwell first.');point={floor:destination,...center(target)};
 }else fail(400,'Choose stairs, elevator, or a tunnel.');member.position=point;member.lastMoveAt=now;
}
