import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,decision,pawns,spaces,events,validateGame,validateRoster,standings,score,spaceCount,lastSpace,entryTracks,inEntry,crisisSpaces,crisisFork,crisisRejoin,inCrisis} from '../public/life/rules.js';
import {GameRoom} from '../src/rooms.js';
const roster=n=>pawns.slice(0,n).map((p,i)=>({name:'Officer '+(i+1),pawn:p.id}));
test('Choosing a starting route places the pawn on its first playable space',()=>{
 const start=createGame(roster(2));const academy=perform(start,{type:'choose',index:0});assert.equal(academy.players[0].careerPath,'academy');assert.equal(academy.players[0].cash,500);assert.equal(academy.players[0].rank,0);assert.equal(academy.players[0].reputation,3);assert.equal(academy.players[0].entryPosition,0);assert.equal(academy.phase,'roll');assert.equal(academy.turns,0);assert.equal(start.players[0].academyDone,false);
 const floor=perform(start,{type:'choose',index:1});assert.equal(floor.players[0].careerPath,'jail');assert.equal(floor.players[0].cash,1300);assert.equal(floor.players[0].rank,0);assert.equal(floor.players[0].reputation,3);
 assert.equal(perform(academy,{type:'roll'},()=>0).players[0].cash,700);assert.equal(perform(floor,{type:'roll'},()=>0).players[0].cash,1500);
});
test('Both entry routes play over turns, stop at their final space, and join without unused movement',()=>{
 for(const [index,path] of ['academy','jail'].entries()){
  assert.equal(entryTracks[path].length,index?8:12);
  let g=perform(createGame(roster(2)),{type:'choose',index}),landings=0;
  while(inEntry(g.players[0])){
   g=perform(g,{type:'roll'},()=>0);landings++;assert.equal(g.pending.type,'entry');assert.equal(g.players[0].entryPosition,landings);assert.equal(g.players[0].position,0);
   assert.deepEqual(validateGame(JSON.parse(JSON.stringify(g))),g);assert.match(decision(g).title,/Academy|Jail career/);
   g=perform(g,{type:'choose',index:0});assert.equal(g.phase,'end');assert.throws(()=>perform(g,{type:'choose',index:0}),/no decision/);
   if(inEntry(g.players[0])){g=perform(g,{type:'end'});if(!g.players[1].academyDone)g=perform(g,{type:'choose',index:1});g=perform(g,{type:'roll'},()=>.999);while(g.phase==='choice')g=perform(g,{type:'choose',index:decision(g).options.findIndex(o=>!o.disabled)});g=perform(g,{type:'end'});assert.equal(g.turn,0);}
  }
  assert.equal(landings,entryTracks[path].length-1);assert.equal(g.players[0].rank,index?0:1);assert.equal(g.players[0].position,0);
  let near=perform(createGame(roster(2)),{type:'choose',index});near.players[0].entryPosition=entryTracks[path].length-2;
  const stopped=perform(near,{type:'roll'},()=>.999);assert.equal(stopped.players[0].entryPosition,entryTracks[path].length-1);assert.equal(stopped.players[0].position,0);assert.equal(stopped.players[0].rank,0);assert.equal(stopped.phase,'choice');assert.equal(stopped.pending.type,'entry');assert.equal(stopped.route.length,1);
  const joined=perform(stopped,{type:'choose',index:0});assert.equal(joined.players[0].entryPosition,null);assert.equal(joined.players[0].position,0);assert.equal(joined.players[0].reputation,index?4:6);assert.equal(joined.players[0].rank,index?0:1);assert.equal(joined.phase,'end');
 }
});
test('Existing careers stay on the main road and invalid entry saves are rejected',()=>{
 const old=perform(createGame(roster(2)),{type:'choose',index:1});delete old.players[0].entryPosition;delete old.players[0].careerPath;old.players[0].position=12;
 const continued=perform(JSON.parse(JSON.stringify(old)),{type:'roll'},()=>0);assert.equal(continued.players[0].position,13);assert.equal(inEntry(continued.players[0]),false);
 for(const change of [{entryPosition:8},{entryPosition:-1},{entryPosition:1.5},{entryPosition:1,position:2},{entryPosition:1,careerPath:null},{entryPosition:1,academyDone:false}]){const bad=perform(createGame(roster(2)),{type:'choose',index:1});Object.assign(bad.players[0],change);assert.throws(()=>validateGame(bad));}
});
test('The spinner yields every value from 1 to 10, moves that many spaces and stops at retirement',()=>{
 const ready=perform(createGame(roster(2)),{type:'choose',index:1});ready.players[0].entryPosition=null;
 for(let number=1;number<=10;number++){
  const next=perform(ready,{type:'roll'},()=>(number-.5)/10);assert.equal(next.dice,number);assert.equal(next.players[0].position,number);assert.equal(next.route.length,number);assert.equal(next.players[0].cash,1500);assert.deepEqual(validateGame(next),next);
 }
 const near=structuredClone(ready);near.players[0].position=lastSpace-2;const retired=perform(near,{type:'roll'},()=>.999);assert.equal(retired.dice,10);assert.equal(retired.players[0].position,lastSpace);assert.equal(retired.players[0].retired,true);assert.deepEqual(retired.route,[lastSpace-1,lastSpace]);
 const ten=perform(ready,{type:'roll'},()=>.999);assert.throws(()=>validateGame({...ten,dice:11}));assert.throws(()=>validateGame({...ten,dice:0}));
});
test('Passing a review with a large roll permits promotions and cannot bypass eligibility',()=>{
 let g=perform(createGame(roster(2)),{type:'choose',index:1});g.players[0].entryPosition=null;g.players[0].position=15;g=perform(g,{type:'roll'},()=>.999);assert.equal(g.players[0].position,25);assert.equal(g.pending.type,'promotion');const promoted=perform(g,{type:'choose',index:0});assert.equal(promoted.players[0].rank,1);assert.equal(promoted.players[0].reputation,2);
 g.players[0].reputation=0;assert.throws(()=>perform(g,{type:'choose',index:0}),/available/);g.players[0].rank=4;assert(decision(g).options[0].disabled);assert.equal(perform(g,{type:'choose',index:1}).players[0].rank,4);
});
test('Every event choice respects resource bounds, negative savings and exhaustion recovery',()=>{
 assert.equal(events.length,24);assert.equal(new Set(events.map(e=>e.id)).size,events.length);assert.equal(spaces.length,100);
 for(const event of events)for(let index=0;index<event.options.length;index++){
  const g=createGame(roster(2));Object.assign(g.players[0],{cash:0,reputation:9,energy:1,academyDone:true});g.pending={type:'event',id:event.id};const next=perform(g,{type:'choose',index}),p=next.players[0];assert(p.reputation>=0&&p.reputation<=10);assert(p.energy>=1&&p.energy<=10);assert.equal(next.phase,'end');validateGame(next);
  const effect=event.options[index];assert.equal(p.cash,effect.cash-(1+effect.energy<=0?200:0));
 }
 const exhausted=createGame(roster(2));exhausted.pending={type:'shift'};exhausted.players[0].energy=1;const result=perform(exhausted,{type:'choose',index:0});assert.equal(result.players[0].energy,3);assert.equal(result.players[0].cash,1350);assert.match(result.log.at(-1),/recovery/);
});
test('Crossing Stop 56 preserves a promotion review, then forces the crisis before unused movement',()=>{
 let g=perform(createGame(roster(2)),{type:'choose',index:1});g.players[0].entryPosition=null;g.players[0].position=50;
 g=perform(g,{type:'roll'},()=>.999);assert.equal(g.players[0].position,crisisFork);assert.equal(g.pending.type,'promotion');assert.equal(g.pending.thenCrisis,true);assert.equal(g.route.length,5);assert.equal(g.players[0].crisisPosition,null);
 g=perform(g,{type:'choose',index:1});assert.equal(g.phase,'choice');assert.equal(g.pending.type,'crisis');assert.equal(g.players[0].crisisPosition,0);assert.match(decision(g).title,/Burnout/);assert.throws(()=>perform(g,{type:'roll'}),/Finish/);
 g=perform(g,{type:'choose',index:1});assert.equal(g.phase,'end');assert.equal(g.players[0].crisisPosition,0);
 const exact=perform(createGame(roster(2)),{type:'choose',index:1});exact.players[0].entryPosition=null;exact.players[0].position=54;const entered=perform(exact,{type:'roll'},()=>0);assert.equal(entered.pending.type,'crisis');assert.equal(entered.players[0].position,crisisFork);
});
test('All ten crisis dilemmas apply real tradeoffs, survive saves, recover exhaustion, and rejoin only after the final choice',()=>{
 assert.equal(crisisSpaces.length,10);
 for(let position=0;position<crisisSpaces.length;position++)for(let index=0;index<2;index++){
  const g=perform(createGame(roster(2)),{type:'choose',index:1});Object.assign(g.players[0],{entryPosition:null,position:crisisFork,crisisPosition:position,cash:0,reputation:5,energy:1});g.phase='choice';g.pending={type:'crisis'};
  assert.deepEqual(validateGame(JSON.parse(JSON.stringify(g))),g);assert.equal(decision(g).options.length,2);const effect=crisisSpaces[position].options[index];assert(effect.cash<0||effect.reputation<0||effect.energy<0);
  const next=perform(g,{type:'choose',index}),p=next.players[0];assert.equal(p.cash,effect.cash-(1+effect.energy<=0?200:0));assert(p.reputation>=0&&p.reputation<=10);assert(p.energy>=1&&p.energy<=10);assert.equal(next.phase,'end');
  assert.equal(p.crisisDone,position===9);assert.equal(p.position,position===9?crisisRejoin:crisisFork);assert.equal(p.crisisPosition,position===9?null:position);validateGame(next);
 }
 const near=perform(createGame(roster(2)),{type:'choose',index:1});Object.assign(near.players[0],{entryPosition:null,position:crisisFork,crisisPosition:8});const stopped=perform(near,{type:'roll'},()=>.999);assert.equal(stopped.players[0].crisisPosition,9);assert.equal(stopped.players[0].position,crisisFork);assert.deepEqual(stopped.route,[9]);assert.equal(stopped.pending.type,'crisis');
 const joined=perform(stopped,{type:'choose',index:0});joined.phase='roll';const continued=perform(joined,{type:'roll'},()=>0);assert.equal(continued.players[0].position,crisisRejoin+1);assert.equal(continued.players[0].crisisPosition,null);assert.equal(continued.players[0].crisisDone,true);
});
test('Older careers past the fork keep their progress, and invalid crisis saves are rejected',()=>{
 const old=perform(createGame(roster(2)),{type:'choose',index:1});Object.assign(old.players[0],{entryPosition:null,position:60});delete old.players[0].crisisPosition;delete old.players[0].crisisDone;
 assert.equal(perform(old,{type:'roll'},()=>0).players[0].position,61);
 for(const change of [{crisisPosition:10},{crisisPosition:-1},{crisisPosition:.5},{crisisPosition:1,position:54},{crisisPosition:1,crisisDone:true},{crisisPosition:1,entryPosition:0},{crisisDone:'yes'}]){const bad=structuredClone(old);Object.assign(bad.players[0],{position:crisisFork},change);assert.throws(()=>validateGame(bad));}
 assert.throws(()=>validateGame({...old,phase:'choice',pending:{type:'crisis'}}));assert.throws(()=>validateGame({...old,phase:'choice',pending:{type:'promotion',thenCrisis:true}}));
});
test('Full careers for 2–6 players finish, skip retirees, preserve saves, and share exact ties',()=>{
 for(let n=2;n<=6;n++)for(let seed=1;seed<=8;seed++){
  let state=seed,random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32),g=createGame(roster(n),random),steps=0;
  while(g.phase!=='over'){
   assert(++steps<800);if(g.phase!=='end')assert(!g.players[g.turn].retired);
   const action=g.phase==='roll'?{type:'roll'}:g.phase==='end'?{type:'end'}:{type:'choose',index:decision(g).options.findIndex(o=>!o.disabled)};
   const before=JSON.stringify(g);const next=perform(g,action,random);assert.equal(JSON.stringify(g),before);g=validateGame(JSON.parse(JSON.stringify(next)));
  }
  assert(g.players.every(p=>p.position===lastSpace&&p.retired&&p.crisisDone&&p.crisisPosition===null));assert(standings(g)[0].score>=standings(g).at(-1).score);assert.throws(()=>perform(g,{type:'roll'}),/finished/);
 }
 const tied=createGame(roster(2));assert.equal(score(tied.players[0]),score(tied.players[1]));assert.equal(standings(tied).filter(p=>p.score===standings(tied)[0].score).length,2);
});
test('Turn phases, unique player names and pawns, and corrupt saves are enforced',()=>{
 const g=createGame(roster(2));assert.throws(()=>perform(g,{type:'roll'}),/Finish/);assert.throws(()=>perform(g,{type:'end'}),/Resolve/);assert.throws(()=>perform(g,{type:'choose',index:'0'}),/available/);assert.throws(()=>validateRoster([...roster(2),roster(2)[0]]));assert.throws(()=>validateRoster(roster(1)));assert.throws(()=>validateGame({...g,turn:8}));assert.throws(()=>validateGame({...g,deck:[]}));assert.throws(()=>validateGame({...g,pending:{type:'event',id:'forged'}}));
});
test('Older 36-space careers retain their resources, decisions and relative progress without changing the source save',()=>{
 const old=createGame(roster(3));delete old.boardSize;old.turn=1;old.phase='choice';old.pending={type:'event',id:events[4].id};old.cursor=5;old.route=[16,17];
 Object.assign(old.players[1],{position:17,cash:2375,rank:2,reputation:8,energy:4,academyDone:true});Object.assign(old.players[2],{position:35,retired:true,academyDone:true});
 const before=JSON.stringify(old),next=validateGame(old);assert.equal(JSON.stringify(old),before);assert.equal(next.boardSize,100);assert.deepEqual(next.players.map(p=>p.position),[0,48,99]);assert.deepEqual(next.route,[45,48]);assert.deepEqual(next.pending,old.pending);assert.deepEqual(next.deck,old.deck);assert.equal(next.cursor,5);assert.equal(next.players[1].cash,2375);assert.equal(next.players[1].rank,2);assert.equal(next.players[1].reputation,8);assert.equal(next.players[1].energy,4);
 assert.deepEqual(validateGame(next),next);const continued=perform(next,{type:'choose',index:0});assert.equal(continued.players[1].position,48);assert.equal(continued.phase,'end');
 const finished=createGame(roster(2));delete finished.boardSize;finished.phase='over';finished.pending=null;finished.players.forEach(p=>{p.position=35;p.retired=true;});assert(validateGame(finished).players.every(p=>p.position===99&&p.retired));
 assert.throws(()=>validateGame({...next,boardSize:37}));assert.throws(()=>validateGame({...next,players:next.players.map((p,i)=>i? p:{...p,position:100})}));
});
const memory=()=>{const data=new Map();return {storage:{async get(k){return structuredClone(data.get(k));},async put(k,v){data.set(k,structuredClone(v));},async setAlarm(){},async deleteAlarm(){},async deleteAll(){data.clear();}},blockConcurrencyWhile:async fn=>fn()};};
const call=(room,path,payload,token)=>room.fetch(new Request('https://room'+path,{method:payload?'POST':'GET',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined}));
test('Existing online careers restore onto 100 spaces with the same seats, deck and pending decision',async()=>{
 const ctx=memory(),room=new GameRoom(ctx,{});await Promise.resolve();const host=await(await call(room,'/init',{kind:'life',code:'ABC234',name:'Joe',choice:'badge'})).json();const guest=await(await call(room,'/join',{name:'Jacob',choice:'keys'})).json();await call(room,'/start',{revision:2,id:crypto.randomUUID()},host.token);
 const old=room.room.state;delete old.boardSize;Object.assign(old.players[1],{position:17,cash:3200,rank:2,academyDone:true});old.turn=1;old.pending={type:'event',id:events[0].id};old.route=[16,17];const deck=[...old.deck],members=structuredClone(room.room.members);await ctx.storage.put('room',room.room);
 const restored=new GameRoom(ctx,{});await Promise.resolve();const mine=await(await call(restored,'/state',null,guest.token)).json();assert.equal(mine.viewer,1);assert.equal(mine.state.boardSize,100);assert.equal(mine.state.players[1].position,48);assert.equal(mine.state.players[1].cash,3200);assert.equal(mine.state.players[1].rank,2);assert.equal(mine.state.deck,undefined);assert.deepEqual(restored.room.state.deck,deck);assert.deepEqual(restored.room.members,members);
 const response=await call(restored,'/action',{revision:mine.revision,id:crypto.randomUUID(),action:{type:'choose',index:1}},guest.token);assert.equal(response.status,200);const after=await response.json();assert.equal(after.state.phase,'end');assert.equal(after.state.players[1].position,48);assert.equal((await ctx.storage.get('room')).state.boardSize,100);
});
test('An online crisis restores mid-route, keeps decisions on the right seat, and applies the final cost once',async()=>{
 const ctx=memory();let room=new GameRoom(ctx,{});await Promise.resolve();const host=await(await call(room,'/init',{kind:'life',code:'ABC234',name:'Joe',choice:'badge'})).json();const guest=await(await call(room,'/join',{name:'Jacob',choice:'keys'})).json();await call(room,'/start',{revision:2,id:crypto.randomUUID()},host.token);
 Object.assign(room.room.state.players[0],{academyDone:true,careerPath:'jail',position:crisisFork,crisisPosition:8});Object.assign(room.room.state,{phase:'roll',pending:null});await ctx.storage.put('room',room.room);
 room=new GameRoom(ctx,{});await Promise.resolve();let snap=await(await call(room,'/state',null,host.token)).json();assert.equal(snap.state.players[0].crisisPosition,8);assert.equal(snap.state.deck,undefined);
 const roll={revision:snap.revision,id:crypto.randomUUID(),action:{type:'roll'}};assert.equal((await call(room,'/action',roll,guest.token)).status,403);snap=await(await call(room,'/action',roll,host.token)).json();assert.equal(snap.state.pending.type,'crisis');assert.equal(snap.state.players[0].crisisPosition,9);assert.equal(snap.state.players[0].position,crisisFork);
 room=new GameRoom(ctx,{});await Promise.resolve();snap=await(await call(room,'/state',null,host.token)).json();const cash=snap.state.players[0].cash,choose={revision:snap.revision,id:crypto.randomUUID(),action:{type:'choose',index:0}};
 const joined=await(await call(room,'/action',choose,host.token)).json(),duplicate=await(await call(room,'/action',choose,host.token)).json();assert.equal(joined.state.players[0].cash,cash-600);assert.equal(joined.state.players[0].position,crisisRejoin);assert.equal(joined.state.players[0].crisisPosition,null);assert.equal(joined.state.players[0].crisisDone,true);assert.deepEqual(duplicate.state,joined.state);assert.equal(duplicate.revision,joined.revision);assert.equal(joined.state.phase,'end');
 assert.equal((await call(room,'/end',{revision:joined.revision,id:crypto.randomUUID()},host.token)).status,200);
});
test('Six-device career authority: own turns, hidden deck, server die, duplicate and stale actions, reconnect and deletion',async()=>{
 const ctx=memory();let room=new GameRoom(ctx,{});await Promise.resolve();const host=await(await call(room,'/init',{kind:'life',code:'ABC234',name:'Officer 1',choice:pawns[0].id})).json(),seats=[host];for(let i=1;i<6;i++)seats.push(await(await call(room,'/join',{name:'Officer '+(i+1),choice:pawns[i].id})).json());
 let snap=await(await call(room,'/start',{revision:6,id:crypto.randomUUID()},host.token)).json();assert.equal(snap.state.deck,undefined);assert.equal(snap.state.phase,'choice');const act=action=>({revision:snap.revision,id:crypto.randomUUID(),action});
 assert.equal((await call(room,'/action',act({type:'choose',index:0}),seats[1].token)).status,403);const first=act({type:'choose',index:0});snap=await(await call(room,'/action',first,host.token)).json();assert.equal(snap.state.players[0].rank,0);const duplicate=await(await call(room,'/action',first,host.token)).json();assert.equal(duplicate.revision,snap.revision);assert.equal(duplicate.state.players[0].cash,500);
 assert.equal((await call(room,'/action',{revision:6,id:crypto.randomUUID(),action:{type:'roll'}},host.token)).status,409);
 snap=await(await call(room,'/action',act({type:'roll',dice:99,cash:999999}),host.token)).json();assert(snap.state.dice>=1&&snap.state.dice<=10);assert.equal(snap.state.players[0].cash,700);assert.equal(snap.state.deck,undefined);
 let actions=0;while(snap.state.phase!=='over'){
  const g=snap.state,action=g.phase==='roll'?{type:'roll'}:g.phase==='end'?{type:'end'}:{type:'choose',index:decision(g).options.findIndex(o=>!o.disabled)};
  const response=await call(room,'/action',act(action),seats[g.turn].token);assert.equal(response.status,200);snap=await response.json();assert(++actions<700);
  if(actions===25){room=new GameRoom(ctx,{});await Promise.resolve();snap=await(await call(room,'/state',null,host.token)).json();assert.equal(snap.state.deck,undefined);}
 }
 assert(snap.state.players.every(p=>p.retired));assert.equal((await call(room,'/end',{revision:snap.revision,id:crypto.randomUUID()},seats[1].token)).status,403);assert.equal((await call(room,'/end',{revision:snap.revision,id:crypto.randomUUID()},host.token)).status,200);assert.equal(await ctx.storage.get('room'),undefined);assert.equal((await call(room,'/state',null,host.token)).status,404);
});
