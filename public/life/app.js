import {drivingEffects} from './driving.js?v=driving-1';
import {carIcon,carDescription} from './cars.js?v=job-cards-1';
import {pawns,colors,ranks,gameKey,loadGame,decision,perform,standings,spaceCount,lastSpace,spinnerStep,entryTracks,inEntry,inCrisis,crisisSpaces,crisisFork,salary,tileCount,tileBonus,homeValue,familyBonus,lifeTiles} from './rules.js?v=job-cards-1';
import {createBoard} from './board.js?v=job-cards-1';
import {OnlineRoom,roomBanner} from '../online.js';
import {bindEndGame,clearEndedGame} from '../end-game.js';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const locationLabel=p=>p.retired?'Retired':!p.academyDone?'Choose your start':inCrisis(p)?'Mid-Life Crisis · Space '+(p.crisisPosition+1)+' of '+crisisSpaces.length:inEntry(p)?(p.careerPath==='academy'?'Academy':'Jail career')+' · Space '+(p.entryPosition+1)+' of '+entryTracks[p.careerPath].length:'Stop '+(p.position+1)+' of '+spaceCount;
const money=n=>(n<0?'−':'')+'$'+Math.abs(n).toLocaleString('en-US');
const code=new URLSearchParams(location.search).get('room')?.toUpperCase();
const online=code?new OnlineRoom('life',code):null;
let game=null,busy=false,moving=false,cleared=false,generation=0,lastChoice='',endBinding,motionHint='Making the rounds…';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const board=createBoard($('careerTiles')),coordinates=board.coordinates;
const driving=drivingEffects($('careerBoard'));
const panelSpin=document.createElement('button');panelSpin.type='button';panelSpin.id='panelSpin';panelSpin.className='panel-spin';panelSpin.setAttribute('aria-label','Spin the wheel');
const panelWheel=document.createElementNS('http://www.w3.org/2000/svg','svg');panelWheel.setAttribute('viewBox','470 155 310 340');panelWheel.setAttribute('aria-hidden','true');panelWheel.append(board.svg.querySelector('defs').cloneNode(true),board.svg.querySelector('.life-spinner').cloneNode(true));panelWheel.querySelectorAll('[id]').forEach(n=>{if(n.id==='careerSpinnerNeedle')n.removeAttribute('id');else n.id='panel-'+n.id;});panelWheel.querySelectorAll('[fill]').forEach(n=>{const fill=n.getAttribute('fill');if(fill.startsWith('url(#'))n.setAttribute('fill',fill.replace('url(#','url(#panel-'));});panelSpin.append(panelWheel);document.querySelector('.roll-area').prepend(panelSpin);
const panelNeedle=panelWheel.querySelector('.spinner-needle');
const headings=new Map();
function drive(img,frames,options){
 let previous=headings.get(img.dataset.pawn),lastAngle=previous;
 const clean=frames.map((frame,i)=>{
  const at={x:parseFloat(frame.left),y:parseFloat(frame.top)},next=frames.slice(i+1).find(f=>Math.abs(parseFloat(f.left)-at.x)+Math.abs(parseFloat(f.top)-at.y)>.001),before=frames[Math.max(0,i-1)];
  let angle=next?Math.atan2((parseFloat(next.top)-at.y)*1350,(parseFloat(next.left)-at.x)*1400)*180/Math.PI+90:i?Math.atan2((at.y-parseFloat(before.top))*1350,(at.x-parseFloat(before.left))*1400)*180/Math.PI+90:lastAngle??0;
  if(lastAngle!==undefined){while(angle-lastAngle>180)angle-=360;while(angle-lastAngle< -180)angle+=360;}lastAngle=angle;
  return {...frame,transform:`translate(-50%,-50%) rotate(${angle}deg)`};
 });
 headings.set(img.dataset.pawn,lastAngle);img.style.transform=clean.at(-1).transform;
 return img.animate(clean,options);
}
let spinnerAngle=0;
function canAct(){return !!game&&!cleared&&!busy&&!moving&&game.phase!=='over'&&(!online||online.canAct);}
function error(message){$('lifeError').textContent=message;$('decisionError').textContent=message;}
function tileBack(){const card=el('div','life-tile-back');card.setAttribute('aria-hidden','true');for(const letter of 'LIFE')card.append(el('span','',letter));return card;}
function renderTiles(target,p,reveal){
 target.replaceChildren();target.className='life-tile-collection';
 const count=tileCount(p),heading=el('p','tile-rack-label',count+' LIFE tile'+(count===1?'':'s')+(reveal?' · '+money(tileBonus(p)):' · Face down until retirement'));target.append(heading);
 const rack=el('div','life-tile-rack');rack.setAttribute('aria-label',count+' LIFE tiles');
 if(!count)rack.append(el('span','tile-empty','Collect memories along the way.'));
 else if(!reveal){for(let i=0;i<Math.min(count,6);i++)rack.append(tileBack());if(count>6)rack.append(el('span','tile-more','+'+(count-6)));}
 else for(const id of p.lifeTiles||[]){const tile=lifeTiles.find(t=>t.id===id),card=el('div','life-tile-face');card.append(el('strong','',money(tile.value)),el('span','',tile.name));rack.append(card);}
 target.append(rack);
}
function announceTiles(previous){if(!previous)return;const gains=game.players.map((p,i)=>({p,count:tileCount(p)-tileCount(previous.players[i])})).filter(a=>a.count>0);if(!gains.length)return;document.querySelector('.life-tile-award')?.remove();const notice=el('div','life-tile-award');notice.setAttribute('role','status');notice.append(tileBack(),el('span','',gains.map(({p,count})=>p.name+' earned '+count+' LIFE tile'+(count===1?'':'s')+'!').join(' ')));document.body.append(notice);setTimeout(()=>notice.remove(),3200);}
function renderDecision(){
 const event=decision(game);if(!event)return;
 $('decisionPlayer').textContent=game.players[game.turn].name+' · '+(game.pending.type==='academy'?'YOUR FIRST DECISION':game.pending.type==='crisis'?'MID-LIFE CRISIS':'ON THE CLOCK');$('decisionTitle').textContent=event.title;$('decisionIcon').textContent=event.icon;$('decisionText').textContent=event.text;$('decisionOptions').replaceChildren();$('decisionOptions').classList.toggle('job-card-options',!!event.jobCards);
 event.options.forEach((choice,index)=>{const button=el('button','decision-choice',choice.label);button.type='button';if(event.jobCards){button.classList.add(Number.isInteger(choice.acceptJob)?'job-accept':choice.faceDown?'job-card-back':'job-card-face');}button.disabled=!!choice.disabled||!canAct();const changes=[];if(choice.cash)changes.push((choice.cash>0?'+':'−')+money(Math.abs(choice.cash)));if(choice.tiles)changes.push('+'+choice.tiles+' LIFE tile'+(choice.tiles===1?'':'s'));if(choice.promote)changes.push('Higher salary');if(choice.home)changes.push('Retirement home value '+money(choice.home.value));if(choice.children)changes.push('+1 child');button.append(el('span','',changes.join(' · ')+(choice.disabled?' · Not eligible yet':'')));button.onclick=()=>act({type:'choose',index});$('decisionOptions').append(button);});
}
function controls(){if(!game)return;const p=game.players[game.turn],mine=!online||online.viewer===game.turn,active=canAct();
 $('turnEyebrow').textContent=game.phase==='over'?'OFF THE CLOCK':mine?'ON THE CLOCK':'WAITING FOR THE CREW';$('turnName').textContent=game.phase==='over'?'Everyone’s retired.':p.name;$('turnRank').textContent=game.phase==='over'?'The final briefing':ranks[p.rank]+' · '+locationLabel(p);
 $('turnStats').replaceChildren();for(const [label,value] of [['Savings / debt',money(p.cash)],['Pay Day salary',money(salary(p))],['LIFE tiles',String(tileCount(p))]]){const stat=el('div','stat',label);stat.append(el('strong','',value));$('turnStats').append(stat);}
 $('careerDie').textContent=game.dice||'–';$('careerDie').setAttribute('aria-label',game.dice?'Spun '+game.dice:'Spinner ready');board.spin.disabled=game.phase!=='roll'||!active;panelSpin.disabled=board.spin.disabled;
 const starting=game.phase==='choice'&&game.pending.type==='academy';board.startPanel.hidden=true;board.setPath(p.careerPath);
 for(const {button} of board.pathButtons)button.disabled=!starting||!active;
 $('openDecision').textContent=starting?'Choose your career path →':'Make your decision →';
 $('turnHint').textContent=moving?motionHint:game.phase==='over'?'Compare the crew’s final scores below.':!mine?'Waiting for '+p.name+'.':game.phase==='choice'?(starting?'Choose Work in the Jail or Go to the Academy below the board.':'A decision is waiting for you.'):game.phase==='end'?(p.retired?'Your career is complete. Pass the turn to the crew.':'Shift complete. Pass it to the next officer.'):'Your next shift is one spin away.';
 for(const [id,phase] of [['rollCareer','roll'],['openDecision','choice'],['endCareerTurn','end']]){$(id).hidden=game.phase!==phase||!mine;$(id).disabled=!active;}
 renderDecision();renderTiles($('lifeTileRack'),p,game.phase==='over');endBinding?.update();
}
function renderRoster(){const leaders=standings(game),high=leaders[0].score;$('careerRoster').replaceChildren();game.players.forEach((p,i)=>{const card=el('article','officer-card'+(i===game.turn&&game.phase!=='over'?' current':''));card.style.setProperty('--player-color',colors[i]);const heading=el('div','officer-heading'),img=el('img');img.src=carIcon(p);img.alt=carDescription(p);const text=el('div');text.append(el('h3','',p.name),el('p','',ranks[p.rank]+' · '+locationLabel(p)+(online?.viewer===i?' · You':'')));heading.append(img,text);const numbers=el('div','officer-numbers');for(const [label,value] of [['Savings',money(p.cash)],['Salary',money(salary(p))],['LIFE tiles',String(tileCount(p))]]){const item=el('span','',label+' ');item.append(el('strong','',value));numbers.append(item);}const track=el('div','progress-track'),fill=el('span');fill.style.width=p.position/lastSpace*100+'%';track.append(fill);const family=el('p','family-summary',(p.married?(p.spouse?'Married · '+p.spouse+' spouse':'Married'):'Single')+' · '+p.children+' child'+(p.children===1?'':'ren')+(p.home?' · '+p.home.name:''));const tiles=el('div','');renderTiles(tiles,p,game.phase==='over');card.append(heading,numbers,family,tiles,track);$('careerRoster').append(card);});
 $('careerResults').hidden=game.phase!=='over';if(game.phase==='over'){const winners=leaders.filter(p=>p.score===high);$('resultsTitle').textContent=winners.length===1?winners[0].name+' wins the county career.':winners.map(p=>p.name).join(' & ')+' share the win.';$('finalScores').replaceChildren(...leaders.map(p=>el('li','',p.name+' · '+money(p.score)+' total — '+money(p.cash)+' savings, '+money(tileBonus(p))+' LIFE bonus, '+money(homeValue(p))+' home value, '+money(familyBonus(p))+' family bonus')));}
 $('careerLog').replaceChildren(...[...game.log].reverse().map(text=>el('li','',text)));
}
async function render(previous){
 driving.reset();
 const currentGeneration=++generation;$('careerTokens').getAnimations({subtree:true}).forEach(a=>a.cancel());[board.needle,panelNeedle].forEach(n=>n.getAnimations().forEach(a=>a.cancel()));moving=false;
 if(!game)return;renderRoster();announceTiles(previous);
 const animations=[];$('careerTokens').replaceChildren();motionHint='Spinning, then making the rounds…';
 const spun=previous&&previous.phase==='roll'&&game.dice&&game.players.some((p,i)=>p.position>previous.players[i].position&&!inCrisis(previous.players[i])||inEntry(p)&&inEntry(previous.players[i])&&p.entryPosition>previous.players[i].entryPosition||inCrisis(p)&&inCrisis(previous.players[i])&&p.crisisPosition>previous.players[i].crisisPosition||previous.phase==='roll'&&game.pending?.type==='crisis');
 const spinDuration=spun&&!reduced()?1600:0;
 if(spun){const nextAngle=Math.ceil(spinnerAngle/360)*360+1080+(game.dice-1)*spinnerStep;if(spinDuration)for(const needle of [board.needle,panelNeedle])animations.push(needle.animate([{transform:`rotate(${spinnerAngle}deg)`},{transform:`rotate(${nextAngle}deg)`}],{duration:spinDuration,easing:'cubic-bezier(.15,.65,.12,1)'}));spinnerAngle=nextAngle;for(const needle of [board.needle,panelNeedle])needle.style.transform=`rotate(${spinnerAngle}deg)`;}else if(!previous){spinnerAngle=((game.dice||1)-1)*spinnerStep;for(const needle of [board.needle,panelNeedle])needle.style.transform=`rotate(${spinnerAngle}deg)`;}
 game.players.forEach((p,i)=>{const img=el('img','career-token'+(i===game.turn?' active':'')+(inEntry(p)?' on-entry':''));img.src=carIcon(p);img.alt=p.name+' · '+carDescription(p);img.title=p.name+' — '+locationLabel(p);img.dataset.pawn=p.pawn;img.style.transform=`translate(-50%,-50%) rotate(${headings.get(p.pawn)||0}deg)`;const target=!p.academyDone&&p.position===0?board.startCoordinates(i):inCrisis(p)?board.crisisCoordinates(p.crisisPosition,i):inEntry(p)?board.entryCoordinates(p.careerPath,p.entryPosition,i):coordinates(p.position,i);img.style.left=target.left+'%';img.style.top=target.top+'%';$('careerTokens').append(img);
  const old=previous?.players[i],animationCount=animations.length;
  const frame=at=>({left:at.left+'%',top:at.top+'%',transform:'translate(-50%,-50%)'});
  if(old&&inCrisis(old)&&!inCrisis(p)&&!reduced()){
   motionHint='Leaving the crisis behind. Back to the main road…';animations.push(drive(img,board.crisisExitFrames(i).map(frame),{duration:2400,easing:'ease-in-out'}));
  }else if(old&&!inCrisis(old)&&inCrisis(p)&&!reduced()){
   motionHint='Taking the Mid-Life Crisis detour…';
   const distance=Math.max(0,crisisFork-old.position),main=Array.from({length:distance*8+1},(_,j)=>frame(coordinates(old.position+(distance?j/8:0),i))),branch=board.crisisEntryFrames(i).slice(1).map(frame);animations.push(drive(img,[...main,...branch],{delay:spinDuration,duration:distance*750+2000,easing:'linear',fill:'backwards'}));
  }else if(old&&inCrisis(old)&&inCrisis(p)&&old.crisisPosition<p.crisisPosition&&!reduced()){
   motionHint='Working through the Mid-Life Crisis…';const distance=p.crisisPosition-old.crisisPosition,steps=distance*8,frames=Array.from({length:steps+1},(_,j)=>{const at=board.crisisCoordinates(old.crisisPosition+distance*j/steps,i);return {left:at.left+'%',top:at.top+'%',transform:'translate(-50%,-50%)',offset:j/steps};});animations.push(drive(img,frames,{delay:spinDuration,duration:distance*750,easing:'linear',fill:'backwards'}));
  }else if(old&&!old.academyDone&&p.academyDone&&p.careerPath&&!reduced()){
   motionHint=p.careerPath==='academy'?'Heading to the Academy…':'Starting work in the jail…';
   const frames=[board.startCoordinates(i),target].map(at=>({left:at.left+'%',top:at.top+'%',transform:'translate(-50%,-50%)'}));animations.push(drive(img,frames,{duration:1400,easing:'ease-in-out'}));
  }else if(old&&inEntry(old)&&inEntry(p)&&old.entryPosition<p.entryPosition&&!reduced()){
   motionHint=p.careerPath==='academy'?'Moving through the Academy…':'Working through the first shift…';
   const distance=p.entryPosition-old.entryPosition,steps=distance*8,frames=Array.from({length:steps+1},(_,j)=>{const at=board.entryCoordinates(p.careerPath,old.entryPosition+distance*j/steps,i);return {left:at.left+'%',top:at.top+'%',transform:'translate(-50%,-50%)',offset:j/steps};});animations.push(drive(img,frames,{delay:spinDuration,duration:distance*750,easing:'linear',fill:'backwards'}));
  }else if(old&&inEntry(old)&&!inEntry(p)&&!reduced()){
   motionHint='Joining the main career road…';const frames=board.exitFrames(p.careerPath,i).map(at=>({left:at.left+'%',top:at.top+'%',transform:'translate(-50%,-50%)'}));animations.push(drive(img,frames,{duration:2000,easing:'ease-in-out'}));
  }else if(old&&old.position<p.position&&!reduced()){
   const steps=(p.position-old.position)*8,frames=Array.from({length:steps+1},(_,j)=>{const at=coordinates(old.position+(p.position-old.position)*j/steps,i);return {left:at.left+'%',top:at.top+'%',transform:'translate(-50%,-50%)',offset:j/steps};});animations.push(drive(img,frames,{delay:spinDuration,duration:(p.position-old.position)*750,easing:'linear',fill:'backwards'}));
  }
  if(animations.length>animationCount)driving.follow(img,animations.at(-1));
 });
 moving=animations.length>0;controls();if(moving){$('careerDecision').close();await Promise.allSettled(animations.map(a=>a.finished));if(currentGeneration!==generation)return;await driving.overview();if(currentGeneration!==generation)return;moving=false;controls();}
 maybeOpenDecision();
}
function maybeOpenDecision(){if(game?.phase!=='choice'||!canAct()){if(game?.phase!=='choice'||online&&online.viewer!==game.turn)$('careerDecision').close();return;}const key=game.turn+':'+game.turns+':'+game.pending.type+':'+(game.pending.id||'')+':'+(game.pending.revealed||[]).join(',');if(key!==lastChoice&&!$('careerRules').open){lastChoice=key;renderDecision();if(!$('careerDecision').open)$('careerDecision').showModal();}}
async function act(action){if(!canAct())return;busy=true;error('');controls();try{if(online)await online.action(action);else{const previous=game;game=perform(game,action);if(!cleared)localStorage.setItem(gameKey,JSON.stringify(game));await render(previous);}}catch(e){error(e.message);}finally{busy=false;controls();maybeOpenDecision();}}
endBinding=bindEndGame({online:!!online,available:()=>!!game&&(!online||online.snapshot?.host),ready:()=>!busy&&!moving,end:async()=>{if(online)await online.send('end');cleared=true;clearEndedGame('life',code,[gameKey]);},reportError:error});
for(const {button,index} of board.pathButtons)button.onclick=()=>{if(game?.phase==='choice'&&game.pending.type==='academy')act({type:'choose',index});};
panelSpin.onclick=()=>act({type:'roll'});$('rollCareer').onclick=()=>act({type:'roll'});board.spin.onclick=()=>act({type:'roll'});$('endCareerTurn').onclick=()=>act({type:'end'});$('openDecision').onclick=()=>{renderDecision();if(!$('careerDecision').open)$('careerDecision').showModal();};$('closeDecision').onclick=()=>$('careerDecision').close();$('showRules').onclick=()=>$('careerRules').showModal();$('closeRules').onclick=()=>$('careerRules').close();$('rulesDone').onclick=()=>$('careerRules').close();$('careerRules').addEventListener('close',maybeOpenDecision);
if(online){const status=roomBanner('life',code,$('lifeMain'));online.onstatus=text=>status.textContent=text;online.oninvalid=e=>{if(e.status===404){cleared=true;clearEndedGame('life',code);}else location.replace('/life-setup?room='+code);};online.onchange=snapshot=>{if(!snapshot.state){location.replace('/life-setup?room='+code);return;}const previous=game;game=snapshot.state;render(previous);};try{await online.connect();}catch(e){if(!online.seat)location.replace('/life-setup?room='+code);else error(e.message);}}
else{game=loadGame();if(!game)location.replace('/life-setup?mode=local');else await render();window.addEventListener('storage',event=>{if(event.key!==gameKey)return;if(event.oldValue!==null&&event.newValue===null){cleared=true;location.replace('/');return;}const next=loadGame();if(next){const previous=game;game=next;render(previous);}});}
