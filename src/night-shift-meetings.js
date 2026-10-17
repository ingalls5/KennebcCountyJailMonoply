import {chooseMeetingScene} from '../public/night-shift/meeting-result-rules.js';
import {center,distance,worldSpawn,worldWalkable} from '../public/night-shift/world.js';
import {roomDoors} from '../public/night-shift/layout.js';
import {killStartGrace} from '../public/night-shift/player-rules.js';
export const roundDuration=180000,escortDuration=14000;
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
export function meetingLocation(layout,pattern=/briefing/i){
 for(const [floor,f] of layout.floors.entries())for(const room of f.rooms)if(pattern.test(room.name))return {floor,...center(room),roomId:room.id,name:room.name,room};
 const point=worldSpawn(layout);return {...point,name:'Briefing point',room:null};
}
function circlePoint(room,index,count){const place=meetingLocation(room.layout),angle=index/Math.max(1,count)*Math.PI*2-Math.PI/2,radius=place.room?Math.max(0,Math.min(100,place.room.w/2-26,place.room.h/2-26)):0;const point={floor:place.floor,x:place.x+Math.cos(angle)*radius,y:place.y+Math.sin(angle)*radius};return worldWalkable(room.layout,point.floor,point.x,point.y)?point:{floor:place.floor,x:place.x,y:place.y};}
export function startMeeting(room,callerId,now){
 const living=room.members.filter(p=>p.alive!==false).map(p=>p.id),first=callerId?living.indexOf(callerId):((room.meetingCount||0)%Math.max(1,living.length)),order=[...living.slice(first),...living.slice(0,first)];
 room.meetingCount=(room.meetingCount||0)+1;room.phase='discussion';room.roundEndsAt=null;room.sabotage=null;room.bodies=[];
 room.meeting={id:crypto.randomUUID(),number:room.meetingCount,callerId:callerId||null,reason:callerId?'emergency':'round',startedAt:now,order,turn:0,messages:[],done:[],votes:{},result:null};
 room.members.forEach((p,i)=>{p.position=circlePoint(room,i,room.members.length);p.lastMoveAt=now;p.work=null;});room.revision++;
 if(!order.length)room.phase='voting';
}
export function beginRound(room,now){room.phase='round';room.roundEndsAt=now+roundDuration;room.round++;room.nextSabotageAt=now+10000;room.members.forEach(p=>{p.work=null;p.lastMoveAt=now;p.cooldownUntil=room.nextSabotageAt;if(p.role==='killer')p.killReadyAt=now+killStartGrace;});room.revision++;}
export function advanceMeetingClock(room,now){
 if(room.status!=='playing')return false;
 if(!room.phase){room.phase='round';room.roundEndsAt=now+roundDuration;return true;}
 if(room.phase==='round'&&now>=room.roundEndsAt){startMeeting(room,null,now);return true;}
 if(room.phase==='escort'&&now>=room.meeting.result.endsAt){beginRound(room,now);return true;}
 return false;
}
export function publicMeeting(room,member){const m=room.meeting;if(!m)return null;return {id:m.id,number:m.number,callerId:m.callerId,reason:m.reason,startedAt:m.startedAt,order:m.order,turn:m.turn,messages:m.messages,trimmedMessages:m.trimmedMessages||0,done:m.done,voted:Object.keys(m.votes),myVote:m.votes[member.id]??null,result:m.result};}
function escortRoute(layout){const place=meetingLocation(layout,/sally\s*port/i),r=place.room;if(!r)return {floor:place.floor,roomName:'Sallyport',from:{x:250,y:340},to:{x:930,y:340},door:{x:950,y:340},room:null};const f=layout.floors[place.floor],doors=roomDoors(r,f.corridors||[]),door=doors[0],from=center(r),to=door?center(door):{x:r.x+r.w-10,y:r.y+r.h/2};return {floor:place.floor,roomName:r.name,from,to,door:to,room:{x:r.x,y:r.y,w:r.w,h:r.h}};}
export function meetingAction(room,member,path,data,now){
 if(room.status!=='playing')fail(409,'Wait for the game to start.');
 if(path==='meeting'){
  if(room.phase!=='round')fail(409,'A meeting is already underway.');if(member.alive===false)fail(403,'Only living players can call a meeting.');if(data.round!==room.round)fail(409,'This round changed. Reconnect before calling a meeting.');
  const place=meetingLocation(room.layout);if(place.floor!==member.position.floor||distance(place,member.position)>85||place.room&&(member.position.x<place.room.x||member.position.x>place.room.x+place.room.w||member.position.y<place.room.y||member.position.y>place.room.y+place.room.h))fail(403,'Walk to the meeting button in the briefing room.');startMeeting(room,member.id,now);return;
 }
 const m=room.meeting;if(!m||data.meetingId!==m.id)fail(409,'This meeting changed. Reconnect to the current meeting.');if(!m.order.includes(member.id)||member.alive===false)fail(403,'Eliminated players can watch, but cannot speak or vote.');
 if(path==='speak'){
  if(room.phase!=='discussion'||m.order[m.turn]!==member.id)fail(403,'Wait for your speaking turn.');const message=typeof data.message==='string'?data.message.trim():'';if(!message||message.length>600)fail(400,'Write a message of 1–600 characters.');if(typeof data.id!=='string'||!data.id||data.id.length>80)fail(400,'A message identifier is required.');if(m.messages.some(p=>p.id===data.id&&p.playerId===member.id))return;m.messages.push({id:data.id,playerId:member.id,message,at:now});while(new TextEncoder().encode(JSON.stringify(m.messages)).length>32000){m.messages.shift();m.trimmedMessages=(m.trimmedMessages||0)+1;}
 }else if(path==='speaker-done'){
  if(m.done.includes(member.id))return;if(room.phase!=='discussion'||m.order[m.turn]!==member.id)fail(403,'Wait for your speaking turn.');m.done.push(member.id);m.turn++;if(m.turn>=m.order.length)room.phase='voting';
 }else if(path==='vote'){
  const target=data.targetId;if(target!=='skip'&&!m.order.includes(target))fail(400,'Choose a player or Skip.');if(Object.hasOwn(m.votes,member.id)){if(m.votes[member.id]===target)return;fail(409,'Your vote is already submitted.');}if(!['discussion','voting'].includes(room.phase))fail(409,'Voting is closed for this meeting.');m.votes[member.id]=target;
 }else fail(404,'Meeting action not found.');resolveMeeting(room,now);room.revision++;
}
export function nextSessionAlarm(room,now=Date.now()){if(room.status==='playing'&&room.phase==='round')return Math.min(room.expiresAt||now+86400000,room.roundEndsAt);if(room.phase==='escort')return Math.min(room.expiresAt||now+86400000,room.meeting.result.endsAt);return room.expiresAt||now+86400000;}

function resolveMeeting(room,now){const m=room.meeting;if(!['discussion','voting'].includes(room.phase)||m.done.length!==m.order.length||Object.keys(m.votes).length!==m.order.length)return;
 const counts={};for(const id of Object.values(m.votes))counts[id]=(counts[id]||0)+1;const ejectedId=m.order.find(id=>(counts[id]||0)>m.order.length/2)||null;
 const scene=chooseMeetingScene(!!ejectedId,room.lastMeetingScene);room.lastMeetingScene=scene;
 m.result={ejectedId,counts,votes:{...m.votes},scene,seed:crypto.getRandomValues(new Uint32Array(1))[0],startedAt:now,endsAt:now+escortDuration,route:ejectedId?escortRoute(room.layout):null};room.phase='escort';if(ejectedId){const target=room.members.find(p=>p.id===ejectedId);target.alive=false;target.ejected=true;target.work=null;}
}
