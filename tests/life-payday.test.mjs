import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,crisisFork} from '../public/life/rules.js';
import {crossedPayDays} from '../public/life/payday.js';
function fixture(position){const g=createGame([{name:'One',pawn:'badge'},{name:'Two',pawn:'keys'}]);Object.assign(g.players[0],{position,rank:3,academyDone:true,careerPath:'jail'});g.phase='roll';g.pending=null;return g;}
test('Paycheck animation matches salary on passing or landing at Pay Day',()=>{for(const [position,roll] of [[3,.4],[4,0]]){const before=fixture(position),after=perform(before,{type:'roll'},()=>roll),crossings=crossedPayDays(before,after);assert.equal(crossings.length,1);assert.equal(crossings[0].amount,650);assert.equal(after.players[0].cash-before.players[0].cash,650);assert.ok(crossings[0].at>0&&crossings[0].at<=1);}});
test('Crisis Pay Day pays and animates when passed',()=>{const before=fixture(crisisFork);Object.assign(before.players[0],{crisisTaken:true,crisisPosition:2});const after=perform(before,{type:'roll'},()=>.3);assert.equal(crossedPayDays(before,after).length,1);assert.equal(after.players[0].cash-before.players[0].cash,650);});
test('Paychecks do not replay on reload, unchanged snapshots, or ordinary choices',()=>{const before=fixture(3),after=perform(before,{type:'roll'},()=>.4);assert.deepEqual(crossedPayDays(null,after),[]);assert.deepEqual(crossedPayDays(after,after),[]);const chosen=perform(after,{type:'choose',index:0});assert.deepEqual(crossedPayDays(after,chosen),[]);});
