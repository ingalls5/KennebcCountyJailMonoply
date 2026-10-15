import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,decision,validateGame} from '../public/life/rules.js';
import {project} from '../src/rooms.js';
const fresh=()=>createGame([{name:'One',pawn:'badge'},{name:'Two',pawn:'keys'}]);
test('Starting work draws exactly one blind job and accepts it before spinning',()=>{
 let g=perform(fresh(),{type:'choose',index:1});
 assert.equal(g.pending.cards.length,5);assert.ok(decision(g).options.every(o=>o.faceDown));assert.throws(()=>perform(g,{type:'roll'}));
 g=perform(g,{type:'choose',index:2});const job=g.pending.cards[2];
 assert.throws(()=>perform(g,{type:'choose',index:1}));g=perform(g,{type:'choose',index:5});
 assert.equal(g.players[0].rank,job);assert.equal(g.phase,'roll');validateGame(g);
});
test('Academy graduates reveal two cards before choosing either job',()=>{
 let g=perform(fresh(),{type:'choose',index:0});g.players[0].entryPosition=11;g.pending={type:'entry'};g.phase='choice';
 g=perform(g,{type:'choose',index:0});assert.equal(g.pending.graduate,true);
 g=perform(g,{type:'choose',index:0});assert.equal(decision(g).options.length,5);
 g=perform(g,{type:'choose',index:4});const job=g.pending.cards[4];assert.equal(decision(g).options.length,7);
 assert.throws(()=>perform(g,{type:'choose',index:3}));g=perform(g,{type:'choose',index:6});
 assert.equal(g.players[0].rank,job);assert.equal(g.phase,'roll');validateGame(g);
});
test('Online snapshots hide every unpicked job from both players',()=>{
 let g=perform(fresh(),{type:'choose',index:1});const members=[{id:'one'},{id:'two'}],room={kind:'life',members,state:g};
 for(const member of members)assert.deepEqual(project(room,member).state.pending.cards,[null,null,null,null,null]);
 g=perform(g,{type:'choose',index:3});room.state=g;
 for(const member of members){const visible=project(room,member).state.pending.cards;assert.equal(visible.filter(n=>n!==null).length,1);assert.equal(visible[3],g.pending.cards[3]);}
 assert.equal(g.pending.cards.filter(n=>Number.isInteger(n)).length,5);
});
