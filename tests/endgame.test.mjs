import test from 'node:test';import assert from 'node:assert/strict';import {newGame,perform,loadGame} from '../public/economy.js';
const roster=[{name:'Alice',pawn:'keys'},{name:'Bob',pawn:'badge'},{name:'Casey',pawn:'oc-spray'},{name:'Drew',pawn:'energy-drink'}];
function finalDebt(payee){const g=newGame(roster);g.players[0].bankrupt=true;g.players[3].bankrupt=true;g.turn=2;g.players[1].cash=0;g.players[2].cash=0;g.properties[1].owner=2;g.properties[1].mortgaged=true;g.phase='debt';g.debts=[{payer:2,payee,amount:50,label:'Rent'}];return g;}
test('the last remaining player wins before inherited mortgage fees can block or bankrupt them',()=>{
 const next=perform(finalDebt(1),{type:'bankrupt'});assert.equal(next.phase,'over');assert.equal(next.winner,1);assert.equal(next.turn,1);assert.equal(next.players[1].cash,0);assert.equal(next.players[1].bankrupt,false);assert.equal(next.properties[1].owner,1);assert.equal(next.properties[1].mortgaged,true);assert.deepEqual(next.debts,[]);assert.equal(next.extraRoll,false);assert.match(next.log[0],/Bob wins/);assert.throws(()=>perform(next,{type:'roll',dice:[1,2]}),/finished/);
});
test('bankruptcy to the bank ends a two-player remainder without unnecessary auctions',()=>{
 const next=perform(finalDebt(null),{type:'bankrupt'});assert.equal(next.phase,'over');assert.equal(next.turn,next.winner);assert.equal(next.winner,1);assert.equal(next.properties[1].owner,null);assert.equal(next.properties[1].mortgaged,false);assert.deepEqual(next.liquidations,[]);assert.equal(next.auction,null);
});
test('an older completed save highlights the actual winner without changing cash or property',()=>{
 const g=finalDebt(1);g.players[2].bankrupt=true;g.properties[1].owner=1;g.phase='over';g.winner=1;g.extraRoll=true;g.players[1].cash=205;g.debts=[];const old=globalThis.localStorage;try{globalThis.localStorage={getItem:()=>JSON.stringify(g)};const loaded=loadGame(roster);assert.equal(loaded.turn,1);assert.equal(loaded.extraRoll,false);assert.equal(loaded.players[1].cash,205);assert.deepEqual(loaded.properties,g.properties);}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});
