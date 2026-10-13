import {newGame,loadGame,perform,deed,rent,gameKey} from './economy.js';
import {pawns,loadPlayers} from './players.js';
import {spaces,position,move} from './board.js';
const STEP_MS=500;
const board=document.getElementById('board'),details=document.getElementById('spaceDetails');const rosterChoice=loadPlayers();let game=rosterChoice.length?loadGame(rosterChoice):null,players=game?.players||[],token=0,turn=game?.turn||0,selected=0;

function select(index){selected=index;const space=spaces[index];board.querySelectorAll('.space').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));details.replaceChildren();const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='SPACE '+(index+1)+' · '+space.type.replace('gotojail','corner').toUpperCase();const title=document.createElement('h2');title.textContent=space.name;const text=document.createElement('p');text.textContent=space.detail||'A property in the '+space.group.replace('lightblue','light blue')+' color group.';details.append(eyebrow,title,text);details.className='detail-card '+(space.group||'neutral');if(space.price){const price=document.createElement('p');price.className='detail-price';price.textContent=(space.type==='tax'?'Tax · ':'Price · ')+'$'+space.price;details.append(price);}if(game)propertyControls(index);}
spaces.forEach((space,index)=>{const p=position(index),button=document.createElement('button');button.type='button';button.className=['space',p.side,space.type,index%10===0?'corner':'',space.group||''].join(' ');button.setAttribute('aria-label',space.name+(space.price?', $'+space.price:''));button.setAttribute('aria-pressed','false');button.dataset.index=index;button.style.gridRow=p.row;button.style.gridColumn=p.column;const inner=document.createElement('span');inner.className='space-inner';if(space.group){const strip=document.createElement('span');strip.className='color-strip';inner.append(strip);}const name=document.createElement('span');name.className='space-name';name.textContent=space.name;inner.append(name);if(space.icon){const icon=document.createElement('span');icon.className='space-icon';icon.setAttribute('aria-hidden','true');if(space.icon==='vending'){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 80');svg.setAttribute('class','vending-icon');
 const parts=[['rect',{x:8,y:3,width:48,height:72,rx:5,fill:'#bc4938',stroke:'#263c30','stroke-width':3}],['rect',{x:14,y:10,width:28,height:43,rx:2,fill:'#dbedf0',stroke:'#263c30','stroke-width':2}],['path',{d:'M14 25H42M14 39H42',stroke:'#263c30','stroke-width':2}],['path',{d:'M19 16V21M28 16V21M37 16V21M19 30V35M28 30V35M37 30V35M19 44V49M28 44V49M37 44V49',stroke:'#d39533','stroke-width':5}],['rect',{x:46,y:17,width:5,height:12,rx:1,fill:'#f3db8f'}],['rect',{x:18,y:59,width:26,height:9,rx:2,fill:'#263c30'}]];
 for(const [tag,attributes] of parts){const part=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [name,value] of Object.entries(attributes))part.setAttribute(name,value);svg.append(part);}icon.append(svg);
 }else icon.textContent=space.icon;inner.append(icon);}if(space.price){const price=document.createElement('span');price.className='space-price';price.textContent='$'+space.price;inner.append(price);}button.append(inner);button.onclick=()=>select(index);board.append(button);});
