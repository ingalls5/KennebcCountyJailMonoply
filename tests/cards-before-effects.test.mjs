import test from 'node:test';import assert from 'node:assert/strict';import {newGame,perform} from '../public/economy.js';
const roster=[{name:'Alice',pawn:'keys'},{name:'Bob',pawn:'badge'}];
test('card markers precede movement, including chained card draws',()=>{
 const original=newGame(roster);original.players[0].position=33;original.cards.chance=[8];original.cards.chest=[0];
 const next=perform(original,{type:'roll',dice:[1,2]});
 assert.deepEqual(next.route.map(step=>step.card?['card',step.position,step.card.deck,step.card.id]:['move',step.position]),[['move',34],['move',35],['move',36],['card',36,'chance',8],['move',33],['card',33,'chest',0],['move',0]]);
 assert.equal(original.players[0].position,33);assert.equal(original.players[0].cash,1500);assert.equal(next.players[0].position,0);assert.equal(next.players[0].cash,1700);
});
