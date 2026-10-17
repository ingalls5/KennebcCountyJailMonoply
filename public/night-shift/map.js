import {validateLayout,loadLayout,baseCorridors,roomLinks,roomWalls,hallwayFixtures,stairAt,corridorContains,corridorTasks,elevatorAt} from './layout.js?v=machinery-1';
export const width=1280,height=960;
const room=(name,x,y,color,kind,task)=>({name,x,y,w:490,h:310,color,kind,task});
export const floors=[
 {code:'B1',name:'Basement',subtitle:'BELOW THE SHIFT',rooms:[room('Utilities',100,110,'#5f6d70','utilities','Reset the breaker panel'),room('Laundry',690,110,'#687d81','laundry','Restart a laundry cycle'),room('Storage',100,540,'#7d7567','storage','Inventory supplies'),room('Evidence',690,540,'#707486','evidence','Log an evidence bag')]},
 {code:'01',name:'1st floor / Intake',subtitle:'ARRIVALS & DEPARTURES',rooms:[room('Intake',100,110,'#778a8c','intake','Complete an intake record'),room('Booking',690,110,'#828477','booking','Match the booking files'),room('Medical',100,540,'#6b8d86','medical','Restock the medical cabinet'),room('Sallyport',690,540,'#7a858c','sallyport','Check the transport vehicle')]},
 {code:'02',name:'2nd floor',subtitle:'KEEP THE COUNT',rooms:[room('A-Unit',100,110,'#7d8c8b','cells','Complete the A-Unit count'),room('T-Unit',690,110,'#7e858d','cells','Complete the T-Unit count'),room('Dayroom',100,540,'#7b8c7b','dayroom','Check the dayroom cameras'),room('Rec yard',690,540,'#637d72','yard','Inspect the workout station')]},
 {code:'03',name:'3rd floor',subtitle:'ABOVE THE NOISE',rooms:[room('Control',100,110,'#687d8b','control','Restore a camera feed'),room('Programs',690,110,'#8b8375','classroom','Sort the program materials'),room('Staff room',100,540,'#867b76','staff','Collect the shift reports'),room('Mechanical',690,540,'#6a7678','utilities','Check ventilation pressure')]}
];
export const lift={x:600,y:112,w:80,h:104};
export const stairs=[{x:88,y:447,w:70,h:66,name:'PRA',direction:-1},{x:1120,y:447,w:70,h:66,name:'PRB',direction:1}];
export const taskPoints=r=>r.tasks?r.tasks.map(t=>({...t,x:r.x+t.x*r.w,y:r.y+t.y*r.h})):[{id:r.id||r.name,name:r.task,x:r.x+422,y:r.y+235}];
export const taskPoint=r=>taskPoints(r)[0]||{x:r.x+r.w/2,y:r.y+r.h/2};
export let cameraStationId=null;
export function cameraRoom(camera){const x=camera.x+camera.w/2,y=camera.y+camera.h/2;return floors[camera.level].rooms.filter(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h).sort((a,b)=>a.w*a.h-b.w*b.h)[0]||null;}
export function cameraHallway(camera){const x=camera.x+camera.w/2,y=camera.y+camera.h/2;return corridorsFor(camera.level).find(c=>corridorContains(c,x,y))||null;}
export function cameraCoverage(camera){const room=cameraRoom(camera);if(room)return {kind:'room',name:room.name,bounds:room};const hallway=cameraHallway(camera);if(!hallway)return null;const x=camera.x+camera.w/2,y=camera.y+camera.h/2,reach=160;const left=Math.max(hallway.x,x-reach),top=Math.max(hallway.y,y-reach),right=Math.min(hallway.x+hallway.w,x+reach),bottom=Math.min(hallway.y+hallway.h,y+reach);return {kind:'hallway',name:hallway.name||'Hallway',hallway,bounds:{x:left,y:top,w:right-left,h:bottom-top}};}
export const cameraStationFor=floor=>(floors[floor].decorations||[]).find(d=>d.type==='monitors'&&d.id===cameraStationId)||null;
export function atCameraStation(floor,player){const d=cameraStationFor(floor);if(!d)return false;const end={x:d.x+d.w/2,y:d.y+d.h/2},distance=Math.hypot(end.x-player.x,end.y-player.y);if(distance>=85)return false;const steps=Math.max(1,Math.ceil(distance/5));for(let i=0;i<=steps;i++){const t=i/steps;if(!walkable(floor,player.x+(end.x-player.x)*t,player.y+(end.y-player.y)*t,0))return false;}return true;}
export const passages=[];
export const staircases=[];
let elevatorConfig=null;
export const corridorsFor=floor=>floors[floor].custom?floors[floor].corridors:baseCorridors;
export const liftFor=floor=>floors[floor].custom?(elevatorConfig?.floors?.includes(floor)?elevatorAt(elevatorConfig,corridorsFor(floor),floor):null):lift;
export const stairsFor=floor=>floors[floor].custom?staircases.filter(s=>floor>=s.startFloor&&floor<=s.endFloor&&!(s.excludedFloors||[]).includes(floor)).map(s=>stairAt(s,corridorsFor(floor),floor)):stairs;
export const stairDestination=(stair,floor)=>stairsFor(floor).find(s=>s.id===stair.id)||stairsFor(floor).find(s=>s.name===stair.name)||null;
export const spawnFor=floor=>floors[floor].custom?hallwayFixtures(corridorsFor(floor)).spawn:{x:640,y:480};
export const linksFor=floor=>floors[floor].custom?[...floors[floor].rooms,...stairsFor(floor),liftFor(floor)].filter(Boolean).flatMap(r=>roomLinks(r,corridorsFor(floor))):[315,905].flatMap(x=>[{x,y:410,w:60,h:40},{x,y:520,w:60,h:40}]);
export const jobsFor=floor=>[...floors[floor].rooms.flatMap(r=>taskPoints(r)),...corridorsFor(floor).flatMap(corridorTasks)];
export function furniture(){return [];}

