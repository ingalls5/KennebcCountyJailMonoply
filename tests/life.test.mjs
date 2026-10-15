import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,decision,pawns,validateGame,validateRoster,standings,score,salary,lifeTiles,tileBonus,events,entryTracks,crisisSpaces,crisisFork,crisisRejoin,lastSpace,ruleSet} from '../public/life/rules.js';
import {GameRoom,project} from '../src/rooms.js';
const roster=n=>pawns.slice(0,n).map((p,i)=>({name:'Officer '+(i+1),pawn:p.id}));
const ready=()=>{const g=perform(createGame(roster(2)),{type:'choose',index:1});g.players[0].entryPosition=null;return g;};
test('New careers use money, salary, and LIFE tiles without the old meters',()=>{
 const g=createGame(roster(2));assert.equal(g.ruleSet,ruleSet);for(const p of g.players){assert(!('reputation'in p));assert(!('energy'in p));assert.equal(p.cash,1000);assert.equal(salary(p),200);assert.deepEqual(p.lifeTiles,[]);}
 const academy=perform(g,{type:'choose',index:0});assert.equal(academy.players[0].cash,500);assert.equal(academy.players[0].rank,0);assert.equal(perform(academy,{type:'roll'},()=>0).players[0].cash,500);
 const jail=perform(g,{type:'choose',index:1});assert.equal(jail.players[0].cash,1300);assert.equal(jail.players[0].entryPosition,0);
});
test('Pay Days pay on passing or landing, not on every spin',()=>{
 const g=ready();assert.equal(perform(g,{type:'roll'},()=>0).players[0].cash,1300);
 const landed=perform(g,{type:'roll'},()=>.45);assert.equal(landed.players[0].position,5);assert.equal(landed.players[0].cash,1500);assert.equal(landed.phase,'end');
 const passed=perform(g,{type:'roll'},()=>.75);assert.equal(passed.players[0].cash,1500);assert.equal(passed.players[0].position,8);
 g.players[0].rank=3;assert.equal(perform(g,{type:'roll'},()=>.45).players[0].cash,1950);
});
test('LIFE tiles award once, conserve the bank, and add cash to final scoring',()=>{
 const g=ready();g.phase='choice';g.pending={type:'life'};const before=JSON.stringify(g),next=perform(g,{type:'choose',index:0});assert.equal(JSON.stringify(g),before);assert.equal(next.players[0].lifeTiles.length,1);assert.equal(next.tileCursor,1);assert.equal(next.players[0].cash,1300);assert.equal(score(next.players[0]),1300+tileBonus(next.players[0]));assert.throws(()=>perform(next,{type:'choose',index:0}),/no decision/);validateGame(next);
 const broken=structuredClone(next);broken.players[1].lifeTiles.push(broken.players[0].lifeTiles[0]);assert.throws(()=>validateGame(broken));
});
test('An empty LIFE bank takes a retired player’s tile and otherwise grants none',()=>{
 const g=ready();g.tileCursor=lifeTiles.length;g.players[1].lifeTiles=[...g.tileDeck];Object.assign(g.players[1],{retired:true,position:lastSpace,academyDone:true});g.phase='choice';g.pending={type:'life'};
 const next=perform(g,{type:'choose',index:0});assert.equal(next.players[0].lifeTiles.length,1);assert.equal(next.players[1].lifeTiles.length,59);assert.equal(next.tileCursor,60);validateGame(next);
 g.players[1].retired=false;g.players[1].position=20;assert.equal(perform(g,{type:'choose',index:0}).players[0].lifeTiles.length,0);
});
test('Graduation awards Officer rank and a LIFE tile, and career training uses money',()=>{
 const g=perform(createGame(roster(2)),{type:'choose',index:0});g.players[0].entryPosition=entryTracks.academy.length-2;const landed=perform(g,{type:'roll'},()=>.99);const joined=perform(landed,{type:'choose',index:0});assert.equal(joined.players[0].rank,1);assert.equal(joined.players[0].entryPosition,null);assert.equal(joined.players[0].lifeTiles.length,1);assert.equal(salary(joined.players[0]),350);
 const review=ready();review.phase='choice';review.pending={type:'promotion'};const promoted=perform(review,{type:'choose',index:0});assert.equal(promoted.players[0].cash,1000);assert.equal(promoted.players[0].rank,1);assert.equal(perform(review,{type:'choose',index:1}).players[0].lifeTiles.length,1);
 review.players[0].rank=4;assert(decision(review).options[0].disabled);
});
test('Life events support marriage, children, houses, and retirement assets',()=>{
 let g=ready();g.phase='choice';g.pending={type:'event',id:'wedding'};g=perform(g,{type:'choose',index:1});assert(g.players[0].married);assert.equal(g.players[0].lifeTiles.length,1);
 g.phase='choice';g.pending={type:'event',id:'baby'};g=perform(g,{type:'choose',index:1});assert.equal(g.players[0].children,1);
 g.phase='choice';g.pending={type:'event',id:'house'};g=perform(g,{type:'choose',index:0});assert.equal(g.players[0].home.value,900);assert.equal(score(g.players[0]),g.players[0].cash+tileBonus(g.players[0])+1000);validateGame(g);
});
test('Mid-Life Crisis remains a choice, pays at C5, and rejoins at Stop 67',()=>{
 const g=ready();g.players[0].position=54;const fork=perform(g,{type:'roll'},()=>0);assert.equal(fork.pending.type,'crisis-fork');const skipped=perform(fork,{type:'choose',index:0});assert.equal(skipped.players[0].position,56);assert.equal(skipped.players[0].lifeTiles.length,0);
 let taken=perform(fork,{type:'choose',index:1});assert.equal(taken.pending.type,'crisis');taken=perform(taken,{type:'choose',index:0});assert.equal(taken.players[0].lifeTiles.length,2);
 taken.phase='roll';taken=perform(taken,{type:'roll'},()=>.99);assert.equal(taken.players[0].crisisPosition,crisisSpaces.length-1);assert.equal(taken.players[0].cash,1300-900+200);taken=perform(taken,{type:'choose',index:1});assert.equal(taken.players[0].position,crisisRejoin);assert.equal(taken.players[0].crisisPosition,null);assert(taken.players[0].crisisDone);validateGame(taken);
});
test('Old saves migrate without losing money, positions, decisions, or event order',()=>{
 const old=ready();delete old.ruleSet;delete old.tileDeck;delete old.tileCursor;old.deck=old.deck.filter(id=>events.slice(0,24).some(e=>e.id===id));old.cursor=3;old.pending={type:'event',id:'coffee'};old.phase='choice';old.players[0].position=32;old.players[0].cash=2450;old.players.forEach(p=>{p.reputation=7;p.energy=5;delete p.lifeTiles;delete p.married;delete p.children;delete p.home;});const raw=JSON.stringify(old),next=validateGame(old);assert.equal(JSON.stringify(old),raw);assert.equal(next.players[0].cash,2450);assert.equal(next.players[0].position,32);assert.equal(next.cursor,3);assert.deepEqual(next.deck.slice(0,24),old.deck);assert.equal(next.deck.length,28);assert.deepEqual(next.pending,old.pending);assert(!('energy'in next.players[0]));assert(!('reputation'in next.players[0]));assert.deepEqual(next.players[0].lifeTiles,[]);assert.deepEqual(validateGame(next),next);
 const tiny=structuredClone(old);delete tiny.boardSize;tiny.players[0].position=17;assert.equal(validateGame(tiny).players[0].position,48);
});
test('Online LIFE projections keep every bonus and the bank order hidden until the game ends',()=>{
 const g=ready();g.phase='choice';g.pending={type:'life'};const collected=perform(g,{type:'choose',index:0});const member={id:'host',name:'Joe',choice:'badge'},room={kind:'life',members:[member],host:'host',code:'ABC234',revision:1,state:collected};const hidden=project(room,member);assert.equal(hidden.state.players[0].lifeTileCount,1);assert.equal(hidden.state.players[0].lifeTiles,undefined);assert.equal(hidden.state.tileDeck,undefined);assert.equal(hidden.state.tileCursor,undefined);assert.equal(hidden.state.deck,undefined);assert(collected.players[0].lifeTiles.length);
 collected.phase='over';collected.players.forEach(p=>{p.retired=true;p.position=lastSpace;});const revealed=project(room,member);assert.deepEqual(revealed.state.players[0].lifeTiles,collected.players[0].lifeTiles);assert.equal(standings(revealed.state)[0].score,score(collected.players[0]));
});
// Available for a requested full-game check; this test is not run automatically during draft edits.
test('Full careers for 2–6 players finish with LIFE tiles and both crisis choices',()=>{
 for(let n=2;n<=6;n++){let seed=9,random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32),g=createGame(roster(n),random),steps=0;while(g.phase!=='over'){assert(++steps<900);const action=g.phase==='roll'?{type:'roll'}:g.phase==='end'?{type:'end'}:{type:'choose',index:g.pending.type==='crisis-fork'?g.turn%2:decision(g).options.findIndex(o=>!o.disabled)};g=perform(g,action,random);}assert(g.players.every(p=>p.retired&&p.crisisDone));validateGame(g);assert.equal(standings(g)[0].score,Math.max(...g.players.map(score)));}
});


