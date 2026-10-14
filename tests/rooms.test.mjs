import test from 'node:test';
import assert from 'node:assert/strict';
import {GameRoom,project} from '../src/rooms.js';
import {defaultConfig,createGame,suspects} from '../public/clue/rules.js';
import {newGame,perform} from '../public/economy.js';
const memory=()=>{const data=new Map();return {storage:{async get(k){return structuredClone(data.get(k));},async put(k,v){data.set(k,structuredClone(v));},async setAlarm(){},async deleteAll(){data.clear();}},blockConcurrencyWhile:async fn=>fn()};};
async function call(room,path,payload,token){return room.fetch(new Request('https://room'+path,{method:payload?'POST':'GET',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined}));}
async function init(kind='clue'){const ctx=memory(),room=new GameRoom(ctx,{});await Promise.resolve();const response=await call(room,'/init',{kind,code:'ABC234',name:'Joe',choice:kind==='clue'?'red':'keys',config:defaultConfig()});assert.equal(response.status,201);return {room,ctx,host:await response.json()};}
const act=(revision,action)=>({revision,id:crypto.randomUUID(),action});
test('Only the host can end either online game, including outside their turn, and the ending is idempotent',async()=>{
 for(const kind of ['clue','monoply']){
  const {room,ctx,host}=await init(kind);
  const second=await(await call(room,'/join',{name:'Detective 2',choice:kind==='clue'?'gold':'badge'})).json();
  if(kind==='clue')await call(room,'/join',{name:'Detective 3',choice:'silver'});
  const started=await(await call(room,'/start',{revision:kind==='clue'?3:2,id:crypto.randomUUID()},host.token)).json();
  room.room.state.turn=1;const before=structuredClone(room.room.state);
  const payload={revision:started.revision,id:crypto.randomUUID()};
  assert.equal((await call(room,'/end',payload,second.token)).status,403);assert.deepEqual(room.room.state,before);
  if(kind==='monoply'){
   room.room.motion={id:'in-flight',actor:1};assert.equal((await call(room,'/end',payload,host.token)).status,409);room.room.motion=null;
   room.room.trade={id:'pending-offer',from:0,to:1};
  }
  const response=await call(room,'/end',payload,host.token);assert.equal(response.status,200);const ended=await response.json();
  assert.equal(ended.state.phase,'over');assert.equal(ended.state.endedEarly,true);assert.equal(ended.state.winner,null);assert.equal(ended.trade,null);
  assert.deepEqual(ended.state.players.map(player=>player.name),before.players.map(player=>player.name));
  if(kind==='clue'){assert.deepEqual(ended.state.solution,before.solution);assert.deepEqual(ended.state.players[1].hand,[]);}
  else assert.deepEqual(ended.state.properties,before.properties);
  assert.deepEqual(await(await call(room,'/end',payload,host.token)).json(),ended);
  assert.equal((await call(room,'/end',{revision:ended.revision,id:crypto.randomUUID()},host.token)).status,409);
  const restored=new GameRoom(ctx,{});await Promise.resolve();assert.deepEqual(await(await call(restored,'/state',null,host.token)).json(),ended);
 }
});
test('A six-player online case reveals its answer when everyone is out and restarts with six fresh hands',async()=>{
 const {room,host}=await init(),seats=[host];
 for(let i=1;i<6;i++)seats.push(await(await call(room,'/join',{name:'Detective '+(i+1),choice:suspects[i].id})).json());
 let snapshot=await(await call(room,'/start',{revision:6,id:crypto.randomUUID()},host.token)).json();assert.equal(snapshot.state.deck.length,22);
 for(let i=0;i<6;i++){
  const mine=await(await call(room,'/state',null,seats[i].token)).json();assert.equal(mine.state.turn,i);assert.equal(mine.state.solution,undefined);
  const [type,id]=mine.state.players[i].hand[0].split(':');
  const accusation=await call(room,'/action',act(mine.revision,{type:'accuse',suspect:'red',item:'key',room:'booking',[type]:id}),seats[i].token);
  assert.equal(accusation.status,200);snapshot=await accusation.json();assert(snapshot.state.players[i].eliminated);
  if(i<5){const ended=await call(room,'/action',act(snapshot.revision,{type:'end'}),seats[i].token);assert.equal(ended.status,200);snapshot=await ended.json();}
 }
 assert.equal(snapshot.state.phase,'over');assert.equal(snapshot.state.winner,null);assert.equal(snapshot.state.solution.length,3);
 assert.equal((await call(room,'/restart',{revision:snapshot.revision,id:crypto.randomUUID()},seats[5].token)).status,403);
 const restarted=await call(room,'/restart',{revision:snapshot.revision,id:crypto.randomUUID()},host.token);assert.equal(restarted.status,200);const next=await restarted.json();
 assert.equal(next.round,2);assert.equal(next.state.phase,'turn');assert.equal(next.state.solution,undefined);assert.equal(next.state.winner,null);assert.deepEqual(next.state.itemRooms,{});
 assert.equal(next.state.players.length,6);assert(next.state.players.every(player=>!player.eliminated));assert.equal(room.room.state.players.flatMap(player=>player.hand).length,19);
});
test('Rooms authenticate seats, reject non-host starts and out-of-turn actions, and restore from storage',async()=>{const {room,ctx,host}=await init();const p2=await (await call(room,'/join',{name:'Jacob',choice:'gold'})).json(),p3=await (await call(room,'/join',{name:'Owen',choice:'silver'})).json();assert.equal((await call(room,'/state')).status,401);assert.equal((await call(room,'/start',{revision:3,id:crypto.randomUUID()},p2.token)).status,403);let state=await (await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token)).json();assert.equal(state.state.players.length,3);assert.equal(state.state.solution,undefined);assert.equal(state.state.players[1].hand.length,0);assert(state.state.players[0].hand.length>0);assert.equal((await call(room,'/action',act(state.revision,{type:'roll'}),p2.token)).status,403);const restored=new GameRoom(ctx,{});await Promise.resolve();assert.deepEqual(await (await call(restored,'/state',null,host.token)).json(),state);assert.equal((await call(room,'/join',{name:'Fourth',choice:'green'})).status,409);});
test('Clue projections never expose other hands, notes, the envelope, or a privately shown card to the host',()=>{const game=createGame(suspects.slice(0,3).map((s,i)=>({name:'P'+i,suspect:s.id})));game.turn=1;game.phase='view';game.pending={suggestion:['suspect:red','item:key','room:booking'],refuter:2,card:game.players[2].hand[0]};game.players[2].notes['room:booking']='yes';const members=game.players.map((p,i)=>({id:''+i,token:'secret'+i,name:p.name,choice:p.suspect})),room={code:'ABC234',kind:'clue',members,host:'0',state:game};const host=project(room,members[0]),requester=project(room,members[1]);assert.equal(host.state.solution,undefined);assert.deepEqual(host.state.players[2].hand,[]);assert.deepEqual(host.state.players[2].notes,{});assert.equal(host.state.pending.card,null);assert.equal(requester.state.pending.card,game.pending.card);assert(!JSON.stringify(host).includes('secret'));});
test('Private notebooks can be edited on a waiting player’s device without changing another notebook',async()=>{const {room,host}=await init();const p2=await(await call(room,'/join',{name:'Jacob',choice:'gold'})).json();await call(room,'/join',{name:'Owen',choice:'silver'});const started=await(await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token)).json();const mine=room.room.state.players[1].hand;const card=['suspect:red','item:key','room:booking'].find(c=>!mine.includes(c));const result=await(await call(room,'/action',act(started.revision,{type:'note',card,value:'maybe',player:0}),p2.token)).json();assert.equal(result.state.players[1].notes[card],'maybe');assert.deepEqual(result.state.players[0].notes,{});assert.equal(room.room.state.players[0].notes[card],undefined);});
test('Monoply rolls are server-chosen, duplicate requests do not roll twice, and staged cards must be read before effects commit',async()=>{const {room,host}=await init('monoply');await call(room,'/join',{name:'Jacob',choice:'badge'});let started=await(await call(room,'/start',{revision:2,id:crypto.randomUUID()},host.token)).json();const payload=act(started.revision,{type:'roll',dice:[99,99]});let roll=await(await call(room,'/action',payload,host.token)).json();assert(roll.motion.dice.every(d=>d>=1&&d<=6));assert.equal(roll.state.players[0].position,0);assert.equal(roll.state.cards,undefined);const again=await(await call(room,'/action',payload,host.token)).json();assert.equal(again.revision,roll.revision);assert.equal(again.motion.id,roll.motion.id);for(let i=0;i<roll.motion.route.filter(s=>s.card).length;i++)roll=await(await call(room,'/action',act(roll.revision,{type:'continue-card',cardIndex:i}),host.token)).json();const finished=await(await call(room,'/action',act(roll.revision,{type:'finish-motion'}),host.token)).json();assert.equal(finished.motion,null);assert.deepEqual(finished.state.lastDice,roll.motion.dice);
 const before=newGame([{name:'Joe',pawn:'keys'},{name:'Jacob',pawn:'badge'}]),next=perform(before,{type:'roll',dice:[3,4]});assert(next.route.some(s=>s.card));room.room.state=before;room.room.motion={id:'test',type:'roll',actor:0,next,dice:[3,4],acknowledged:0};assert.equal((await call(room,'/action',act(room.room.revision,{type:'finish-motion'}),host.token)).status,409);assert.equal(room.room.state.players[0].position,0);});