const inside=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
export function walkable(floor,x,y,radius=10){if(floors[floor].custom&&floors[floor].rooms.some(room=>roomWalls(room,corridorsFor(floor)).some(w=>x+radius>=w.x&&x-radius<=w.x+w.w&&y+radius>=w.y&&y-radius<=w.y+w.h)))return false;const areas=[...floors[floor].rooms,...stairsFor(floor),liftFor(floor),...linksFor(floor)].filter(Boolean);return [[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dy])=>(areas.some(r=>inside(x+dx,y+dy,r))||corridorsFor(floor).some(c=>corridorContains(c,x+dx,y+dy))))&&!floors[floor].rooms.flatMap(furniture).filter(r=>r.type!=='parking').some(r=>x>r.x-radius&&x<r.x+r.w+radius&&y>r.y-radius&&y<r.y+r.h+radius);}
export function findPath(floor,start,end){const step=floors[floor].custom?10:20,key=(x,y)=>x+','+y,snap=n=>Math.round(n/step)*step;const sx=snap(start.x),sy=snap(start.y),tx=snap(end.x),ty=snap(end.y);if(!walkable(floor,tx,ty))return [];const q=[[sx,sy]],seen=new Map([[key(sx,sy),null]]);for(let i=0;i<q.length;i++){const [x,y]=q[i];if(x===tx&&y===ty){const path=[];let k=key(x,y);while(k){const [x,y]=k.split(',').map(Number);path.unshift({x,y});k=seen.get(k);}return path.slice(1);}for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!seen.has(k)&&nx>=0&&ny>=0&&nx<=width&&ny<=height&&walkable(floor,nx,ny)&&[.25,.5,.75].every(t=>walkable(floor,x+dx*t,y+dy*t))){seen.set(k,key(x,y));q.push([nx,ny]);}}}return [];}

export let sharedMapRevision=0,sharedMapError=null;
export let sharedLayout=null;
if(typeof window!=='undefined'){try{const response=await fetch('/api/night-shift/map',{cache:'no-store'});if(!response.ok)throw Error('Shared map is unavailable. Reload to try again.');const saved=await response.json();sharedMapRevision=saved.revision;sharedLayout=saved.layout?validateLayout(saved.layout):null;}catch(e){sharedMapError=e.message;}}
try{const layout=sharedLayout||loadLayout();if(layout){cameraStationId=layout.cameraStationId;layout.floors.forEach((f,i)=>{floors[i].decorations=f.decorations;floors[i].rooms=f.rooms;floors[i].corridors=f.corridors;floors[i].custom=true;for(const r of floors[i].rooms)r.clearZones=roomLinks(r,corridorsFor(i));});passages.push(...layout.passages);staircases.push(...layout.stairs);elevatorConfig=layout.elevator;}}catch{}
