import test from 'node:test';
import assert from 'node:assert/strict';
import {suspects,rooms,cards,createGame,defaultConfig,validateConfig,validateRoster,validateGame,perform,reachable,neighbors,matchingCards,canSuggest,loadGame,caseCategories} from '../public/clue/rules.js';
const roster=suspects.slice(0,4).map((s,i)=>({name:'Detective '+(i+1),suspect:s.id}));
const rng=seed=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
const fresh=()=>createGame(roster,defaultConfig(),rng(131026));
test('Clue deals each joined suspect, seven weapons and nine rooms once, with balanced hands for 3–6 players',()=>{for(let n=3;n<=6;n++){const g=createGame(suspects.slice(0,n).map((s,i)=>({name:'Player '+i,suspect:s.id})),defaultConfig(),rng(n));assert.equal(g.solution.length,3);for(const type of ['suspect','item','room'])assert.equal(g.solution.filter(c=>c.startsWith(type+':')).length,1);const all=[...g.solution,...g.players.flatMap(p=>p.hand)];assert.equal(all.length,n+16);assert.equal(new Set(all).size,n+16);const sizes=g.players.map(p=>p.hand.length);assert(Math.max(...sizes)-Math.min(...sizes)<=1);validateGame(g);}});
test('Custom names retain stable card identities and reject blank, repeated, or excessive names',()=>{const config=defaultConfig();config['room:booking']='HD8';const g=createGame(roster,config);assert.equal(g.config['room:booking'],'HD8');assert.throws(()=>validateConfig({...config,'room:control':'HD8'}));assert.throws(()=>validateConfig({...config,'item:key':''}));assert.throws(()=>validateRoster(roster.slice(0,2)));assert.throws(()=>validateRoster([...roster.slice(0,3),roster[0]]));});
test('Every room is reachable through reciprocal doors; no route walks through a room or another pawn',()=>{const g=fresh();for(const room of rooms){const node='room:'+room.id,exits=neighbors(node);assert(exits.length>0,room.id);for(const exit of exits)assert(neighbors(exit).includes(node));}g.phase='move';g.steps=12;const paths=reachable(g);assert(paths.size>0);for(const [end,path] of paths){assert(path.length<=13);assert.equal(path.at(-1),end);assert(!path.slice(1,-1).some(n=>n.startsWith('room:')));assert(!Object.entries(g.positions).some(([s,n])=>s!==g.players[0].suspect&&!n.startsWith('room:')&&path.includes(n)));}assert.throws(()=>perform(g,{type:'move',node:'0,0'}));for(const s of suspects){g.positions[g.players[0].suspect]=s.start;g.positions[s.id]=s.start;g.phase='move';g.steps=12;assert(reachable(g).size>0);}});
test('Room entry consumes the roll; corner passages replace rolling and allow a new suggestion',()=>{let g=fresh();g.positions.red='7,3';g=perform(g,{type:'roll'},()=>0);assert.equal(g.steps,2);assert(reachable(g).has('room:booking'));g=perform(g,{type:'move',node:'room:booking'});assert.equal(g.phase,'end');assert.equal(g.steps,0);assert(canSuggest(g));assert.throws(()=>perform(g,{type:'roll'}));g.phase='turn';g=perform(g,{type:'passage'});assert.equal(g.positions.red,'room:sally');assert.equal(g.phase,'end');assert(canSuggest(g));});
test('A detective can spread another rumor after leaving and re-entering the same room',()=>{
 let g=createGame(suspects.map((s,i)=>({name:'Detective '+(i+1),suspect:s.id})),defaultConfig(),rng(10313));
 const finishRumor=()=>{if(g.phase==='refute'){g=perform(g,{type:'show',card:matchingCards(g,g.pending.refuter)[0]});g=perform(g,{type:'hide'});}};
 const nextRound=()=>{for(let i=0;i<6;i++)g=perform(g,{type:'end'});};
 g.positions.red='room:booking';g=perform(g,{type:'suggest',suspect:'gold',item:'key'});finishRumor();nextRound();
 assert.equal(!!canSuggest(g),false,'Staying in the room does not permit a second rumor');
 g=perform(g,{type:'roll'},()=>.999);g=perform(g,{type:'move',node:'7,3'});nextRound();
 g=perform(g,{type:'roll'},()=>.999);g=perform(g,{type:'move',node:'room:booking'});
 assert(canSuggest(g),'Leaving and re-entering permits another rumor');
 g=perform(g,{type:'suggest',suspect:'silver',item:'radio'});finishRumor();nextRound();
 assert.equal(!!canSuggest(g),false);g=perform(g,{type:'passage'});assert(canSuggest(g));validateGame(g);
});
test('Suggestions summon suspect and equipment; first clockwise matching player chooses one private card',()=>{let g=fresh();g.positions.red='room:booking';const suspect='gold',item='key',suggestion=['suspect:'+suspect,'item:'+item,'room:booking'];const first=[1,2,3].find(i=>matchingCards(g,i,suggestion).length);assert.notEqual(first,undefined);g=perform(g,{type:'suggest',suspect,item});assert.equal(g.positions.gold,'room:booking');assert.equal(g.players[1].summoned,true);assert.equal(g.itemRooms.key,'booking');assert.equal(g.phase,'refute');assert.equal(g.pending.refuter,first);const choices=matchingCards(g,first);assert.throws(()=>perform(g,{type:'show',card:g.solution[0]}));g=perform(g,{type:'show',card:choices[0]});assert.equal(g.phase,'view');assert.equal(g.pending.card,choices[0]);g=perform(g,{type:'hide'});assert.equal(g.pending,null);assert.equal(g.players[0].notes[choices[0]],'no');assert.equal(g.phase,'end');assert.equal(canSuggest(g),false);validateGame(g);});
test('Eliminated detectives still disprove suggestions; no-match suggestions do not reveal the answer',()=>{let g=fresh();const [suspect,item,room]=g.solution.map(id=>id.split(':')[1]);g.positions.red='room:'+room;g=perform(g,{type:'suggest',suspect,item});assert.equal(g.phase,'end');assert.equal(g.pending,null);assert.match(g.log.at(-1),/No other player/);g=fresh();g.positions.red='room:booking';g.players[1].eliminated=true;const candidate=cards.filter(c=>c.type==='suspect').flatMap(s=>cards.filter(c=>c.type==='item').map(i=>({suspect:s.key,item:i.key,suggestion:[s.id,i.id,'room:booking']}))).find(c=>matchingCards(g,1,c.suggestion).length);g=perform(g,{type:'suggest',...candidate});assert.equal(g.pending.refuter,1);g=perform(g,{type:'show',card:matchingCards(g,1)[0]});g=perform(g,{type:'hide'});g=perform(g,{type:'end'});assert.equal(g.turn,2);});
test('Wrong accusations end that detective’s investigation, cannot be retried, and all-wrong games close; a correct accusation wins',()=>{let g=fresh();const right=Object.fromEntries(g.solution.map(c=>c.split(':')));const wrong={...right,suspect:suspects.find(s=>s.id!==right.suspect).id};g=perform(g,{type:'accuse',...wrong});assert(g.players[0].eliminated);assert.equal(g.phase,'end');assert.throws(()=>perform(g,{type:'accuse',...right}));assert.equal(canSuggest(g),false);g=perform(g,{type:'end'});assert.equal(g.turn,1);g=perform(g,{type:'accuse',...right});assert.equal(g.phase,'over');assert.equal(g.winner,1);validateGame(g);g=fresh();for(let i=0;i<4;i++){g=perform(g,{type:'accuse',...wrong});if(i<3)g=perform(g,{type:'end'});}assert.equal(g.phase,'over');assert.equal(g.winner,null);validateGame(g);});
test('Notebook ownership and saves preserve pending private handoffs; corrupt/missing cards do not load',()=>{let g=fresh();assert.throws(()=>perform(g,{type:'note',player:1,card:cards[0].id,value:'yes'}));g=perform(g,{type:'note',player:0,card:cards[0].id,value:'maybe'});assert.equal(g.players[0].notes[cards[0].id],'maybe');g.positions.red='room:booking';g=perform(g,{type:'suggest',suspect:'gold',item:'key'});const storage={getItem:()=>JSON.stringify(g)};assert.deepEqual(loadGame(storage),g);const corrupt=structuredClone(g);corrupt.players[0].hand.pop();assert.equal(loadGame({getItem:()=>JSON.stringify(corrupt)}),null);assert.equal(loadGame({getItem:()=>'{'}),null);assert.equal(loadGame({getItem:()=>null}),null);});

