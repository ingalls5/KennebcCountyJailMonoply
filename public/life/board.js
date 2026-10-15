import {spaces} from './rules.js';

// All board art is original SVG. The road geometry also drives pawn movement.
export const boardWidth=1200,boardHeight=1000;
export const road='M 100 895 L 105 775 C 105 730 160 715 220 715 L 340 715 C 430 715 435 625 350 625 L 215 625 C 120 625 120 520 215 520 L 410 520 C 500 520 480 415 400 415 L 190 415 C 65 415 65 275 160 275 L 285 275 C 370 275 375 170 290 170 L 170 170 C 80 170 100 70 200 70 L 950 70 C 1090 70 1110 200 1000 220 L 860 220 C 780 220 780 330 870 330 L 1010 330 C 1120 330 1120 455 1015 455 L 830 455 C 735 455 735 555 830 555 L 1010 555 C 1130 555 1115 700 1000 700 L 800 700 C 700 700 720 805 820 805 L 1010 805 C 1130 805 1120 925 1000 925 L 530 925';
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
 add(root,'rect',{width:1200,height:1000,rx:16,fill:'url(#lifeGrass)'});
 add(root,'rect',{x:10,y:10,width:1180,height:980,rx:12,fill:'url(#lifeMeadow)',opacity:.6});
 // A quiet Maine landscape under the road, with a pond and wooded edges.
 add(root,'path',{d:'M410 635C440 583 562 608 594 664C622 711 565 777 510 770C452 764 377 698 410 635Z',fill:'#6cae94',stroke:'#b3d58a','stroke-width':15});
 add(root,'path',{d:'M423 639C454 610 554 624 575 668C595 710 550 751 510 750C464 751 405 686 423 639Z',fill:'url(#lifeWater)'});
 for(let i=0;i<7;i++)add(root,'path',{d:`M${443+i*11} ${659+i*11}q18 -6 36 0`,fill:'none',stroke:'#c6e8de','stroke-width':2,opacity:.55});
 add(root,'path',{d:'M480 756L489 710L514 716L506 760Z',fill:'#c6ad77',stroke:'#e8d6a7','stroke-width':3});
 const woods=[[38,44],[45,150],[42,227],[40,445],[44,510],[44,598],[38,695],[37,967],[198,975],[294,962],[385,972],[1138,50],[1142,140],[1153,240],[1150,400],[1153,520],[1152,616],[1154,747],[1143,882],[1145,968],[441,155],[467,180],[725,170],[765,120],[477,841],[650,851],[651,720],[671,670],[675,620],[680,550],[700,500]];
 woods.forEach(([x,y],i)=>{tree(root,x,y,.8+(i%3)*.18);tree(root,x+19,y+23,.7);});
 for(let i=0;i<85;i++){const x=45+(i*137)%1110,y=35+(i*79)%930;add(root,'path',{d:`M${x} ${y}l3 -5m-3 5l-4 -3`,stroke:'#4f9b4d','stroke-width':1.5,opacity:.28});}
 // Small raised buildings echo the plastic landmarks on a tabletop board.
 building(root,{x:180,y:816,w:119,h:64,label:'THE ACADEMY',roof:'#e7eedf'});
 const academy=root.lastChild;add(academy,'path',{d:'M10 -6L52 -30L96 -6Z',fill:'#fcfff1',stroke:'#d7e2cc','stroke-width':3});add(academy,'text',{x:53,y:-7,'text-anchor':'middle','font-size':12,fill:'#45747c','font-weight':900},'A');
 building(root,{x:470,y:125,w:85,h:35,label:'TRAINING',roof:'#d6e5ed'});
 building(root,{x:387,y:805,w:90,h:45,label:'CONTROL',roof:'#e5e9db'});
 building(root,{x:925,y:377,w:112,h:47,label:'BOOKING',roof:'#f1eee0',scale:.35});
 building(root,{x:225,y:329,w:120,h:32,label:'INTAKE',roof:'#dbe3d7',scale:.55});
 building(root,{x:890,y:611,w:103,h:45,label:'BRIEFING',roof:'#efe9d4',scale:.5});
 building(root,{x:570,y:778,w:98,h:40,label:'LAST BRIEFING',roof:'#f0ead7'});
 // Fenced rec yard.
 const yard=add(root,'g',{transform:'translate(225 562) scale(.5)'});
 add(yard,'path',{d:'M197 443H315V485H197Z',fill:'#6eab64',stroke:'#e7ecd8','stroke-width':3});
 for(let i=0;i<8;i++)add(yard,'path',{d:`M${200+i*16} 441V486`,stroke:'#c7d4ba','stroke-width':1});
 add(yard,'path',{d:'M232 476V452H258V476M270 477V459H293V477',fill:'none',stroke:'#397f59','stroke-width':6});
 add(yard,'text',{x:256,y:500,'text-anchor':'middle',class:'scenery-label'},'REC YARD');
 // Printed card stacks sit in the open spaces between roads.
 const deck=add(root,'g',{transform:'translate(585 607) rotate(12)'});for(let i=3;i>=0;i--)add(deck,'rect',{x:i*2,y:i*3,width:78,height:108,rx:5,fill:'#fff9e7',stroke:'#a5b68f','stroke-width':1.4});add(deck,'rect',{x:7,y:7,width:64,height:94,rx:3,fill:'#a776b0'});add(deck,'text',{x:39,y:35,'text-anchor':'middle',class:'deck-title'},'COUNTY');add(deck,'text',{x:39,y:51,'text-anchor':'middle',class:'deck-title'},'EVENTS');add(deck,'text',{x:39,y:82,'text-anchor':'middle','font-size':28,fill:'#fff8dd'},'?');
 const pay=add(root,'g',{transform:'translate(407 263) rotate(-10)'});for(let i=3;i>=0;i--)add(pay,'rect',{x:i*2,y:i*3,width:76,height:99,rx:4,fill:'#fffbe9',stroke:'#94b18b','stroke-width':1.3});add(pay,'rect',{x:6,y:6,width:64,height:87,fill:'#86c77d',rx:3});add(pay,'text',{x:38,y:32,'text-anchor':'middle',class:'deck-title'},'SHIFT PAY');add(pay,'text',{x:38,y:61,'text-anchor':'middle','font-size':29,fill:'#214a3f'},'$');add(pay,'text',{x:38,y:80,'text-anchor':'middle','font-size':8,fill:'#214a3f'},'EACH TURN');
 // Colorful original title printed on the landscape.
 const title=add(root,'g',{transform:'translate(514 505) rotate(-3)'});['L','I','F','E'].forEach((letter,i)=>{add(title,'rect',{x:i*49,y:0,width:46,height:58,rx:2,fill:['#955ca0','#428bbc','#77b575','#e3ae36'][i],stroke:'#f9f5da','stroke-width':3});add(title,'text',{x:i*49+23,y:45,'text-anchor':'middle','font-family':'Georgia,serif','font-weight':900,'font-size':49,fill:'#fffbe8'},letter);});add(title,'text',{x:96,y:80,'text-anchor':'middle',class:'life-board-subtitle'},'ON THE INSIDE');add(title,'text',{x:96,y:98,'text-anchor':'middle',class:'life-board-edition'},'KENNEBEC COUNTY JAIL');
 sign(root,410,908,'CHOOSE YOUR START');
 // These short entrance lanes join the numbered path at the first briefing.
 for(const [d,color] of [['M230 953C150 968 132 938 100 895','#94cde0'],['M380 951C255 990 165 978 100 895','#ecb954']]){add(root,'path',{d,fill:'none',stroke:'#f8f5de','stroke-width':27,'stroke-linecap':'round'});add(root,'path',{d,fill:'none',stroke:color,'stroke-width':18,'stroke-linecap':'round'});}
 add(root,'text',{x:224,y:956,'text-anchor':'middle',class:'start-lane-label'},'ACADEMY');add(root,'text',{x:363,y:969,'text-anchor':'middle',class:'start-lane-label'},'START ON THE FLOOR');
}
function spinner(root){
 const cx=625,cy=315,r=119,g=add(root,'g',{class:'life-spinner','aria-hidden':'true'});
 add(g,'ellipse',{cx:cx+6,cy:cy+18,rx:r+22,ry:r+13,fill:'#2c693e55'});
 add(g,'circle',{cx,cy:cy+7,r:r+22,fill:'#35884c',stroke:'#a2d27b','stroke-width':5});
 add(g,'circle',{cx,cy,r:r+8,fill:'#fffdf0',stroke:'#d0dac0','stroke-width':5});
 const fills=['#e9c74c','#d97b4d','#8fc477','#54acb1','#718ec0','#a578b3'];
 for(let i=0;i<6;i++){
  const start=(i*60-120)*Math.PI/180,end=(i*60-60)*Math.PI/180;
  const x1=cx+Math.cos(start)*r,y1=cy+Math.sin(start)*r,x2=cx+Math.cos(end)*r,y2=cy+Math.sin(end)*r;
  add(g,'path',{d:`M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}Z`,fill:fills[i],stroke:'#ffffef','stroke-width':4});
  const angle=(i*60-90)*Math.PI/180;add(g,'text',{x:cx+Math.cos(angle)*89,y:cy+Math.sin(angle)*89+9,'text-anchor':'middle',class:'spinner-number'},String(i+1));
 }
 // Outer pegs and a white center give the wheel its raised, plastic appearance.
 for(let i=0;i<12;i++){const a=i*Math.PI/6;add(g,'circle',{cx:cx+Math.cos(a)*(r+9),cy:cy+Math.sin(a)*(r+9),r:4,fill:'#fffdec',stroke:'#c5d2ba','stroke-width':1});}
 const needle=add(g,'g',{id:'careerSpinnerNeedle',class:'spinner-needle'});needle.style.transformOrigin=`${cx}px ${cy}px`;
 add(needle,'path',{d:`M${cx-8} ${cy+46}L${cx-6} ${cy-61}L${cx-14} ${cy-61}L${cx} ${cy-95}L${cx+14} ${cy-61}H${cx+6}L${cx+8} ${cy+46}Z`,fill:'#fffef0',stroke:'#c1cbb6','stroke-width':2});
 add(g,'circle',{cx,cy:cy+4,r:34,fill:'#c1cfb9'});add(g,'circle',{cx,cy,r:34,fill:'url(#lifePlastic)',stroke:'#fffff5','stroke-width':3});add(g,'text',{x:cx,y:cy+5,'text-anchor':'middle',class:'spinner-center'},'SPIN');
 add(g,'text',{x:cx,y:cy+r+42,'text-anchor':'middle',class:'scenery-label'},'MAKE YOUR NEXT MOVE');
}
const names={start:['FIRST','BRIEFING'],retire:['RETIREMENT','FINISH'],promotion:['STOP','REVIEW'],shift:['SHIFT','CHOICE'],rest:['DAYS','OFF'],event:['COUNTY','EVENT']};
const fills={start:'#62b9cc',retire:'#d890b0',promotion:'#e17b59',shift:'#9acb7d',rest:'#a6d9e8',event:'#f2cc5b'};
export function createBoard(target){
 const svg=node('svg',{viewBox:'0 0 1200 1000',class:'life-board-art',role:'img','aria-labelledby':'lifeBoardTitle lifeBoardDescription'});add(svg,'title',{id:'lifeBoardTitle'},'Life on the Inside: winding county career board');add(svg,'desc',{id:'lifeBoardDescription'},'A colorful road winds around the Academy, jail buildings, trees and a pond. One hundred numbered stops lead from first briefing to retirement. A six-number spinner sits in the center.');
 const defs=add(svg,'defs');
 const grass=add(defs,'linearGradient',{id:'lifeGrass',x2:'0',y2:'1'});add(grass,'stop',{'stop-color':'#9cc97e'});add(grass,'stop',{offset:1,'stop-color':'#85ba75'});
 const meadow=add(defs,'pattern',{id:'lifeMeadow',width:55,height:43,patternUnits:'userSpaceOnUse'});add(meadow,'path',{d:'M0 43L55 0M0 0L55 43',stroke:'#d5e5a9','stroke-width':.7,opacity:.4});add(meadow,'circle',{cx:14,cy:11,r:1.3,fill:'#eff0bd'});
 const water=add(defs,'linearGradient',{id:'lifeWater',x2:'1',y2:'1'});add(water,'stop',{'stop-color':'#8ad0cb'});add(water,'stop',{offset:1,'stop-color':'#57aebf'});
 const plastic=add(defs,'radialGradient',{id:'lifePlastic',cx:'.35',cy:'.25'});add(plastic,'stop',{'stop-color':'#fffff9'});add(plastic,'stop',{offset:1,'stop-color':'#e2e9d4'});
 scenery(svg);
 const route=add(svg,'path',{d:road,fill:'none',stroke:'none'}),length=route.getTotalLength(),step=length/spaces.length;
 const point=distance=>{const d=Math.max(0,Math.min(length,distance)),p=route.getPointAtLength(d),a=route.getPointAtLength(Math.max(0,d-1)),b=route.getPointAtLength(Math.min(length,d+1)),angle=Math.atan2(b.y-a.y,b.x-a.x);return {x:p.x,y:p.y,angle};};
 add(svg,'path',{d:road,fill:'none',stroke:'#2c643b55','stroke-width':96,'stroke-linecap':'round',transform:'translate(3 7)'});
 add(svg,'path',{d:road,fill:'none',stroke:'#faf9e6','stroke-width':94,'stroke-linecap':'round','stroke-linejoin':'round'});
 add(svg,'path',{d:road,fill:'none',stroke:'#d9ddc1','stroke-width':79,'stroke-linecap':'round'});
 spaces.forEach((space,i)=>{
  const tile=add(svg,'g',{class:'career-tile type-'+space.type,'aria-label':`Stop ${i+1}: ${space.name}`});
  const samples=Array.from({length:17},(_,j)=>point((i+j/16)*step));
  add(tile,'path',{d:samples.map((p,j)=>(j?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' '),fill:'none',stroke:fills[space.type],'stroke-width':76,'stroke-linejoin':'round'});
  if(i){const p=point(i*step),nx=-Math.sin(p.angle),ny=Math.cos(p.angle);add(tile,'path',{d:`M${p.x+nx*38} ${p.y+ny*38}L${p.x-nx*38} ${p.y-ny*38}`,stroke:'#837a4f99','stroke-width':1.2});}
  const p=point((i+.5)*step);let angle=p.angle*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;
  const text=add(tile,'g',{transform:`translate(${p.x} ${p.y}) rotate(${angle})`});
  add(text,'text',{x:0,y:-13,'text-anchor':'middle',class:'road-space-title'},names[space.type][0]);
  add(text,'text',{x:0,y:1,'text-anchor':'middle',class:'road-space-detail'},names[space.type][1]);
  add(text,'text',{x:-step*.27,y:27,'text-anchor':'middle',class:'road-space-number'},String(i+1).padStart(2,'0'));
  add(text,'text',{x:step*.26,y:28,'text-anchor':'middle',class:'road-direction',transform:p.angle*180/Math.PI!==angle?'rotate(180 '+step*.26+' 22)':''},'➜');
 });
 spinner(svg);target.replaceChildren(svg);
 const spin=document.createElement('button');spin.type='button';spin.id='boardSpin';spin.className='board-spin-button';spin.setAttribute('aria-label','Spin the career wheel');spin.style.left=625/12+'%';spin.style.top=315/10+'%';target.parentElement.append(spin);
 return {
  svg,spin,needle:svg.querySelector('#careerSpinnerNeedle'),
  coordinates(position,index){
   const p=point((position+.5)*step),fraction=position-Math.floor(position);
   const offset=pos=>{const a=point((pos+.5)*step).angle,along=(index%2-.5)*25,across=(10+Math.floor(index/2)*25)*(Math.cos(a)<0?-1:1);return {x:Math.cos(a)*along-Math.sin(a)*across,y:Math.sin(a)*along+Math.cos(a)*across};};
   const a=offset(Math.floor(position)),b=offset(Math.ceil(position));
   return {left:(p.x+a.x*(1-fraction)+b.x*fraction)/12,top:(p.y+a.y*(1-fraction)+b.y*fraction)/10};
  },
  center(position){return point((position+.5)*step);}
 };
}
