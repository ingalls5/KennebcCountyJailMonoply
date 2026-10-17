import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8791/');await page.addStyleTag({url:'/night-shift/tasks.css?v=sabotage-1'});
 await page.evaluate(async()=>{window.effect=null;window.saved=0;const {openTask}=await import('/night-shift/tasks.js?v=sabotage-1');openTask({name:'Pressure test during power failure',game:'valves'},()=>window.saved++,{effect:()=>window.effect});});
 const d=page.locator('#taskDialog');for(const [line,count]of [[1,6],[2,8],[3,7]])for(let i=0;i<count;i++)await d.getByRole('button',{name:'Close valve '+line+' one notch',exact:true}).click();
 await d.getByRole('button',{name:'Run pressure test',exact:true}).click();await page.waitForTimeout(100);
 await page.evaluate(()=>window.effect={id:'outage',type:'power'});await page.waitForFunction(()=>document.querySelector('.machine-stage').inert);
 const progress=d.locator('.eq-meter output').last(),held=await progress.textContent();await page.waitForTimeout(400);assert.equal(await progress.textContent(),held);assert.equal(await page.evaluate(()=>window.saved),0);
 await page.evaluate(()=>window.effect=null);await d.getByRole('button',{name:'Back to the floor',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.saved),1);assert.deepEqual(errors,[]);
 console.log('PASS: an in-flight valve pressure test freezes during a power outage and resumes to completion after repair.');
}finally{await browser.close();}
