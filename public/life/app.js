import {pawns,colors,ranks,gameKey,loadGame,decision,perform,standings,spaceCount,lastSpace} from './rules.js';
import {createBoard} from './board.js';
import {OnlineRoom,roomBanner} from '../online.js';
import {bindEndGame,clearEndedGame} from '../end-game.js';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const money=n=>(n<0?'−':'')+'$'+Math.abs(n).toLocaleString('en-US');
const code=new URLSearchParams(location.search).get('room')?.toUpperCase();
const online=code?new OnlineRoom('life',code):null;
let game=null,busy=false,moving=false,cleared=false,generation=0,lastChoice='',endBinding;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const board=createBoard($('careerTiles')),coordinates=board.coordinates;
let spinnerAngle=0;
function canAct(){return !!game&&!cleared&&!busy&&!moving&&game.phase!=='over'&&(!online||online.canAct);}
function error(message){$('lifeError').textContent=message;$('decisionError').textContent=message;}
function renderDecision(){
 const event=decision(game);if(!event)return;
 $('decisionPlayer').textContent=game.players[game.turn].name+' · '+(game.pending.type==='academy'?'YOUR FIRST DECISION':'ON THE CLOCK');$('decisionTitle').textContent=event.title;$('decisionIcon').textContent=event.icon;$('decisionText').textContent=event.text;$('decisionOptions').replaceChildren();
 event.options.forEach((choice,index)=>{const button=el('button','decision-choice',choice.label);button.type='button';button.disabled=!!choice.disabled||!canAct();const changes=[];if(choice.cash)changes.push((choice.cash>0?'+':'−')+money(Math.abs(choice.cash)));if(choice.reputation)changes.push((choice.reputation>0?'+':'')+choice.reputation+' reputation');if(choice.energy)changes.push((choice.energy>0?'+':'')+choice.energy+' energy');if(choice.promote)changes.push('Rank +1');button.append(el('span','',changes.join(' · ')+(choice.disabled?' · Not eligible yet':'')));button.onclick=()=>act({type:'choose',index});$('decisionOptions').append(button);});
}
function controls(){if(!game)return;const p=game.players[game.turn],mine=!online||online.viewer===game.turn,active=canAct();
 $('turnEyebrow').textContent=game.phase==='over'?'OFF THE CLOCK':mine?'ON THE CLOCK':'WAITING FOR THE CREW';$('turnName').textContent=game.phase==='over'?'Everyone’s retired.':p.name;$('turnRank').textContent=game.phase==='over'?'The final briefing':ranks[p.rank]+' · '+(p.retired?'Retired':'Stop '+(p.position+1)+' of '+spaceCount);
 $('turnStats').replaceChildren();for(const [label,value] of [['Savings / debt',money(p.cash)],['Reputation',p.reputation+'/10'],['Energy',p.energy+'/10']]){const stat=el('div','stat',label);stat.append(el('strong','',value));$('turnStats').append(stat);}
 $('careerDie').textContent=game.dice||'–';$('careerDie').setAttribute('aria-label',game.dice?'Spun '+game.dice:'Spinner ready');board.spin.disabled=game.phase!=='roll'||!active;
 $('turnHint').textContent=moving?'Spinning, then making the rounds…':game.phase==='over'?'Compare the crew’s final scores below.':!mine?'Waiting for '+p.name+'.':game.phase==='choice'?(game.pending.type==='academy'?'Choose your starting route.':'A decision is waiting for you.'):game.phase==='end'?(p.retired?'Your career is complete. Pass the turn to the crew.':'Shift complete. Pass it to the next officer.'):'Your next shift is one spin away.';
 for(const [id,phase] of [['rollCareer','roll'],['openDecision','choice'],['endCareerTurn','end']]){$(id).hidden=game.phase!==phase||!mine;$(id).disabled=!active;}
 renderDecision();endBinding?.update();
}
function renderRoster(){const leaders=standings(game),high=leaders[0].score;$('careerRoster').replaceChildren();game.players.forEach((p,i)=>{const card=el('article','officer-card'+(i===game.turn&&game.phase!=='over'?' current':''));card.style.setProperty('--player-color',colors[i]);const heading=el('div','officer-heading'),img=el('img');img.src=pawns.find(c=>c.id===p.pawn).icon;img.alt='';const text=el('div');text.append(el('h3','',p.name),el('p','',ranks[p.rank]+' · '+(p.retired?'Retired':'Stop '+(p.position+1))+(online?.viewer===i?' · You':'')));heading.append(img,text);const numbers=el('div','officer-numbers');for(const [label,value] of [['Savings',money(p.cash)],['Reputation',p.reputation+'/10'],['Energy',p.energy+'/10']]){const item=el('span','',label+' ');item.append(el('strong','',value));numbers.append(item);}const track=el('div','progress-track'),fill=el('span');fill.style.width=p.position/lastSpace*100+'%';track.append(fill);card.append(heading,numbers,track);$('careerRoster').append(card);});
 $('careerResults').hidden=game.phase!=='over';if(game.phase==='over'){const winners=leaders.filter(p=>p.score===high);$('resultsTitle').textContent=winners.length===1?winners[0].name+' wins the county career.':winners.map(p=>p.name).join(' & ')+' share the win.';$('finalScores').replaceChildren(...leaders.map(p=>el('li','',p.name+' · '+money(p.score)+' total — '+money(p.cash)+' savings, '+p.reputation+' reputation, '+p.energy+' energy')));}
 $('careerLog').replaceChildren(...[...game.log].reverse().map(text=>el('li','',text)));
}
async function render(previous){
 const currentGeneration=++generation;$('careerTokens').getAnimations({subtree:true}).forEach(a=>a.cancel());board.needle.getAnimations().forEach(a=>a.cancel());moving=false;
 if(!game)return;renderRoster();
 const animations=[];$('careerTokens').replaceChildren();
 const spun=previous&&game.dice&&game.players.some((p,i)=>p.position>previous.players[i].position);
 const spinDuration=spun&&!reduced()?1600:0;
 if(spun){const nextAngle=Math.ceil(spinnerAngle/360)*360+1080+(game.dice-1)*60;if(spinDuration)animations.push(board.needle.animate([{transform:`rotate(${spinnerAngle}deg)`},{transform:`rotate(${nextAngle}deg)`}],{duration:spinDuration,easing:'cubic-bezier(.15,.65,.12,1)'}));spinnerAngle=nextAngle;board.needle.style.transform=`rotate(${spinnerAngle}deg)`;}else if(!previous){spinnerAngle=((game.dice||1)-1)*60;board.needle.style.transform=`rotate(${spinnerAngle}deg)`;}
 game.players.forEach((p,i)=>{const img=el('img','career-token'+(i===game.turn?' active':''));img.src=pawns.find(c=>c.id===p.pawn).icon;img.alt=p.name+' · '+pawns.find(c=>c.id===p.pawn).name;img.title=p.name+' — stop '+(p.position+1);const target=coordinates(p.position,i);img.style.left=target.left+'%';img.style.top=target.top+'%';$('careerTokens').append(img);
  const old=previous?.players[i];if(old&&old.position<p.position&&!reduced()){
   const steps=(p.position-old.position)*8,frames=Array.from({length:steps+1},(_,j)=>{const at=coordinates(old.position+(p.position-old.position)*j/steps,i),hop=Math.sin(j/steps*(p.position-old.position)*Math.PI)*8;return {left:at.left+'%',top:at.top+'%',transform:`translate(-50%,calc(-50% - ${Math.abs(hop)}px))`,offset:j/steps};});animations.push(img.animate(frames,{delay:spinDuration,duration:(p.position-old.position)*350,easing:'linear',fill:'backwards'}));
  }
 });
 moving=animations.length>0;controls();if(moving){$('careerDecision').close();await Promise.allSettled(animations.map(a=>a.finished));if(currentGeneration!==generation)return;moving=false;controls();}
 maybeOpenDecision();
}
function maybeOpenDecision(){if(game?.phase!=='choice'||!canAct()){if(game?.phase!=='choice'||online&&online.viewer!==game.turn)$('careerDecision').close();return;}const key=game.turn+':'+game.turns+':'+game.pending.type+':'+(game.pending.id||'');if(key!==lastChoice&&!$('careerRules').open){lastChoice=key;renderDecision();if(!$('careerDecision').open)$('careerDecision').showModal();}}
async function act(action){if(!canAct())return;busy=true;error('');controls();try{if(online)await online.action(action);else{const previous=game;game=perform(game,action);if(!cleared)localStorage.setItem(gameKey,JSON.stringify(game));await render(previous);}}catch(e){error(e.message);}finally{busy=false;controls();maybeOpenDecision();}}
endBinding=bindEndGame({online:!!online,available:()=>!!game&&(!online||online.snapshot?.host),ready:()=>!busy&&!moving,end:async()=>{if(online)await online.send('end');cleared=true;clearEndedGame('life',code,[gameKey]);},reportError:error});
$('rollCareer').onclick=()=>act({type:'roll'});board.spin.onclick=()=>act({type:'roll'});$('endCareerTurn').onclick=()=>act({type:'end'});$('openDecision').onclick=()=>{renderDecision();$('careerDecision').showModal();};$('closeDecision').onclick=()=>$('careerDecision').close();$('showRules').onclick=()=>$('careerRules').showModal();$('closeRules').onclick=()=>$('careerRules').close();$('rulesDone').onclick=()=>$('careerRules').close();$('careerRules').addEventListener('close',maybeOpenDecision);
if(online){const status=roomBanner('life',code,$('lifeMain'));online.onstatus=text=>status.textContent=text;online.oninvalid=e=>{if(e.status===404){cleared=true;clearEndedGame('life',code);}else location.replace('/life-setup?room='+code);};online.onchange=snapshot=>{if(!snapshot.state){location.replace('/life-setup?room='+code);return;}const previous=game;game=snapshot.state;render(previous);};try{await online.connect();}catch(e){if(!online.seat)location.replace('/life-setup?room='+code);else error(e.message);}}
else{game=loadGame();if(!game)location.replace('/life-setup?mode=local');else await render();window.addEventListener('storage',event=>{if(event.key!==gameKey)return;if(event.oldValue!==null&&event.newValue===null){cleared=true;location.replace('/');return;}const next=loadGame();if(next){const previous=game;game=next;render(previous);}});}