const memory=()=>{const data=new Map();return {storage:{async get(k){return structuredClone(data.get(k));},async put(k,v){data.set(k,structuredClone(v));},async setAlarm(){},async deleteAlarm(){},async deleteAll(){data.clear();}},blockConcurrencyWhile:async fn=>fn()};};
const call=(room,path,payload,token)=>room.fetch(new Request('https://room'+path,{method:payload?'POST':'GET',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined}));

test('Six-device career authority: own turns, hidden deck, server die, duplicate and stale actions, reconnect and deletion',async()=>{
 const ctx=memory();let room=new GameRoom(ctx,{});await Promise.resolve();const host=await(await call(room,'/init',{kind:'life',code:'ABC234',name:'Officer 1',choice:pawns[0].id})).json(),seats=[host];for(let i=1;i<6;i++)seats.push(await(await call(room,'/join',{name:'Officer '+(i+1),choice:pawns[i].id})).json());
 let snap=await(await call(room,'/start',{revision:6,id:crypto.randomUUID()},host.token)).json();assert.equal(snap.state.deck,undefined);assert.equal(snap.state.phase,'choice');const act=action=>({revision:snap.revision,id:crypto.randomUUID(),action});
 assert.equal((await call(room,'/action',act({type:'choose',index:0}),seats[1].token)).status,403);const first=act({type:'choose',index:0});snap=await(await call(room,'/action',first,host.token)).json();assert.equal(snap.state.players[0].rank,0);const duplicate=await(await call(room,'/action',first,host.token)).json();assert.equal(duplicate.revision,snap.revision);assert.equal(duplicate.state.players[0].cash,500);
 assert.equal((await call(room,'/action',{revision:6,id:crypto.randomUUID(),action:{type:'roll'}},host.token)).status,409);
 snap=await(await call(room,'/action',act({type:'roll',dice:99,cash:999999}),host.token)).json();assert(snap.state.dice>=1&&snap.state.dice<=10);assert.equal(snap.state.players[0].cash,500);assert.equal(snap.state.deck,undefined);
 let actions=0;while(snap.state.phase!=='over'){
  const g=snap.state,action=g.phase==='roll'?{type:'roll'}:g.phase==='end'?{type:'end'}:{type:'choose',index:g.pending.type==='crisis-fork'?g.turn%2:decision(g).options.findIndex(o=>!o.disabled)};
  const response=await call(room,'/action',act(action),seats[g.turn].token);assert.equal(response.status,200);snap=await response.json();assert(++actions<700);
  if(actions===25){room=new GameRoom(ctx,{});await Promise.resolve();snap=await(await call(room,'/state',null,host.token)).json();assert.equal(snap.state.deck,undefined);}
 }
 assert(snap.state.players.every(p=>p.retired));assert.equal((await call(room,'/end',{revision:snap.revision,id:crypto.randomUUID()},seats[1].token)).status,403);assert.equal((await call(room,'/end',{revision:snap.revision,id:crypto.randomUUID()},host.token)).status,200);assert.equal(await ctx.storage.get('room'),undefined);assert.equal((await call(room,'/state',null,host.token)).status,404);
});
