export const width=1280,height=960;
const room=(name,x,y,color,kind,task)=>({name,x,y,w:490,h:310,color,kind,task});
export const floors=[
 {code:'B1',name:'Basement',subtitle:'BELOW THE SHIFT',rooms:[room('Utilities',100,110,'#5f6d70','utilities','Reset the breaker panel'),room('Laundry',690,110,'#687d81','laundry','Restart a laundry cycle'),room('Storage',100,540,'#7d7567','storage','Inventory supplies'),room('Evidence',690,540,'#707486','evidence','Log an evidence bag')]},
 {code:'01',name:'1st floor / Intake',subtitle:'ARRIVALS & DEPARTURES',rooms:[room('Intake',100,110,'#778a8c','intake','Complete an intake record'),room('Booking',690,110,'#828477','booking','Match the booking files'),room('Medical',100,540,'#6b8d86','medical','Restock the medical cabinet'),room('Sallyport',690,540,'#7a858c','sallyport','Check the transport vehicle')]},
 {code:'02',name:'2nd floor',subtitle:'KEEP THE COUNT',rooms:[room('A-Unit',100,110,'#7d8c8b','cells','Complete the A-Unit count'),room('T-Unit',690,110,'#7e858d','cells','Complete the T-Unit count'),room('Dayroom',100,540,'#7b8c7b','dayroom','Check the dayroom cameras'),room('Rec yard',690,540,'#637d72','yard','Inspect the workout station')]},
 {code:'03',name:'3rd floor',subtitle:'ABOVE THE NOISE',rooms:[room('Control',100,110,'#687d8b','control','Restore a camera feed'),room('Programs',690,110,'#8b8375','classroom','Sort the program materials'),room('Staff room',100,540,'#867b76','staff','Collect the shift reports'),room('Mechanical',690,540,'#6a7678','utilities','Check ventilation pressure')]}
];
export const lift={x:600,y:112,w:80,h:104};
export const stairs=[{x:88,y:447,w:70,h:66,direction:-1},{x:1120,y:447,w:70,h:66,direction:1}];
export const taskPoint=r=>({x:r.x+422,y:r.y+235});
export function furniture(r){const out=[];const put=(x,y,w,h,type)=>out.push({x:r.x+x,y:r.y+y,w,h,type});
 if(r.kind==='cells'){for(let i=0;i<4;i++)put(24+i*113,24,100,100,'cell');put(35,190,160,42,'table');}
 else if(r.kind==='sallyport'){put(60,70,100,180,'car');put(220,70,100,180,'parking');for(let i=0;i<5;i++)put(375,22+i*34,65,28,'locker');}
 else if(r.kind==='yard'){put(55,55,170,65,'workout');put(290,55,110,65,'workout');put(65,235,180,25,'bench');}
 else if(r.kind==='medical'){put(38,55,80,150,'bed');put(175,55,80,150,'bed');put(310,30,130,45,'cabinet');}
 else if(r.kind==='laundry'){for(let i=0;i<4;i++)put(30+i*105,36,80,70,'washer');put(80,185,230,55,'table');}
 else if(r.kind==='utilities'){put(30,35,90,170,'machine');put(160,35,110,90,'machine');put(330,30,110,55,'cabinet');}
 else if(r.kind==='storage'||r.kind==='evidence'){for(let i=0;i<3;i++)put(35+i*145,35,115,85,'shelf');put(45,210,180,36,'table');}
 else if(r.kind==='control'){put(30,28,410,50,'monitors');put(70,165,260,65,'desk');}
 else if(r.kind==='classroom'){for(let row=0;row<2;row++)for(let col=0;col<3;col++)put(40+col*140,80+row*100,95,40,'table');put(60,20,340,14,'board');}
 else if(r.kind==='dayroom'){put(40,40,120,60,'table');put(230,40,120,60,'table');put(50,190,240,40,'bench');put(390,35,40,65,'tv');}
 else if(r.kind==='staff'){put(35,35,100,80,'cabinet');put(200,40,200,60,'table');put(35,200,250,50,'sofa');}
 else{put(30,30,190,55,'desk');put(275,30,160,45,'cabinet');put(40,180,130,45,'bench');put(290,150,55,70,'desk');}
 return out;
}
const inside=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
export function walkable(floor,x,y,radius=10){const areas=[{x:80,y:430,w:1120,h:100},{x:600,y:80,w:80,h:800},...floors[floor].rooms,...[315,905].flatMap(x=>[{x,y:410,w:60,h:40},{x,y:520,w:60,h:40}])];return [[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dy])=>areas.some(r=>inside(x+dx,y+dy,r)))&&!floors[floor].rooms.flatMap(furniture).filter(r=>r.type!=='parking').some(r=>x>r.x-radius&&x<r.x+r.w+radius&&y>r.y-radius&&y<r.y+r.h+radius);}
export function findPath(floor,start,end){const step=20,key=(x,y)=>x+','+y,snap=n=>Math.round(n/step)*step;const sx=snap(start.x),sy=snap(start.y),tx=snap(end.x),ty=snap(end.y);if(!walkable(floor,tx,ty))return [];const q=[[sx,sy]],seen=new Map([[key(sx,sy),null]]);for(let i=0;i<q.length;i++){const [x,y]=q[i];if(x===tx&&y===ty){const path=[];let k=key(x,y);while(k){const [x,y]=k.split(',').map(Number);path.unshift({x,y});k=seen.get(k);}return path.slice(1);}for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!seen.has(k)&&nx>=0&&ny>=0&&nx<=width&&ny<=height&&walkable(floor,nx,ny)){seen.set(k,key(x,y));q.push([nx,ny]);}}}return [];}
