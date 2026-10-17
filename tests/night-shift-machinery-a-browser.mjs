import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const dialog=page=>page.locator('#taskDialog');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function drag(page,source,target){
 await source.scrollIntoViewIfNeeded();await target.scrollIntoViewIfNeeded();
 const a=await source.boundingBox(),b=await target.boundingBox();assert(a&&b,'Both pieces are visible');
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:16});await page.mouse.up();
}
async function rotate(page,control,degrees){
 await control.scrollIntoViewIfNeeded();const a=await control.boundingBox(),x=a.x+a.width/2,y=a.y+a.height/2,r=a.width*.35;
 await page.mouse.move(x+r,y);await page.mouse.down();
 for(let n=1;n<=Math.ceil(Math.abs(degrees)/10);n++){const angle=Math.sign(degrees)*Math.min(n*10,Math.abs(degrees))*Math.PI/180;await page.mouse.move(x+Math.cos(angle)*r,y+Math.sin(angle)*r);}
 await page.mouse.up();
}
async function setRange(input,value,step=5){await input.focus();await input.press('Home');for(let n=0;n<value/step;n++)await input.press('ArrowRight');}
async function holdAt(page,control,condition,timeout=7000){
 await control.scrollIntoViewIfNeeded();const b=await control.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
 const start=Date.now();try{while(!(await condition())){if(Date.now()-start>timeout)throw Error('Equipment control did not reach its target');await sleep(65);}}finally{await page.mouse.up();}
}

// Solves the currently open equipment through its visible controls.
export async function solveEquipment(page,game){
 const d=dialog(page);
 if(game==='wires'){
  await d.getByRole('button',{name:'Breaker ON',exact:true}).click();
  for(const label of ['A','B','C','D'])await drag(page,d.getByRole('button',{name:'Pick up lead '+label,exact:true}),d.getByRole('button',{name:'Socket '+label,exact:true}));
  await d.getByRole('button',{name:'Breaker OFF',exact:true}).click();await d.getByRole('button',{name:'Run circuit test',exact:true}).click();
 }
 if(game==='sequence'){
  const order=await d.locator('.eq-startup-list li').allTextContents();
  for(let i=0;i<order.length;i++){const control=d.getByRole('button',{name:order[i]+' switch',exact:true});if(i===0){await control.scrollIntoViewIfNeeded();const b=await control.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height*.8);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height*.2,{steps:8});await page.mouse.up();}else await control.click();}
  await rotate(page,d.getByRole('button',{name:'Turn starter crank clockwise',exact:true}),220);
 }
 if(game==='calibrate'){
  for(const name of ['Power','Pressure','Ventilation']){const card=d.locator('.eq-instrument').filter({has:page.getByRole('heading',{name,exact:true})});const target=Number((await card.locator('.eq-target').textContent()).match(/\d+/)[0]);await setRange(card.getByRole('slider',{name:name+' setting',exact:true}),target);await drag(page,d.getByRole('button',{name:'⌁  Diagnostic probe',exact:true}),card.getByRole('button',{name:'Record '+name+' sensor',exact:true}));}
 }
 if(game==='keypad'){
  const code=(await d.locator('.eq-work-order').textContent()).match(/\d{4}/)[0];if(!await d.locator('.eq-id-card').isDisabled())await drag(page,d.locator('.eq-id-card'),d.getByRole('button',{name:'SWIPE CREDENTIAL',exact:true}));await d.locator('.eq-code-display').focus();await page.keyboard.type(code);await d.getByRole('button',{name:'Unlock access panel',exact:true}).click();await d.getByRole('slider',{name:'Slide door bolt open',exact:true}).focus();await page.keyboard.press('End');
 }
 if(game==='timing'){
  for(let round=1;round<=3;round++){
   const target=await d.locator('.eq-target').textContent(),numbers=target.match(/\d+/g).map(Number),center=(numbers[2]+numbers[3])/2;
   let pressure=Number((await d.locator('.eq-pressure-reading').textContent()).match(/\d+/)[0]);
   const pump=pressure<center,control=d.getByRole('button',{name:pump?'▲ HOLD PUMP':'▼ HOLD BLEED',exact:true});
   await holdAt(page,control,async()=>{pressure=Number((await d.locator('.eq-pressure-reading').textContent()).match(/\d+/)[0]);return pump?pressure>=center:pressure<=center;});
   if(round<3)await page.waitForFunction(previous=>{const target=document.querySelector('#taskDialog .eq-target');return target&&target.textContent!==previous;},target);else await d.getByRole('button',{name:'Back to the floor',exact:true}).waitFor();
  }
 }
 if(game==='radio'){
  const assigned=Math.round(Number((await d.locator('.eq-work-order').textContent()).match(/\d+\.\d/)[0])*10),distance=assigned-1400;
  for(let n=0;n<Math.floor(distance/10);n++)await d.getByRole('button',{name:'Increase coarse tuning',exact:true}).click();
  const fine=d.getByRole('button',{name:'Turn fine radio tuning knob',exact:true});await fine.focus();for(let n=0;n<distance%10;n++)await fine.press('ArrowRight');
  await setRange(d.getByRole('slider',{name:'Radio reception',exact:true}),70);
  await holdAt(page,d.getByRole('button',{name:'● HOLD TRANSMIT',exact:true}),async()=>await d.getByRole('button',{name:'Back to the floor',exact:true}).count()>0);
 }
 if(game==='valves'){
  for(let n=1;n<=3;n++)await rotate(page,d.getByRole('button',{name:'Turn valve '+n,exact:true}),-240);
  await d.getByRole('button',{name:'Run pressure test',exact:true}).click();
 }
 await d.getByRole('button',{name:'Back to the floor',exact:true}).waitFor({timeout:10000});
}

