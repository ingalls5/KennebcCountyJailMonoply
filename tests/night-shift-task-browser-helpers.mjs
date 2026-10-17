import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {solveEquipment} from './night-shift-machinery-a-browser.mjs';
import {solveInspection} from './night-shift-machinery-b-browser.mjs';
import {solvePhysical} from './night-shift-machinery-c-browser.mjs';

export async function solveTask(page,game){
 if(['wires','sequence','calibrate','keypad','timing','radio','valves'].includes(game))return solveEquipment(page,game);
 if(['records','count','memory','order','contraband','fingerprint','tally'].includes(game))return solveInspection(page,game);
 return solvePhysical(page,game);
}
export async function runTaskGames(games){
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8791',page=await browser.newPage({viewport:{width:810,height:1080}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/');await page.addStyleTag({url:base+'/night-shift/tasks.css?v=machinery-1'});
  await page.evaluate(()=>window.completions=0);
  const open=game=>page.evaluate(async game=>{const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');openTask({name:game,game},()=>window.completions++);},game);
  await open(games[0]);await page.keyboard.press('Escape');assert.equal(await page.locator('#taskDialog').count(),0);assert.equal(await page.evaluate(()=>window.completions),0);
  for(const [index,game]of games.entries()){
   await open(game);await solveTask(page,game);
   assert.equal(await page.evaluate(()=>window.completions),index+1,game+' saves exactly once');
   await page.getByRole('button',{name:'Back to the floor',exact:true}).click();
   console.log('PASS: '+game);
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