let moving=false;const pieces=(players.length?players:[{name:'Preview',pawn:'keys',position:0}]).map(player=>{const pawn=document.createElement('span');pawn.className='token player-token moving-token';const image=document.createElement('img');image.src=pawns.find(p=>p.id===player.pawn).icon;image.alt='';pawn.append(image);pawn.setAttribute('aria-label',player.name+'’s pawn');pawn.title=player.name;board.append(pawn);return pawn;});
function roster(){const container=document.getElementById('playerRoster');container.replaceChildren();players.forEach((player,index)=>{const label=document.createElement('span');label.className='roster-player'+(index===turn?' active':'');const image=document.createElement('img');image.src=pawns.find(p=>p.id===player.pawn).icon;image.alt=pawns.find(p=>p.id===player.pawn).name;label.append(image,document.createTextNode(player.name+' · $'+player.cash.toLocaleString()+(player.bankrupt?' · Out':player.inJail?' · Two Bridges':'')));container.append(label);});document.getElementById('turnTitle').textContent=players.length?players[turn].name+'’s turn':'Your move.';}
function locate(piece,space,index){const tile=board.querySelector(`[data-index="${space}"]`),size=board.clientWidth*.028;piece.style.left=((tile.offsetLeft+tile.offsetWidth*(.2+(index%3)*.3)-size/2)/board.clientWidth*100)+'%';piece.style.top=((tile.offsetTop+tile.offsetHeight*(.58+Math.floor(index/3)*.26)-size/2)/board.clientHeight*100)+'%';piece.dataset.space=space;}
function place(){pieces.forEach((piece,index)=>{piece.hidden=!!players[index]?.bankrupt;locate(piece,players.length?players[index].position:token,index);});}
async function glide(piece,space,index){const before=piece.getBoundingClientRect();locate(piece,space,index);const after=piece.getBoundingClientRect();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const dx=before.x-after.x,dy=before.y-after.y,lift=Math.max(7,Math.min(20,board.clientWidth*.018));await piece.animate([
 {transform:`translate(${dx}px,${dy}px) scale(1)`,offset:0},
 {transform:`translate(${dx*.5}px,${dy*.5-lift}px) scale(1.06)`,offset:.45},
 {transform:'translate(0,0) scale(1.1,.9)',offset:.82},
 {transform:'translate(0,0) scale(1)',offset:1}
 ],{duration:STEP_MS,easing:'linear'}).finished;}
