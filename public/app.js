import {pawns,loadPlayers} from './players.js';
import {spaces,position,move} from './board.js';
const STEP_MS=500;
const board=document.getElementById('board'),details=document.getElementById('spaceDetails');let token=0,turn=0;const players=loadPlayers().map(player=>({...player,position:0}));

function select(index){const space=spaces[index];board.querySelectorAll('.space').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));details.replaceChildren();const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='SPACE '+(index+1)+' · '+space.type.replace('gotojail','corner').toUpperCase();const title=document.createElement('h2');title.textContent=space.name;const text=document.createElement('p');text.textContent=space.detail||'A property in the '+space.group.replace('lightblue','light blue')+' color group.';details.append(eyebrow,title,text);details.className='detail-card '+(space.group||'neutral');if(space.price){const price=document.createElement('p');price.className='detail-price';price.textContent=(space.type==='tax'?'Tax · ':'Price · ')+'$'+space.price;details.append(price);}}
spaces.forEach((space,index)=>{const p=position(index),button=document.createElement('button');button.type='button';button.className=['space',p.side,space.type,index%10===0?'corner':'',space.group||''].join(' ');button.setAttribute('aria-label',space.name+(space.price?', $'+space.price:''));button.setAttribute('aria-pressed','false');button.dataset.index=index;button.style.gridRow=p.row;button.style.gridColumn=p.column;const inner=document.createElement('span');inner.className='space-inner';if(space.group){const strip=document.createElement('span');strip.className='color-strip';inner.append(strip);}const name=document.createElement('span');name.className='space-name';name.textContent=space.name;inner.append(name);if(space.icon){const icon=document.createElement('span');icon.className='space-icon';icon.setAttribute('aria-hidden','true');if(space.icon==='vending'){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 80');svg.setAttribute('class','vending-icon');
 const parts=[['rect',{x:8,y:3,width:48,height:72,rx:5,fill:'#bc4938',stroke:'#263c30','stroke-width':3}],['rect',{x:14,y:10,width:28,height:43,rx:2,fill:'#dbedf0',stroke:'#263c30','stroke-width':2}],['path',{d:'M14 25H42M14 39H42',stroke:'#263c30','stroke-width':2}],['path',{d:'M19 16V21M28 16V21M37 16V21M19 30V35M28 30V35M37 30V35M19 44V49M28 44V49M37 44V49',stroke:'#d39533','stroke-width':5}],['rect',{x:46,y:17,width:5,height:12,rx:1,fill:'#f3db8f'}],['rect',{x:18,y:59,width:26,height:9,rx:2,fill:'#263c30'}]];
 for(const [tag,attributes] of parts){const part=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [name,value] of Object.entries(attributes))part.setAttribute(name,value);svg.append(part);}icon.append(svg);
 }else icon.textContent=space.icon;inner.append(icon);}if(space.price){const price=document.createElement('span');price.className='space-price';price.textContent='$'+space.price;inner.append(price);}button.append(inner);button.onclick=()=>select(index);board.append(button);});
let moving=false;const pieces=(players.length?players:[{name:'Preview',pawn:'keys',position:0}]).map(player=>{const pawn=document.createElement('span');pawn.className='token player-token moving-token';const image=document.createElement('img');image.src=pawns.find(p=>p.id===player.pawn).icon;image.alt='';pawn.append(image);pawn.setAttribute('aria-label',player.name+'’s pawn');pawn.title=player.name;board.append(pawn);return pawn;});
function roster(){const container=document.getElementById('playerRoster');container.replaceChildren();players.forEach((player,index)=>{const label=document.createElement('span');label.className='roster-player'+(index===turn?' active':'');const image=document.createElement('img');image.src=pawns.find(p=>p.id===player.pawn).icon;image.alt=pawns.find(p=>p.id===player.pawn).name;label.append(image,document.createTextNode(player.name));container.append(label);});document.getElementById('turnTitle').textContent=players.length?players[turn].name+'’s turn':'Your move.';}
function locate(piece,space,index){const tile=board.querySelector(`[data-index="${space}"]`),size=board.clientWidth*.028;piece.style.left=((tile.offsetLeft+tile.offsetWidth*(.2+(index%3)*.3)-size/2)/board.clientWidth*100)+'%';piece.style.top=((tile.offsetTop+tile.offsetHeight*(.58+Math.floor(index/3)*.26)-size/2)/board.clientHeight*100)+'%';piece.dataset.space=space;}
function place(){pieces.forEach((piece,index)=>locate(piece,players.length?players[index].position:token,index));}
async function glide(piece,space,index){const before=piece.getBoundingClientRect();locate(piece,space,index);const after=piece.getBoundingClientRect();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const dx=before.x-after.x,dy=before.y-after.y,lift=Math.max(7,Math.min(20,board.clientWidth*.018));await piece.animate([
 {transform:`translate(${dx}px,${dy}px) scale(1)`,offset:0},
 {transform:`translate(${dx*.5}px,${dy*.5-lift}px) scale(1.06)`,offset:.45},
 {transform:'translate(0,0) scale(1.1,.9)',offset:.82},
 {transform:'translate(0,0) scale(1)',offset:1}
 ],{duration:STEP_MS,easing:'linear'}).finished;}