test('The swapped rooms use their new doors and the upper-right T-Unit passage connects to Kitchen',()=>{
 let g=fresh();g.positions.red='room:visitation';g=perform(g,{type:'passage'});assert.equal(g.positions.red,'room:kitchen');g.phase='turn';g=perform(g,{type:'passage'});assert.equal(g.positions.red,'room:visitation');
 g.phase='turn';g.positions.red='room:medical';assert.throws(()=>perform(g,{type:'passage'}),/no passage/);
 assert.deepEqual(neighbors('room:medical'),['7,10']);assert.deepEqual(neighbors('room:visitation'),['17,3','21,7']);
});
test('Older cases update untouched room labels without redealing cards, losing notes, or overwriting new custom names',()=>{
 const old=fresh();delete old.boardRevision;Object.assign(old.config,{'room:booking':'Booking','room:control':'Control Room','room:visitation':'Visitation','room:property':'Property Room'});old.players[0].notes['room:medical']='maybe';
 const hands=structuredClone(old.players.map(p=>p.hand)),solution=[...old.solution],positions=structuredClone(old.positions),loaded=loadGame({getItem:()=>JSON.stringify(old)});
 assert(loaded);assert.equal(loaded.config['room:booking'],'Intake');assert.equal(loaded.config['room:control'],'Control');assert.equal(loaded.config['room:visitation'],'T-Unit');assert.equal(loaded.config['room:property'],'4th Floor');assert.deepEqual(loaded.players.map(p=>p.hand),hands);assert.deepEqual(loaded.solution,solution);assert.deepEqual(loaded.positions,positions);assert.equal(loaded.players[0].notes['room:medical'],'maybe');
 const custom=fresh();custom.config['room:booking']='Booking';assert.equal(loadGame({getItem:()=>JSON.stringify(custom)}).config['room:booking'],'Booking');
 old.config['room:visitation']='Custom Unit';assert.equal(loadGame({getItem:()=>JSON.stringify(old)}).config['room:visitation'],'Custom Unit');
});

