import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,decision,validateGame,crisisFork,crisisRejoin} from '../public/life/rules.js';
function fixture(){const g=createGame([{name:'One',pawn:'badge'},{name:'Two',pawn:'keys'}]);Object.assign(g.players[0],{academyDone:true,careerPath:'jail'});g.phase='roll';g.pending=null;return g;}
function canSpin(g){assert.equal(g.phase,'roll');assert.equal(g.turn,0);assert.equal(g.pending,null);assert.equal(g.dice,null);validateGame(g);assert.doesNotThrow(()=>perform(g,{type:'roll'},()=>0));}
test('First shift completion grants another spin on the main board',()=>{let g=fixture();g.players[0].entryPosition=6;g=perform(g,{type:'roll'},()=>.9);g=perform(g,{type:'choose',index:0});assert.equal(g.players[0].entryPosition,null);canSpin(g);});
test('Both fork choices grant another spin after all required decisions',()=>{
 for(const choice of [0,1]){let g=fixture();g.players[0].position=52;g=perform(g,{type:'roll'},()=>.9);assert.equal(g.pending.thenCrisis,undefined);assert.equal(g.pending.type,'crisis-fork');g=perform(g,{type:'choose',index:choice});if(choice===1){assert.equal(g.pending.type,'crisis');assert.throws(()=>perform(g,{type:'roll'}));g=perform(g,{type:'choose',index:0});}canSpin(g);}
});
test('Final crisis stop grants another spin after rejoining the board',()=>{let g=fixture();Object.assign(g.players[0],{position:crisisFork,crisisPosition:8,crisisTaken:true});g=perform(g,{type:'roll'},()=>.9);g=perform(g,{type:'choose',index:0});assert.equal(g.players[0].position,crisisRejoin);assert.equal(g.players[0].crisisPosition,null);canSpin(g);});
test('Family stops grant another spin; ordinary turns and retirement still end',()=>{
 for(const stop of [14,24,34,44,64,74]){let g=fixture();Object.assign(g.players[0],{position:stop-3,crisisDone:stop>56});g=perform(g,{type:'roll'},()=>.9);if(g.pending.thenFamily){g=perform(g,{type:'choose',index:0});g=perform(g,{type:'choose',index:3});}if(g.pending.id==='house'){g=perform(g,{type:'choose',index:0});g=perform(g,{type:'choose',index:1});g=perform(g,{type:'choose',index:5});}else g=perform(g,{type:'choose',index:0});canSpin(g);}
 let g=fixture();g=perform(g,{type:'roll'},()=>0);g=perform(g,{type:'choose',index:0});assert.equal(g.phase,'end');g=fixture();Object.assign(g.players[0],{position:98,crisisDone:true});g=perform(g,{type:'roll'},()=>0);assert.equal(g.phase,'end');assert.equal(g.players[0].retired,true);
});
