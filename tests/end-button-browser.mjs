import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createGame,suspects,defaultConfig,gameKey as clueKey} from '../public/clue/rules.js';
import {newGame,gameKey as monopolyKey} from '../public/economy.js';
import {storageKey} from '../public/players.js';

const origin='http://127.0.0.1:8791',folder='.runtime/end-game';fs.mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[];
async function pageFor(){const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);await page.evaluate(()=>localStorage.setItem('kennebc-sound-v1','off'));return {context,page};}
async function confirmEnd(page,button,accept){
 const dialog=page.waitForEvent('dialog');const click=button.click();const prompt=await dialog;
 assert.equal(prompt.type(),'confirm');assert.match(prompt.message(),/End this game/);assert.match(prompt.message(),/No winner/);
 if(accept)await prompt.accept();else await prompt.dismiss();await click;
}
async function roomState(page,code,seat){const response=await page.request.get(origin+'/api/rooms/'+code+'/state',{headers:{Authorization:'Bearer '+seat.token}});assert.equal(response.status(),200);return response.json();}
try{
 // Local Monoply: the button is usable inside a landing popup.
 const {context:localContext,page}=await pageFor();
 const roster=[{name:'Joe',pawn:'keys'},{name:'Bob',pawn:'badge'}],game=newGame(roster);
 game.phase='purchase';game.offer=1;game.players[0].position=1;game.players[0].cash=1440;game.properties[3].owner=0;
 await page.evaluate(({roster,game,key,rosterKey})=>{localStorage.setItem(rosterKey,JSON.stringify(roster));localStorage.setItem(key,JSON.stringify(game));},{roster,game,key:monopolyKey,rosterKey:storageKey});
 await page.goto(origin+'/board');await page.locator('#turnDialog[open]').waitFor();
 const raw=await page.evaluate(key=>localStorage.getItem(key),monopolyKey);
 await confirmEnd(page,page.locator('#turnDialog [data-end-game]'),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),monopolyKey),raw);
 await confirmEnd(page,page.locator('#turnDialog [data-end-game]'),true);await page.getByRole('heading',{name:'Game ended',exact:true}).first().waitFor();
 const ended=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),monopolyKey);assert.equal(ended.winner,null);assert.equal(ended.endedEarly,true);assert.equal(ended.players[0].cash,1440);assert.equal(ended.properties[3].owner,0);assert(await page.locator('#roll').isDisabled());
 await page.reload();assert.equal(await page.locator('#turnTitle').innerText(),'Game ended');assert(await page.locator('#roll').isDisabled());
 await page.screenshot({path:folder+'/monoply-local.png',fullPage:true});
 // A normal winner remains a winner; manual endings don't replace that outcome.
 const won=newGame(roster);won.phase='over';won.winner=1;won.turn=1;won.players[0].bankrupt=true;
 await page.evaluate(({key,game})=>localStorage.setItem(key,JSON.stringify(game)),{key:monopolyKey,game:won});await page.reload();assert.equal(await page.locator('#turnTitle').innerText(),'Bob wins!');
 // Local Clue: end during the privacy handoff and reveal the case without declaring a killer-finder.
 const clue=createGame(suspects.map((suspect,i)=>({name:'Detective '+(i+1),suspect:suspect.id})));
 await page.evaluate(({key,game})=>localStorage.setItem(key,JSON.stringify(game)),{key:clueKey,game:clue});await page.goto(origin+'/clue');await page.locator('#clueHandoff[open]').waitFor();
 const clueRaw=await page.evaluate(key=>localStorage.getItem(key),clueKey);
 await confirmEnd(page,page.locator('#clueHandoff [data-end-game]'),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),clueKey),clueRaw);
 await confirmEnd(page,page.locator('#clueHandoff [data-end-game]'),true);await page.locator('.case-solution [data-card]').last().waitFor();assert.equal(await page.locator('.case-solution [data-card]').count(),3);assert.equal(await page.locator('#clueTurnName').innerText(),'Game ended');assert.equal(await page.locator('#clueHandoff').evaluate(dialog=>dialog.open),false);
 await page.reload();assert.equal(await page.locator('#clueTurnName').innerText(),'Game ended');assert.equal(await page.locator('.case-solution [data-card]').count(),3);await page.screenshot({path:folder+'/clue-local.png',fullPage:true});
 await page.goto(origin);assert(await page.getByRole('link',{name:'View last case',exact:true}).isVisible());assert(await page.getByRole('link',{name:'View last game',exact:true}).isVisible());await localContext.close();
 for(const kind of ['clue','monoply']){
  const {context:hostContext,page:hostPage}=await pageFor(),{context:peerContext,page:peerPage}=await pageFor();
  const count=kind==='clue'?6:2;
  const created=await hostPage.request.post(origin+'/api/rooms',{data:{kind,name:'Detective 1',choice:kind==='clue'?'red':'keys',config:defaultConfig()}});assert.equal(created.status(),201);const host=await created.json(),seats=[host],code=host.code;
  for(let i=1;i<count;i++){const joined=await hostPage.request.post(origin+'/api/rooms/'+code+'/join',{data:{name:'Detective '+(i+1),choice:kind==='clue'?suspects[i].id:'badge'}});assert.equal(joined.status(),201);seats.push(await joined.json());}
  const started=await hostPage.request.post(origin+'/api/rooms/'+code+'/start',{headers:{Authorization:'Bearer '+host.token},data:{revision:count,id:crypto.randomUUID()}});assert.equal(started.status(),200);
  const peer=seats.at(-1);await hostPage.evaluate(async seat=>(await import('/online.js')).keepSeat(seat),host);await peerPage.evaluate(async seat=>(await import('/online.js')).keepSeat(seat),peer);
  const path=kind==='clue'?'/clue':'/board';await hostPage.goto(origin+path+'?room='+code);await peerPage.goto(origin+path+'?room='+code);await hostPage.locator('[data-end-game]').first().waitFor();assert.equal(await peerPage.locator('[data-end-game]:visible').count(),0);
  if(kind==='clue'){
   await hostPage.getByRole('button',{name:'End turn →',exact:true}).click();await hostPage.waitForFunction(()=>document.getElementById('clueTurnName').textContent==='Detective 2');
   await peerPage.locator('#viewHand').click();assert(await peerPage.locator('#cluePrivateDialog').evaluate(dialog=>dialog.open));
  }
  const before=await roomState(hostPage,code,host);
  const denied=await peerPage.request.post(origin+'/api/rooms/'+code+'/end',{headers:{Authorization:'Bearer '+peer.token},data:{revision:before.revision,id:crypto.randomUUID()}});assert.equal(denied.status(),403);
  await confirmEnd(hostPage,hostPage.locator('[data-end-game]').first(),false);assert.equal((await roomState(hostPage,code,host)).revision,before.revision);
  await confirmEnd(hostPage,hostPage.locator('[data-end-game]').first(),true);
  for(const participant of [hostPage,peerPage]){
   await participant.waitForFunction(kind=>document.getElementById(kind==='clue'?'clueTurnName':'turnTitle').textContent==='Game ended',kind);
   assert.equal(await participant.locator('[data-end-game]:visible').count(),0);assert(await participant.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(kind==='clue'){assert.equal(await participant.locator('.case-solution [data-card]').count(),3);assert.equal(await participant.locator('#cluePrivateDialog').evaluate(dialog=>dialog.open),false);}
   else assert(await participant.locator('#roll').isDisabled());
  }
  const final=await roomState(peerPage,code,peer);assert.equal(final.state.phase,'over');assert.equal(final.state.endedEarly,true);assert.equal(final.state.winner,null);
  if(kind==='clue'){assert.equal(final.state.solution.length,3);assert.deepEqual(final.state.players[0].hand,[]);}
  await peerPage.reload();await peerPage.waitForFunction(kind=>document.getElementById(kind==='clue'?'clueTurnName':'turnTitle').textContent==='Game ended',kind);
  await peerPage.screenshot({path:folder+'/'+kind+'-online.png',fullPage:true});await hostContext.close();await peerContext.close();
  console.log(kind+' passed: cancel, host authority, ending for everyone, and reconnect.');
 }
 assert.deepEqual(errors,[]);console.log('PASS: End game works in both local and room-code games, closes private handoffs, preserves the final save, reveals the Clue answer and keeps normal wins intact.');
}finally{await browser.close();}
