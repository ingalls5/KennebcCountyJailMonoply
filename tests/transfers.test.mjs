import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,perform} from '../public/economy.js';
const roster=[{name:'Alice',pawn:'keys'},{name:'Bob',pawn:'badge'}];
test('transfer effects identify each side of a cash-and-deed exchange',()=>{
 const original=newGame(roster);original.properties[1].owner=0;original.properties[3].owner=1;
 const next=perform(original,{type:'trade',index:1,player:1,cash:100,exchange:3});
 assert.deepEqual(next.transfers,[{kind:'money',from:1,to:0,amount:100},{kind:'property',from:0,to:1,index:1},{kind:'property',from:1,to:0,index:3}]);
 assert.equal(original.properties[1].owner,0);assert.equal(next.players[0].cash,1600);assert.equal(next.players[1].cash,1400);
 assert.deepEqual(perform(next,{type:'trade',index:3,player:1,cash:0,exchange:1}).transfers,[{kind:'property',from:0,to:1,index:3},{kind:'property',from:1,to:0,index:1}]);
});
test('unpaid rent has no transfer until mortgage cash actually settles the debt',()=>{
 const original=newGame(roster);original.players[0].cash=0;original.properties[3].owner=1;original.properties[1].owner=0;
 const owing=perform(original,{type:'roll',dice:[1,2]});assert.equal(owing.phase,'debt');assert.deepEqual(owing.transfers,[]);
 const settled=perform(owing,{type:'mortgage',index:1});assert.deepEqual(settled.transfers,[{kind:'money',from:null,to:0,amount:30},{kind:'money',from:0,to:1,amount:4}]);
 assert.equal(settled.players[0].cash,26);assert.equal(settled.players[1].cash,1504);
 assert.deepEqual(perform(settled,{type:'end'}).transfers,[]);
});