test('Revision-two weapon updates preserve an active case and customized room or weapon names',()=>{
 let old=fresh();old.positions.red='room:booking';old=perform(old,{type:'suggest',suspect:'gold',item:'key'});
 old.boardRevision=2;Object.assign(old.config,{'item:cuffs':'Handcuffs','item:spray':'OC Spray','item:belt':'Duty Belt','room:booking':'Booking'});old.players[0].notes['item:belt']='maybe';
 const before=structuredClone(old);delete before.config;delete before.boardRevision;
 const loaded=loadGame({getItem:()=>JSON.stringify(old)});assert(loaded);
 assert.equal(loaded.config['item:cuffs'],'911 Knife');assert.equal(loaded.config['item:spray'],'Taser');assert.equal(loaded.config['item:belt'],'Inmate-made shank');assert.equal(loaded.config['room:booking'],'Booking');
 const after=structuredClone(loaded);delete after.config;delete after.boardRevision;assert.deepEqual(after,before);
 old.config['item:belt']='Custom Shiv';assert.equal(loadGame({getItem:()=>JSON.stringify(old)}).config['item:belt'],'Custom Shiv');
 const current=fresh();current.config['item:cuffs']='Handcuffs';assert.equal(loadGame({getItem:()=>JSON.stringify(current)}).config['item:cuffs'],'Handcuffs');
});

test('The Drugs card can be the hidden weapon, appear in rumors and identify the winning accusation',()=>{
 let game;for(let seed=1;seed<=100;seed++){const candidate=createGame(roster,defaultConfig(),rng(seed));if(candidate.solution.includes('item:drugs')){game=candidate;break;}}
 assert(game);assert.equal(caseCategories(game).item.length,7);assert.equal(game.deck.length,roster.length+16);
 const answer=Object.fromEntries(game.solution.map(card=>card.split(':')));game.positions.red='room:'+answer.room;
 game=perform(game,{type:'suggest',suspect:answer.suspect,item:'drugs'});assert.equal(game.itemRooms.drugs,answer.room);assert.match(game.log.join(' '),/using Drugs/);assert.equal(game.pending,null);
 game=perform(game,{type:'accuse',...answer});assert.equal(game.phase,'over');assert.equal(game.winner,0);validateGame(game);
});

