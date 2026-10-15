import {spaces,entryTracks,crisisSpaces,crisisFork,crisisRejoin,spinnerMax,spinnerStep} from './rules.js';

// All board art is original SVG. The road geometry also drives pawn movement.
export const boardWidth=1400,boardHeight=1350;
export const road='M 300 1240 L 180 1240 Q 100 1240 100 1160 L 100 895 L 105 775 C 105 730 160 715 220 715 L 340 715 C 430 715 435 625 350 625 L 215 625 C 120 625 120 520 215 520 L 410 520 C 500 520 480 415 400 415 L 190 415 C 65 415 65 275 160 275 L 285 275 C 370 275 375 170 290 170 L 170 170 C 80 170 100 70 200 70 L 950 70 C 1090 70 1110 200 1000 220 L 860 220 C 780 220 780 330 870 330 L 1010 330 C 1120 330 1120 455 1015 455 L 830 455 C 735 455 735 555 830 555 L 1010 555 C 1130 555 1115 700 1000 700 L 800 700 C 700 700 720 805 820 805 L 1010 805 C 1130 805 1120 925 1000 925 L 530 925';
const svgNS='http://www.w3.org/2000/svg';
const node=(tag,attrs={},text)=>{const n=document.createElementNS(svgNS,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));if(text!==undefined)n.textContent=text;return n;};
function add(parent,tag,attrs,text){const n=node(tag,attrs,text);parent.append(n);return n;}
function tree(parent,x,y,scale=1){const g=add(parent,'g',{transform:`translate(${x} ${y}) scale(${scale})`});add(g,'ellipse',{cx:4,cy:12,rx:16,ry:8,fill:'#3d6e493d'});add(g,'path',{d:'M-2 3V17H3V3',fill:'#6c6944'});add(g,'circle',{cx:0,cy:0,r:17,fill:'#377d48'});add(g,'circle',{cx:-5,cy:-5,r:12,fill:'#559d53'});add(g,'circle',{cx:4,cy:-9,r:8,fill:'#75b660'});}
function building(parent,{x,y,w=110,h=65,label,roof='#e6eddf',scale=1}){
 const g=add(parent,'g',{transform:`translate(${x} ${y}) scale(${scale})`,class:'board-building'});
 add(g,'path',{d:`M-8 8H${w+14}V${h+22}H-8Z`,fill:'#335c3535'});
 add(g,'path',{d:`M0 0H${w}V${h}L${w-12} ${h+18}H-12V18Z`,fill:'#b5c1b0'});
 add(g,'path',{d:`M-12 18H${w-12}V${h+18}H-12Z`,fill:'#f8f6e9'});
 add(g,'path',{d:`M${w-12} 18L${w} 0V${h}L${w-12} ${h+18}Z`,fill:'#c1cbbb'});
 add(g,'path',{d:`M0 -5H${w}L${w-12} 18H-12Z`,fill:roof,stroke:'#fcfff3','stroke-width':3});
 for(let i=0;i<Math.floor(w/25);i++)add(g,'rect',{x:i*25+2,y:h-8,width:10,height:14,fill:'#839fa0',rx:1});
 add(g,'rect',{x:w/2-18,y:h-8,width:17,height:26,fill:'#6f8580'});
 add(g,'path',{d:`M${w/2-25} ${h-10}H${w/2+7}L${w/2+12} ${h-3}H${w/2-30}Z`,fill:'#dce5d5',stroke:'#fff9e8','stroke-width':2});
 add(g,'text',{x:w/2-8,y:h+39,'text-anchor':'middle',class:'scenery-label'},label);
 return g;
}
function sign(parent,x,y,label,color='#f4edda'){
 const g=add(parent,'g',{transform:`translate(${x} ${y})`});add(g,'path',{d:'M-30 0V28M30 0V28',stroke:'#8d8061','stroke-width':5});add(g,'rect',{x:-72,y:-14,width:144,height:33,rx:5,fill:color,stroke:'#f8ffed','stroke-width':3});add(g,'text',{y:7,'text-anchor':'middle',class:'scenery-label'},label);return g;
}
function scenery(root){
 add(root,'rect',{width:boardWidth,height:boardHeight,rx:16,fill:'url(#lifeGrass)'});
 add(root,'rect',{x:10,y:10,width:boardWidth-20,height:boardHeight-20,rx:12,fill:'url(#lifeMeadow)',opacity:.6});
 // A quiet Maine landscape under the road, with a pond and wooded edges.
 add(root,'path',{d:'M410 635C440 583 562 608 594 664C622 711 565 777 510 770C452 764 377 698 410 635Z',fill:'#6cae94',stroke:'#b3d58a','stroke-width':15});
 add(root,'path',{d:'M423 639C454 610 554 624 575 668C595 710 550 751 510 750C464 751 405 686 423 639Z',fill:'url(#lifeWater)'});
 for(let i=0;i<7;i++)add(root,'path',{d:`M${443+i*11} ${659+i*11}q18 -6 36 0`,fill:'none',stroke:'#c6e8de','stroke-width':2,opacity:.55});
 add(root,'path',{d:'M480 756L489 710L514 716L506 760Z',fill:'#c6ad77',stroke:'#e8d6a7','stroke-width':3});
 const woods=[[38,44],[45,150],[42,227],[40,445],[44,510],[44,598],[38,695],[37,967],[198,975],[294,962],[385,972],[1138,50],[1142,140],[1153,240],[1150,400],[1153,520],[1152,616],[1154,747],[1143,882],[1145,968],[441,155],[467,180],[725,170],[765,120],[477,841],[650,851],[651,720],[671,670],[675,620],[680,550],[700,500]];
 woods.forEach(([x,y],i)=>{tree(root,x,y,.8+(i%3)*.18);tree(root,x+19,y+23,.7);});
 for(let i=0;i<85;i++){const x=45+(i*137)%1110,y=35+(i*79)%930;add(root,'path',{d:`M${x} ${y}l3 -5m-3 5l-4 -3`,stroke:'#4f9b4d','stroke-width':1.5,opacity:.28});}
 // Small raised buildings echo the plastic landmarks on a tabletop board.
 building(root,{x:470,y:125,w:85,h:35,label:'TRAINING',roof:'#d6e5ed'});
 building(root,{x:925,y:377,w:112,h:47,label:'BOOKING',roof:'#f1eee0',scale:.35});
 building(root,{x:225,y:329,w:120,h:32,label:'INTAKE',roof:'#dbe3d7',scale:.55});
 building(root,{x:890,y:611,w:103,h:45,label:'BRIEFING',roof:'#efe9d4',scale:.5});
 building(root,{x:570,y:778,w:98,h:40,label:'LAST BRIEFING',roof:'#f0ead7'});
 // Fenced rec yard.
 const yard=add(root,'g',{transform:'translate(345 -5) scale(.5)'});
 add(yard,'path',{d:'M197 443H315V485H197Z',fill:'#6eab64',stroke:'#e7ecd8','stroke-width':3});
 for(let i=0;i<8;i++)add(yard,'path',{d:`M${200+i*16} 441V486`,stroke:'#c7d4ba','stroke-width':1});
 add(yard,'path',{d:'M232 476V452H258V476M270 477V459H293V477',fill:'none',stroke:'#397f59','stroke-width':6});
 add(yard,'text',{x:256,y:500,'text-anchor':'middle',class:'scenery-label'},'REC YARD');
 // Printed card stacks sit in the open spaces between roads.
 const deck=add(root,'g',{transform:'translate(585 607) rotate(12)'});for(let i=3;i>=0;i--)add(deck,'rect',{x:i*2,y:i*3,width:78,height:108,rx:5,fill:'#fff9e7',stroke:'#a5b68f','stroke-width':1.4});add(deck,'rect',{x:7,y:7,width:64,height:94,rx:3,fill:'#a776b0'});add(deck,'text',{x:39,y:35,'text-anchor':'middle',class:'deck-title'},'COUNTY');add(deck,'text',{x:39,y:51,'text-anchor':'middle',class:'deck-title'},'EVENTS');add(deck,'text',{x:39,y:82,'text-anchor':'middle','font-size':28,fill:'#fff8dd'},'?');
 const pay=add(root,'g',{transform:'translate(407 263) rotate(-10)'});for(let i=3;i>=0;i--)add(pay,'rect',{x:i*2,y:i*3,width:76,height:99,rx:4,fill:'#fffbe9',stroke:'#94b18b','stroke-width':1.3});add(pay,'rect',{x:6,y:6,width:64,height:87,fill:'#86c77d',rx:3});add(pay,'text',{x:38,y:32,'text-anchor':'middle',class:'deck-title'},'SHIFT PAY');add(pay,'text',{x:38,y:61,'text-anchor':'middle','font-size':29,fill:'#214a3f'},'$');add(pay,'text',{x:38,y:80,'text-anchor':'middle','font-size':8,fill:'#214a3f'},'EACH TURN');
 // Colorful original title printed on the landscape.
 const title=add(root,'g',{transform:'translate(514 505) rotate(-3)'});['L','I','F','E'].forEach((letter,i)=>{add(title,'rect',{x:i*49,y:0,width:46,height:58,rx:2,fill:['#955ca0','#428bbc','#77b575','#e3ae36'][i],stroke:'#f9f5da','stroke-width':3});add(title,'text',{x:i*49+23,y:45,'text-anchor':'middle','font-family':'Georgia,serif','font-weight':900,'font-size':49,fill:'#fffbe8'},letter);});add(title,'text',{x:96,y:80,'text-anchor':'middle',class:'life-board-subtitle'},'ON THE INSIDE');add(title,'text',{x:96,y:98,'text-anchor':'middle',class:'life-board-edition'},'KENNEBEC COUNTY JAIL');
}
export const careerPaths=[
 {id:'academy',label:'Go to the Academy',details:'Pay $500 · 12 spaces · Graduate as an Officer',color:'#88c6dd',x:560,y:1098,w:130,h:100},
 {id:'jail',label:'Work in the Jail',details:'Collect $300 · 8 work spaces · Start as a Rookie',color:'#a5cb77',x:780,y:1098,w:130,h:100}
];
const roadWidth=76;
const percent=p=>({left:p.x/boardWidth*100,top:p.y/boardHeight*100});
function entryRoad(path,step){
 if(path==='jail')return `M950 1240H${950-entryTracks.jail.length*step}`;
 // The Academy takes a longer loop. Its spaces use the main road's exact step.
 const radius=70,height=(entryTracks.academy.length*step-640+(4-Math.PI)*radius)/2,top=1180-height;
 return `M1000 1180V${top+radius}A${radius} ${radius} 0 0 0 930 ${top}H430A${radius} ${radius} 0 0 0 360 ${top+radius}V1180`;
}
function startArea(root,step){
 const g=add(root,'g',{class:'career-start-area'});
 add(g,'rect',{x:155,y:975,width:990,height:360,rx:20,fill:'#c0d89b',stroke:'#e3edbd','stroke-width':3});
 add(g,'text',{x:670,y:997,'text-anchor':'middle',class:'start-area-heading'},'CHOOSE YOUR CAREER PATH');
 // Short unnumbered junctions connect both full-size tracks to START and First Briefing.
 for(const path of careerPaths){
  const end=path.id==='academy'?{x:360,y:1180}:{x:950-entryTracks.jail.length*step,y:1240};
  const connector=path.id==='academy'?'M1070 1240Q1000 1240 1000 1180':`M1070 1240H950`;
  const exit=path.id==='academy'?'M360 1180Q360 1240 300 1240':`M${end.x} ${end.y}H300`;
  for(const d of [connector,exit]){add(g,'path',{d,fill:'none',stroke:'#fffde9','stroke-width':94,'stroke-linejoin':'round'});add(g,'path',{d,fill:'none',stroke:'#d9ddc1','stroke-width':roadWidth,'stroke-linejoin':'round'});}
 }
 for(const path of careerPaths){
  const lane=add(g,'g',{class:'start-route','data-path':path.id});
  const line=add(lane,'path',{d:entryRoad(path.id,step),fill:'none',stroke:'none','data-start-road':path.id});
  // Browser arc approximations are tiny; correct them so all centerline lengths match.
  if(path.id==='academy'){
   const difference=entryTracks.academy.length*step-line.getTotalLength();
   line.setAttribute('d',entryRoad(path.id,step+difference/entryTracks.academy.length));
  }
  const d=line.getAttribute('d');
  add(lane,'path',{d,fill:'none',stroke:'#fffde9','stroke-width':94,class:'start-route-edge'});
  const length=line.getTotalLength(),track=entryTracks[path.id],tileStep=length/track.length;
  track.forEach((space,i)=>{
   const tile=add(lane,'g',{class:'entry-tile','aria-label':`${path.id==='academy'?'Academy':'Jail career'} space ${i+1}: ${space.name}`}),last=i===track.length-1;
   const points=Array.from({length:17},(_,j)=>line.getPointAtLength((i+j/16)*tileStep));
   add(tile,'path',{d:points.map((p,j)=>(j?'L':'M')+p.x+' '+p.y).join(' '),fill:'none',stroke:last?'#df805f':path.color,'stroke-width':roadWidth,'stroke-linejoin':'round'});
   const at=line.getPointAtLength((i+.5)*tileStep),a=line.getPointAtLength(Math.max(0,(i+.5)*tileStep-1)),b=line.getPointAtLength(Math.min(length,(i+.5)*tileStep+1)),angle=Math.atan2(b.y-a.y,b.x-a.x);
   if(i){const p=line.getPointAtLength(i*tileStep);add(tile,'path',{d:`M${p.x-Math.sin(angle)*38} ${p.y+Math.cos(angle)*38}L${p.x+Math.sin(angle)*38} ${p.y-Math.cos(angle)*38}`,stroke:'#476b6b88','stroke-width':1.2});}
   let degrees=angle*180/Math.PI;if(degrees>90)degrees-=180;if(degrees<-90)degrees+=180;
   const label=add(tile,'g',{transform:`translate(${at.x} ${at.y}) rotate(${degrees})`});
   const words=space.name.toUpperCase().split(' '),split=Math.ceil(words.length/2),title=last?'STOP':words.slice(0,split).join(' '),detail=last?(path.id==='academy'?'GRADUATION':'SHIFT COMPLETE'):words.slice(split).join(' ')||(path.id==='academy'?'ACADEMY':'JAIL CAREER');
   add(label,'text',{y:-13,'text-anchor':'middle',class:'road-space-title'},title);
   add(label,'text',{y:1,'text-anchor':'middle',class:'road-space-detail'},detail);
   add(label,'text',{x:-tileStep*.27,y:27,'text-anchor':'middle',class:'road-space-number'},(path.id==='academy'?'A':'J')+(i+1));
   add(label,'text',{x:tileStep*.26,y:28,'text-anchor':'middle',class:'road-direction',transform:angle*180/Math.PI!==degrees?'rotate(180 '+tileStep*.26+' 22)':''},'➜');
  });
  const house=building(g,{x:path.x+28,y:1124,w:73,h:25,label:'',roof:path.id==='academy'?'#e9eede':'#b8c6c7'});
  if(path.id==='academy'){add(house,'path',{d:'M1 -5L31 -24L62 -5Z',fill:'#fffef0',stroke:'#d7e2cc','stroke-width':2});add(house,'text',{x:31,y:-6,'text-anchor':'middle','font-size':10,'font-weight':800,fill:'#4a7284'},'A');}
  else{add(house,'rect',{x:30,y:14,width:22,height:28,rx:2,fill:'#657980',stroke:'#dce5d5','stroke-width':2});add(house,'text',{x:35,y:0,'text-anchor':'middle','font-size':9,'font-weight':800,fill:'#415e69'},'KCJ');}
  add(g,'text',{x:path.x+path.w/2,y:1186,'text-anchor':'middle',class:'start-choice-label'},path.id==='academy'?'GO TO THE ACADEMY':'WORK IN THE JAIL');
 }
 add(g,'circle',{cx:1070,cy:1240,r:30,fill:'#c8784f',stroke:'#fffbe4','stroke-width':4});
 add(g,'text',{x:1070,y:1244,'text-anchor':'middle',class:'start-dot-label'},'START');
}
function crisisArea(root,step,point){
 const g=add(root,'g',{class:'crisis-area'}),fork=point((crisisFork+.5)*step),rejoin=point((crisisRejoin+.5)*step);
 const start={x:fork.x+50,y:fork.y},end={x:rejoin.x+50,y:rejoin.y},radius=60;
 // One continuous road branches out and rejoins farther along the career route.
 // Junctions share the main road's border and lane width; there is no inset panel.
 const entrance=add(g,'path',{d:`M${fork.x} ${fork.y}H${start.x}`,fill:'none',stroke:'none','data-crisis-entrance':''});
 const exit=add(g,'path',{d:`M${end.x} ${end.y}H${rejoin.x}`,fill:'none',stroke:'none','data-crisis-exit':''});
 for(const line of [entrance,exit]){add(g,'path',{d:line.getAttribute('d'),fill:'none',stroke:'#faf9e6','stroke-width':94,'stroke-linejoin':'round',class:'crisis-junction-edge'});add(g,'path',{d:line.getAttribute('d'),fill:'none',stroke:'#c58c9b','stroke-width':roadWidth,'stroke-linejoin':'round',class:'crisis-junction-lane'});}
 const route=reach=>`M${start.x} ${start.y}H${reach-radius}A${radius} ${radius} 0 0 1 ${reach} ${start.y+radius}V${end.y-radius}A${radius} ${radius} 0 0 1 ${reach-radius} ${end.y}H${end.x}`;
 const reach=(crisisSpaces.length*step+start.x+end.x-(end.y-start.y)+(4-Math.PI)*radius)/2;
 const line=add(g,'path',{d:route(reach),fill:'none',stroke:'none','data-crisis-road':''});
 line.setAttribute('d',route(reach+(crisisSpaces.length*step-line.getTotalLength())/2));
 add(g,'path',{d:line.getAttribute('d'),fill:'none',stroke:'#faf9e6','stroke-width':94});
 const length=line.getTotalLength(),tileStep=length/crisisSpaces.length;
 crisisSpaces.forEach((space,i)=>{
  const tile=add(g,'g',{class:'crisis-tile','aria-label':`Mid-Life Crisis space ${i+1}: ${space.name}`}),samples=Array.from({length:17},(_,j)=>line.getPointAtLength((i+j/16)*tileStep));
  add(tile,'path',{d:samples.map((p,j)=>(j?'L':'M')+p.x+' '+p.y).join(' '),fill:'none',stroke:i===crisisSpaces.length-1?'#df805f':'#c58c9b','stroke-width':roadWidth,'stroke-linejoin':'round'});
  const p=line.getPointAtLength((i+.5)*tileStep),a=line.getPointAtLength((i+.5)*tileStep-1),b=line.getPointAtLength((i+.5)*tileStep+1),angle=Math.atan2(b.y-a.y,b.x-a.x);
  if(i){const p=line.getPointAtLength(i*tileStep);add(tile,'path',{d:`M${p.x-Math.sin(angle)*38} ${p.y+Math.cos(angle)*38}L${p.x+Math.sin(angle)*38} ${p.y-Math.cos(angle)*38}`,stroke:'#714c6088','stroke-width':1.2});}
  let degrees=angle*180/Math.PI;if(degrees>90)degrees-=180;if(degrees<-90)degrees+=180;
  const label=add(tile,'g',{transform:`translate(${p.x} ${p.y}) rotate(${degrees})`});
  add(label,'text',{y:-13,'text-anchor':'middle',class:'road-space-title'},space.lines[0]);add(label,'text',{y:1,'text-anchor':'middle',class:'road-space-detail'},space.lines[1]);add(label,'text',{x:i===0?0:-tileStep*.27,y:27,'text-anchor':'middle',class:'road-space-number'},'C'+(i+1));add(label,'text',{x:tileStep*.26,y:28,'text-anchor':'middle',class:'road-direction',transform:angle*180/Math.PI!==degrees?'rotate(180 '+tileStep*.26+' 22)':''},'➜');
 });
 add(g,'text',{x:1210,y:226,'text-anchor':'middle',class:'crisis-board-title'},'MID-LIFE');
 add(g,'text',{x:1210,y:254,'text-anchor':'middle',class:'crisis-board-title'},'CRISIS');
 for(const [x,y] of [[1320,550],[1250,720],[1340,930],[1260,1120],[1340,1260]]){tree(root,x,y,1.2);tree(root,x+18,y+26,.8);}
 return {line,entrance,exit};
}
function startPanel(){
 const panel=document.createElement('section');panel.id='careerStartPanel';panel.className='career-start-panel';panel.setAttribute('aria-labelledby','startPanelTitle');
 const heading=document.createElement('h3');heading.id='startPanelTitle';heading.textContent='Choose your career path.';
 const text=document.createElement('p');text.textContent='Spin through 12 Academy spaces or 8 jail-career spaces. Stop at graduation or the end of your first shift, then join the main road at First Briefing.';
 const choices=document.createElement('div');choices.className='start-panel-choices';const buttons=[];
 for(const [index,path] of careerPaths.entries()){const button=document.createElement('button');button.id=path.id==='academy'?'startAcademy':'startJail';button.type='button';button.className='start-path-choice';button.dataset.startChoice=index;const label=document.createElement('strong');label.textContent=path.label;const detail=document.createElement('span');detail.textContent=path.details;button.append(label,detail);choices.append(button);buttons.push({button,path:path.id,index});}
 panel.append(heading,text,choices);return {panel,buttons};
}
function spinner(root){
 const cx=625,cy=315,r=119,g=add(root,'g',{class:'life-spinner','aria-hidden':'true'});
 add(g,'ellipse',{cx:cx+6,cy:cy+18,rx:r+22,ry:r+13,fill:'#2c693e55'});
 add(g,'circle',{cx,cy:cy+7,r:r+22,fill:'#35884c',stroke:'#a2d27b','stroke-width':5});
 add(g,'circle',{cx,cy,r:r+8,fill:'#fffdf0',stroke:'#d0dac0','stroke-width':5});
 const fills=['#e9c74c','#df9651','#d97868','#cb7da1','#a578b3','#8586bc','#649fc3','#54acb1','#72bba0','#8fc477'];
 for(let i=0;i<spinnerMax;i++){
  const start=(i*spinnerStep-90-spinnerStep/2)*Math.PI/180,end=(i*spinnerStep-90+spinnerStep/2)*Math.PI/180;
  const x1=cx+Math.cos(start)*r,y1=cy+Math.sin(start)*r,x2=cx+Math.cos(end)*r,y2=cy+Math.sin(end)*r;
  add(g,'path',{d:`M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}Z`,fill:fills[i],stroke:'#ffffef','stroke-width':4});
  const angle=(i*spinnerStep-90)*Math.PI/180;add(g,'text',{x:cx+Math.cos(angle)*96,y:cy+Math.sin(angle)*96+9,'text-anchor':'middle',class:'spinner-number'},String(i+1));
 }
 // Outer pegs and a white center give the wheel its raised, plastic appearance.
 for(let i=0;i<spinnerMax*2;i++){const a=i*Math.PI/spinnerMax;add(g,'circle',{cx:cx+Math.cos(a)*(r+9),cy:cy+Math.sin(a)*(r+9),r:4,fill:'#fffdec',stroke:'#c5d2ba','stroke-width':1});}
 const needle=add(g,'g',{id:'careerSpinnerNeedle',class:'spinner-needle'});needle.style.transformOrigin=`${cx}px ${cy}px`;
 add(needle,'path',{d:`M${cx-8} ${cy+46}L${cx-6} ${cy-61}L${cx-14} ${cy-61}L${cx} ${cy-80}L${cx+14} ${cy-61}H${cx+6}L${cx+8} ${cy+46}Z`,fill:'#fffef0',stroke:'#c1cbb6','stroke-width':2});
 add(g,'circle',{cx,cy:cy+4,r:34,fill:'#c1cfb9'});add(g,'circle',{cx,cy,r:34,fill:'url(#lifePlastic)',stroke:'#fffff5','stroke-width':3});add(g,'text',{x:cx,y:cy+5,'text-anchor':'middle',class:'spinner-center'},'SPIN');
 add(g,'text',{x:cx,y:cy+r+42,'text-anchor':'middle',class:'scenery-label'},'MAKE YOUR NEXT MOVE');
}
const names={start:['FIRST','BRIEFING'],retire:['RETIREMENT','FINISH'],promotion:['STOP','REVIEW'],shift:['SHIFT','CHOICE'],rest:['DAYS','OFF'],event:['COUNTY','EVENT']};
const fills={start:'#62b9cc',retire:'#d890b0',promotion:'#e17b59',shift:'#9acb7d',rest:'#a6d9e8',event:'#f2cc5b'};
export function createBoard(target){
 const svg=node('svg',{viewBox:`0 0 ${boardWidth} ${boardHeight}`,class:'life-board-art',role:'img','aria-labelledby':'lifeBoardTitle lifeBoardDescription'});add(svg,'title',{id:'lifeBoardTitle'},'Life on the Inside: winding county career board');add(svg,'desc',{id:'lifeBoardDescription'},'A colorful road winds around the Academy, jail buildings, trees and a pond. Twelve Academy spaces and eight jail-career spaces join one hundred numbered stops from first briefing to retirement. A ten-space Mid-Life Crisis detour branches at Stop 56 and rejoins at Stop 67. A ten-number spinner sits in the center.');
 const defs=add(svg,'defs');
 const grass=add(defs,'linearGradient',{id:'lifeGrass',x2:'0',y2:'1'});add(grass,'stop',{'stop-color':'#9cc97e'});add(grass,'stop',{offset:1,'stop-color':'#85ba75'});
 const meadow=add(defs,'pattern',{id:'lifeMeadow',width:55,height:43,patternUnits:'userSpaceOnUse'});add(meadow,'path',{d:'M0 43L55 0M0 0L55 43',stroke:'#d5e5a9','stroke-width':.7,opacity:.4});add(meadow,'circle',{cx:14,cy:11,r:1.3,fill:'#eff0bd'});
 const water=add(defs,'linearGradient',{id:'lifeWater',x2:'1',y2:'1'});add(water,'stop',{'stop-color':'#8ad0cb'});add(water,'stop',{offset:1,'stop-color':'#57aebf'});
 const plastic=add(defs,'radialGradient',{id:'lifePlastic',cx:'.35',cy:'.25'});add(plastic,'stop',{'stop-color':'#fffff9'});add(plastic,'stop',{offset:1,'stop-color':'#e2e9d4'});
 scenery(svg);
 const route=add(svg,'path',{d:road,fill:'none',stroke:'none'}),length=route.getTotalLength(),step=length/spaces.length;
 startArea(svg,step);
 const point=distance=>{const d=Math.max(0,Math.min(length,distance)),p=route.getPointAtLength(d),a=route.getPointAtLength(Math.max(0,d-1)),b=route.getPointAtLength(Math.min(length,d+1)),angle=Math.atan2(b.y-a.y,b.x-a.x);return {x:p.x,y:p.y,angle};};
 const crisis=crisisArea(svg,step,point);
 add(svg,'path',{d:road,fill:'none',stroke:'#2c643b55','stroke-width':96,'stroke-linecap':'round',transform:'translate(3 7)'});
 add(svg,'path',{d:road,fill:'none',stroke:'#faf9e6','stroke-width':94,'stroke-linecap':'round','stroke-linejoin':'round'});
 add(svg,'path',{d:road,fill:'none',stroke:'#d9ddc1','stroke-width':79,'stroke-linecap':'round'});
 spaces.forEach((space,i)=>{
  const tile=add(svg,'g',{class:'career-tile type-'+space.type,'aria-label':`Stop ${i+1}: ${space.name}`});
  const samples=Array.from({length:17},(_,j)=>point((i+j/16)*step));
  add(tile,'path',{d:samples.map((p,j)=>(j?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' '),fill:'none',stroke:i===crisisFork?'#c58c9b':fills[space.type],'stroke-width':roadWidth,'stroke-linejoin':'round'});
  if(i){const p=point(i*step),nx=-Math.sin(p.angle),ny=Math.cos(p.angle);add(tile,'path',{d:`M${p.x+nx*38} ${p.y+ny*38}L${p.x-nx*38} ${p.y-ny*38}`,stroke:'#837a4f99','stroke-width':1.2});}
  const p=point((i+.5)*step);let angle=p.angle*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;
  const text=add(tile,'g',{transform:`translate(${p.x} ${p.y}) rotate(${angle})`});
  add(text,'text',{x:0,y:-13,'text-anchor':'middle',class:'road-space-title'},i===crisisFork?'CRISIS':names[space.type][0]);
  add(text,'text',{x:0,y:1,'text-anchor':'middle',class:'road-space-detail'},i===crisisFork?'CHOICE':names[space.type][1]);
  add(text,'text',{x:-step*.27,y:27,'text-anchor':'middle',class:'road-space-number'},String(i+1).padStart(2,'0'));
  add(text,'text',{x:step*.26,y:28,'text-anchor':'middle',class:'road-direction',transform:p.angle*180/Math.PI!==angle?'rotate(180 '+step*.26+' 22)':''},'➜');
 });
 spinner(svg);target.replaceChildren(svg);
 const spin=document.createElement('button');spin.type='button';spin.id='boardSpin';spin.className='board-spin-button';spin.setAttribute('aria-label','Spin the career wheel');spin.style.width=282/boardWidth*100+'%';spin.style.left=625/boardWidth*100+'%';spin.style.top=315/boardHeight*100+'%';target.parentElement.append(spin);
 const {panel,buttons}=startPanel();target.parentElement.after(panel);
 for(const [index,path] of careerPaths.entries()){const button=document.createElement('button');button.type='button';button.id=path.id==='academy'?'boardAcademy':'boardJail';button.className='board-path-button';button.style.left=path.x/boardWidth*100+'%';button.style.top=path.y/boardHeight*100+'%';button.style.width=path.w/boardWidth*100+'%';button.style.height=path.h/boardHeight*100+'%';button.setAttribute('aria-label',path.label);button.title=path.label+' · '+path.details;target.parentElement.append(button);buttons.push({button,path:path.id,index});}
 const alongLine=(line,index,position,count)=>{const length=line.getTotalLength(),d=(position+.5)*length/count,p=line.getPointAtLength(d),a=line.getPointAtLength(Math.max(0,d-1)),b=line.getPointAtLength(Math.min(length,d+1)),angle=Math.atan2(b.y-a.y,b.x-a.x),along=(index%2-.5)*25,across=(Math.floor(index/2)-1)*25;return percent({x:p.x+Math.cos(angle)*along-Math.sin(angle)*across,y:p.y+Math.sin(angle)*along+Math.cos(angle)*across});};
 const lineFrames=line=>Array.from({length:17},(_,i)=>percent(line.getPointAtLength(line.getTotalLength()*i/16)));
 const board={
  svg,spin,needle:svg.querySelector('#careerSpinnerNeedle'),
  startPanel:panel,pathButtons:buttons,
  setPath(path){for(const item of buttons)item.button.setAttribute('aria-pressed',String(item.path===path));for(const lane of svg.querySelectorAll('.start-route'))lane.dataset.selected=String(lane.dataset.path===path);},
  crisisCoordinates(position,index){return alongLine(crisis.line,index,position,crisisSpaces.length);},
  crisisEntryFrames(index){return [board.coordinates(crisisFork,index),...lineFrames(crisis.entrance),board.crisisCoordinates(0,index)];},
  crisisExitFrames(index){return [board.crisisCoordinates(crisisSpaces.length-1,index),...lineFrames(crisis.exit),board.coordinates(crisisRejoin,index)];},
  startCoordinates(index){return percent({x:1057+index%2*26,y:1214+Math.floor(index/2)*26});},
  entryCoordinates(path,position,index){
   const line=svg.querySelector(`[data-start-road="${path}"]`),length=line.getTotalLength(),distance=(position+.5)*length/entryTracks[path].length;
   const p=line.getPointAtLength(distance),a=line.getPointAtLength(Math.max(0,distance-1)),b=line.getPointAtLength(Math.min(length,distance+1)),angle=Math.atan2(b.y-a.y,b.x-a.x),along=(index%2-.5)*25,across=(Math.floor(index/2)-1)*25;
   return percent({x:p.x+Math.cos(angle)*along-Math.sin(angle)*across,y:p.y+Math.sin(angle)*along+Math.cos(angle)*across});
  },
  exitFrames(path,index){const line=svg.querySelector(`[data-start-road="${path}"]`),p=line.getPointAtLength(line.getTotalLength());return [board.entryCoordinates(path,entryTracks[path].length-1,index),percent(p),...(path==='academy'?[percent({x:360,y:1240})]:[]),percent({x:300,y:1240}),board.coordinates(0,index)];},
  coordinates(position,index){
   const p=point((position+.5)*step),fraction=position-Math.floor(position);
   const offset=pos=>{const a=point((pos+.5)*step).angle,along=(index%2-.5)*25,across=(10+Math.floor(index/2)*25)*(Math.cos(a)<0?-1:1);return {x:Math.cos(a)*along-Math.sin(a)*across,y:Math.sin(a)*along+Math.cos(a)*across};};
   const a=offset(Math.floor(position)),b=offset(Math.ceil(position));
   return percent({x:p.x+a.x*(1-fraction)+b.x*fraction,y:p.y+a.y*(1-fraction)+b.y*fraction});
  },
  center(position){return point((position+.5)*step);}
 };return board;
}
