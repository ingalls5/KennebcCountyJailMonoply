// Operable jail equipment. Every control supports pointer and keyboard input.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
const integer=(a,b)=>a+Math.floor(Math.random()*(b-a+1));

export function buildEquipment(game,ui){
 if(!['wires','sequence','calibrate','keypad','timing','radio','valves'].includes(game))return false;
 const {stage,node,button,listen,cleanup}=ui;
 stage.classList.add('machinery-stage');stage.dataset.equipment=game;
 const text=(tag,value,cls)=>node(tag,{class:cls||''},value);
 const panel=(title,sub)=>{const p=node('section',{class:'eq-panel'});if(title)p.append(text('h3',title,'eq-panel-title'));if(sub)p.append(text('p',sub,'eq-caption'));return p;};
 const announce=(message,error=false)=>error?ui.wrong(message):ui.status(message);
 function knob(label,onTurn,clickStep=1){
  const k=button('',()=>onTurn(clickStep),{class:'eq-knob','aria-label':label});
  k.append(node('span',{class:'eq-knob-mark','aria-hidden':'true'}));ui.dial(k,onTurn);
  return k;
 }
 function range(label,min,max,step,value,onInput){const input=node('input',{type:'range',min,max,step,value,'aria-label':label});listen(input,'input',()=>onInput(Number(input.value)));return input;}
 function meter(label){const p=node('div',{class:'eq-meter','aria-label':label}),fill=node('span'),out=text('output','0%');p.append(fill,out);return{el:p,set(value,caption){p.style.setProperty('--fill',clamp(value,0,100)+'%');out.textContent=caption??Math.round(value)+'%';}};}
 function hold(control,begin,end){
  let down=false,keyboard=false;
  const start=e=>{if(control.disabled||down||e.button>0)return;down=true;begin();};
  const stop=()=>{if(!down)return;down=false;keyboard=false;end();};
  listen(control,'pointerdown',e=>{e.preventDefault();control.setPointerCapture?.(e.pointerId);start(e);});
  listen(control,'pointerup',stop);listen(control,'pointercancel',stop);listen(control,'lostpointercapture',stop);
  listen(control,'keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat){keyboard=true;start(e);}}});
  listen(control,'keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();stop();}});
  listen(control,'blur',()=>{if(keyboard)stop();});cleanup(stop);
 }
 function rocker(label,onChange){
  let value=false,press=null,lastDrag=-Infinity;
  const control=button('',e=>{if(e?.detail>0&&performance.now()-lastDrag<400)return;set(!value);},{class:'eq-rocker','aria-label':label,'aria-pressed':'false'});
  control.append(text('span','ON','eq-rocker-on'),node('span',{class:'eq-rocker-lever'}),text('span','OFF','eq-rocker-off'));
  const set=next=>{if(control.disabled||next===value)return;value=next;control.setAttribute('aria-pressed',String(value));onChange(value);};
  listen(control,'pointerdown',e=>{if(e.button>0)return;press={x:e.clientX,y:e.clientY,id:e.pointerId};control.setPointerCapture?.(e.pointerId);});
  listen(control,'pointerup',e=>{if(!press)return;const dy=e.clientY-press.y,dx=e.clientX-press.x;if(Math.max(Math.abs(dy),Math.abs(dx))>16){lastDrag=performance.now();set(Math.abs(dy)>Math.abs(dx)?dy<0:dx>0);}press=null;});
  listen(control,'pointercancel',()=>press=null);
  listen(control,'keydown',e=>{if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)){e.preventDefault();set(['ArrowUp','ArrowRight'].includes(e.key));}});
  return{el:control,set,reset(){value=false;control.setAttribute('aria-pressed','false');}};
 }

 if(game==='wires'){
  ui.instructions.textContent='Switch the breaker OFF, patch each cable to its matching marked socket, then restore power and test the circuit. Drag cables or tap both ends.';
  const shell=panel('CAMERA PATCH PANEL','ISOLATE → CONNECT → RESTORE'),breakerRow=node('div',{class:'eq-breaker-row'}),power=text('strong','LIVE · isolate before patching','eq-power-status');
  let isolated=false,chosen=null,restored=false;const linked=new Set(),sources=[],targets=[],colors=['#f18a79','#73c9f3','#edce72','#96d1ac'],shapes=['▲','●','◆','■'];
  const breaker=button('Breaker ON',()=>{if(!isolated){if(linked.size===4){announce('Circuit already restored. Run the circuit test.');return;}isolated=true;restored=false;breaker.textContent='Breaker OFF';power.textContent='ISOLATED · safe to patch';shell.dataset.power='off';}else{if(linked.size!==4){announce('Connect all four leads before restoring power.',true);return;}isolated=false;restored=true;breaker.textContent='Breaker ON';power.textContent='POWER RESTORED · ready for test';shell.dataset.power='on';}breaker.setAttribute('aria-pressed',String(!isolated));},{class:'eq-breaker','aria-pressed':'true'});
  breakerRow.append(breaker,power);const board=node('div',{class:'eq-patch-board'}),left=node('div',{class:'eq-jacks'}),right=node('div',{class:'eq-jacks'}),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('eq-cables');svg.setAttribute('aria-hidden','true');board.append(svg,left,right);
  const draw=()=>{if(!board.isConnected)return;const bounds=board.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);svg.replaceChildren();for(const i of linked){const a=sources[i].getBoundingClientRect(),b=targets[i].getBoundingClientRect(),x=a.right-bounds.left-12,y=a.top+a.height/2-bounds.top,xx=b.left-bounds.left+12,yy=b.top+b.height/2-bounds.top,path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M ${x} ${y} C ${x+50} ${y}, ${xx-50} ${yy}, ${xx} ${yy}`);path.setAttribute('stroke',colors[i]);svg.append(path);}};
  function select(i){if(linked.has(i))return;if(!isolated){announce('Power is live. Switch the breaker OFF first.',true);return;}chosen=i;sources.forEach((s,j)=>s.setAttribute('aria-pressed',String(i===j)));announce('Lead '+shapes[i]+' selected. Choose its matching socket.');}
  function connect(i){if(!isolated){announce('Isolate the power before touching the panel.',true);return;}if(chosen===null){announce('Pick up a lead first.',true);return;}if(chosen!==i){announce('That socket has a different marker. The lead is still in your hand.',true);return;}linked.add(i);sources[i].disabled=true;targets[i].disabled=true;sources[i].setAttribute('aria-pressed','false');chosen=null;ui.progress(linked.size,4,'Cables patched');announce(linked.size===4?'All leads secure. Restore the breaker, then test.':'Cable seated. Choose another lead.');draw();}
  for(const i of mix([0,1,2,3])){const b=button(shapes[i]+'  '+String.fromCharCode(65+i),()=>select(i),{class:'eq-jack eq-lead','aria-label':'Pick up lead '+String.fromCharCode(65+i),'aria-pressed':'false','data-lead':String.fromCharCode(65+i)});b.style.setProperty('--cable',colors[i]);sources[i]=b;left.append(b);}
  for(const i of mix([0,1,2,3])){const b=button(shapes[i]+'  '+String.fromCharCode(65+i),()=>connect(i),{class:'eq-jack eq-socket','aria-label':'Socket '+String.fromCharCode(65+i),'data-socket':String.fromCharCode(65+i)});b.style.setProperty('--cable',colors[i]);targets[i]=b;right.append(b);}
  for(let i=0;i<4;i++)ui.drag(sources[i],()=>targets.filter(t=>!t.disabled),target=>{select(i);connect(targets.indexOf(target));});
  const test=button('Run circuit test',()=>{if(linked.size!==4||!restored){announce('Patch all four leads and restore the breaker before testing.',true);return;}ui.finish();},{class:'eq-primary'});
  shell.append(breakerRow,board,test);stage.append(shell);ui.progress(0,4,'Cables patched');listen(window,'resize',draw);const raf=requestAnimationFrame(draw);cleanup(()=>cancelAnimationFrame(raf));
 }

 if(game==='sequence'){
  ui.instructions.textContent='Follow the startup checklist by throwing each switch. Then turn the starter crank clockwise until the generator reaches operating speed.';
  const labels=['Ventilation','Coolant pump','Fuel supply','Ignition'],order=mix([0,1,2,3]),shell=panel('GENERATOR STARTUP','Throw switches up to engage. Tap switches or use arrow keys.'),checklist=node('ol',{class:'eq-startup-list'}),board=node('div',{class:'eq-switchboard'}),switches=[];let index=0,turns=0;
  for(const i of order)checklist.append(text('li',labels[i]));
  const rpm=meter('Starter speed'),crank=knob('Turn starter crank clockwise',step=>{if(index<4){announce('Follow the startup checklist before turning the crank.',true);return;}turns=clamp(turns+step,0,8);crank.style.setProperty('--angle',turns*45+'deg');rpm.set(turns/8*100,turns*150+' RPM');ui.progress(4+turns,12,'Startup');if(turns===8)ui.finish();});
  const reset=()=>{index=0;turns=0;rpm.set(0,'0 RPM');crank.style.setProperty('--angle','0deg');switches.forEach(s=>s.reset());for(const li of checklist.children)li.classList.remove('eq-checked');ui.progress(0,12,'Startup');};
  labels.forEach((label,i)=>{const item=node('div',{class:'eq-switch-item'}),s=rocker(label+' switch',on=>{if(!on){reset();announce('System powered down. Start the checklist again.');return;}if(i!==order[index]){reset();announce('Safety interlock reset. Start with '+labels[order[0]]+'.',true);return;}checklist.children[index].classList.add('eq-checked');index++;ui.progress(index,12,'Startup');announce(index===4?'All systems ready. Turn the starter crank clockwise.':labels[i]+' engaged. Next: '+labels[order[index]]+'.');});switches.push(s);item.append(text('strong',label),s.el);board.append(item);});
  const starter=node('div',{class:'eq-starter'});starter.append(text('strong','STARTER CRANK'),crank,rpm.el,button('Turn crank clockwise',()=>{if(index<4){announce('Complete the startup checklist first.',true);return;}turns++;crank.style.setProperty('--angle',turns*45+'deg');rpm.set(turns/8*100,turns*150+' RPM');ui.progress(4+turns,12,'Startup');if(turns>=8)ui.finish();},{'aria-label':'Turn starter crank clockwise one notch'}));
  shell.append(checklist,board,starter);stage.append(shell);ui.progress(0,12,'Startup');
 }

 if(game==='calibrate'){
  ui.instructions.textContent='Turn each dial until its needle matches the marked target. Pick up the diagnostic probe and touch each sensor socket to record its reading.';
  const shell=panel('EQUIPMENT CALIBRATION','Dials: drag in a circle, tap, or use arrow keys. Probe: drag to a socket or tap both.'),board=node('div',{class:'eq-calibrations'}),targets=[integer(5,15)*5,integer(5,15)*5,integer(5,15)*5],values=[0,0,0],recorded=new Set(),ports=[],names=['Power','Pressure','Ventilation'];let selected=false;
  const probe=button('⌁  Diagnostic probe',()=>{selected=true;probe.setAttribute('aria-pressed','true');announce('Probe ready. Touch a calibrated sensor socket.');},{class:'eq-probe','aria-pressed':'false'});
  names.forEach((name,i)=>{const card=node('section',{class:'eq-instrument'}),display=text('output','0','eq-instrument-reading'),target=text('p','Target '+targets[i],'eq-target'),gauge=node('div',{class:'eq-round-gauge','aria-label':name+' gauge'}),needle=node('span',{class:'eq-gauge-needle'});gauge.append(needle);let k,input;
   const refresh=()=>{display.textContent=values[i];k.style.setProperty('--angle',(values[i]*2.7-135)+'deg');needle.style.setProperty('--angle',(values[i]*2.7-135)+'deg');input.value=values[i];card.dataset.aligned=String(values[i]===targets[i]);};
   const adjust=step=>{if(recorded.has(i))return;values[i]=clamp(values[i]+step*5,0,100);refresh();};k=knob('Adjust '+name+' dial',adjust);input=range(name+' setting',0,100,5,0,value=>{if(!recorded.has(i)){values[i]=value;refresh();}});
   const controls=node('div',{class:'eq-dial-controls'});controls.append(button('−',()=>adjust(-1),{'aria-label':'Decrease '+name}),k,button('+',()=>adjust(1),{'aria-label':'Increase '+name}));
   const port=button('● Sensor',()=>{if(!selected){announce('Pick up the diagnostic probe first.',true);return;}sample(i);},{class:'eq-sensor','aria-label':'Record '+name+' sensor'});
   function sample(index){if(recorded.has(index))return;if(values[index]!==targets[index]){announce(name+' is not on its target. Adjust the dial before recording.',true);return;}recorded.add(index);port.textContent='✓ Recorded';port.disabled=true;k.disabled=true;input.disabled=true;card.dataset.recorded='yes';selected=false;probe.setAttribute('aria-pressed','false');ui.progress(recorded.size,3,'Readings recorded');announce(name+' reading recorded.');if(recorded.size===3)ui.finish();}
   ports.push(port);card.append(text('h4',name),target,gauge,display,controls,input,port);board.append(card);refresh();
  });const driftTimer=setInterval(()=>{if(ui.suspended?.()||ui.effect?.()?.type!=='equipment')return;for(let i=0;i<3;i++)if(!recorded.has(i)){values[i]=clamp(values[i]+(Math.random()>.5?5:-5),0,100);const input=board.children[i].querySelector('input');input.value=values[i];input.dispatchEvent(new Event('input'));}},2800);cleanup(()=>clearInterval(driftTimer));ui.drag(probe,()=>ports.filter(p=>!p.disabled),p=>{selected=true;p.click();});shell.append(probe,board);stage.append(shell);ui.progress(0,3,'Readings recorded');
 }

 if(game==='keypad'){
  ui.instructions.textContent='Present the officer credential, enter the work-order code, and slide the heavy bolt open. Drag the card to the reader or tap both.';
  const code=String(integer(0,9999)).padStart(4,'0'),shell=panel('SECURE ACCESS PANEL'),order=text('div','WORK ORDER · ACCESS '+code,'eq-work-order'),top=node('div',{class:'eq-access-top'}),card=button('▥  OFFICER\nACCESS CARD',()=>{selected=true;card.setAttribute('aria-pressed','true');announce('Card selected. Touch the credential reader.');},{class:'eq-id-card','aria-pressed':'false'}),reader=button('SWIPE CREDENTIAL',()=>{if(!selected){announce('Pick up the officer access card first.',true);return;}authorize();},{class:'eq-card-reader'}),display=text('output','PRESENT CARD','eq-code-display'),pad=node('div',{class:'eq-number-pad'}),lock=text('strong','LOCKED','eq-lock-state'),boltWrap=node('label',{class:'eq-bolt-control'}),bolt=range('Slide door bolt open',0,100,1,0,value=>{boltWrap.style.setProperty('--bolt',value+'%');if(unlocked&&value>=97)ui.finish();});let selected=false,authorized=false,entered='',unlocked=false;
  const digits=[];const render=()=>{display.textContent=authorized?(entered||'− − − −'): 'PRESENT CARD';lock.textContent=unlocked?'UNLOCKED · slide bolt →':'LOCKED';bolt.disabled=!unlocked;};
  function authorize(){if(authorized)return;authorized=true;selected=false;card.disabled=true;card.setAttribute('aria-pressed','false');reader.textContent='✓ CREDENTIAL ACCEPTED';reader.disabled=true;digits.forEach(b=>b.disabled=false);render();ui.progress(1,3,'Access checks');announce('Credential accepted. Enter the four-digit work-order code.');}
  function digit(n){if(!authorized||unlocked)return;if(entered.length<4)entered+=n;render();}
  function unlock(){if(!authorized){announce('Present a credential first.',true);return;}if(entered!==code){entered='';render();announce('Access code rejected. Check the work order and retry.',true);return;}unlocked=true;digits.forEach(b=>b.disabled=true);render();ui.progress(2,3,'Access checks');announce('Code accepted. Slide the door bolt all the way open.');}
  for(const n of [1,2,3,4,5,6,7,8,9]){const b=button(String(n),()=>digit(n),{'aria-label':'Key '+n});b.disabled=true;digits.push(b);pad.append(b);}const back=button('⌫',()=>{entered=entered.slice(0,-1);render();},{'aria-label':'Delete last digit'}),zero=button('0',()=>digit(0),{'aria-label':'Key 0'}),enter=button('↵',unlock,{'aria-label':'Unlock access panel'});for(const b of [back,zero,enter]){b.disabled=true;digits.push(b);pad.append(b);}
  boltWrap.append(text('span','SLIDE BOLT TO OPEN →'),bolt);top.append(card,reader);ui.drag(card,()=>[reader],authorize);shell.append(order,top,display,pad,lock,boltWrap);stage.append(shell);render();ui.progress(0,3,'Access checks');
  listen(stage.closest('dialog')||stage,'keydown',e=>{if(!authorized||unlocked||e.ctrlKey||e.metaKey||e.altKey)return;if(/^\d$/.test(e.key)){e.preventDefault();digit(e.key);}else if(e.key==='Backspace'){e.preventDefault();entered=entered.slice(0,-1);render();}else if(e.key==='Enter'&&e.target===display){e.preventDefault();unlock();}});display.tabIndex=0;
 }

 if(game==='timing'){
  ui.instructions.textContent='Hold PUMP to build pressure and BLEED to lower it. Release both controls to settle the needle in the green band for one second. Stabilize three test pressures.';
  const shell=panel('PRESSURE TEST RIG','Hold with a finger, mouse, Space, or Enter. Release to let the pressure settle.'),gauge=node('div',{class:'eq-pressure-gauge'}),band=node('div',{class:'eq-pressure-band'}),needle=node('div',{class:'eq-pressure-needle'}),ticks=node('div',{class:'eq-pressure-ticks'}),display=text('output','20 PSI','eq-pressure-reading'),target=text('p','','eq-target'),stability=meter('Stable reading progress'),controls=node('div',{class:'eq-pressure-controls'}),pump=button('▲\nHOLD PUMP',()=>{}, {class:'eq-pump'}),bleed=button('▼\nHOLD BLEED',()=>{}, {class:'eq-bleed'});let pressure=20,action=0,round=0,stable=0,last=performance.now(),ended=false,lastDisturbance=0;const bands=[[35,49],[66,80],[46,60]];
  for(let n=0;n<=100;n+=20)ticks.append(text('span',String(n)));
  gauge.append(band,needle,ticks);controls.append(pump,bleed);shell.append(target,gauge,display,stability.el,controls);stage.append(shell);
  const render=()=>{const [low,high]=bands[round];band.style.left=low+'%';band.style.width=high-low+'%';needle.style.left=pressure+'%';target.textContent='Test '+(round+1)+' of 3 · target '+low+'–'+high+' PSI';display.textContent=Math.round(pressure)+' PSI';gauge.dataset.pressure=pressure.toFixed(1);stability.set(stable/1000*100,Math.min(100,Math.floor(stable/10))+'% stable');shell.dataset.stable=String(pressure>=low&&pressure<=high);};
  hold(pump,()=>{action=1;pump.setAttribute('aria-pressed','true');},()=>{if(action===1)action=0;pump.setAttribute('aria-pressed','false');});hold(bleed,()=>{action=-1;bleed.setAttribute('aria-pressed','true');},()=>{if(action===-1)action=0;bleed.setAttribute('aria-pressed','false');});
  const interval=setInterval(()=>{if(ended)return;const now=performance.now();if(ui.suspended?.()){last=now;return;}const dt=Math.min(150,now-last);last=now;if(ui.effect?.()?.type==='equipment'&&now-lastDisturbance>1300){pressure=clamp(pressure+(Math.random()>.5?4:-4),0,100);lastDisturbance=now;}pressure=clamp(pressure+(action===1?24:action===-1?-30:-2)*dt/1000,0,100);const [low,high]=bands[round];if(pressure>=low&&pressure<=high&&action===0)stable+=dt;else stable=0;if(stable>=1000){round++;stable=0;ui.progress(round,3,'Pressure readings');if(round===3){ended=true;ui.finish();return;}announce('Pressure recorded. Adjust to the next green band.');}render();},40);cleanup(()=>{ended=true;clearInterval(interval);});ui.progress(0,3,'Pressure readings');render();
 }

 if(game==='radio'){
  const assigned=integer(1510,1660),shell=panel('DUTY RADIO · TRANSMISSION CHECK'),assignment=text('div','ASSIGNED '+(assigned/10).toFixed(1)+' MHz · reception 60–80','eq-work-order'),screen=node('div',{class:'eq-radio-screen'}),frequency=text('output','140.0 MHz','eq-frequency'),signal=meter('Radio signal'),wave=node('div',{class:'eq-signal-wave','aria-hidden':'true'}),tuning=node('div',{class:'eq-radio-tuning'});let tuned=1400,gain=0,transmitting=false,held=0,last=0,ended=false;
  ui.instructions.textContent='Turn the coarse and fine tuning knobs to your assigned frequency. Set reception in the green range, then hold TRANSMIT until the message sends.';
  for(let i=0;i<20;i++){const bar=node('span');bar.style.setProperty('--wave',((i*17)%33+10)+'px');wave.append(bar);}
  const ready=()=>tuned===assigned&&gain>=60&&gain<=80;
  const update=()=>{frequency.textContent=(tuned/10).toFixed(1)+' MHz';const strength=clamp(100-Math.abs(tuned-assigned)*3-Math.abs(gain-70),0,100);signal.set(strength,Math.round(strength)+'% SIGNAL');shell.dataset.ready=String(ready());wave.style.setProperty('--signal',(strength/100).toFixed(2));ui.progress((tuned===assigned?1:0)+(gain>=60&&gain<=80?1:0),3,'Radio checks');};
  let lastDrift=performance.now();
  for(const [label,step]of [['Coarse',10],['Fine',1]]){const group=node('div',{class:'eq-radio-control'});let angle=0;const turn=delta=>{if(ended)return;tuned=clamp(tuned+delta*step,1400,1800);angle+=delta*20;k.style.setProperty('--angle',angle+'deg');update();},k=knob('Turn '+label.toLowerCase()+' radio tuning knob',turn),buttons=node('div',{class:'eq-step-buttons'});buttons.append(button('−',()=>turn(-1),{'aria-label':'Decrease '+label.toLowerCase()+' tuning'}),button('+',()=>turn(1),{'aria-label':'Increase '+label.toLowerCase()+' tuning'}));group.append(text('strong',label.toUpperCase()),k,text('small',step===10?'1 MHz / turn':'0.1 MHz / turn'),buttons);tuning.append(group);}
  const gainGroup=node('label',{class:'eq-reception'}),gainRead=text('output','0'),gainInput=range('Radio reception',0,100,5,0,value=>{gain=value;gainRead.textContent=value;update();});gainGroup.append(text('span','RECEPTION · green range 60–80'),gainInput,gainRead);
  const txMeter=meter('Transmission progress'),transmit=button('● HOLD TRANSMIT',()=>{}, {class:'eq-transmit','aria-pressed':'false'});
  hold(transmit,()=>{if(!ready()){announce('Tune the assigned frequency and set reception to 60–80 first.',true);return;}transmitting=true;held=0;last=performance.now();transmit.setAttribute('aria-pressed','true');announce('Sending… keep holding TRANSMIT.');},()=>{transmitting=false;transmit.setAttribute('aria-pressed','false');if(!ended){held=0;txMeter.set(0,'MESSAGE NOT SENT');}});
  const interval=setInterval(()=>{if(ended)return;const now=performance.now();if(ui.suspended?.()){last=now;return;}if(ui.effect?.()?.type==='radio'&&now-lastDrift>2500){tuned=clamp(tuned+(Math.random()>.5?1:-1),1400,1800);lastDrift=now;update();}if(!transmitting)return;const dt=Math.min(150,now-last);last=now;if(!ready()){transmitting=false;held=0;txMeter.set(0,'SIGNAL LOST');announce('Signal lost. Retune before transmitting.',true);return;}held+=dt;txMeter.set(held/900*100,'SENDING '+Math.min(100,Math.floor(held/9))+'%');if(held>=900){ended=true;transmitting=false;ui.progress(3,3,'Radio checks');ui.finish();}},40);cleanup(()=>{ended=true;clearInterval(interval);});screen.append(frequency,wave,signal.el);shell.append(assignment,screen,tuning,gainGroup,txMeter.el,transmit);stage.append(shell);update();
 }

 if(game==='valves'){
  ui.instructions.textContent='Turn leaking valve wheels counterclockwise to close them. Watch the water flow stop, then run the pressure test. Drag wheels, use arrow keys, or tap CLOSE.';
  const shell=panel('WATER MAIN · LEAK REPAIR','Counterclockwise closes · clockwise opens'),board=node('div',{class:'eq-valve-bank'}),open=[6,8,7],wheels=[],cards=[],readouts=[];let testing=false;
  const update=()=>{let sealed=0;open.forEach((value,i)=>{cards[i].style.setProperty('--leak',value/8);cards[i].dataset.sealed=String(value===0);wheels[i].style.setProperty('--angle',value*35+'deg');readouts[i].textContent=value===0?'SEALED':'FLOW '+value+' / 8';if(value===0)sealed++;});ui.progress(sealed,3,'Valves sealed');};
  for(let i=0;i<3;i++){const card=node('section',{class:'eq-pipe-unit'}),pipe=node('div',{class:'eq-pipe','aria-hidden':'true'}),leak=node('div',{class:'eq-water-leak','aria-hidden':'true'});for(let drop=0;drop<5;drop++){const drip=node('i');drip.style.setProperty('--delay',drop*.14+'s');drip.style.setProperty('--x',drop*16+'%');leak.append(drip);}
   const turn=step=>{if(testing)return;open[i]=clamp(open[i]+step,0,8);update();if(open[i]===0)announce('Valve '+(i+1)+' sealed.');};const wheel=knob('Turn valve '+(i+1),turn,-1);wheel.classList.add('eq-valve-wheel');const wheelSpokes=node('span',{class:'eq-wheel-spokes','aria-hidden':'true'});wheel.append(wheelSpokes);const readout=text('output','','eq-valve-state'),buttons=node('div',{class:'eq-step-buttons'});buttons.append(button('⟲ Close',()=>turn(-1),{'aria-label':'Close valve '+(i+1)+' one notch'}),button('Open ⟳',()=>turn(1),{'aria-label':'Open valve '+(i+1)+' one notch'}));card.append(text('h4','LINE '+(i+1)),pipe,leak,wheel,readout,buttons);wheels.push(wheel);cards.push(card);readouts.push(readout);board.append(card);}
  const testMeter=meter('Pressure test'),test=button('Run pressure test',()=>{if(testing)return;if(open.some(n=>n!==0)){announce('Water is still flowing. Close every leaking valve before testing.',true);return;}testing=true;test.disabled=true;wheels.forEach(w=>w.disabled=true);let progress=0;announce('Testing line pressure…');const interval=setInterval(()=>{if(ui.suspended?.())return;progress+=10;testMeter.set(progress,'TEST PRESSURE '+progress+'%');if(progress>=100){clearInterval(interval);ui.finish();}},90);cleanup(()=>clearInterval(interval));},{class:'eq-primary'});shell.append(board,testMeter.el,test);stage.append(shell);testMeter.set(0,'PRESSURE TEST IDLE');update();
 }
 return true;
}