new ResizeObserver(()=>{if(!moving)place();}).observe(board);
place();roster();select(0);
function makeCube(value){
 const cube=document.createElement('span');cube.className='dice-cube';
 const pipPositions={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]},remaining=[1,2,3,4,5,6].filter(n=>n!==value&&n!==7-value),side=remaining[0],top=remaining.find(n=>n!==side&&n!==7-side);
 const faces={front:value,back:7-value,right:side,left:7-side,top,bottom:7-top};
 for(const [orientation,number] of Object.entries(faces)){const face=document.createElement('span');face.className='dice-face dice-'+orientation;face.dataset.value=number;for(let cell=1;cell<=9;cell++){const pip=document.createElement('i');if(pipPositions[number].includes(cell))pip.className='pip';face.append(pip);}cube.append(face);}return cube;
}
async function rollAcrossBoard(values){
 board.querySelectorAll('.board-die').forEach(die=>die.remove());
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dice=values.map((value,index)=>{const die=document.createElement('span');die.className='board-die';die.setAttribute('role','img');die.dataset.value=value;die.setAttribute('aria-label','Die showing '+value);die.style.left=(48+index*10)+'%';die.style.top=(43+index*8)+'%';const shadow=document.createElement('span');shadow.className='dice-shadow';die.append(shadow,makeCube(value));board.append(die);return die;});
 if(reduced)return;
 const viewport=document.querySelector('.board-viewport');if(viewport.scrollWidth>viewport.clientWidth)viewport.scrollTo({left:Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2)});
 await Promise.all(dice.map(async(die,index)=>{
  const distance=board.clientWidth*.34,height=board.clientWidth*.17,spin=index?-1:1,lift=Math.max(16,board.clientWidth*.035),frames=[];
  for(let beat=0;beat<=6;beat++){const airborne=beat%2===1;frames.push({transform:`translateY(${airborne?-lift:0}px) rotateX(${-18+spin*(6-beat)*150}deg) rotateY(${24+(6-beat)*90}deg) rotateZ(${spin*(6-beat)*15}deg)`,offset:beat/6});}
  const travel=die.animate([{transform:`translate(${-distance}px,${height}px)`},{transform:'translate(0,0)'}],{duration:STEP_MS*3,easing:'linear'});
  const tumble=die.querySelector('.dice-cube').animate(frames,{duration:STEP_MS*3,easing:'linear'});
  const shadow=die.querySelector('.dice-shadow').animate([{transform:'scale(1)',opacity:.35},{transform:'scale(.65)',opacity:.12},{transform:'scale(1)',opacity:.35}],{duration:STEP_MS,iterations:3,easing:'ease-in-out'});
  await Promise.all([travel.finished,tumble.finished,shadow.finished]);
 }));
}
document.getElementById('roll').onclick=async()=>{
 if(moving)return;moving=true;const roll=document.getElementById('roll'),reset=document.getElementById('reset');roll.disabled=true;reset.disabled=true;
 const player=players[turn],start=player?player.position:token,values=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)],total=values[0]+values[1],result=move(start,total),piece=pieces[players.length?turn:0];
 document.getElementById('moveStatus').textContent='Rolling the dice…';
 try{await rollAcrossBoard(values);document.querySelectorAll('#dice span').forEach((die,i)=>die.textContent=String.fromCodePoint(0x2680+values[i]-1));document.getElementById('dice').setAttribute('aria-label','Rolled '+values.join(' and '));document.getElementById('moveStatus').textContent=(player?player.name:'You')+' rolled '+total+'. Moving…';for(let step=1;step<=total;step++)await glide(piece,(start+step)%40,players.length?turn:0);if(result.sentToJail)await glide(piece,10,players.length?turn:0);
 token=result.position;if(player)player.position=token;select(token);document.getElementById('moveStatus').textContent=(player?player.name:'You')+' rolled '+total+'. '+(result.sentToJail?'Go directly to Two Bridges.':(result.passedGo?'Passed Briefing! ':'')+'Landed on '+spaces[token].name+'.');if(players.length){turn=(turn+1)%players.length;roster();}
 }finally{moving=false;roll.disabled=false;reset.disabled=false;place();}
};
document.getElementById('reset').onclick=()=>{board.querySelectorAll('.board-die').forEach(die=>die.remove());token=0;turn=0;players.forEach(player=>player.position=0);place();roster();select(0);document.getElementById('moveStatus').textContent=players.length?'Everyone is back at Briefing.':'Your token is waiting at Briefing.';document.querySelectorAll('#dice span').forEach(d=>d.textContent='⚀');document.getElementById('dice').setAttribute('aria-label','Dice not rolled yet');};
document.getElementById('zoom').onclick=event=>{const enabled=document.querySelector('.board-viewport').classList.toggle('enlarged');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Fit the whole board ↙':'Enlarge board ↗';};