test('Online Monoply trades require the recipient’s acceptance and stale revisions cannot change money twice',async()=>{const {room,host}=await init('monoply');const buyer=await(await call(room,'/join',{name:'Jacob',choice:'badge'})).json();let snap=await(await call(room,'/start',{revision:2,id:crypto.randomUUID()},host.token)).json();room.room.state.properties[1].owner=0;room.room.state.phase='action';let offer=await(await call(room,'/action',act(snap.revision,{type:'trade',index:1,player:1,cash:100,exchange:null}),host.token)).json();assert.equal(offer.state.properties[1].owner,0);assert.equal(offer.state.players[1].cash,1500);assert.equal((await call(room,'/action',act(offer.revision,{type:'accept-trade'}),host.token)).status,403);const accept=act(offer.revision,{type:'accept-trade'});let done=await(await call(room,'/action',accept,buyer.token)).json();assert.equal(done.state.properties[1].owner,1);assert.equal(done.state.players[0].cash,1600);assert.equal(done.state.players[1].cash,1400);assert.deepEqual(await(await call(room,'/action',accept,buyer.token)).json(),done);assert.equal((await call(room,'/action',act(offer.revision,{type:'end'}),host.token)).status,409);});

test('Restored online Clue rooms update original draft labels without changing seats or private cards',async()=>{
 const {room,ctx,host}=await init();await call(room,'/join',{name:'Jacob',choice:'gold'});await call(room,'/join',{name:'Owen',choice:'silver'});await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token);
 delete room.room.layoutRevision;delete room.room.state.boardRevision;
 for(const config of [room.room.config,room.room.state.config])Object.assign(config,{'room:booking':'Booking','room:control':'Control Room','room:visitation':'Visitation','room:property':'Property Room'});
 const hands=structuredClone(room.room.state.players.map(p=>p.hand)),solution=[...room.room.state.solution],memberIds=room.room.members.map(p=>p.id);await ctx.storage.put('room',room.room);
 const restored=new GameRoom(ctx,{});await Promise.resolve();const response=await call(restored,'/state',null,host.token);assert.equal(response.status,200);const mine=await response.json();assert.equal(mine.config['room:booking'],'Intake');assert.equal(mine.state.config['room:visitation'],'T-Unit');assert.deepEqual(mine.members.map(p=>p.id),memberIds);assert.deepEqual(restored.room.state.players.map(p=>p.hand),hands);assert.deepEqual(restored.room.state.solution,solution);assert.deepEqual(mine.state.players[1].hand,[]);assert.equal(mine.state.solution,undefined);
});

