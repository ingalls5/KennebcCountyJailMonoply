import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const noWin=async page=>assert.equal(await page.locator('#taskDialog').getByRole('button',{name:'Back to the floor'}).count(),0);
const rangeEnd=async locator=>{await locator.focus();await locator.press('End');};
const rangeHome=async locator=>{await locator.focus();await locator.press('Home');};

// Solvers read the same receipts, item labels, and drawn patterns shown to a player.
// They exercise normal controls; the runtime never exposes a hidden answer field.
export async function solveInspection(page,game){
 const d=page.locator('#taskDialog');
 if(game==='records'){
  await d.getByRole('button',{name:'Stamp verified',exact:true}).click();await noWin(page);
  for(let i=0;i<3;i++){
   const source=d.getByRole('button',{name:'Load file '+(i+1),exact:true});
   if(i===0)await source.dragTo(d.locator('.mb-document-reader'));else await source.click();
   await d.getByRole('button',{name:'OPEN FILE COVER',exact:true}).click();
   const expected=await d.locator('.mb-paper .mb-receipt-field').allTextContents(),actual=await d.locator('.mb-file-document .mb-receipt-field').allTextContents(),valid=expected.join('|')===actual.join('|');
   if(i===0){await d.getByRole('button',{name:valid?'Stamp return for correction':'Stamp verified',exact:true}).click();await noWin(page);}
   const stamp=d.getByRole('button',{name:valid?'Stamp verified':'Stamp return for correction',exact:true});
   if(i===1)await stamp.dragTo(d.locator('.mb-document-reader'));else await stamp.click();
  }
 }
 if(game==='count'){
  await d.getByRole('button',{name:'Confirm and seal count',exact:true}).click();await noWin(page);
  for(let round=0;round<2;round++){
   await rangeEnd(d.getByRole('slider',{name:'Slide unit door open',exact:true}));
   const people=d.locator('.mb-person'),total=await people.count();
   for(let i=0;i<total;i++)await people.nth(i).click();
   await d.getByRole('button',{name:'Confirm and seal count',exact:true}).click();await noWin(page);
   for(let i=0;i<total;i++)await d.getByRole('button',{name:'Increase sheet total',exact:true}).click();
   await d.getByRole('button',{name:'Confirm and seal count',exact:true}).click();
  }
 }
 if(game==='memory'){
  const known=new Map(),returned=new Set();
  await d.getByRole('button',{name:'Return KEY pair',exact:true}).click();await noWin(page);
  const store=async()=>{const pair=d.locator('.mb-matched-pair');if(await pair.count()&&await pair.isVisible()){
   const value=(await pair.textContent()).split(' + ')[0];await d.getByRole('button',{name:'Return '+value+' pair',exact:true}).click();returned.add(value);return true;
  }return false;};
  for(let i=0;i<8;i++){
   const card=d.getByRole('button',{name:'Open property locker '+(i+1),exact:true});
   if(await card.isDisabled())continue;await card.click();
   const value=await card.locator('span').last().textContent();known.set(i,value);await store();
  }
  const groups=new Map();for(const [i,value]of known){if(!groups.has(value))groups.set(value,[]);groups.get(value).push(i);}
  for(const [value,indices]of groups){if(returned.has(value))continue;assert.equal(indices.length,2);for(let attempt=0;attempt<3&&!returned.has(value);attempt++){
   for(const i of indices){await d.getByRole('button',{name:'Open property locker '+(i+1),exact:true}).click();if(await store())break;}
  }}
  assert.equal(returned.size,4);
 }
 if(game==='order'){
  const close=d.getByRole('slider',{name:'Slide filing drawer closed',exact:true});await rangeEnd(close);await noWin(page);await rangeHome(close);
  const values=(await d.locator('.mb-folder').allTextContents()).map(Number).sort((a,b)=>a-b);
  // File in reverse first; a closed drawer must reject the complete but wrong order.
  for(let i=0;i<5;i++){await d.getByRole('button',{name:'Folder '+values[4-i],exact:true}).click();await d.getByRole('button',{name:'Filing slot '+(i+1),exact:true}).click();}
  await rangeEnd(close);await noWin(page);await rangeHome(close);
  for(let i=0;i<5;i++){
   const source=d.getByRole('button',{name:'Folder '+values[i],exact:true}),slot=d.getByRole('button',{name:'Filing slot '+(i+1),exact:true});
   if(i===0)await source.dragTo(slot);else{await source.click();await slot.click();}
  }
  await rangeEnd(close);
 }
 if(game==='contraband'){
  await d.getByRole('button',{name:'Place selected item in evidence',exact:true}).click();await noWin(page);
  await rangeEnd(d.getByRole('slider',{name:'Unzip property bag',exact:true}));
  for(let i=0;i<6;i++){
   const item=d.getByRole('button',{name:'Inspect property item '+(i+1),exact:true});await item.click();
   const name=await item.locator('span').last().textContent(),prohibited=['Shank','Unauthorized phone','Loose pills'].includes(name),target=d.getByRole('button',{name:prohibited?'Place selected item in evidence':'Return selected authorized item',exact:true});
   if(i===0){await d.getByRole('button',{name:prohibited?'Return selected authorized item':'Place selected item in evidence',exact:true}).click();await noWin(page);}
   if(i===1)await item.dragTo(target);else await target.click();
  }
 }
 if(game==='fingerprint'){
  await d.getByRole('button',{name:'SCAN ALIGNED OVERLAY',exact:true}).click();await noWin(page);
  assert(await d.getByRole('button',{name:'LIFT PRINT TO SCANNER',exact:true}).isDisabled());
  for(let i=0;i<6;i++)await d.getByRole('button',{name:'Dust print area '+(i+1),exact:true}).click();
  const target=await d.locator('.mb-print-surface>.mb-fingerprint').innerHTML();
  await d.getByRole('button',{name:'LIFT PRINT TO SCANNER',exact:true}).click();
  const files=await d.locator('.mb-fingerprint-file').all();let match;
  for(const file of files)if(await file.locator('svg').innerHTML()===target)match=file;
  assert(match);await match.click();await d.getByRole('button',{name:'SCAN ALIGNED OVERLAY',exact:true}).click();await noWin(page);
  const horizontal=d.getByRole('slider',{name:'Horizontal registration',exact:true});await rangeHome(horizontal);for(let i=0;i<4;i++)await horizontal.press('ArrowRight');
  await rangeHome(d.getByRole('slider',{name:'Overlay rotation',exact:true}));
  await d.getByRole('button',{name:'SCAN ALIGNED OVERLAY',exact:true}).click();
 }
 if(game==='tally'){
  await d.getByRole('button',{name:'STAMP RECONCILED',exact:true}).click();await noWin(page);
  for(const unit of ['A-UNIT','T-UNIT','INTAKE']){
   await d.getByRole('button',{name:'Open '+unit+' report',exact:true}).click();
   await d.getByRole('button',{name:'STAMP RECONCILED',exact:true}).click();await noWin(page);
   const total=(await d.locator('.mb-report-paper .mb-receipt-field').allTextContents()).reduce((sum,line)=>sum+Number(line.match(/\d+/)[0]),0),dial=d.getByRole('button',{name:'Turn ledger count dial',exact:true});
   await dial.focus();for(let i=0;i<total;i++)await dial.press('ArrowRight');
   await d.getByRole('button',{name:'STAMP RECONCILED',exact:true}).click();
   await d.getByRole('button',{name:'Open '+unit+' report',exact:true}).dragTo(d.getByRole('button',{name:'Clip '+unit+' report',exact:true}));
  }
  await d.getByRole('button',{name:'SEAL COUNT SUMMARY',exact:true}).click();
 }
 await d.getByRole('button',{name:'Back to the floor',exact:true}).waitFor();
}

