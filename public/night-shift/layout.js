export const layoutKey='night-shift-layout-v2';
export const baseCorridors=[{x:80,y:430,w:1120,h:100},{x:600,y:80,w:80,h:800}];
export const kinds=['blank','intake','booking','medical','sallyport','cells','dayroom','yard','control','classroom','staff','utilities','laundry','storage','evidence'];
const defaultsStairs=()=>[{id:'west-stairs',name:'West stairwell',startFloor:0,endFloor:3,x:100,y:450,w:60,h:60,anchor:'hall-start'},{id:'east-stairs',name:'East stairwell',startFloor:0,endFloor:3,x:1120,y:450,w:60,h:60,anchor:'hall-end'}];
export function validateLayout(source){
 if(source?.version!==2||!Array.isArray(source.floors)||source.floors.length!==4||!Array.isArray(source.passages)||source.passages.length>60)throw Error('Choose a valid Night Shift map file.');
 const ids=new Set(),number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max,name=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 function identity(id){if(!name(id,80)||ids.has(id))throw Error('Each map item needs a unique identifier.');ids.add(id);return id;}
 function tasks(list){if(!Array.isArray(list)||list.length>8)throw Error('Each room or hallway supports up to eight jobs.');return list.map(t=>{if(!name(t.id,80)||!name(t.name,80)||!number(t.x,.1,.9)||!number(t.y,.1,.9))throw Error('Check job station names and positions.');return {id:t.id,name:t.name.trim(),x:t.x,y:t.y};});}
 const floors=source.floors.map((f,level)=>{
  if(!Array.isArray(f.rooms)||f.rooms.length>30||!Array.isArray(f.corridors)||f.corridors.length>(f.editableCorridors?32:30))throw Error('Each floor supports 30 rooms and 32 hallways.');
  return {editableCorridors:true,rooms:f.rooms.map(r=>{
   if(!name(r.name,40)||!number(r.x,20,1180)||!number(r.y,20,860)||!number(r.w,100,1200)||!number(r.h,100,900)||r.x+r.w>1260||r.y+r.h>940||!kinds.includes(r.kind)||!/^#[0-9a-f]{6}$/i.test(r.color))throw Error('Check room names, sizes, and positions.');
   return {id:identity(r.id),name:r.name.trim(),x:r.x,y:r.y,w:r.w,h:r.h,kind:r.kind,color:r.color,tasks:tasks(r.tasks)};
  }),corridors:(f.editableCorridors?f.corridors:[...baseCorridors,...f.corridors]).map((c,i)=>{
   const shape=c.shape||'straight';if(!['straight','curve'].includes(shape)||!number(c.x,20,1220)||!number(c.y,20,900)||!number(c.w,shape==='curve'?120:40,1200)||!number(c.h,shape==='curve'?120:40,900)||c.x+c.w>1260||c.y+c.h>940||c.name!==undefined&&!name(c.name,40))throw Error('Check hallway names, sizes, and positions.');
   const thickness=c.thickness??Math.min(80,Math.min(c.w,c.h)*.6),rotation=c.rotation??0;if(shape==='curve'&&(!number(thickness,40,Math.min(c.w,c.h)*.7)||!Number.isInteger(rotation)||rotation<0||rotation>3))throw Error('Keep curved hallways at least 120 units across and 40 units wide.');
   return {id:identity(c.id||`hall-${level}-${i}`),name:c.name?.trim()||`Hallway ${i+1}`,x:c.x,y:c.y,w:c.w,h:c.h,shape,thickness,rotation,tasks:tasks(c.tasks||[])};
  })};
 });
 const passages=source.passages.map(p=>{if(!name(p.id,80)||!name(p.name,60)||![p.from,p.to].every(e=>Number.isInteger(e?.floor)&&e.floor>=0&&e.floor<4&&floors[e.floor].rooms.some(r=>r.id===e.roomId))||p.from.roomId===p.to.roomId)throw Error('Connect each secret passage to two different rooms.');return {id:p.id,name:p.name.trim(),from:{floor:p.from.floor,roomId:p.from.roomId},to:{floor:p.to.floor,roomId:p.to.roomId}};});
 const stairs=(source.stairs===undefined?defaultsStairs():source.stairs);if(!Array.isArray(stairs)||stairs.length>16)throw Error('Use up to sixteen staircases.');
 const cleanStairs=stairs.map(s=>{if(!name(s.name,40)||!Number.isInteger(s.startFloor)||!Number.isInteger(s.endFloor)||s.startFloor<0||s.endFloor>3||s.startFloor>=s.endFloor||!number(s.x,20,1220)||!number(s.y,20,900)||!number(s.w,40,160)||!number(s.h,40,160)||s.x+s.w>1260||s.y+s.h>940||![undefined,null,'hall-start','hall-end'].includes(s.anchor))throw Error('Choose a lower starting level and a higher stopping level for each staircase.');return {id:identity(s.id),name:s.name.trim(),startFloor:s.startFloor,endFloor:s.endFloor,x:s.x,y:s.y,w:s.w,h:s.h,anchor:s.anchor||null};});
 const e=source.elevator||{name:'Elevator',x:610,y:165,w:60,h:70,anchor:'hall'};
 if(!name(e.name,40)||!number(e.x,20,1220)||!number(e.y,20,900)||!number(e.w,40,160)||!number(e.h,40,160)||e.x+e.w>1260||e.y+e.h>940||![undefined,null,'hall'].includes(e.anchor))throw Error('Keep the elevator inside the map, between 40 and 160 units in size.');
 return {version:2,floors,passages,stairs:cleanStairs,elevator:{name:e.name.trim(),x:e.x,y:e.y,w:e.w,h:e.h,anchor:e.anchor||null}};
}
export function defaultLayout(floors){return validateLayout({version:2,floors:floors.map((f,i)=>({rooms:f.rooms.map((r,j)=>({...r,id:`room-${i}-${j}`,tasks:r.tasks||[{id:`task-${i}-${j}`,name:r.task,x:.86,y:.76}]})),editableCorridors:true,corridors:baseCorridors.map(c=>({...c}))})),passages:[],stairs:defaultsStairs()});}
export function saveLayout(layout){const clean=validateLayout(layout);localStorage.setItem(layoutKey,JSON.stringify(clean));return clean;}
export function loadLayout(){try{const data=JSON.parse(localStorage.getItem(layoutKey));return data?validateLayout(data):null;}catch{return null;}}
export function corridorPoint(c,t=.5){if(c.shape!=='curve')return c.w>=c.h?{x:c.x+c.w*t,y:c.y+c.h/2}:{x:c.x+c.w/2,y:c.y+c.h*t};const pad=c.thickness/2,rx=c.w-2*pad,ry=c.h-2*pad,a=t*Math.PI/2,rotation=c.rotation||0,right=rotation===1||rotation===2,bottom=rotation>=2;return {x:(right?c.x+c.w-pad:c.x+pad)+(right?-1:1)*rx*Math.cos(a),y:(bottom?c.y+c.h-pad:c.y+pad)+(bottom?-1:1)*ry*Math.sin(a)};}
export const corridorSamples=c=>Array.from({length:33},(_,i)=>corridorPoint(c,i/32));
export const corridorSvg=c=>corridorSamples(c).map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
function closestOnSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+t*dx,y:a.y+t*dy};}
export function corridorContains(c,x,y){if(c.shape!=='curve')return x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h;const p={x,y},samples=corridorSamples(c);return samples.slice(1).some((b,i)=>{const q=closestOnSegment(p,samples[i],b);return Math.hypot(q.x-x,q.y-y)<=c.thickness/2;});}
export function corridorTasks(c){return (c.tasks||[]).map(t=>({...t,...(c.shape==='curve'?corridorPoint(c,t.x):{x:c.x+c.w*t.x,y:c.y+c.h*t.y})}));}
export function roomLinks(room,corridors){const center={x:room.x+room.w/2,y:room.y+room.h/2};let best;for(const c of corridors){const candidates=c.shape==='curve'?corridorSamples(c):[{x:Math.max(c.x,Math.min(c.x+c.w,center.x)),y:Math.max(c.y,Math.min(c.y+c.h,center.y))}];for(const b of candidates){const a={x:Math.max(room.x,Math.min(room.x+room.w,b.x)),y:Math.max(room.y,Math.min(room.y+room.h,b.y))},distance=Math.hypot(a.x-b.x,a.y-b.y);if(!best||distance<best.distance)best={a,b,distance};}}if(!best)return [];const {a,b}=best;return [{x:Math.min(a.x,b.x)-30,y:a.y-30,w:Math.abs(a.x-b.x)+60,h:60},{x:b.x-30,y:Math.min(a.y,b.y)-30,w:60,h:Math.abs(a.y-b.y)+60}];}
export function stairAt(s,corridors){if(!s.anchor||!corridors.length)return {...s};const point=corridorPoint(corridors[0],s.anchor==='hall-start'?.04:.96);return {...s,x:point.x-s.w/2,y:point.y-s.h/2};}
export function hallwayFixtures(corridors){const hall=corridors[0]||baseCorridors[0],shaft=corridors[1]||hall,center=corridorPoint(shaft,.15);return {lift:{x:center.x-30,y:center.y-35,w:60,h:70},stairs:defaultsStairs().map(s=>stairAt(s,corridors)),spawn:corridorPoint(hall,.5)};}

export function elevatorAt(e,corridors){if(!e||e.anchor==='hall')return {...e,...hallwayFixtures(corridors).lift};return {...e};}