test('Online weapon updates preserve revision-two custom rooms, seats, private cards and game progress',async()=>{
 const {room,ctx,host}=await init();await call(room,'/join',{name:'Jacob',choice:'gold'});await call(room,'/join',{name:'Owen',choice:'silver'});await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token);
 room.room.layoutRevision=2;room.room.state.boardRevision=2;
 for(const config of [room.room.config,room.room.state.config])Object.assign(config,{'room:booking':'Booking','item:cuffs':'Handcuffs','item:spray':'OC Spray','item:belt':'Duty Belt'});
 const before=structuredClone(room.room.state);delete before.config;delete before.boardRevision;
 const seats=structuredClone(room.room.members);await ctx.storage.put('room',room.room);
 const restored=new GameRoom(ctx,{});await Promise.resolve();const response=await call(restored,'/state',null,host.token);assert.equal(response.status,200);const mine=await response.json();
 for(const config of [mine.config,mine.state.config]){assert.equal(config['room:booking'],'Booking');assert.equal(config['item:cuffs'],'911 Knife');assert.equal(config['item:spray'],'Taser');assert.equal(config['item:belt'],'Inmate-made shank');}
 const after=structuredClone(restored.room.state);delete after.config;delete after.boardRevision;assert.deepEqual(after,before);assert.deepEqual(restored.room.members,seats);assert.equal(mine.state.solution,undefined);assert.deepEqual(mine.state.players[1].hand,[]);
});

