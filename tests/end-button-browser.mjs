import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createGame,suspects,defaultConfig,gameKey as clueKey,rosterKey,configKey} from '../public/clue/rules.js';
import {newGame,gameKey as monopolyKey} from '../public/economy.js';
import {storageKey} from '../public/players.js';
const origin='http://127.0.0.1:8791';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],roster=[{name:'Joe',pawn:'keys'},{name:'Bob',pawn:'badge'}];
const clueRoster=suspects.map((suspect,i)=>({name:'Detective '+(i+1),suspect:suspect.id}));
async function pageFor(){const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);await page.evaluate(()=>localStorage.setItem('kennebc-sound-v1','off'));return {context,page};}
async function keep(page,seat){await page.evaluate(async seat=>(await import('/online.js')).keepSeat(seat),seat);}
async function confirmEnd(page,button,accept){const dialog=page.waitForEvent('dialog'),click=button.click(),prompt=await dialog;assert.equal(prompt.type(),'confirm');assert.match(prompt.message(),/End this game/);assert.match(prompt.message(),/delete/i);if(accept)await prompt.accept();else await prompt.dismiss();await click;}
async function roomState(page,code,seat){const response=await page.request.get(origin+'/api/rooms/'+code+'/state',{headers:{Authorization:'Bearer '+seat.token}});assert.equal(response.status(),200);return response.json();}
async function home(page){await page.waitForURL(origin+'/');await page.getByRole('heading',{name:'What are we playing tonight?'}).waitFor();}
async function saveLocal(page){
 const monopoly=newGame(roster),clue=createGame(clueRoster);
 await page.evaluate(({monopoly,clue,roster,clueRoster,keys})=>{localStorage.setItem(keys.monopoly,JSON.stringify(monopoly));localStorage.setItem(keys.players,JSON.stringify(roster));localStorage.setItem(keys.clue,JSON.stringify(clue));localStorage.setItem(keys.roster,JSON.stringify(clueRoster));localStorage.setItem(keys.config,JSON.stringify(clue.config));},{monopoly,clue,roster,clueRoster,keys:{monopoly:monopolyKey,players:storageKey,clue:clueKey,roster:rosterKey,config:configKey}});
 return {monopoly,clue};
}
try{
 const {context,page}=await pageFor();const initial=await saveLocal(page);
 initial.monopoly.phase='purchase';initial.monopoly.offer=1;initial.monopoly.players[0].position=1;initial.monopoly.properties[3].owner=0;
 await page.evaluate(({key,game})=>localStorage.setItem(key,JSON.stringify(game)),{key:monopolyKey,game:initial.monopoly});await page.goto(origin+'/board');await page.locator('#turnDialog[open]').waitFor();
 const sibling=await context.newPage();await sibling.goto(origin+'/board');const otherGame=await context.newPage();await otherGame.goto(origin+'/clue');await otherGame.locator('#clueHandoff[open]').waitFor();
 const raw=await page.evaluate(key=>localStorage.getItem(key),monopolyKey);
 await confirmEnd(page,page.locator('#turnDialog [data-end-game]'),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),monopolyKey),raw);
 await confirmEnd(page,page.locator('#turnDialog [data-end-game]'),true);await home(page);await home(sibling);
 for(const key of [monopolyKey,storageKey])assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
 assert.equal(await page.locator('#savedGame').isVisible(),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),clueKey),JSON.stringify(initial.clue));assert.match(otherGame.url(),/\/clue$/);
 await sibling.close();await otherGame.close();await page.reload();assert.equal(await page.locator('#savedGame').isVisible(),false);
 const won=newGame(roster);won.phase='over';won.winner=1;won.turn=1;won.players[0].bankrupt=true;
 await page.evaluate(({key,rosterKey,roster,game})=>{localStorage.setItem(rosterKey,JSON.stringify(roster));localStorage.setItem(key,JSON.stringify(game));},{key:monopolyKey,rosterKey:storageKey,roster,game:won});await page.goto(origin+'/board');assert.equal(await page.locator('#turnTitle').innerText(),'Bob wins!');
 await page.goto(origin+'/clue');await page.locator('#clueHandoff[open]').waitFor();const clueRaw=await page.evaluate(key=>localStorage.getItem(key),clueKey);
 await confirmEnd(page,page.locator('#clueHandoff [data-end-game]'),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),clueKey),clueRaw);
 await confirmEnd(page,page.locator('#clueHandoff [data-end-game]'),true);await home(page);
 for(const key of [clueKey,rosterKey,configKey])assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
 assert.equal(await page.locator('#savedClue').isVisible(),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),monopolyKey),JSON.stringify(won));assert.equal(await page.evaluate(()=>localStorage.getItem('kennebc-sound-v1')),'off');
 await page.goto(origin+'/clue-setup?mode=local');assert.deepEqual(await page.locator('#cluePlayerRows input').evaluateAll(inputs=>inputs.map(input=>input.value)),['','','']);
 await page.goto(origin+'/board');assert.equal(await page.locator('#turnTitle').innerText(),'Bob wins!');
 await confirmEnd(page,page.locator('#turnDialog [data-end-game]'),true);await home(page);assert.equal(await page.evaluate(key=>localStorage.getItem(key),monopolyKey),null);await context.close();
 console.log('Local games passed: cancel, clear progress and player setup, redirect other tabs, preserve the other game, and fresh setup.');
 for(const kind of ['clue','monoply']){
  const hostBrowser=await pageFor(),peerBrowser=await pageFor(),offlineBrowser=await pageFor();const hostPage=hostBrowser.page,peerPage=peerBrowser.page,offlinePage=offlineBrowser.page,count=kind==='clue'?6:2;
  const created=await hostPage.request.post(origin+'/api/rooms',{data:{kind,name:'Detective 1',choice:kind==='clue'?'red':'keys',config:defaultConfig()}});assert.equal(created.status(),201);const host=await created.json(),seats=[host],code=host.code;
  for(let i=1;i<count;i++){const joined=await hostPage.request.post(origin+'/api/rooms/'+code+'/join',{data:{name:'Detective '+(i+1),choice:kind==='clue'?suspects[i].id:'badge'}});assert.equal(joined.status(),201);seats.push(await joined.json());}
  const started=await hostPage.request.post(origin+'/api/rooms/'+code+'/start',{headers:{Authorization:'Bearer '+host.token},data:{revision:count,id:crypto.randomUUID()}});assert.equal(started.status(),200);
  const peer=seats.at(-1),otherKind=kind==='clue'?'monoply':'clue';const otherResponse=await hostPage.request.post(origin+'/api/rooms',{data:{kind:otherKind,name:'Other room',choice:otherKind==='clue'?'red':'keys',config:defaultConfig()}});assert.equal(otherResponse.status(),201);const otherSeat=await otherResponse.json();
  for(const p of [hostPage,peerPage,offlinePage]){await saveLocal(p);await keep(p,otherSeat);}await keep(hostPage,host);await keep(peerPage,peer);await keep(offlinePage,peer);
  const path=kind==='clue'?'/clue':'/board';await hostPage.goto(origin+path+'?room='+code);await peerPage.goto(origin+path+'?room='+code);await hostPage.locator('[data-end-game]').first().waitFor();assert.equal(await peerPage.locator('[data-end-game]:visible').count(),0);
  if(kind==='clue'){await hostPage.getByRole('button',{name:'End turn →',exact:true}).click();await hostPage.waitForFunction(()=>document.getElementById('clueTurnName').textContent==='Detective 2');await peerPage.locator('#viewHand').click();}
  const before=await roomState(hostPage,code,host);const denied=await peerPage.request.post(origin+'/api/rooms/'+code+'/end',{headers:{Authorization:'Bearer '+peer.token},data:{revision:before.revision,id:crypto.randomUUID()}});assert.equal(denied.status(),403);
  await confirmEnd(hostPage,hostPage.locator('[data-end-game]').first(),false);assert.equal((await roomState(hostPage,code,host)).revision,before.revision);
  // Delete on the server, then lose the first response. A retry still completes cleanup.
  if(kind==='monoply')await hostPage.route(origin+'/api/rooms/'+code+'/end',async route=>{const response=await route.fetch();if(response.status()===200)await route.abort('connectionfailed');else await route.fulfill({response});});
  await confirmEnd(hostPage,hostPage.locator('[data-end-game]').first(),true);await home(hostPage);await home(peerPage);
  for(const p of [hostPage,peerPage]){assert.equal(await p.evaluate(async kind=>(await import('/online.js')).readSeat(kind),kind),null);assert.equal((await p.evaluate(async kind=>(await import('/online.js')).readSeat(kind),otherKind)).code,otherSeat.code);assert(await p.evaluate(key=>localStorage.getItem(key)!==null,kind==='clue'?clueKey:monopolyKey));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  for(const seat of [host,peer])assert.equal((await hostPage.request.get(origin+'/api/rooms/'+code+'/state',{headers:{Authorization:'Bearer '+seat.token}})).status(),404);assert.equal((await hostPage.request.get(origin+'/api/rooms/'+code)).status(),404);
  await offlinePage.goto(origin+path+'?room='+code);await home(offlinePage);assert.equal(await offlinePage.evaluate(async kind=>(await import('/online.js')).readSeat(kind),kind),null);
  await keep(offlinePage,peer);await offlinePage.goto(origin+(kind==='clue'?'/clue-setup':'/setup')+'?room='+code);await home(offlinePage);
  await keep(offlinePage,peer);await offlinePage.reload();await offlinePage.waitForFunction(kind=>localStorage.getItem('kennebec-last-room-'+kind)===null,kind);assert.equal(await offlinePage.getByRole('link',{name:'Return to room '+code+' →',exact:true}).count(),0);
  await hostBrowser.context.close();await peerBrowser.context.close();await offlineBrowser.context.close();console.log(kind+' passed: host authority, room deletion, everyone returns home, offline cleanup, unrelated saves and seats preserved.');
 }
 assert.deepEqual(errors,[]);console.log('PASS: confirmed End game deletes the ended session and player setup, closes its room, removes resume links and handles an interrupted end response.');
}finally{await browser.close();}