test('A saved six-weapon case retains its original answer, hands and notes and excludes the new card',()=>{
 const old=createGame(roster,defaultConfig(),()=>.999);old.boardRevision=3;delete old.deck;delete old.playerSuspects;old.config=defaultConfig();delete old.config['item:drugs'];old.positions=Object.fromEntries(suspects.map(s=>[s.id,s.start]));old.solution=['suspect:red','item:key','room:booking'];old.players.forEach(p=>{p.hand=[];delete p.personality;});cards.filter(c=>c.id!=='item:drugs'&&!old.solution.includes(c.id)).forEach((c,i)=>old.players[i%old.players.length].hand.push(c.id));
 for(const player of old.players)player.hand=player.hand.filter(card=>card!=='item:drugs');old.positions.red='room:booking';old.players[0].notes['item:belt']='maybe';
 const before=structuredClone(old);delete before.config;delete before.boardRevision;
 const loaded=loadGame({getItem:()=>JSON.stringify(old)});assert(loaded);assert.equal(loaded.deck.length,21);assert.equal(caseCategories(loaded).item.length,6);assert(!loaded.deck.includes('item:drugs'));
 const after=structuredClone(loaded);delete after.config;delete after.boardRevision;delete after.deck;assert.deepEqual(after,before);
 assert.throws(()=>perform(loaded,{type:'suggest',suspect:'gold',item:'drugs'}));assert.throws(()=>perform(loaded,{type:'note',player:0,card:'item:drugs',value:'maybe'}));assert.throws(()=>perform(loaded,{type:'accuse',suspect:'gold',item:'drugs',room:'booking'}));
 const current=fresh();delete current.deck;assert.equal(loadGame({getItem:()=>JSON.stringify(current)}),null);
 const corrupt=structuredClone(loaded);corrupt.players[0].hand.pop();assert.equal(loadGame({getItem:()=>JSON.stringify(corrupt)}),null);
});

test('Joining names and unique personalities become the only suspects, cards and pawns in a new case',()=>{
 const joined=[{name:'  Joe  ',suspect:'purple'},{name:'Unassigned 1',suspect:'gold'},{name:'Owen',suspect:'blue'}],game=createGame(joined);
 assert.equal(new Set(suspects.map(s=>s.personality)).size,6);assert.equal(caseCategories(game).suspect.length,3);assert.equal(game.deck.length,19);assert.equal(Object.keys(game.positions).length,3);
 for(const player of game.players){assert.equal(game.config['suspect:'+player.suspect],player.name);assert.equal(player.personality,suspects.find(s=>s.id===player.suspect).personality);}
 assert.equal(game.config['suspect:purple'],'Joe');assert(!game.deck.includes('suspect:red'));assert(game.players.some(p=>game.solution.includes('suspect:'+p.suspect)));validateGame(game);
 game.positions.purple='room:booking';const rumor=perform(game,{type:'suggest',suspect:'gold',item:'key'});assert.match(rumor.log.join(' '),/Unassigned 1 killed the rookie/);
 assert.throws(()=>perform(game,{type:'suggest',suspect:'red',item:'key'}));assert.throws(()=>perform(game,{type:'accuse',suspect:'red',item:'key',room:'booking'}));
 assert.throws(()=>validateRoster([{name:'Joe',suspect:'red'},{name:'Jacob',suspect:'red'},{name:'Owen',suspect:'silver'}]));assert.throws(()=>validateRoster([{name:'Joe',suspect:''},{name:'Jacob',suspect:'gold'},{name:'Owen',suspect:'silver'}]));
});

test('Existing six-suspect cases retain their names and hidden answer after player-named suspects are introduced',()=>{
 const old=createGame(suspects.map((s,i)=>({name:'Original suspect '+i,suspect:s.id})),defaultConfig(),()=>.999);
 old.players=old.players.slice(0,3);old.players.forEach(player=>{player.hand=[];delete player.personality;});old.deck.filter(id=>!old.solution.includes(id)).forEach((id,i)=>old.players[i%3].hand.push(id));old.boardRevision=4;delete old.playerSuspects;
 const before=structuredClone(old);delete before.boardRevision;const loaded=loadGame({getItem:()=>JSON.stringify(old)});assert(loaded);assert.equal(caseCategories(loaded).suspect.length,6);assert.equal(loaded.deck.length,22);
 const after=structuredClone(loaded);delete after.boardRevision;assert.deepEqual(after,before);
});

test('Saved personality choices become the requested jail roles without changing the case',()=>{
 let old=fresh();old.positions.red='room:booking';old=perform(old,{type:'suggest',suspect:'gold',item:'key'});old.boardRevision=5;
 const previous={red:'The Veteran',gold:'The Hothead',silver:'The Quiet One',green:'The Joker'};old.players.forEach(player=>player.personality=previous[player.suspect]);
 const loaded=loadGame({getItem:()=>JSON.stringify(old)});assert(loaded);assert.deepEqual(loaded.players.map(player=>player.personality),['FTO','Supervisor','Intake Officer','Booking Officer']);
 for(const state of [old,loaded]){delete state.boardRevision;state.players.forEach(player=>delete player.personality);}assert.deepEqual(loaded,old);
 assert.deepEqual(suspects.map(suspect=>suspect.personality),['FTO','Supervisor','Intake Officer','Booking Officer','Utility Officer','Floor Officer']);
});
