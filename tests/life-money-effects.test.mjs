import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,perform,events,decision} from '../public/life/rules.js';
import {moneyTransfers} from '../public/life/payday.js';
function fixture(){const g=createGame([{name:'One',pawn:'badge'},{name:'Two',pawn:'keys'}]);Object.assign(g.players[0],{academyDone:true,careerPath:'jail'});g.phase='choice';return g;}
test('Every event expense and income generates its exact signed cash animation',()=>{
 for(const event of events){const before=fixture();before.pending={type:'event',id:event.id};if(event.id==='house')before.players[0].position=23;for(let index=0;index<decision(before).options.length;index++){const after=perform(before,{type:'choose',index}),delta=after.players[0].cash-before.players[0].cash,transfers=moneyTransfers(before,after);assert.equal(transfers.reduce((n,c)=>n+c.amount,0),delta,event.id);assert.equal(transfers.length,delta?1:0,event.id);}}
});
test('Paychecks keep crossing timing without a duplicate generic income animation',()=>{const before=fixture();before.phase='roll';before.pending=null;before.players[0].position=3;const after=perform(before,{type:'roll'},()=>.4),transfers=moneyTransfers(before,after);assert.equal(transfers.length,1);assert.equal(transfers[0].payday,true);assert.equal(transfers[0].at,.4);assert.equal(transfers[0].amount,200);});
test('Academy and first-job starting cash changes animate in opposite directions',()=>{const before=createGame([{name:'One',pawn:'badge'},{name:'Two',pawn:'keys'}]);assert.equal(moneyTransfers(before,perform(before,{type:'choose',index:0}))[0].amount,-500);assert.equal(moneyTransfers(before,perform(before,{type:'choose',index:1}))[0].amount,300);assert.deepEqual(moneyTransfers(null,before),[]);assert.deepEqual(moneyTransfers(before,before),[]);});