async function run(){
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:1300},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8791/');await page.addStyleTag({url:'/night-shift/tasks.css?v=machinery-1'});await page.evaluate(()=>{window.taskCompletions=0;});
  for(const game of ['records','count','memory','order','contraband','fingerprint','tally']){
   await page.evaluate(async game=>{const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');openTask({name:game,game},()=>window.taskCompletions++);},game);
   await solveInspection(page,game);await page.getByRole('button',{name:'Back to the floor',exact:true}).click();console.log('PASS:',game,'physical controls, rejected incomplete actions, legitimate completion');
  }
  assert.equal(await page.evaluate(()=>window.taskCompletions),7);
  await page.setViewportSize({width:390,height:844});
  for(const game of ['records','count','memory','order','contraband','fingerprint','tally']){
   await page.evaluate(async game=>{const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');openTask({name:game,game},()=>window.taskCompletions++);},game);
   assert(await page.locator('#taskDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),game+' has no horizontal overflow on phone');
   await page.getByRole('button',{name:'Close task',exact:true}).click();
  }
  // Exercise a native touch drag with the actual shared pointer-control implementation.
  await page.setViewportSize({width:810,height:1200});
  await page.evaluate(async()=>{const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');openTask({name:'Touch inspection',game:'records'},()=>window.taskCompletions++);});
  const source=page.getByRole('button',{name:'Load file 1',exact:true}),target=page.locator('.mb-document-reader');await source.scrollIntoViewIfNeeded();const a=await source.boundingBox(),z=await target.boundingBox(),session=await page.context().newCDPSession(page),from={x:a.x+a.width/2,y:a.y+a.height/2},to={x:z.x+z.width/2,y:z.y+z.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let i=1;i<=15;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/15,y:from.y+(to.y-from.y)*i/15}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.getByRole('button',{name:'OPEN FILE COVER',exact:true}).waitFor();await page.screenshot({path:'.runtime/machinery-b-records.png'});await page.getByRole('button',{name:'Close task',exact:true}).click();assert.deepEqual(errors,[]);console.log('PASS: seven phone panels fit, native touch file loading, clean cancellation');
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
