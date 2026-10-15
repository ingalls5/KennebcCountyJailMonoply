import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,decision,pawns,spaces,events,validateGame,validateRoster,standings,score} from '../public/life/rules.js';
import {GameRoom} from '../src/rooms.js';
const roster=n=>pawns.slice(0,n).map((p,i)=>({name:'Officer '+(i+1),pawn:p.id}));
test('The Academy and floor routes have different costs and pay without spending a turn',()=>{
 const start=createGame(roster(2));const academy=perform(start,{type:'choose',index:0});assert.equal(academy.players[0].cash,500);assert.equal(academy.players[0].rank,1);assert.equal(academy.players[0].reputation,6);assert.equal(academy.phase,'roll');assert.equal(academy.turns,0);assert.equal(start.players[0].academyDone,false);
 const floor=perform(start,{type:'choose',index:1});assert.equal(floor.players[0].cash,1300);assert.equal(floor.players[0].rank,0);assert.equal(floor.players[0].reputation,3);
 assert.equal(perform(academy,{type:'roll'},()=>0).players[0].cash,850);assert.equal(perform(floor,{type:'roll'},()=>0).players[0].cash,1500);
});
test('Passing a review with a large roll permits promotions and cannot bypass eligibility',()=>{
 let g=perform(createGame(roster(2)),{type:'choose',index:1});g.players[0].position=4;g=perform(g,{type:'roll'},()=>.999);assert.equal(g.players[0].position,10);assert.equal(g.pending.type,'promotion');const promoted=perform(g,{type:'choose',index:0});assert.equal(promoted.players[0].rank,1);assert.equal(promoted.players[0].reputation,2);
 g.players[0].reputation=0;assert.throws(()=>perform(g,{type:'choose',index:0}),/available/);g.players[0].rank=4;assert(decision(g).options[0].disabled);assert.equal(perform(g,{type:'choose',index:1}).players[0].rank,4);
});
test('Every event choice respects resource bounds, negative savings and exhaustion recovery',()=>{
 assert.equal(events.length,24);assert.equal(new Set(events.map(e=>e.id)).size,events.length);assert.equal(spaces.length,36);
 for(const event of events)for(let index=0;index<event.options.length;index++){
  const g=createGame(roster(2));Object.assign(g.players[0],{cash:0,reputation:9,energy:1,academyDone:true});g.pending={type:'event',id:event.id};const next=perform(g,{type:'choose',index}),p=next.players[0];assert(p.reputation>=0&&p.reputation<=10);assert(p.energy>=1&&p.energy<=10);assert.equal(next.phase,'end');validateGame(next);
  const effect=event.options[index];assert.equal(p.cash,effect.cash-(1+effect.energy<=0?200:0));
 }
 const exhausted=createGame(roster(2));exhausted.pending={type:'shift'};exhausted.players[0].energy=1;const result=perform(exhausted,{type:'choose',index:0});assert.equal(result.players[0].energy,3);assert.equal(result.players[0].cash,1350);assert.match(result.log.at(-1),/recovery/);
});
test('Full careers for 2–6 players finish, skip retirees, preserve saves, and share exact ties',()=>{
 for(let n=2;n<=6;n++)for(let seed=1;seed<=8;seed++){
  let state=seed,random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32),g=createGame(roster(n),random),steps=0;
  while(g.phase!=='over'){
   assert(++steps<800);if(g.phase!=='end')assert(!g.players[g.turn].retired);
   const action=g.phase==='roll'?{type:'roll'}:g.phase==='end'?{type:'end'}:{type:'choose',index:decision(g).options.findIndex(o=>!o.disabled)};
   const before=JSON.stringify(g);const next=perform(g,action,random);assert.equal(JSON.stringify(g),before);g=validateGame(JSON.parse(JSON.stringify(next)));
  }
  assert(g.players.every(p=>p.position===35&&p.retired));assert(standings(g)[0].score>=standings(g).at(-1).score);assert.throws(()=>perform(g,{type:'roll'}),/finished/);
 }
 const tied=createGame(roster(2));assert.equal(score(tied.players[0]),score(tied.players[1]));assert.equal(standings(tied).filter(p=>p.score===standings(tied)[0].score).length,2);
});
test('Turn phases, unique player names and pawns, and corrupt saves are enforced',()=>{
 const g=createGame(roster(2));assert.throws(()=>perform(g,{type:'roll'}),/Finish/);assert.throws(()=>perform(g,{type:'end'}),/Resolve/);assert.throws(()=>perform(g,{type:'choose',index:'0'}),/available/);assert.throws(()=>validateRoster([...roster(2),roster(2)[0]]));assert.throws(()=>validateRoster(roster(1)));assert.throws(()=>validateGame({...g,turn:8}));assert.throws(()=>validateGame({...g,deck:[]}));assert.throws(()=>validateGame({...g,pending:{type:'event',id:'forged'}}));
});
const memory=()=>{const data=new Map();return {storage:{async get(k){return structuredClone(data.get(k));},async put(k,v){data.set(k,structuredClone(v));},async setAlarm(){},async deleteAlarm(){},async deleteAll(){data.clear();}},blockConcurrencyWhile:async fn=>fn()};};
const call=(room,path,payload,token)=>room.fetch(new Request('https://room'+path,{method:payload?'POST':'GET',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined}));
test('Six-device career authority: own turns, hidden deck, server die, duplicate and stale actions, reconnect and deletion',async()=>{
 const ctx=memory();let room=new GameRoom(ctx,{});await Promise.resolve();const host=await(await call(room,'/init',{kind:'life',code:'ABC234',name:'Officer 1',choice:pawns[0].id})).json(),seats=[host];for(let i=1;i<6;i++)seats.push(await(await call(room,'/join',{name:'Officer '+(i+1),choice:pawns[i].id})).json());
 let snap=await(await call(room,'/start',{revision:6,id:crypto.randomUUID()},host.token)).json();assert.equal(snap.state.deck,undefined);assert.equal(snap.state.phase,'choice');const act=action=>({revision:snap.revision,id:crypto.randomUUID(),action});
 assert.equal((await call(room,'/action',act({type:'choose',index:0}),seats[1].token)).status,403);const first=act({type:'choose',index:0});snap=await(await call(room,'/action',first,host.token)).json();assert.equal(snap.state.players[0].rank,1);const duplicate=await(await call(room,'/action',first,host.token)).json();assert.equal(duplicate.revision,snap.revision);assert.equal(duplicate.state.players[0].cash,500);
 assert.equal((await call(room,'/action',{revision:6,id:crypto.randomUUID(),action:{type:'roll'}},host.token)).status,409);
 snap=await(await call(room,'/action',act({type:'roll',dice:99,cash:999999}),host.token)).json();assert(snap.state.dice>=1&&snap.state.dice<=6);assert.equal(snap.state.players[0].cash,850);assert.equal(snap.state.deck,undefined);
 let actions=0;while(snap.state.phase!=='over'){
  const g=snap.state,action=g.phase==='roll'?{type:'roll'}:g.phase==='end'?{type:'end'}:{type:'choose',index:decision(g).options.findIndex(o=>!o.disabled)};
  const response=await call(room,'/action',act(action),seats[g.turn].token);assert.equal(response.status,200);snap=await response.json();assert(++actions<700);
  if(actions===25){room=new GameRoom(ctx,{});await Promise.resolve();snap=await(await call(room,'/state',null,host.token)).json();assert.equal(snap.state.deck,undefined);}
 }
 assert(snap.state.players.every(p=>p.retired));assert.equal((await call(room,'/end',{revision:snap.revision,id:crypto.randomUUID()},seats[1].token)).status,403);assert.equal((await call(room,'/end',{revision:snap.revision,id:crypto.randomUUID()},host.token)).status,200);assert.equal(await ctx.storage.get('room'),undefined);assert.equal((await call(room,'/state',null,host.token)).status,404);
});
