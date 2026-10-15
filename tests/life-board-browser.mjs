import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const origin='http://127.0.0.1:8791',folder='.runtime/life';fs.mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1400}}),errors=[],api=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))api.push(r.url());});
 await page.addInitScript(()=>{Math.random=()=>.999;});await page.goto(origin+'/life-preview');await page.locator('.life-board-art').waitFor();assert.deepEqual(await page.locator('.spinner-number').allTextContents(),Array.from({length:10},(_,i)=>String(i+1)));
 await page.evaluate(()=>{localStorage.setItem('kennebec-life-v1','keep-career');localStorage.setItem('kennebc-economy-v1','keep-monoply');localStorage.setItem('kennebec-clue-v1','keep-clue');});
 await page.reload();await page.locator('#boardSpin').click();await page.waitForFunction(()=>document.querySelector('#careerSpinnerNeedle').getAnimations().length>0);assert(await page.locator('#boardSpin').isDisabled());await page.waitForFunction(()=>/Spinner: (?:10|[1-9])/.test(document.getElementById('previewSpinResult').textContent));assert.equal(await page.evaluate(()=>localStorage.getItem('kennebec-life-v1')),'keep-career');assert.equal(await page.evaluate(()=>localStorage.getItem('kennebc-economy-v1')),'keep-monoply');assert.equal(await page.evaluate(()=>localStorage.getItem('kennebec-clue-v1')),'keep-clue');assert.deepEqual(api,[]);
 const geometry=await page.evaluate(async()=>{
  const {createBoard}=await import('/life/board.js');
  const root=document.getElementById('careerBoard'),board=createBoard(document.getElementById('careerTiles'));
  const tokens=Array.from({length:6},()=>{const token=document.createElement('img');token.className='career-token';token.src='/pawns/badge.svg';root.append(token);return token;});
  for(let position=0;position<100;position++){
   tokens.forEach((token,i)=>{const p=board.coordinates(position,i);token.style.left=p.left+'%';token.style.top=p.top+'%';});
   const bounds=root.getBoundingClientRect(),rects=tokens.map(t=>t.getBoundingClientRect());
   for(const r of rects)if(r.left<bounds.left||r.right>bounds.right||r.top<bounds.top||r.bottom>bounds.bottom)throw Error('Pawn leaves the board at stop '+position);
   for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=rects[i],b=rects[j];if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)throw Error('Pawns overlap at stop '+position);}
  }
  tokens.forEach(t=>t.remove());return {positions:100,tiles:board.svg.querySelectorAll('.career-tile').length};
 });assert.equal(geometry.positions,100);assert.equal(geometry.tiles,100);
 // Capture the board without a game, including phone fit and standalone art.
 await page.reload();await page.locator('.life-board-art').waitFor();await page.locator('#careerBoard').screenshot({path:folder+'/winding-board.png'});await page.screenshot({path:folder+'/winding-preview.png',fullPage:true});
 for(const size of [{width:820,height:1180},{width:390,height:844},{width:320,height:740}]){await page.setViewportSize(size);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#careerBoard').evaluate(e=>e.scrollWidth===e.clientWidth));await page.screenshot({path:folder+'/winding-preview-'+size.width+'.png',fullPage:true});}
 await page.setViewportSize({width:1440,height:1100});
 const legacy=await page.evaluate(async()=>{const {createGame}=await import('/life/rules.js');const game=createGame([{name:'Joe',pawn:'badge'},{name:'Jacob',pawn:'keys'}]);delete game.boardSize;Object.assign(game.players[0],{position:17,cash:2400,rank:2,academyDone:true});game.pending={type:'event',id:'holiday'};game.route=[16,17];const raw=JSON.stringify(game);localStorage.setItem('kennebec-life-v1',raw);return raw;});
 await page.goto(origin+'/life');await page.locator('#careerDecision[open]').waitFor();assert.match(await page.locator('#turnRank').innerText(),/Stop 49 of 100/);assert.equal(await page.evaluate(()=>localStorage.getItem('kennebec-life-v1')),legacy);await page.locator('.decision-choice').nth(1).click();const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('kennebec-life-v1')));assert.equal(migrated.boardSize,100);assert.equal(migrated.players[0].position,48);assert.equal(migrated.players[0].cash,2400);assert.equal(migrated.players[0].rank,2);
 await page.goto(origin+'/life-setup?mode=local');await page.locator('#lifePlayerRows input').nth(0).fill('Joe');await page.locator('#lifePlayerRows input').nth(1).fill('Jacob');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Begin your careers'}).click();await page.getByRole('button',{name:'Go to the Academy'}).click();
 const before=await page.locator('.career-token').first().evaluate(e=>({left:e.style.left,top:e.style.top}));await page.locator('#boardSpin').click();await page.waitForFunction(()=>document.querySelector('#careerSpinnerNeedle').getAnimations().length>0);assert(await page.locator('#boardSpin').isDisabled());assert(await page.locator('#careerDecision').isHidden());
 const during=await page.locator('.career-token').first().evaluate(e=>({left:getComputedStyle(e).left,top:getComputedStyle(e).top}));assert(during.left&&during.top);await page.locator('#careerDecision[open]').waitFor();assert.equal(await page.locator('#careerTokens').evaluate(e=>e.getAnimations({subtree:true}).length),0);const after=await page.locator('.career-token').first().evaluate(e=>({left:e.style.left,top:e.style.top}));assert.notDeepEqual(after,before);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kennebec-life-v1')).players[0].position),10);const number=await page.locator('#careerDie').innerText();assert.equal(number,'10');const finalAngle=await page.locator('#careerSpinnerNeedle').evaluate(e=>Number(e.style.transform.match(/rotate\(([^d]+)deg\)/)[1])%360);assert.equal(finalAngle,(Number(number)-1)*36);
 assert.deepEqual(errors,[]);console.log('Winding board passed: preview save isolation and no API calls, spinner animation and result, 100 crowded stops, smooth pawn movement after spinning, and 320–1600px layouts.');
}finally{await browser.close();}
