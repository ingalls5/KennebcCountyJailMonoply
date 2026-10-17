import {drawOfficer} from './avatars.js?v=meetings-2';
import {sceneCaption} from './meeting-result-rules.js?v=meetings-2';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
function label(ctx,message,x,y,color='#fff0c7',size=13){ctx.font=`700 ${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(message,x,y);}
function officer(ctx,{x,y,color,name,phase=0,walking=false,angle=0,labelBelow=false}){ctx.save();ctx.translate(x,y);ctx.rotate(angle);drawOfficer(ctx,{x:0,y:0,color,scale:.85,walking,phase});ctx.restore();label(ctx,name,x,y+(labelBelow?44:-39),color,12);}
function paper(ctx,x,y,angle=0,stamp=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#e4dbc2';ctx.strokeStyle='#887e68';ctx.lineWidth=1;ctx.fillRect(-10,-14,20,28);ctx.strokeRect(-10,-14,20,28);ctx.strokeStyle='#768587';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-6,-7+i*5);ctx.lineTo(6,-7+i*5);ctx.stroke();}if(stamp){ctx.strokeStyle='#4b9777';ctx.lineWidth=3;ctx.strokeRect(-8,0,16,8);}ctx.restore();}
function coffee(ctx,x,y,t,reduced){ctx.fillStyle='#dbc8a2';ctx.fillRect(x-6,y-7,12,15);ctx.strokeStyle='#e9d6b4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+7,y,5,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.fillStyle='#694733';ctx.fillRect(x-5,y-7,10,3);ctx.strokeStyle='#dbe6df99';ctx.lineWidth=1;for(let i=0;i<2;i++){const drift=reduced?0:Math.sin(t*1.7+i)*2;ctx.beginPath();ctx.moveTo(x-3+i*5,y-12);ctx.quadraticCurveTo(x-4+i*5+drift,y-18,x-2+i*5,y-25);ctx.stroke();}}
function roomFloor(ctx,box){ctx.fillStyle='#718085';ctx.fillRect(box.x,box.y,box.w,box.h);ctx.strokeStyle='#a3aeb0';ctx.lineWidth=8;ctx.strokeRect(box.x,box.y,box.w,box.h);ctx.strokeStyle='#52646a';ctx.lineWidth=1;for(let x=box.x+24;x<box.x+box.w;x+=28){ctx.beginPath();ctx.moveTo(x,box.y);ctx.lineTo(x,box.y+box.h);ctx.stroke();}}
export function drawMeetingResult(canvas,state,now){const r=state.meeting.result,ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,seconds=Math.max(0,(now-r.startedAt)/1000),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,seed=((r.seed||0)%1000)/1000,scene=r.scene||(r.ejectedId?'clipboard':'all-clear');ctx.clearRect(0,0,w,h);ctx.fillStyle='#101d24';ctx.fillRect(0,0,w,h);const target=state.members.find(p=>p.id===r.ejectedId);
 if(target)drawExit(ctx,r,target,scene,seconds,reduced,seed,w,h);else drawAllClear(ctx,scene,seconds,reduced,seed,w,h);
 canvas.dataset.scene=scene;canvas.setAttribute('aria-label',sceneCaption(scene));
}
function drawExit(ctx,r,target,scene,t,reduced,seed,w,h){const route=r.route||{room:{x:0,y:0,w:680,h:420},from:{x:250,y:210},to:{x:680,y:210}},box=route.room||{x:0,y:0,w:1000,h:700},scale=Math.min((w-128)/box.w,(h-128)/box.h),ox=(w-box.w*scale)/2,oy=(h-box.h*scale)/2,point=p=>({x:ox+(p.x-box.x)*scale,y:oy+(p.y-box.y)*scale}),from=point(route.from),door=point(route.to),length=Math.hypot(door.x-from.x,door.y-from.y)||1,ux=(door.x-from.x)/length,uy=(door.y-from.y)/length;
 roomFloor(ctx,{x:ox,y:oy,w:box.w*scale,h:box.h*scale});label(ctx,'SALLYPORT',w/2,27,'#dae1d9',16);
 let progress=smooth((t-2)/10),walking=t>2&&t<12;
 if(scene==='clipboard'||scene==='coffee'){progress=smooth((t-3.8)/8.6);walking=t>3.8&&t<12.4;}
 if(scene==='wrong-door'){progress=t<3?-.19*Math.sin(Math.PI*clamp((t-.5)/2.5)) : smooth((t-3)/9.2);walking=t>.5&&t<12.2;}
 if(reduced){progress=.36;walking=false;}
 const wobble=!reduced&&scene==='shuffle'?Math.sin(progress*Math.PI*8)*12:!reduced&&scene==='paper-trail'?Math.sin(progress*Math.PI*3)*7:0,x=from.x+ux*(length+70)*progress-uy*wobble,y=from.y+uy*(length+70)*progress+ux*wobble,open=reduced?.7:smooth((progress-.44)/.2),vertical=Math.abs(ux)>Math.abs(uy);
 ctx.save();ctx.translate(door.x,door.y);if(vertical)ctx.rotate(Math.PI/2);ctx.fillStyle='#263b45';ctx.fillRect(-36,-9,72,18);ctx.fillStyle='#a3adb2';ctx.fillRect(-36-28*open,-7,35,14);ctx.fillRect(1+28*open,-7,35,14);ctx.restore();
 const offset={x:-uy*21,y:ux*21},good={x:x-offset.x,y:y-offset.y},guest={x:x+offset.x,y:y+offset.y};ctx.save();ctx.globalAlpha=reduced?1:1-smooth((progress-.94)/.06);officer(ctx,{...good,color:'#e6c47e',name:'Goodchild',phase:t+(scene==='shuffle'?Math.sin(t):0),walking,angle:!reduced&&scene==='shuffle'?Math.sin(t*2)*.08:0});officer(ctx,{...guest,color:target.color,name:target.name,phase:t+.5,walking,labelBelow:true});
 if(scene==='coffee')coffee(ctx,good.x+20,good.y+(t<3.8?-16:-2),t,reduced);
 if(scene==='clipboard')paper(ctx,good.x+22,good.y-2,!reduced&&t<3.8?Math.sin(t*3)*.12:0,true);
 if(scene==='paper-trail')for(let i=0;i<7;i++){const age=reduced?i/8:((t*.16+i*.13+seed)%1);paper(ctx,good.x-ux*age*85+Math.sin(i*2)*18,good.y-uy*age*85+age*12,age*.6+i*.8);}
 ctx.restore();
 if(scene==='clipboard'&&t<3.8)label(ctx,'Sign here… and here.',w/2,h-18);
 else if(scene==='coffee'&&t<3.8)label(ctx,'One last sip.',w/2,h-18);
 else if(scene==='wrong-door'&&t<3.4)label(ctx,'Wait. Other door!',w/2,h-18);
 else if(scene==='shuffle')label(ctx,'The Sallyport shuffle',w/2,h-18);
 else if(scene==='paper-trail')label(ctx,'There is always more paperwork.',w/2,h-18);
 else label(ctx,'This way, please.',w/2,h-18);
}
function drawAllClear(ctx,scene,t,reduced,seed,w,h){roomFloor(ctx,{x:76,y:66,w:w-152,h:h-128});label(ctx,'BRIEFING · EVERYBODY STAYS',w/2,27,'#dae1d9',16);ctx.fillStyle='#344f54';ctx.strokeStyle='#a2b0a4';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w/2,h/2+32,122,48,0,0,Math.PI*2);ctx.fill();ctx.stroke();let x=w/2,y=h/2-20,walking=false;
 if(!reduced&&scene==='all-clear'){x=150+smooth(t/3)*170-(t>8?smooth((t-8)/4)*80:0);walking=t<3||t>8;}
 if(!reduced&&scene==='coffee-break'){x=150+smooth(t/4)*(w/2-150);walking=t<4;}
 if(!reduced&&scene==='case-closed'){x=w/2+Math.sin(Math.min(t,3)*Math.PI/3)*30;walking=t<3;}
 officer(ctx,{x,y,color:'#e6c47e',name:'Goodchild',phase:t,walking});
 if(scene==='coffee-break'){coffee(ctx,x+20,y+(t>4&&t<9?-17:0),t,reduced);label(ctx,t<4?'Nobody? Not even one escort?':'Best meeting all shift.',w/2,h-20);}
 else if(scene==='case-closed'){for(let i=0;i<4;i++)paper(ctx,w/2+72+i*12,h/2+18-i*2,(i-2)*.12,t>4||reduced);const stamp=t>3&&t<5&&!reduced?Math.sin((t-3)*Math.PI)*12:0;ctx.fillStyle='#80584c';ctx.fillRect(x+18,y+12-stamp,16,12);ctx.fillStyle='#c3c0aa';ctx.fillRect(x+13,y+23-stamp,26,6);if(t>5||reduced)label(ctx,'BACK TO WORK',w/2,h/2+48,'#a3d3aa',14);label(ctx,'Case closed… for now.',w/2,h-20);}
 else{const look=reduced?0:Math.sin(Math.min(t,6)*2)*5;ctx.strokeStyle='#e6c47e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-18,y+2);ctx.lineTo(x-34,y-8-look);ctx.moveTo(x+18,y+2);ctx.lineTo(x+34,y-8+look);ctx.stroke();label(ctx,t<6?'So… nobody is coming with me?':'All right. Everybody back to work!',w/2,h-20);}
}
