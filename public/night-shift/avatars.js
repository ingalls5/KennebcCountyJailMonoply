// One uniform renderer for the menu, living officers, ghosts, and fallen bodies.
export function drawOfficer(ctx,{x=0,y=0,color='#65a5b8',scale=1,phase=0,walking=false,ghost=false,body=false}={}){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);if(body)ctx.rotate(Math.PI/2);if(ghost)ctx.globalAlpha*=.4;
 const box=(x,y,w,h,fill,edge)=>{ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);}};
 if(!body){ctx.fillStyle='#06121b88';ctx.beginPath();ctx.ellipse(0,25,18,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,25,19,7,0,0,Math.PI*2);ctx.stroke();}
 const step=walking?Math.sin(phase*9)*3:0;
 box(-11,10+step,9,13,'#11171e','#54606a');box(2,10-step,9,13,'#11171e','#54606a');box(-12,21+step,10,5,'#050a10');box(2,21-step,10,5,'#050a10');
 box(-14,-6,28,20,'#11171d','#73818a');box(-20,-5,6,17,'#11171d','#536570');box(14,-5,6,17,'#11171d','#536570');
 box(-20,-3,6,4,color);box(14,-3,6,4,color);box(-18,12,4,4,color);box(15,12,4,4,color);
 box(-2,-5,4,14,'#202a31');box(6,-1,4,5,'#d3b877');box(-9,1,5,3,color);
 // Heavy belt, buckle, radio, canister, and utility pouches remain black.
 box(-16,8,32,6,'#05090e','#87928f');box(-3,8,6,6,'#b8a16c','#e4cd89');
 for(const x of [-16,-10,7,13])box(x,9,5,8,'#080d13','#596975');
 box(-17,3,5,10,'#10191f','#75818b');box(-16,-2,2,6,'#1a232b');box(13,5,4,10,'#151b21','#849189');
 ctx.fillStyle=color;ctx.strokeStyle='#1b2e39';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-16,11,0,Math.PI*2);ctx.fill();ctx.stroke();
 box(-11,-24,22,6,'#111820','#596c74');box(-9,-22,18,2,color);box(-8,-15,16,6,'#c2d9d7','#2d4a58');box(-2,-24,4,3,'#d2ba81');
 if(ghost){ctx.strokeStyle=color;ctx.setLineDash([3,3]);ctx.beginPath();ctx.ellipse(0,0,27,37,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 ctx.restore();
}
