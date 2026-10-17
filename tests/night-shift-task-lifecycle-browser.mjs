import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {solveInspection} from './night-shift-machinery-b-browser.mjs';

// These checks exercise normal controls and completion callbacks. No station
// state or answers are modified by the test.
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:1300},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8791/');
 await page.addStyleTag({url:'/night-shift/tasks.css?v=machinery-1'});
 const dialog=page.locator('#taskDialog');
 const prepareStorage=async()=>{
  const bins={Laundry:['Clean towels','Bed sheets'],Medical:['Bandages','Exam gloves'],Kitchen:['Meal trays','Cooking pans']};
  for(const [area,items]of Object.entries(bins)){
   await dialog.getByRole('button',{name:'Open '+area+' lid',exact:true}).click();
   for(const name of items){await dialog.getByRole('button',{name,exact:true}).click();await dialog.getByRole('button',{name:area+' bin (open)',exact:true}).click();}
   await dialog.getByRole('button',{name:'Close '+area+' lid',exact:true}).click();
  }
 };
 const flushFrames=async()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

 await page.evaluate(async()=>{
  window.cancelledCalls=0;
  const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');
  openTask({id:'cancelled-station',name:'Cancellation check',game:'sort'},()=>window.cancelledCalls++);
 });
 await dialog.getByRole('button',{name:'Open Laundry lid',exact:true}).click();
 await dialog.getByRole('button',{name:'Clean towels',exact:true}).click();
 await dialog.getByRole('button',{name:'Laundry bin (open)',exact:true}).click();
 assert.equal(await dialog.locator('.mc-conveyor .mc-package').count(),5);
 await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>window.cancelledCalls),0);
 await page.evaluate(async()=>{
  const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');
  openTask({id:'cancelled-station',name:'Cancellation reopened',game:'sort'},()=>window.cancelledCalls++);
 });
 assert.equal(await dialog.locator('.mc-conveyor .mc-package').count(),6);
 assert.equal(await dialog.locator('.mc-package:disabled').count(),0);
 await dialog.getByRole('button',{name:'Close task',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.cancelledCalls),0);
 console.log('PASS: native Escape cancels partial work without completion; reopening starts an unsolved station.');

 for(const outcome of ['resolve','reject']){
  await page.evaluate(async outcome=>{
   window.oldCalls=0;window.newCalls=0;window.oldSettled=false;
   const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');
   openTask({id:'pending-'+outcome,name:'Old pending save',game:'sort'},()=>{
    window.oldCalls++;
    return new Promise((resolve,reject)=>{window.settleOldSave=()=>outcome==='resolve'?resolve():reject(Error('Old save rejected after close'));}).finally(()=>window.oldSettled=true);
   });
  },outcome);
  await prepareStorage();
  await dialog.getByRole('button',{name:'Secure storage',exact:true}).dblclick();
  assert.equal(await page.evaluate(()=>window.oldCalls),1,'rapid final clicks must invoke one save');
  assert(await dialog.locator('.machine-stage').evaluate(stage=>stage.inert));
  await dialog.getByRole('button',{name:'Close task',exact:true}).click();await dialog.waitFor({state:'detached'});
  await page.evaluate(async()=>{
   const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');
   openTask({id:'fresh-station',name:'Fresh independent task',game:'records'},()=>window.newCalls++);
  });
  await page.evaluate(()=>window.settleOldSave());await flushFrames();
  assert(await page.evaluate(()=>window.oldSettled));
  assert.equal(await dialog.getAttribute('data-game'),'records');
  assert.equal(await dialog.locator('#taskTitle').textContent(),'Fresh independent task');
  assert.equal(await dialog.getByRole('progressbar').getAttribute('aria-valuenow'),'0');
  assert.equal(await dialog.getByRole('button',{name:'Back to the floor',exact:true}).count(),0);
  assert.equal(await dialog.getByRole('button',{name:'Retry saving completion',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>window.newCalls),0);
  await solveInspection(page,'records');
  assert.equal(await page.evaluate(()=>window.newCalls),1);
  assert.equal(await page.evaluate(()=>window.oldCalls),1);
  await dialog.getByRole('button',{name:'Back to the floor',exact:true}).click();
  console.log('PASS: '+outcome+' of a closed task’s pending save cannot alter a new task or its completion.');
 }

 await page.evaluate(async()=>{
  window.retryCalls=0;window.retrySuccesses=0;
  const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');
  openTask({id:'retry-station',name:'Retry completion check',game:'sort'},()=>{
   window.retryCalls++;
   if(window.retryCalls===1)throw Error('Simulated connection interruption');
   return new Promise(resolve=>window.finishRetrySave=()=>{window.retrySuccesses++;resolve();});
  });
 });
 await prepareStorage();await dialog.getByRole('button',{name:'Secure storage',exact:true}).click();
 const retry=dialog.getByRole('button',{name:'Retry saving completion',exact:true});await retry.waitFor();
 assert.equal(await page.evaluate(()=>window.retryCalls),1);
 assert.equal(await page.evaluate(()=>window.retrySuccesses),0);
 assert.match(await dialog.locator('.machine-status').textContent(),/Simulated connection interruption/);
 assert.equal(await dialog.locator('.mc-conveyor').count(),0,'solved game should not replay after save failure');
 await retry.dblclick();
 assert.equal(await page.evaluate(()=>window.retryCalls),2,'retry invokes callback exactly once more');
 assert.equal(await page.evaluate(()=>window.retrySuccesses),0);
 assert(await dialog.locator('.machine-stage').evaluate(stage=>stage.inert));
 await page.evaluate(()=>window.finishRetrySave());
 await dialog.getByRole('button',{name:'Back to the floor',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.retryCalls),2);
 assert.equal(await page.evaluate(()=>window.retrySuccesses),1);
 assert.equal(await dialog.getByRole('progressbar').getAttribute('aria-valuenow'),'100');
 await dialog.getByRole('button',{name:'Back to the floor',exact:true}).click();await flushFrames();
 assert.equal(await page.evaluate(()=>window.retryCalls),2);
 assert.deepEqual(errors,[]);
 console.log('PASS: rejected saves retry without replay or duplicate completion; no browser errors.');
}finally{await browser.close();}
