import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {suspects,rooms,caseCategories,gameKey,validateGame,reachable,neighbors,canSuggest,currentRoom} from '../public/clue/rules.js';
import {newGame,gameKey as monopolyKey} from '../public/economy.js';
const seed=Number(process.env.CLUE_SEED||10313);
const playerCount=Number(process.env.CLUE_PLAYERS||6);
assert(Number.isInteger(playerCount)&&playerCount>=3&&playerCount<=6,'CLUE_PLAYERS must be 3–6');
const folder='.runtime/clue/'+playerCount+'/'+seed;fs.mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],stats={players:playerCount,turns:0,rolls:0,moves:0,passages:0,suggestions:0,privateCards:0,handoffs:0,reloads:0,wrongAccusations:0};
let page;
try {
 page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(initial=>{let seed;try{seed=Number(sessionStorage.getItem('clue-rng'))||initial;}catch{seed=initial;}Math.random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;seed>>>=0;try{sessionStorage.setItem('clue-rng',String(seed));}catch{}return seed/4294967296;};},seed);
 await page.goto('http://127.0.0.1:8791/');
 const monopoly=JSON.stringify(newGame([{name:'Old Joe',pawn:'keys'},{name:'Old Jacob',pawn:'badge'}]));
 await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:monopolyKey,raw:monopoly});
 await page.getByRole('link',{name:'Play Clue',exact:false}).click();await page.getByRole('button',{name:'One device',exact:true}).click();
 for(let i=3;i<playerCount;i++)await page.locator('#clueAddPlayer').click();
 for(let i=0;i<playerCount;i++){await page.locator('#cluePlayerRows input').nth(i).fill('Detective '+(i+1));await page.locator('#cluePlayerRows select').nth(i).selectOption(suspects[i].id);}
 await page.locator('.case-customize summary').click();
 await page.locator('[data-card="room:booking"]').fill('HD8');
 assert.equal(await page.locator('[data-card^="suspect:"]').count(),0);
 await page.locator('[data-card="item:key"]').fill('Master Key');
 await page.screenshot({path:folder+'/setup.png',fullPage:true});
 await page.getByRole('button',{name:'Open a new case'}).click();await page.waitForURL('**/clue');await page.locator('#clueHandoff[open]').waitFor();
 assert.equal(await page.locator('.clue-room').count(),9);assert.equal(await page.locator('.clue-pawn').count(),playerCount);
 assert.match(await page.locator('[data-room="booking"]').innerText(),/HD8/);
 const state=async()=>{const g=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),gameKey);validateGame(g);return g;};
 const publicState=async()=>{const g=await state();return {...g,solution:undefined,players:g.players.map(p=>({...p,hand:undefined,notes:undefined})),pending:g.pending?{...g.pending,card:undefined}:null};};
 const knowledge=Array.from({length:playerCount},()=>({seen:new Set(),own:new Set(),loaded:false,tried:new Map()}));
 async function privacy(){assert.equal(await page.locator('#privateDialogBody [data-card]').count(),0);assert.equal(await page.locator('#clueActions [data-card],#clueActions [data-show-card]').count(),0);assert.equal(await page.locator('#privateTools').isVisible(),false);}
 async function ready(){if(await page.locator('#clueHandoff').evaluate(d=>d.open)){await privacy();await page.keyboard.press('Escape');assert(await page.locator('#clueHandoff').evaluate(d=>d.open));await page.locator('#readyDetective').click();stats.handoffs++;}}
 async function hand(index){if(knowledge[index].loaded)return;await page.locator('#viewHand').click();const ids=await page.locator('#privateDialogBody [data-card]').evaluateAll(es=>es.map(e=>e.dataset.card));for(const id of ids){knowledge[index].seen.add(id);knowledge[index].own.add(id);}knowledge[index].loaded=true;await page.locator('#closeCluePrivate').click();assert.equal(await page.locator('#privateDialogBody [data-card]').count(),0);}
 async function choice(type,ids){await page.getByRole('button',{name:type==='suggest'?'Spread a rumor':'Make an accusation',exact:true}).click();for(const [key,value] of Object.entries(ids))await page.locator(`#choiceFields select[name="${key}"]`).selectOption(value);await page.locator('#submitClueChoice').click();}
 async function nextTurn(){await page.getByRole('button',{name:'End turn →',exact:true}).click();stats.turns++;await privacy();}
 async function reloadCovered(){const before=await state();await page.reload();assert.deepEqual(await state(),before);assert(await page.locator('#clueHandoff').evaluate(d=>d.open));await privacy();stats.reloads++;await ready();}
 await privacy();await ready();await hand(0);
 const own=Array.from(knowledge[0].own)[0],[ownedType,ownedKey]=own.split(':');const wrong={suspect:'red',item:'key',room:'booking',[ownedType]:ownedKey};
 // Let every detective investigate before checking that an incorrect accusation eliminates a player.
 let solved=false,lastSuggestion=null;
 function graphDistance(g,target){const blocked=new Set(Object.entries(g.positions).filter(([id,node])=>id!==g.players[g.turn].suspect&&!node.startsWith('room:')).map(([,node])=>node));const distance=new Map([[target,0]]),queue=[target];for(let i=0;i<queue.length;i++){const n=queue[i];for(const next of neighbors(n)){if(!distance.has(next)&&!blocked.has(next)){distance.set(next,distance.get(n)+1);queue.push(next);}}}return distance;}
 for(let step=0;step<900;step++){
  let g=await publicState();if(g.phase==='over'){solved=true;break;}
  await ready();const active=g.phase==='refute'?g.pending.refuter:g.turn;await hand(active);
  const k=knowledge[g.turn];
  if(g.phase==='refute'){
   if(stats.privateCards===0&&stats.reloads===0)await reloadCovered();
   const choices=await page.locator('[data-show-card]').evaluateAll(es=>es.map(e=>e.dataset.showCard));assert(choices.length>0);
   const show=choices[(stats.privateCards+g.pending.refuter)%choices.length];await page.locator(`[data-show-card="${show}"]`).click();assert(await page.locator('#clueHandoff').evaluate(d=>d.open));await privacy();
   if(stats.privateCards===0)await reloadCovered();
  }else if(g.phase==='view'){
   const id=await page.locator('.evidence-card.shown').getAttribute('data-card');assert(id);k.seen.add(id);stats.privateCards++;await page.getByRole('button',{name:'Hide card and finish',exact:true}).click();assert.equal(await page.locator('.evidence-card.shown').count(),0);
  }else if(['turn','end'].includes(g.phase)){
   if(g.turn===0&&g.phase==='turn'&&stats.turns>=playerCount*2&&stats.wrongAccusations===0){await choice('accuse',wrong);assert.equal((await publicState()).players[0].eliminated,true);assert.equal(await page.getByRole('button',{name:'Make an accusation',exact:true}).count(),0);stats.wrongAccusations++;await nextTurn();continue;}
   const candidates=Object.fromEntries(Object.entries(caseCategories(g)).map(([type,list])=>[type,list.filter(e=>!k.seen.has(type+':'+e.id)).map(e=>e.id)]));
   if(Object.values(candidates).every(list=>list.length===1)){await choice('accuse',Object.fromEntries(Object.entries(candidates).map(([type,list])=>[type,list[0]])));continue;}
   if(g.phase==='end'&&lastSuggestion?.turn===g.turn&&g.log.at(-1)==='No other player could disprove the rumor.'&&lastSuggestion.ids.every(id=>!k.own.has(id))){await choice('accuse',Object.fromEntries(lastSuggestion.ids.map(id=>id.split(':'))));continue;}
   if(canSuggest(g)){
    const room=currentRoom(g),tries=k.tried.get(room)||0;k.tried.set(room,tries+1);const sc=candidates.suspect,ic=candidates.item;const suspect=sc[tries%sc.length],item=ic[Math.floor(tries/sc.length)%ic.length];assert(suspect&&item);lastSuggestion={turn:g.turn,ids:['suspect:'+suspect,'item:'+item,'room:'+room]};await choice('suggest',{suspect,item});stats.suggestions++;
   }else if(g.phase==='end')await nextTurn();
   else{
    const room=currentRoom(g),passage=rooms.find(r=>r.id===room)?.passage;
    if(passage&&candidates.room.includes(passage)&&stats.passages<2){await page.getByRole('button',{name:'Passage to '+g.config['room:'+passage],exact:true}).click();stats.passages++;}
    else{await page.getByRole('button',{name:'Roll the dice',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('kennebec-clue-v1')).phase!=='turn');stats.rolls++;}
   }
  }else if(g.phase==='move'){
   const paths=reachable(g),targets=rooms.filter(r=>r.id!==g.players[g.turn].lastSuggestedRoom&&(!k.seen.has('room:'+r.id)||g.players[g.turn].summoned));
   const options=targets.length?targets:rooms.filter(r=>r.id!==currentRoom(g));let best=null;
   for(const room of options){const distance=graphDistance(g,'room:'+room.id),tried=k.tried.get(room.id)||0;for(const [node,path] of paths){const left=distance.get(node);if(left===undefined)continue;const score=left+tried*3+(node.startsWith('room:')&&node!=='room:'+room.id?8:0);if(!best||score<best.score||score===best.score&&path.length>best.path.length)best={node,path,score};}}
   assert(best,'A legal move is available');if(best.node.startsWith('room:'))await page.locator(`[data-room="${best.node.slice(5)}"]`).click();else await page.locator(`.hall-tile[aria-label="Corridor column ${Number(best.node.split(',')[0])+1}, row ${Number(best.node.split(',')[1])+1}"]`).click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('kennebec-clue-v1')).phase==='end');stats.moves++;
  }else throw Error('Unknown phase '+g.phase);
  if(stats.suggestions===3&&stats.reloads<2&&!['refute','view'].includes((await publicState()).phase))await reloadCovered();
  if(step===25){await page.screenshot({path:folder+'/board-desktop.png',fullPage:true});for(const size of [{width:390,height:844},{width:820,height:1180}]){await page.setViewportSize(size);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:folder+'/board-'+size.width+'.png',fullPage:true});}await page.setViewportSize({width:1440,height:1100});}
  if(step%50===0)console.log(JSON.stringify({progress:true,step,...stats}));
 }
 assert(solved,'The investigation must reach a correct final accusation');const final=await state();assert.notEqual(final.winner,null);assert(final.players[0].eliminated);assert.equal(await page.locator('.case-solution [data-card]').count(),3);assert(final.lastAccusation.correct);stats.winner=final.players[final.winner].name;
 await page.screenshot({path:folder+'/winner.png',fullPage:true});const raw=JSON.stringify(final);await page.reload();assert.equal(JSON.stringify(await state()),raw);assert.equal(await page.locator('#clueHandoff').evaluate(d=>d.open),false);
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),monopolyKey),monopoly,'Clue must not modify the Monoply save');
 await page.getByRole('link',{name:'All games',exact:true}).click();await page.getByRole('link',{name:'View last case'}).waitFor({state:'visible'});await page.getByRole('link',{name:'Play Clue',exact:false}).click();await page.getByRole('button',{name:'One device',exact:true}).click();
 await page.getByRole('button',{name:'Open a new case'}).click();assert(await page.locator('#replaceCase').evaluate(d=>d.open));await page.getByRole('button',{name:'Keep current case'}).click();assert.equal(JSON.stringify(await state()),raw);await page.getByRole('button',{name:'Open a new case'}).click();await page.getByRole('button',{name:'Start new case',exact:true}).click();await page.waitForURL('**/clue');await page.locator('#clueHandoff[open]').waitFor();assert.equal((await state()).phase,'turn');assert.equal((await state()).config['room:booking'],'HD8');assert.equal((await state()).players.length,playerCount);await privacy();
 await ready();await page.locator('#viewNotebook').click();const ownedSelect=await page.locator('.notebook-row.owned select').count();assert(ownedSelect>0);assert(await page.locator('.notebook-row.owned select').first().isDisabled());const mark=page.locator('.notebook-row:not(.owned) select').first();const markedId=await mark.getAttribute('data-note');await mark.selectOption('maybe');await page.locator('#closeCluePrivate').click();await reloadCovered();await page.locator('#viewNotebook').click();assert.equal(await page.locator(`[data-note="${markedId}"]`).inputValue(),'maybe');await page.locator('#closeCluePrivate').click();
 // A normal-motion roll and pawn move also finish and commit their state.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await ready();await page.getByRole('button',{name:'Roll the dice',exact:true}).click();await page.locator('.clue-dice.rolling').waitFor();assert(await page.locator('.die').first().evaluate(e=>e.getAnimations().length>0));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('kennebec-clue-v1')).phase==='move');const normal=await publicState(),path=[...reachable(normal)].find(([n])=>n.startsWith('room:'))||[...reachable(normal)][0];const target=path[0];if(target.startsWith('room:'))await page.locator(`[data-room="${target.slice(5)}"]`).click();else{const [x,y]=target.split(',').map(Number);await page.locator(`.hall-tile[aria-label="Corridor column ${x+1}, row ${y+1}"]`).click();}await page.waitForFunction(()=>[...document.querySelectorAll('.clue-pawn')].some(e=>e.getAnimations().length));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('kennebec-clue-v1')).phase==='end');
 const geometry=await page.locator('.clue-pawn').evaluateAll(es=>{const board=document.getElementById('clueMap').getBoundingClientRect();return es.every(e=>{const r=e.getBoundingClientRect();return r.left>=board.left-5&&r.right<=board.right+5&&r.top>=board.top-5&&r.bottom<=board.bottom+5;});});assert(geometry,'All six pawns must stay on the board');
 assert.deepEqual(errors,[]);fs.writeFileSync(folder+'/report.json',JSON.stringify({stats,final},null,2));console.log(JSON.stringify({complete:true,...stats,saveSeparation:true,restartVerified:true,notesVerified:true,animationsVerified:true}));
} catch(error){if(page){await page.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});fs.writeFileSync(folder+'/failure.json',JSON.stringify({error:error.message,stats},null,2));}throw error;}finally{await browser.close();}