async function main(){
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:1050},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8791/');await page.addStyleTag({url:'/night-shift/tasks.css?v=machinery-1'});
  await page.evaluate(async()=>{window.equipmentTasks=await import('/night-shift/tasks.js?v=machinery-1');window.equipmentCompletions=0;});
  for(const game of ['wires','sequence','calibrate','keypad','timing','radio','valves']){
   await page.evaluate(game=>window.equipmentTasks.openTask({game,name:'Test '+game},async()=>{window.equipmentCompletions++;}),game);
   assert.equal(await dialog(page).locator('.machine-status[data-tone=error]').count(),0,'Panel initializes without an error');
   if(game==='wires'){await dialog(page).getByRole('button',{name:'Run circuit test',exact:true}).click();assert.equal(await page.evaluate(()=>window.equipmentCompletions),0,'An isolated unfinished circuit cannot complete');}
   if(game==='valves'){const before=await page.evaluate(()=>window.equipmentCompletions);await dialog(page).getByRole('button',{name:'Run pressure test',exact:true}).click();assert.equal(await page.evaluate(()=>window.equipmentCompletions),before,'A leaking line cannot pass its pressure test');}
   await solveEquipment(page,game);assert.equal(await dialog(page).evaluate(d=>d.scrollWidth>d.clientWidth+1),false,game+' fits its dialog');await dialog(page).getByRole('button',{name:'Back to the floor',exact:true}).click();console.log('PASS '+game+' physical controls and completion');
  }
  assert.equal(await page.evaluate(()=>window.equipmentCompletions),7,'Each solved station records exactly once');
  // Leaving a running gauge must cancel its loop and allow a fresh attempt.
  await page.evaluate(()=>window.equipmentTasks.openTask({game:'timing',name:'Abandoned pressure test'},async()=>{window.equipmentCompletions++;}));await dialog(page).getByRole('button',{name:'Close task',exact:true}).click();await sleep(1300);assert.equal(await page.evaluate(()=>window.equipmentCompletions),7);
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.equipmentTasks.openTask({game:'valves',name:'Phone valve controls'},async()=>{window.equipmentCompletions++;}));
  assert.equal(await dialog(page).evaluate(d=>d.scrollWidth>d.clientWidth+1),false,'Phone-sized valve controls fit');await solveEquipment(page,'valves');await dialog(page).getByRole('button',{name:'Back to the floor',exact:true}).click();
  await page.evaluate(()=>window.equipmentTasks.openTask({game:'keypad',name:'Touch credential reader'},async()=>{window.equipmentCompletions++;}));
  const source=dialog(page).locator('.eq-id-card'),target=dialog(page).locator('.eq-card-reader');await source.scrollIntoViewIfNeeded();await target.scrollIntoViewIfNeeded();const a=await source.boundingBox(),b=await target.boundingBox(),cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2}]});
  for(let step=1;step<=12;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*step/12,y:a.y+a.height/2+(b.y+b.height/2-a.y-a.height/2)*step/12}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await source.isDisabled(),true,'Real touch drag presents a credential');await cdp.detach();await solveEquipment(page,'keypad');await dialog(page).getByRole('button',{name:'Back to the floor',exact:true}).click();
  assert.deepEqual(errors,[]);console.log('PASS phone fit, real touch card swipe, restart cleanup, and no browser errors');
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error);process.exitCode=1;});
