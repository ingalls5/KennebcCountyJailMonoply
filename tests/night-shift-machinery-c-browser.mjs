import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
export async function solvePhysical(page,game){
 const d=page.locator('#taskDialog'),areas={0:'Laundry',1:'Laundry',2:'Medical',3:'Medical',4:'Kitchen',5:'Kitchen'};
 if(game==='sort'){
  for(const area of ['Laundry','Medical','Kitchen'])await d.getByRole('button',{name:'Open '+area+' lid',exact:true}).click();
  for(let id=0;id<6;id++){await d.locator('[data-supply="'+id+'"]').click();await d.locator('.mc-bin-inside[data-area="'+areas[id]+'"]').click();}
  for(const area of ['Laundry','Medical','Kitchen'])await d.getByRole('button',{name:'Close '+area+' lid',exact:true}).click();
  await d.getByRole('button',{name:'Secure storage',exact:true}).click();
 }else if(game==='tray'){
  for(let round=0;round<2;round++){for(let i=0;i<3;i++){const slot=d.locator('[data-compartment="'+i+'"]'),food=(await slot.locator('small').textContent()).split(' · ')[1];await d.locator('[data-food="'+food+'"]').click();await slot.click();}await d.getByRole('button',{name:'Serve tray',exact:true}).click();}
 }else if(game==='balance'){
  await d.getByRole('button',{name:'SEALED PARCEL',exact:true}).click();let target=Number(await d.locator('.mc-scale-display').getAttribute('data-target'));
  for(const weight of [10,5,2,1])while(target>=weight){await d.getByRole('button',{name:'Add '+weight+' kg',exact:true}).click();target-=weight;}await d.getByRole('button',{name:'Lock scale reading',exact:true}).click();
 }else if(game==='clean'){
  await d.locator('.mc-clean-controls summary').click();for(let patch=1;patch<=12;patch++){const b=d.getByRole('button',{name:'Scrub stain '+patch,exact:true});while(await b.count()&&await b.isEnabled())await b.click();}
 }else if(game==='route'){
  for(const square of [1,2,9,16,15,14,21,28,29,30,31,24,17,18,19,20,27,34])await d.locator('[data-square="'+square+'"]').click();
 }else if(game==='crates'){
  const used={Laundry:0,Medical:0,Kitchen:0};for(let id=0;id<6;id++){const area=areas[id];await d.locator('[data-supply="'+id+'"]').click();await d.locator('.mc-shelf-slot[data-area="'+area+'"][data-slot="'+(++used[area])+'"]').click();}await d.getByRole('button',{name:'Sign off inventory',exact:true}).click();
 }else throw Error('Unknown physical game: '+game);
 await d.getByRole('button',{name:'Back to the floor',exact:true}).waitFor();
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8791';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:900,height:1100},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');
 await page.addStyleTag({url:base+'/night-shift/tasks.css?v=machinery-1'});
 await page.addStyleTag({url:base+'/night-shift/task-machinery-c.css?v=machinery-1'});
 await page.evaluate(()=>window.physicalCompleted=0);
 page.setDefaultTimeout(5000);const d=page.locator('#taskDialog');let count=0;
 const open=game=>page.evaluate(async game=>{const {openTask}=await import('/night-shift/tasks.js?v=machinery-1');openTask({name:game,game},()=>window.physicalCompleted++);},game);
 const noFinish=async()=>assert.equal(await page.evaluate(()=>window.physicalCompleted),count,'An unfinished task must not complete');
 const done=async()=>{await d.getByRole('button',{name:'Back to the floor'}).click();assert.equal(await page.evaluate(()=>window.physicalCompleted),++count);};
 const drag=async(a,b)=>{await a.scrollIntoViewIfNeeded();await b.scrollIntoViewIfNeeded();await a.scrollIntoViewIfNeeded();const aa=await a.boundingBox(),bb=await b.boundingBox();await page.mouse.move(aa.x+aa.width/2,aa.y+aa.height/2);await page.mouse.down();await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2,{steps:15});await page.mouse.up();};
 const areas={0:'Laundry',1:'Laundry',2:'Medical',3:'Medical',4:'Kitchen',5:'Kitchen'};
 await open('sort');await d.getByRole('button',{name:'Secure storage',exact:true}).click();await noFinish();
 await drag(d.locator('[data-supply="0"]'),d.locator('.mc-bin-inside[data-area="Laundry"]'));assert.equal(await d.locator('.mc-stored').count(),0);
 for(const area of ['Laundry','Medical','Kitchen'])await d.getByRole('button',{name:'Open '+area+' lid',exact:true}).click();
 for(let id=0;id<6;id++)await drag(d.locator('[data-supply="'+id+'"]'),d.locator('.mc-bin-inside[data-area="'+areas[id]+'"]'));
 assert.equal(await d.locator('.mc-stored').count(),6);await d.getByRole('button',{name:'Secure storage',exact:true}).click();await noFinish();
 for(const area of ['Laundry','Medical','Kitchen'])await d.getByRole('button',{name:'Close '+area+' lid',exact:true}).click();
 await d.getByRole('button',{name:'Secure storage',exact:true}).click();await done();console.log('PASS physical sort: open lids, drag actual supplies, close lids, secure storage.');
 await open('tray');await d.getByRole('button',{name:'Serve tray',exact:true}).click();await noFinish();
 for(let round=0;round<2;round++){
  for(let i=0;i<3;i++){const slot=d.locator('[data-compartment="'+i+'"]'),food=(await slot.locator('small').textContent()).split(' · ')[1];if(round===0)await drag(d.locator('[data-food="'+food+'"]'),slot);else{await d.locator('[data-food="'+food+'"]').click();await slot.click();}}
  assert.equal(await d.locator('.mc-compartment.mc-filled').count(),3);
  if(round===0){await drag(d.getByRole('button',{name:'Serve tray',exact:true}),d.locator('.mc-serving-hatch'));await noFinish();assert.match(await d.locator('.mc-ticket').textContent(),/Meal 2 of 2/);}else await d.getByRole('button',{name:'Serve tray',exact:true}).click();
 }
 await done();console.log('PASS physical meals: compartment placement, slide serving hatch, two tickets and tap fallback.');
 await open('balance');await d.getByRole('button',{name:'Lock scale reading',exact:true}).click();await noFinish();
 await drag(d.getByRole('button',{name:'Add 5 kg',exact:true}),d.locator('.mc-weight-pan'));assert.equal(await d.locator('.mc-scale-display').getAttribute('data-total'),'0');
 await drag(d.getByRole('button',{name:'SEALED PARCEL',exact:true}),d.locator('.mc-parcel-pan'));
 await drag(d.getByRole('button',{name:'Add 2 kg',exact:true}),d.locator('.mc-weight-pan'));assert.equal(await d.locator('.mc-on-pan').count(),1);await drag(d.getByRole('button',{name:'Remove 2 kg weight',exact:true}),d.locator('.mc-weight-rack'));assert.equal(await d.locator('.mc-on-pan').count(),0);
 let target=Number(await d.locator('.mc-scale-display').getAttribute('data-target'));
 for(const weight of [10,5,2,1])while(target>=weight){await drag(d.getByRole('button',{name:'Add '+weight+' kg',exact:true}),d.locator('.mc-weight-pan'));target-=weight;}
 assert.equal(await d.locator('.mc-balanced').count(),1);await noFinish();await d.getByRole('button',{name:'Lock scale reading',exact:true}).click();await done();console.log('PASS physical balance: load parcel, drag weighted pieces, remove individual weights, lock exact balance.');
 await open('clean');const canvas=d.locator('.mc-clean-surface canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.05,box.y+box.height*.16);await page.mouse.down();await page.mouse.move(box.x+box.width*.95,box.y+box.height*.16,{steps:28});await page.mouse.up();const remaining=Number(await canvas.getAttribute('data-remaining'));assert(remaining>0&&remaining<108);await noFinish();await d.locator('.mc-clean-controls summary').click();
 for(let patch=1;patch<=12;patch++){const b=d.getByRole('button',{name:'Scrub stain '+patch,exact:true});while(await b.count()&&await b.isEnabled())await b.click();}
 await done();console.log('PASS physical cleaning: strokes erase visible dirt; complete with accessible tap controls.');
 await open('route');await d.getByRole('button',{name:'Square 35 exit',exact:true}).click();assert.equal(await d.locator('.mc-route-map').getAttribute('data-position'),'0');await noFinish();
 const route=[0,1,2,9,16,15,14,21,28,29,30,31,24,17,18,19,20,27,34];
 await d.locator('.mc-route-map').scrollIntoViewIfNeeded();const bounds=await d.locator('.mc-route-map').boundingBox();const center=n=>({x:bounds.x+bounds.width*(n%7+.5)/7,y:bounds.y+bounds.height*(Math.floor(n/7)+.5)/5});let pt=center(0);await page.mouse.move(pt.x,pt.y);await page.mouse.down();for(const n of route.slice(1)){pt=center(n);await page.mouse.move(pt.x,pt.y,{steps:8});}await page.mouse.up();await done();console.log('PASS physical route: continuous checkpoint trace, no jumping to exit.');
 await open('crates');await d.getByRole('button',{name:'Sign off inventory',exact:true}).click();await noFinish();
 const used={Laundry:0,Medical:0,Kitchen:0};
 for(let id=0;id<6;id++){const area=areas[id];await drag(d.locator('[data-supply="'+id+'"]'),d.locator('.mc-shelf-slot[data-area="'+area+'"][data-slot="'+(++used[area])+'"]'));}
 assert.equal(await d.locator('.mc-slot-filled').count(),6);await noFinish();await drag(d.locator('[data-supply="0"]'),d.locator('.mc-shelf-slot[data-area="Laundry"][data-slot="3"]'));assert.equal(await d.locator('.mc-shelf-slot[data-area="Laundry"][data-slot="3"] [data-supply="0"]').count(),1);
 await d.locator('[data-supply="0"]').click();await d.getByRole('button',{name:'Return selected supply to cart',exact:true}).click();assert.equal(await d.locator('.mc-stock-dock [data-supply="0"]').count(),1);await d.locator('[data-supply="0"]').click();await d.locator('.mc-shelf-slot[data-area="Laundry"][data-slot="1"]').click();await d.getByRole('button',{name:'Sign off inventory',exact:true}).click();await done();console.log('PASS physical shelves: choose positions, move existing stock, return/reposition and sign off.');
 await page.setViewportSize({width:390,height:844});for(const game of ['sort','tray','balance','clean','route','crates']){await open(game);assert(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Phone dialog should not overflow: '+game);await d.getByRole('button',{name:'Close task',exact:true}).click();}
 await open('crates');const source=d.locator('[data-supply="0"]'),destination=d.locator('.mc-shelf-slot[data-area="Laundry"][data-slot="1"]');await source.scrollIntoViewIfNeeded();const aa=await source.boundingBox(),bb=await destination.boundingBox(),session=await page.context().newCDPSession(page),from={x:aa.x+aa.width/2,y:aa.y+aa.height/2},to={x:bb.x+bb.width/2,y:bb.y+bb.height/2};await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let i=1;i<=12;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await destination.locator('[data-supply="0"]').count(),1);await d.getByRole('button',{name:'Close task',exact:true}).click();
 assert.deepEqual(errors,[]);console.log('PASS all six phone layouts, native touch shelf placement, and no browser errors.');
}finally{await browser.close();}

}