test('A six-weapon online case reconnects without redealing and a restart adds the seventh weapon',async()=>{
 const {room,ctx,host}=await init();await call(room,'/join',{name:'Jacob',choice:'gold'});await call(room,'/join',{name:'Owen',choice:'silver'});await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token);
 room.room.state=createGame(room.room.members.map(member=>({name:member.name,suspect:member.choice})),defaultConfig(),()=>.999);
 room.room.layoutRevision=3;room.room.state.boardRevision=3;delete room.room.state.deck;delete room.room.state.playerSuspects;room.room.state.config=defaultConfig();room.room.state.positions=Object.fromEntries(suspects.map(s=>[s.id,s.start]));room.room.state.solution=['suspect:red','item:key','room:booking'];room.room.state.players.forEach(p=>{p.hand=[];delete p.personality;});Object.keys(defaultConfig()).filter(id=>id!=='item:drugs'&&!room.room.state.solution.includes(id)).forEach((id,i)=>room.room.state.players[i%room.room.state.players.length].hand.push(id));
 delete room.room.config['item:drugs'];delete room.room.state.config['item:drugs'];for(const player of room.room.state.players)player.hand=player.hand.filter(card=>card!=='item:drugs');
 const hands=structuredClone(room.room.state.players.map(player=>player.hand)),answer=[...room.room.state.solution];await ctx.storage.put('room',room.room);
 const restored=new GameRoom(ctx,{});await Promise.resolve();const mine=await(await call(restored,'/state',null,host.token)).json();
 assert.equal(mine.state.deck.length,21);assert(!mine.state.deck.includes('item:drugs'));assert.deepEqual(restored.room.state.players.map(player=>player.hand),hands);assert.deepEqual(restored.room.state.solution,answer);assert.equal(mine.state.solution,undefined);
 const note=await call(restored,'/action',act(mine.revision,{type:'note',card:'item:drugs',value:'maybe'}),host.token);assert.equal(note.status,400);
 const restarted=await call(restored,'/restart',{revision:mine.revision,id:crypto.randomUUID()},host.token);assert.equal(restarted.status,200);const next=await restarted.json();assert.equal(next.state.deck.length,19);assert(next.state.deck.includes('item:drugs'));assert.equal(next.config['item:drugs'],'Drugs');assert.equal(restored.room.state.players.reduce((count,player)=>count+player.hand.length,0),16);
});

test('Online Clue requires an available role and uses joining names as suspects',async()=>{
 const {room,host}=await init();
 assert.equal((await call(room,'/join',{name:'Missing choice'})).status,400);
 const taken=await call(room,'/join',{name:'Different Joe',choice:'red'});assert.equal(taken.status,409);assert.match((await taken.json()).error,/role is already taken/);
 await call(room,'/join',{name:'Jacob',choice:'purple'});await call(room,'/join',{name:'Owen',choice:'blue'});
 const response=await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token);assert.equal(response.status,200);const mine=await response.json();
 assert.equal(mine.state.config['suspect:red'],'Joe');assert.equal(mine.state.config['suspect:purple'],'Jacob');assert.equal(mine.state.config['suspect:blue'],'Owen');assert.equal(mine.state.players[1].personality,'Floor Officer');assert.equal(mine.state.deck.length,19);assert(!mine.state.deck.includes('suspect:gold'));assert.equal(mine.state.solution,undefined);assert.deepEqual(mine.state.players[1].hand,[]);
});

test('Online role labels update while keeping seats, private cards and the hidden answer',async()=>{
 const {room,ctx,host}=await init();await call(room,'/join',{name:'Jacob',choice:'gold'});await call(room,'/join',{name:'Owen',choice:'silver'});await call(room,'/start',{revision:3,id:crypto.randomUUID()},host.token);
 room.room.layoutRevision=5;room.room.state.boardRevision=5;room.room.state.players.forEach((player,i)=>player.personality=['The Veteran','The Hothead','The Quiet One'][i]);
 const before=structuredClone(room.room);await ctx.storage.put('room',room.room);const restored=new GameRoom(ctx,{});await Promise.resolve();const mine=await(await call(restored,'/state',null,host.token)).json();
 assert.deepEqual(mine.state.players.map(player=>player.personality),['FTO','Supervisor','Intake Officer']);assert.equal(mine.state.solution,undefined);assert.deepEqual(mine.state.players[1].hand,[]);
 for(const snapshot of [before,restored.room]){delete snapshot.layoutRevision;delete snapshot.state.boardRevision;snapshot.state.players.forEach(player=>delete player.personality);}assert.deepEqual(restored.room,before);
});
