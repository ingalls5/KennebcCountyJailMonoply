import {openTask} from './tasks.js?v=sabotage-1';
import {sabotages,sabotageFor} from './sabotage-rules.js?v=sabotage-1';
const $=id=>document.getElementById(id),tried=new Set();let effect=null,crossed=false;
const equipment={
 power:{icon:'ϟ',work:'Pull the isolation lever, remove four fuses, and close the steel cover.',officer:'Try the powerless station'},
 radio:{icon:'◉',work:'Turn the interference knobs and hold the transmission control.',officer:'Try tuning the affected radio'},
 equipment:{icon:'⚙',work:'Misadjust the regulators and reverse the sensor connector.',officer:'Try the unstable equipment'},
 doors:{icon:'▥',work:'Slide the bolts, turn the override key, and engage the locks.',officer:'Try an access panel'},
 records:{icon:'▤',work:'Reroute the unit reports and stamp the altered batch.',officer:'Try the scrambled records'},
 cameras:{icon:'▣',work:'Pull the camera leads, remove the drive, and stop the recorder.',officer:'Try a camera connection task'}
};
function button(label,handler,cls=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.onclick=handler;return b;}
for(const definition of sabotages){const details=equipment[definition.id],card=document.createElement('article');card.dataset.sabotage=definition.id;const icon=document.createElement('span');icon.className='test-symbol';icon.textContent=details.icon;icon.setAttribute('aria-hidden','true');const title=document.createElement('h3');title.textContent=definition.name;const description=document.createElement('p');description.textContent=details.work;const action=button('Start sabotage',()=>{
 openTask({name:definition.name,game:definition.game,sabotageType:definition.id},()=>{effect={id:crypto.randomUUID(),type:definition.id};tried.add(definition.id);crossed=false;render();},{mode:'sabotage',onClose:()=>{if(effect?.type===definition.id){$('officerView').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('officerTitle').setAttribute('tabindex','-1');$('officerTitle').focus({preventScroll:true});}}});
 },'test-primary');action.setAttribute('aria-label','Try sabotage: '+definition.name);card.append(icon,title,description,action);$('sabotageChoices').append(card);}
function render(){
 const definition=sabotageFor(effect?.type);$('testedCount').textContent=tried.size+' / 6 tried';for(const card of $('sabotageChoices').children)card.classList.toggle('test-tried',tried.has(card.dataset.sabotage));
 $('systemBadge').textContent=definition?definition.name+' · ACTIVE':'Systems online';$('systemBadge').classList.toggle('alert',!!effect);$('effectSummary').textContent=definition?definition.effect:'Complete any sabotage above to see its effect here.';
 const locked=effect?.type==='doors',lost=['power','cameras'].includes(effect?.type);$('doorScene').classList.toggle('locked',locked);$('doorScene').classList.toggle('dark',effect?.type==='power');$('doorScene').classList.toggle('crossed',crossed&&!locked);$('doorLabel').textContent=locked?'LOCKED':'UNLOCKED';$('tryDoor').textContent=crossed&&!locked?'Walk back':'Walk through door';$('cameraScene').classList.toggle('signal-lost',lost);$('lostSignal').hidden=!lost;$('doorStatus').textContent=locked?'The door is jammed. The officer cannot pass until the manual release is repaired.':crossed?'The officer passed through the doorway.':'The doorway is open for normal travel.';
 const actions=$('officerActions');actions.replaceChildren();if(!definition)return;
 const note=document.createElement('p');note.textContent=effect.type==='power'?'Open the officer task to see the controls pause. Close it to return here and restore power.':effect.type==='cameras'?'The sample camera is offline. Repair the camera system to bring the picture back.':effect.type==='doors'?'Try walking through the doorway, then complete its manual release repair.':'Open the officer task to feel the interference, or repair the affected system.';actions.append(note);
 if(definition.id!=='cameras')actions.append(button(equipment[definition.id].officer,()=>openTask({name:'Officer task · '+definition.game,game:definition.game},()=>{}, {mode:'task',effect:()=>effect}),'test-secondary'));
 actions.append(button('Repair · '+definition.repair,()=>{const activeId=effect.id;openTask({name:definition.repair,game:definition.repairGame||definition.game},()=>{if(effect?.id===activeId){effect=null;crossed=false;render();$('effectSummary').textContent='Repair complete. Systems are back online. Choose another sabotage to try.';}},{mode:'repair'});},'test-repair'));
}
$('tryDoor').onclick=()=>{if(effect?.type==='doors'){$('doorStatus').textContent='Locked. Complete “Release jammed doors” to let the officer through.';return;}crossed=!crossed;render();};
$('resetTest').onclick=()=>{effect=null;crossed=false;tried.clear();render();};render();
