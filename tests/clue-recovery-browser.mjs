import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {suspects,items,rooms,createGame,gameKey,validateGame,defaultConfig} from '../public/clue/rules.js';

const origin='http://127.0.0.1:8791';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(8000);
page.on('pageerror',error=>errors.push(error.message));
try{
 const response=await page.request.post(origin+'/api/rooms',{data:{kind:'clue',name:'Detective 1',choice:'red',config:defaultConfig()}});
 assert.equal(response.status(),201);const host=await response.json(),code=host.code,members=[host];
 for(let i=1;i<6;i++){
  const joined=await page.request.post(origin+'/api/rooms/'+code+'/join',{data:{name:'Detective '+(i+1),choice:suspects[i].id}});
  assert.equal(joined.status(),201);members.push(await joined.json());
 }
 const started=await page.request.post(origin+'/api/rooms/'+code+'/start',{headers:{Authorization:'Bearer '+host.token},data:{revision:6,id:crypto.randomUUID()}});
 assert.equal(started.status(),200);const initial=await started.json();
 const waiting=await(await page.request.get(origin+'/api/rooms/'+code+'/state',{headers:{Authorization:'Bearer '+members[5].token}})).json();
 const noteCard=waiting.state.deck.find(card=>!waiting.state.players[5].hand.includes(card));
 await page.goto(origin);await page.evaluate(async snapshot=>(await import('/online.js')).keepSeat(snapshot),host);
 await page.goto(origin+'/clue?room='+code);await page.getByRole('button',{name:'Roll the dice',exact:true}).waitFor();
 // A waiting detective saves a notebook entry after the roller's screen was rendered.
 // The real server rejects the old revision and supplies a refreshed snapshot.
 let injected=false;
 await page.route(origin+'/api/rooms/'+code+'/action',async route=>{
  if(injected){await route.continue();return;}injected=true;
  const changed=await page.request.post(origin+'/api/rooms/'+code+'/action',{headers:{Authorization:'Bearer '+members[5].token},data:{revision:initial.revision,id:crypto.randomUUID(),action:{type:'note',card:noteCard,value:'maybe'}}});
  assert.equal(changed.status(),200);await route.continue();
 });
 await page.getByRole('button',{name:'Roll the dice',exact:true}).click();
 await page.waitForFunction(revision=>Number(document.querySelector('.online-banner')?.dataset.revision)>revision,initial.revision);
 await page.waitForFunction(()=>document.getElementById('clueError').textContent.includes('The game changed.'));
 assert(await page.getByRole('button',{name:'Roll the dice',exact:true}).isEnabled());
 await page.getByRole('button',{name:'Roll the dice',exact:true}).click();
 await page.waitForFunction(()=>document.getElementById('clueTurnStatus').textContent.startsWith('Move up to '));assert.equal(await page.locator('#clueError').innerText(),'');
 const rolled=await(await page.request.get(origin+'/api/rooms/'+code+'/state',{headers:{Authorization:'Bearer '+host.token}})).json();
 await page.unroute(origin+'/api/rooms/'+code+'/action');let turnChanged=false;
 await page.route(origin+'/api/rooms/'+code+'/action',async route=>{
  if(!turnChanged){
   turnChanged=true;
   // A second tab for the same seat ends the turn while this move is in flight.
   const ended=await page.request.post(origin+'/api/rooms/'+code+'/action',{headers:{Authorization:'Bearer '+host.token},data:{revision:rolled.revision,id:crypto.randomUUID(),action:{type:'end'}}});
   assert.equal(ended.status(),200);
  }
  await route.continue();
 });
 await page.getByText('Choose a corridor square',{exact:true}).click();
 await page.getByRole('button',{name:'Move here',exact:true}).click();
 await page.waitForFunction(()=>document.getElementById('clueTurnName').textContent==='Detective 2');
 assert.match(await page.locator('#clueTurnStatus').innerText(),/Waiting for Detective 2/);
 assert.match(await page.locator('#clueError').innerText(),/The game changed/);
 assert.equal(await page.getByRole('button',{name:'Roll the dice',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Move here',exact:true}).count(),0);
 // Rumors can bring all six suspects and all seven weapons into one room.
 // Check the most crowded layout in every room at desktop and phone widths.
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const room of rooms){
   const game=createGame(suspects.map((suspect,i)=>({name:'Detective '+(i+1),suspect:suspect.id})));
   game.positions=Object.fromEntries(suspects.map(suspect=>[suspect.id,'room:'+room.id]));
   game.itemRooms=Object.fromEntries(items.map(item=>[item.id,room.id]));validateGame(game);
   await page.evaluate(({key,game})=>localStorage.setItem(key,JSON.stringify(game)),{key:gameKey,game});
   await page.goto(origin+'/clue');await page.locator('#readyDetective').click();
   const layout=await page.evaluate(id=>{
    const room=document.querySelector('[data-room="'+id+'"]'),bounds=room.getBoundingClientRect();
    const labels=[...room.querySelectorAll('.room-name,.room-passage')].map(el=>el.getBoundingClientRect());
    const pawns=[...document.querySelectorAll('.clue-pawn')].map(el=>el.getBoundingClientRect());
    const weapons=[...document.querySelectorAll('.room-equipment')].map(el=>el.getBoundingClientRect());
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const inside=r=>r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom;
    return {pawns:pawns.length,weapons:weapons.length,contained:[...pawns,...weapons].every(inside),covered:pawns.some(p=>[...labels,...weapons].some(other=>overlap(p,other))),pawnCollisions:pawns.some((p,i)=>pawns.slice(i+1).some(other=>overlap(p,other))),weaponCollisions:weapons.some((p,i)=>weapons.slice(i+1).some(other=>overlap(p,other)))};
   },room.id);
   assert.equal(layout.pawns,6);assert.equal(layout.weapons,7);assert(layout.contained,room.id+' at '+width+': pieces stay in the room');
   assert.equal(layout.covered,false,room.id+' at '+width+': titles, passages and weapons stay clear of pawns');assert.equal(layout.pawnCollisions,false,room.id+' at '+width+': pawns do not overlap');assert.equal(layout.weaponCollisions,false,room.id+' at '+width+': weapons do not overlap');
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: stale-revision conflicts display their message, permit a valid retry, and refresh turn controls. All six pawns and seven weapons fit in every room without covering titles or passages at desktop and phone sizes.');
}finally{await browser.close();}
