import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {newGame,gameKey} from '../public/economy.js';
import {storageKey} from '../public/players.js';
const roster=[{name:'Alice',pawn:'energy-drink'},{name:'Bob',pawn:'badge'}];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8791/');
 async function seed(game){await page.evaluate(({roster,game,gameKey,storageKey})=>{localStorage.setItem(storageKey,JSON.stringify(roster));localStorage.setItem(gameKey,JSON.stringify(game));},{roster,game,gameKey,storageKey});await page.goto('http://127.0.0.1:8791/board');await page.locator('.space').last().waitFor();}
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:1100});let game=newGame(roster);game.properties[1].owner=0;game.properties[3].owner=1;await seed(game);
  await page.locator('[data-index="1"]').click();await page.locator('#spaceDetails summary').click();await page.locator('#spaceDetails details select').nth(1).selectOption('3');await page.locator('#spaceDetails details input').fill('100');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Confirm trade',exact:true}).click();
  await page.locator('#transferStage').waitFor();assert.equal(await page.locator('.transfer-row').count(),2);assert.equal(await page.locator('.money-packet').innerText(),'$100');assert.equal(await page.locator('.deed-packet').count(),2);
  const moneyRow=page.locator('.transfer-row').filter({has:page.locator('.money-packet')});assert.equal(await moneyRow.locator('.transfer-person').first().getAttribute('data-player'),'1');assert.equal(await moneyRow.locator('.transfer-person').last().getAttribute('data-player'),'0');assert.match(await moneyRow.innerText(),/Bob/);assert.match(await moneyRow.innerText(),/Alice/);
  const before=await page.locator('.money-packet').evaluate(e=>getComputedStyle(e).transform);await page.waitForFunction(old=>getComputedStyle(document.querySelector('.money-packet')).transform!==old,before);
  await page.waitForFunction(()=>document.querySelector('.money-packet').getAnimations()[0].currentTime>600);assert(await page.locator('#transferStage').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));await page.screenshot({path:'.runtime/trade-animation-'+width+'.png'});
  await page.locator('#transferStage').waitFor({state:'detached'});assert.match(await page.locator('#spaceDetails').innerText(),/Owned by Bob/);assert.match(await page.locator('#playerRoster').innerText(),/1,600/);assert.match(await page.locator('#playerRoster').innerText(),/1,400/);await page.reload();assert.equal(await page.locator('#transferStage').count(),0,'Saved transfers must not replay on reload');
 }
 let game=newGame(roster);game.phase='purchase';game.offer=1;game.players[0].position=1;await seed(game);await page.getByRole('button',{name:'Buy · $60',exact:true}).click();await page.locator('#transferStage').waitFor();assert(await page.locator('#turnDialog').evaluate(d=>d.open));assert(await page.locator('#transferStage').evaluate(s=>s.matches(':popover-open')));assert(await page.getByRole('button',{name:'End turn',exact:false}).isDisabled());await page.screenshot({path:'.runtime/purchase-animation-mobile.png'});await page.locator('#transferStage').waitFor({state:'detached'});await page.getByRole('button',{name:'End turn',exact:false}).click();assert.equal(await page.locator('#turnDialog').evaluate(d=>d.open),false);
 await page.emulateMedia({reducedMotion:'reduce'});game=newGame(roster);game.phase='purchase';game.offer=1;await seed(game);await page.getByRole('button',{name:'Buy · $60',exact:true}).click();assert.equal(await page.locator('#transferStage').count(),0);assert.match(await page.locator('#playerRoster').innerText(),/1,440/);assert.deepEqual(errors,[]);
 console.log('Transfers passed: animated cash and bidirectional deeds, desktop/phone fit, popup layering, action locking, persistence, and reduced motion.');
}finally{await browser.close();}
