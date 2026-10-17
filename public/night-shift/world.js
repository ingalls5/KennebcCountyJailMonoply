import {roomWalls,roomLinks,roomDoors,corridorContains,hallwayFixtures,stairAt,elevatorAt,passageLanding} from './layout.js?v=meetings-1';
export const center=r=>({x:r.x+r.w/2,y:r.y+r.h/2});
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const liftAt=(layout,floor)=>layout.elevator?.floors.includes(floor)?elevatorAt(layout.elevator,layout.floors[floor].corridors,floor):null;
export const stepsAt=(layout,floor)=>layout.stairs.filter(s=>floor>=s.startFloor&&floor<=s.endFloor&&!(s.excludedFloors||[]).includes(floor)).map(s=>stairAt(s,layout.floors[floor].corridors,floor));
const inside=(p,r,radius=0)=>p.x+radius>=r.x&&p.x-radius<=r.x+r.w&&p.y+radius>=r.y&&p.y-radius<=r.y+r.h;
export function worldWalkable(layout,floor,x,y,radius=10,effect=null){
 const f=layout.floors[floor];if(!f||!Number.isFinite(x)||!Number.isFinite(y))return false;
 if(f.rooms.some(r=>roomWalls(r,f.corridors).some(w=>inside({x,y},w,radius))))return false;
 if(effect?.type==='doors'&&effect.doors.some(d=>d.floor===floor&&inside({x,y},d,radius)))return false;
 const areas=[...f.rooms,...stepsAt(layout,floor),liftAt(layout,floor)].filter(Boolean);areas.push(...areas.flatMap(r=>roomLinks(r,f.corridors)));
 return [[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dy])=>areas.some(r=>x+dx>=r.x&&x+dx<=r.x+r.w&&y+dy>=r.y&&y+dy<=r.y+r.h)||f.corridors.some(c=>corridorContains(c,x+dx,y+dy)));
}
export function worldSpawn(layout,floor=1){const f=layout.floors[floor],candidate=hallwayFixtures(f.corridors).spawn;if(worldWalkable(layout,floor,candidate.x,candidate.y))return {floor,...candidate};for(const r of [...f.rooms,...f.corridors]){const p=center(r);if(worldWalkable(layout,floor,p.x,p.y))return {floor,...p};}throw Error('Add an accessible starting area on this floor.');}
export function tunnelEndpoints(layout,floor){const result=[];for(const p of layout.passages)for(const [from,to]of [[p.from,p.to],[p.to,p.from]])if(from.floor===floor){const r=layout.floors[floor].rooms.find(r=>r.id===from.roomId);if(r)result.push({id:p.id,name:p.name,to,point:passageLanding(r,p=>worldWalkable(layout,floor,p.x,p.y))});}return result;}
export function jammedDoors(layout,station){const f=layout.floors[station.floor],rooms=[...f.rooms].sort((a,b)=>(a.id===station.roomId?-1:b.id===station.roomId?1:0));return rooms.filter(r=>roomDoors(r,f.corridors).length).slice(0,2).flatMap(r=>roomDoors(r,f.corridors).map(d=>({...d,floor:station.floor,roomId:r.id,roomName:r.name})));}
export function lineClear(layout,floor,a,b,effect=null){if(effect?.type==='doors')effect={...effect,doors:effect.doors.filter(d=>d.floor!==floor||!inside(a,d,10))};const length=distance(a,b),steps=Math.max(1,Math.ceil(length/4));for(let i=0;i<=steps;i++)if(!worldWalkable(layout,floor,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,10,effect))return false;return true;}