new ResizeObserver(()=>{if(!moving)place();}).observe(board);
place();roster();select(0);document.querySelector('.economy-card').hidden=!game;if(game){document.getElementById('moveStatus').textContent=players[turn].name+' is at '+spaces[players[turn].position].name+'.';renderEconomy();}
function makeCube(value){
 const cube=document.createElement('span');cube.className='dice-cube';
 const pipPositions={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]},remaining=[1,2,3,4,5,6].filter(n=>n!==value&&n!==7-value),side=remaining[0],top=remaining.find(n=>n!==side&&n!==7-side);
 const faces={front:value,back:7-value,right:side,left:7-side,top,bottom:7-top};
 for(const [orientation,number] of Object.entries(faces)){const face=document.createElement('span');face.className='dice-face dice-'+orientation;face.dataset.value=number;for(let cell=1;cell<=9;cell++){const pip=document.createElement('i');if(pipPositions[number].includes(cell))pip.className='pip';face.append(pip);}cube.append(face);}return cube;
}
async function rollAcrossBoard(values){
 board.querySelectorAll('.board-die').forEach(die=>die.remove());
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dice=values.map((value,index)=>{const die=document.createElement('span');die.className='board-die';die.setAttribute('role','img');die.dataset.value=value;die.setAttribute('aria-label','Die showing '+value);die.style.left=(48+index*10+(Math.random()-.5)*4)+'%';die.style.top=(43+index*8+(Math.random()-.5)*4)+'%';const shadow=document.createElement('span');shadow.className='dice-shadow';die.append(shadow,makeCube(value));board.append(die);return die;});
 if(reduced)return;
 const viewport=document.querySelector('.board-viewport');if(viewport.scrollWidth>viewport.clientWidth)viewport.scrollTo({left:Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2)});
 await Promise.all(dice.map(async(die,index)=>{
  const random=(min,max)=>min+Math.random()*(max-min),direction=()=>Math.random()<.5?-1:1;
  const hops=6,diceBeat=STEP_MS*2,duration=diceBeat*hops,lift=Math.max(20,board.clientWidth*random(.04,.065)),frames=[];
  const spinX=direction()*360*(4+Math.floor(Math.random()*4)),spinY=direction()*360*(3+Math.floor(Math.random()*4)),spinZ=direction()*random(360,720);
  const tiltX=random(-28,-14),tiltY=random(16,32),tiltZ=random(-12,12),cube=die.querySelector('.dice-cube');
  cube.style.transform=`rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${tiltZ}deg)`;
  for(let beat=0;beat<=hops*2;beat++){const remaining=1-beat/(hops*2),hop=beat%2===1?lift*random(.65,1.25):0;frames.push({transform:`translateY(${-hop}px) rotateX(${tiltX+remaining*spinX}deg) rotateY(${tiltY+remaining*spinY}deg) rotateZ(${tiltZ+remaining*spinZ}deg)`,offset:beat/(hops*2)});}
  const mirror=Math.random()<.5,edge=()=>random(.16,.24),far=()=>random(.74,.84);
  const route=[[edge(),far()],[far(),edge()],[edge(),edge()],[far(),far()],[edge(),random(.4,.6)],[far(),random(.35,.55)]];
  const finalX=parseFloat(die.style.left)/100,finalY=parseFloat(die.style.top)/100;
  const path=route.map(([x,y],step)=>({transform:`translate(${((mirror?1-x:x)-finalX)*board.clientWidth}px,${(y-finalY)*board.clientHeight}px)`,offset:step/hops}));
  path.push({transform:'translate(0,0)',offset:1});
  const travel=die.animate(path,{duration,easing:'linear'});
  const tumble=cube.animate(frames,{duration,easing:'linear'});
  const shadow=die.querySelector('.dice-shadow').animate([{transform:'scale(1)',opacity:.35},{transform:`scale(${random(.4,.65)})`,opacity:.1},{transform:'scale(1)',opacity:.35}],{duration:diceBeat,iterations:hops,easing:'ease-in-out'});
  await Promise.all([travel.finished,tumble.finished,shadow.finished]);
 }));
}
document.getElementById('roll').onclick=async()=>{
 if(moving||(game&&game.phase!=='roll'))return;moving=true;const roll=document.getElementById('roll'),reset=document.getElementById('reset');roll.disabled=true;reset.disabled=true;
 const actor=turn,player=players[actor],start=player?player.position:token,values=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)],total=values[0]+values[1],piece=pieces[player?actor:0];
 document.getElementById('moveStatus').textContent='Rolling the dice…';document.getElementById('gameError').textContent='';
 try{
  const next=game?perform(game,{type:'roll',dice:values}):null,result=game?null:move(start,total);
  await rollAcrossBoard(values);document.querySelectorAll('#dice span').forEach((die,i)=>die.textContent=String.fromCodePoint(0x2680+values[i]-1));document.getElementById('dice').setAttribute('aria-label','Rolled '+values.join(' and '));
  document.getElementById('moveStatus').textContent=(player?player.name:'You')+' rolled '+total+'. Moving…';
  const route=next?.route||Array.from({length:total},(_,i)=>({position:(start+i+1)%40}));
  for(const step of route)await glide(piece,step.position,player?actor:0);
  if(!game&&result.sentToJail)await glide(piece,10,0);
  if(next){game=next;players=game.players;turn=game.turn;token=players[actor].position;saveGame();roster();select(token);}
  else{token=result.position;select(token);}
  document.getElementById('moveStatus').textContent=(player?player.name:'You')+' rolled '+total+'. Landed on '+spaces[token].name+'.';
 }catch(error){document.getElementById('gameError').textContent=error.message;}
 finally{moving=false;roll.disabled=false;reset.disabled=false;place();if(game)renderEconomy();}
};
document.getElementById('reset').onclick=()=>{
 if(game&&!confirm('Start a new game? This resets all balances, property ownership, and buildings on this device.'))return;
 board.querySelectorAll('.board-die').forEach(die=>die.remove());token=0;turn=0;if(game){game=newGame(rosterChoice);players=game.players;saveGame();}place();roster();select(0);document.getElementById('moveStatus').textContent='Everyone is back at Briefing.';document.querySelectorAll('#dice span').forEach(d=>d.textContent='⚀');document.getElementById('dice').setAttribute('aria-label','Dice not rolled yet');if(game)renderEconomy();
};
function saveGame(){try{localStorage.setItem(gameKey,JSON.stringify(game));}catch{document.getElementById('gameError').textContent='This browser could not save the game. Keep this page open to continue.';}}
async function execute(action){if(moving)return;document.getElementById('gameError').textContent='';try{const next=perform(game,action);if(next.route.length){moving=true;document.getElementById('roll').disabled=true;const actor=game.turn;for(const step of next.route)await glide(pieces[actor],step.position,actor);moving=false;}game=next;players=game.players;turn=game.turn;saveGame();place();roster();select(selected);renderEconomy();document.getElementById('moveStatus').textContent=action.type==='end'?players[turn].name+'’s turn. At '+spaces[players[turn].position].name+'.':game.log[0];}catch(error){moving=false;document.getElementById('gameError').textContent=error.message;renderEconomy();}}
function button(container,label,action,disabled=false){const b=document.createElement('button');b.type='button';b.className='economy-button';b.textContent=label;b.disabled=disabled||moving;b.onclick=()=>execute(action);container.append(b);return b;}
function paragraph(container,text){const p=document.createElement('p');p.textContent=text;container.append(p);}
function propertyControls(index){const property=game.properties[index],d=deed(index);if(!property)return;const owner=property.owner,manager=game.phase==='debt'?game.debts[0].payer:game.turn;
 paragraph(details,owner===null?'Available from the bank.':'Owned by '+game.players[owner].name+(property.mortgaged?' · Mortgaged':'')+(property.buildings?' · '+(property.buildings===5?'Hotel':property.buildings+' house'+(property.buildings===1?'':'s')):''));
 if(d.rents){const table=document.createElement('table');table.className='rent-table';d.rents.forEach((amount,level)=>{const row=document.createElement('tr'),label=document.createElement('td'),price=document.createElement('td');label.textContent=level===0?'Base rent':level===5?'Hotel':level+' house'+(level===1?'':'s');price.textContent='$'+amount;row.append(label,price);table.append(row);});details.append(table);paragraph(details,'Full color group doubles unimproved rent. Houses and hotel: $'+d.buildCost+' each.');}
 else paragraph(details,spaces[index].type==='railroad'?'Rent: $25 / $50 / $100 / $200 for 1 / 2 / 3 / 4 officers owned.':'Rent: 4× the dice total, or 10× when both instructors are owned.');
 if(owner!==null)paragraph(details,'Current rent: '+(spaces[index].type==='utility'?'dice-based':'$'+rent(game,index))+' · Mortgage value: $'+d.mortgage);
 if(owner===manager&&game.phase!=='over'){const actions=document.createElement('div');actions.className='property-actions';if(d.buildCost){button(actions,'Build · $'+d.buildCost,{type:'build',index},property.buildings===5||property.mortgaged);button(actions,'Sell building · $'+d.buildCost/2,{type:'sell',index},property.buildings===0);button(actions,'Sell all buildings in group',{type:'sell-group',index},property.buildings===0);}button(actions,property.mortgaged?'Lift mortgage · $'+Math.ceil(d.mortgage*1.1):'Mortgage · $'+d.mortgage,{type:property.mortgaged?'redeem':'mortgage',index});details.append(actions);
  if(game.phase!=='auction'&&game.players.filter(p=>!p.bankrupt).length>1){const trade=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Trade this property';trade.append(summary);const otherLabel=document.createElement('label');otherLabel.textContent='Trade with';const other=document.createElement('select');game.players.forEach((player,i)=>{if(i!==manager&&!player.bankrupt){const option=document.createElement('option');option.value=i;option.textContent=player.name;other.append(option);}});otherLabel.append(other);trade.append(otherLabel);const exchangeLabel=document.createElement('label');exchangeLabel.textContent='Receive a property (optional)';const exchange=document.createElement('select');exchangeLabel.append(exchange);trade.append(exchangeLabel);function choices(){exchange.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='No property in return';exchange.append(none);game.properties.forEach((p,i)=>{if(p?.owner===Number(other.value)){const option=document.createElement('option');option.value=i;option.textContent=spaces[i].name;exchange.append(option);}});}other.onchange=choices;choices();const cashLabel=document.createElement('label');cashLabel.textContent='Cash paid to you';const cash=document.createElement('input');cash.type='number';cash.min=0;cash.step=1;cash.value=0;cashLabel.append(cash);trade.append(cashLabel);const agree=document.createElement('button');agree.className='economy-button';agree.type='button';agree.textContent='Confirm trade';agree.onclick=()=>{if(confirm('Do both players agree to trade '+spaces[index].name+' for $'+cash.value+(exchange.value?' and '+spaces[Number(exchange.value)].name:'')+'?'))execute({type:'trade',index,player:Number(other.value),cash:Number(cash.value),exchange:exchange.value});};trade.append(agree);details.append(trade);}
 }
}
function renderEconomy(){
 board.querySelectorAll('.space').forEach((tile,index)=>{const p=game.properties[index];tile.classList.toggle('owned',p?.owner!==null&&!!p);tile.querySelector('.building-badge')?.remove();if(p?.buildings){const badge=document.createElement('span');badge.className='building-badge';badge.textContent=p.buildings===5?'🏨':'🏠 '+p.buildings;tile.append(badge);}});
 const controls=document.getElementById('turnActions'),economic=document.getElementById('economicActions');controls.replaceChildren();economic.replaceChildren();
 document.getElementById('roll').disabled=moving||game.phase!=='roll';
 document.getElementById('bankStock').textContent='Bank: '+game.bank.houses+' houses · '+game.bank.hotels+' hotels. Hospital Coverage has no jackpot.';
 const log=document.getElementById('gameLog');log.replaceChildren();game.log.slice(0,12).forEach(text=>{const li=document.createElement('li');li.textContent=text;log.append(li);});
 if(game.phase==='over'){document.getElementById('turnTitle').textContent=game.players[game.winner].name+' wins!';paragraph(controls,'Start a new game to play again.');return;}if(game.phase==='auction')document.getElementById('turnTitle').textContent='Property auction';if(game.phase==='debt')document.getElementById('turnTitle').textContent=game.players[game.debts[0].payer].name+'’s payment';
 if(game.phase==='action')button(controls,'End turn →',{type:'end'});
 if(game.phase==='roll'&&game.extraRoll)paragraph(controls,'Doubles! Roll again.');
 if(game.players[game.turn].inJail&&game.phase==='roll'){paragraph(controls,'Two Bridges: roll doubles, pay $50, or use a get-out-free card.');button(controls,'Pay $50 bail',{type:'bail'});button(controls,'Use get-out-free card',{type:'free-card'},game.players[game.turn].freeCards.length===0);}
 if(game.phase==='purchase'){paragraph(controls,spaces[game.offer].name+' is available for $'+deed(game.offer).price+'.');button(controls,'Buy · $'+deed(game.offer).price,{type:'buy'},game.players[game.turn].cash<deed(game.offer).price);button(controls,'Send to auction',{type:'auction'});}
 if(game.phase==='auction'){
  const a=game.auction;paragraph(controls,'Auction: '+spaces[a.index].name+'. High bid: $'+a.high+(a.bidder!==null?' by '+game.players[a.bidder].name:''));paragraph(controls,game.players[a.actor].name+' can bid or pass.');const label=document.createElement('label');label.textContent='Your bid';const input=document.createElement('input');input.type='number';input.min=a.high+1;input.max=game.players[a.actor].cash;input.value=a.high+1;input.id='auctionBid';label.append(input);controls.append(label);const bid=button(controls,'Place bid',{type:'bid',amount:input.value});bid.onclick=()=>execute({type:'bid',amount:input.value});button(controls,'Pass on this auction',{type:'pass'});
 }
 if(game.phase==='debt'){const d=game.debts[0];paragraph(controls,game.players[d.payer].name+' owes $'+d.amount+' for '+d.label+'. Select an owned space to sell buildings or mortgage it.');const b=button(controls,'Declare bankruptcy',{type:'bankrupt'});b.onclick=()=>{if(confirm('Declare bankruptcy and leave this game?'))execute({type:'bankrupt'});};}
 const manager=game.phase==='debt'?game.debts[0].payer:game.turn;paragraph(economic,game.players[manager].name+'’s properties');const list=document.createElement('div');list.className='owned-list';game.properties.forEach((property,index)=>{if(property?.owner===manager){const b=document.createElement('button');b.type='button';b.textContent=spaces[index].name+(property.mortgaged?' · Mortgaged':'');b.onclick=()=>select(index);list.append(b);}});economic.append(list);if(!list.children.length)paragraph(economic,'No properties yet.');
}
document.getElementById('zoom').onclick=event=>{const enabled=document.querySelector('.board-viewport').classList.toggle('enlarged');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Fit the whole board ↙':'Enlarge board ↗';};
