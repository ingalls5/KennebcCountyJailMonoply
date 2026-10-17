import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {solveSabotage} from './night-shift-sabotage-browser.mjs';
import {solveEquipment} from './night-shift-machinery-a-browser.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[],api=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/night-shift/'))api.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('night-shift-room-v1',JSON.stringify({code:'ABC234',token:'demo-sentinel'})));
 await page.goto('http://127.0.0.1:8791/night-shift-sabotage-test');
 const d=page.locator('#taskDialog');
 for(const [i,type]of ['power','radio','equipment','doors','records','cameras'].entries()){
  await page.locator('[data-sabotage="'+type+'"]').getByRole('button').click();await solveSabotage(page,type);await d.getByRole('button',{name:'Back to the floor',exact:true}).click();
  assert.equal(await page.locator('#testedCount').textContent(),(i+1)+' / 6 tried');assert.match(await page.locator('#systemBadge').textContent(),/ACTIVE/);
  if(type==='power'){
   assert(await page.locator('#lostSignal').isVisible());await page.getByRole('button',{name:'Try the powerless station',exact:true}).click();assert(await d.locator('.machine-stage').evaluate(el=>el.inert));await d.getByRole('button',{name:'Close task',exact:true}).click();await page.getByRole('button',{name:'Repair · Restore power',exact:true}).click();await solveEquipment(page,'wires');await d.getByRole('button',{name:'Back to the floor',exact:true}).click();assert.equal(await page.locator('#systemBadge').textContent(),'Systems online');assert(!await page.locator('#lostSignal').isVisible());
  }
  if(type==='radio'){
   await page.getByRole('button',{name:'Try tuning the affected radio',exact:true}).click();const initial=await d.locator('.eq-frequency').textContent();await page.waitForFunction(old=>document.querySelector('.eq-frequency').textContent!==old,initial);await d.getByRole('button',{name:'Close task',exact:true}).click();
  }
  if(type==='doors'){
   await page.locator('#tryDoor').click();assert.match(await page.locator('#doorStatus').textContent(),/Locked/);assert(!await page.locator('#doorScene').evaluate(el=>el.classList.contains('crossed')));await page.getByRole('button',{name:'Repair · Release jammed doors',exact:true}).click();await solveEquipment(page,'keypad');await d.getByRole('button',{name:'Back to the floor',exact:true}).click();await page.locator('#tryDoor').click();assert(await page.locator('#doorScene').evaluate(el=>el.classList.contains('crossed')));
  }
  if(type==='cameras')assert(await page.locator('#lostSignal').isVisible());
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#officerView').scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'.runtime/sabotage-demo-phone.png'});await page.locator('#resetTest').click();assert.equal(await page.locator('#testedCount').textContent(),'0 / 6 tried');assert.equal(await page.locator('#systemBadge').textContent(),'Systems online');assert(!await page.locator('#lostSignal').isVisible());
 assert.deepEqual(api,[],'Solo demo must not call live game APIs');assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('night-shift-room-v1'))),{code:'ABC234',token:'demo-sentinel'});assert.deepEqual(errors,[]);
 console.log('PASS: all six solo sabotage games, officer effects, power/door repairs, reset, phone fit, and no live game or saved-seat changes.');
}finally{await browser.close();}
