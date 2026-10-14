import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {suspects,rooms,caseCategories,reachable,neighbors,currentRoom,canSuggest} from '../public/clue/rules.js';

const origin='http://127.0.0.1:8791',folder='.runtime/clue-online-game';
fs.mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const pages=[],contexts=[],errors=[];
const stats={players:6,turns:0,rolls:0,moves:0,passages:0,rumors:0,privateCards:0,eliminatedRefutations:0,reconnects:0};
const knowledge=suspects.map(()=>({seen:new Set(),own:new Set(),tried:new Map(),turns:0}));
let code,s;
async function snapshot(page){
 return page.evaluate(async code=>{
  const {readSeat}=await import('/online.js'),seat=readSeat('clue',code);
  const response=await fetch('/api/rooms/'+code+'/state',{headers:{Authorization:'Bearer '+seat.token}});
  if(!response.ok)throw Error('Snapshot failed: '+response.status);
  return response.json();
 },code);
}
async function synced(page,revision){await page.waitForFunction(revision=>Number(document.querySelector('.online-banner')?.dataset.revision)>=revision,revision);}
async function change(page,fn){
 const before=s.revision;await fn();
 await page.waitForFunction(revision=>Number(document.querySelector('.online-banner')?.dataset.revision)>revision,before);
 s=await snapshot(page);assert(s.revision>before);
 assert.equal(await page.locator('#clueError').innerText(),'');
}
async function choice(page,type,ids){
 await page.getByRole('button',{name:type==='suggest'?'Spread a rumor':'Make an accusation',exact:true}).click();
 for(const [name,value] of Object.entries(ids))await page.locator('#choiceFields select[name="'+name+'"]').selectOption(value);
 await change(page,()=>page.locator('#submitClueChoice').click());
 await page.waitForFunction(()=>!document.getElementById('clueChoiceDialog').open);
}
async function privateStates(){
 const states=await Promise.all(pages.map(snapshot));
 for(let i=0;i<6;i++){
  const state=states[i].state;assert.equal(states[i].viewer,i);
  if(state.phase!=='over')assert.equal(state.solution,undefined);
  for(let j=0;j<6;j++)if(i!==j){assert.deepEqual(state.players[j].hand,[]);assert.deepEqual(state.players[j].notes,{});}
  if(state.pending&&!(state.phase==='view'&&state.turn===i))assert.equal(state.pending.card,null);
 }
 return states;
}
function distance(game,target){
 const blocked=new Set(Object.entries(game.positions).filter(([id,node])=>id!==game.players[game.turn].suspect&&!node.startsWith('room:')).map(([,node])=>node));
 const found=new Map([[target,0]]),queue=[target];
 for(let i=0;i<queue.length;i++)for(const next of neighbors(queue[i]))if(!found.has(next)&&!blocked.has(next)){found.set(next,found.get(queue[i])+1);queue.push(next);}
 return found;
}
try{
 for(let i=0;i<6;i++){
  const viewport=[{width:1440,height:1100},{width:1280,height:900},{width:1024,height:768},{width:820,height:1180},{width:390,height:844},{width:320,height:740}][i];
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});contexts.push(context);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push('Detective '+(i+1)+': '+e.message));pages.push(page);
 }
 await pages[0].goto(origin+'/clue-setup');
 const create=pages[0].locator('.online-entry-form').first();
 await create.locator('input').first().fill('Detective 1');await create.locator('select').selectOption('red');
 await create.getByRole('button',{name:'Create room',exact:true}).click();
 await pages[0].locator('.online-lobby h2').waitFor();
 code=(await pages[0].locator('.online-lobby h2').innerText()).replace('Room ','');
 for(let i=1;i<6;i++){
  await pages[i].goto(origin+'/clue-setup?room='+code);const join=pages[i].locator('.online-entry-form').nth(1);
  await join.locator('input').nth(1).fill('Detective '+(i+1));await join.locator('select').selectOption(suspects[i].id);
  await join.getByRole('button',{name:'Join room',exact:true}).click();await pages[i].locator('.online-lobby h2').waitFor();
 }
 await pages[0].waitForFunction(()=>document.querySelectorAll('.online-lobby-players li').length===6);
 assert.equal(await pages[5].getByRole('button',{name:'Start game',exact:true}).count(),0);
 await pages[0].screenshot({path:folder+'/lobby.png',fullPage:true});
 await pages[0].getByRole('button',{name:'Start game',exact:true}).click();
 for(const page of pages){await page.waitForURL('**/clue?room=*');await page.locator('#viewHand').waitFor();assert.equal(await page.locator('.clue-pawn').count(),6);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 s=await snapshot(pages[0]);assert.equal(s.state.deck.length,22);
 const sizes=[];
 for(let i=0;i<6;i++){
  await pages[i].locator('#viewHand').click();const ids=await pages[i].locator('#privateDialogBody [data-card]').evaluateAll(es=>es.map(e=>e.dataset.card));
  sizes.push(ids.length);for(const id of ids){knowledge[i].own.add(id);knowledge[i].seen.add(id);}
  await pages[i].locator('#closeCluePrivate').click();
 }
 assert.deepEqual(sizes,[4,3,3,3,3,3]);assert.equal(new Set(knowledge.flatMap(k=>[...k.own])).size,19);
 await privateStates();
 // An observer cannot roll, and private notes remain editable while waiting.
 const denied=await pages[5].evaluate(async({code,revision})=>{
  const {readSeat}=await import('/online.js');const r=await fetch('/api/rooms/'+code+'/action',{method:'POST',headers:{Authorization:'Bearer '+readSeat('clue',code).token,'Content-Type':'application/json'},body:JSON.stringify({revision,id:crypto.randomUUID(),action:{type:'roll'}})});return r.status;
 },{code,revision:s.revision});assert.equal(denied,403);
 await pages[5].locator('#viewNotebook').click();const note=pages[5].locator('.notebook-row:not(.owned) select').first(),noteId=await note.getAttribute('data-note');
 await change(pages[5],()=>note.selectOption('maybe'));await pages[5].locator('#closeCluePrivate').click();
 await pages[5].reload();await synced(pages[5],s.revision);await pages[5].locator('#viewNotebook').click();assert.equal(await pages[5].locator('[data-note="'+noteId+'"]').inputValue(),'maybe');await pages[5].locator('#closeCluePrivate').click();stats.reconnects++;
 let lastRumor=null,wrongDone=false,solved=false;
 for(let step=0;step<1200;step++){
  const g=s.state;if(g.phase==='over'){solved=true;break;}
  const active=g.phase==='refute'?g.pending.refuter:g.turn,page=pages[active],k=knowledge[g.turn];
  await synced(page,s.revision);
  if(g.phase==='refute'){
   const requester=g.turn;const buttons=page.locator('[data-show-card]');await buttons.first().waitFor();
   const ids=await buttons.evaluateAll(es=>es.map(e=>e.dataset.showCard));assert(ids.every(id=>knowledge[active].own.has(id)&&g.pending.suggestion.includes(id)));
   const id=ids[stats.privateCards%ids.length];await change(page,()=>page.locator('[data-show-card="'+id+'"]').click());
   await synced(pages[requester],s.revision);assert.equal(await pages[requester].locator('.evidence-card.shown').getAttribute('data-card'),id);
   await privateStates();for(let i=0;i<6;i++)if(i!==requester){await synced(pages[i],s.revision);assert.equal(await pages[i].locator('.evidence-card.shown').count(),0);}
   if(g.players[active].eliminated)stats.eliminatedRefutations++;
   if(stats.privateCards===0){await pages[requester].reload();await synced(pages[requester],s.revision);assert.equal(await pages[requester].locator('.evidence-card.shown').getAttribute('data-card'),id);stats.reconnects++;}
  }else if(g.phase==='view'){
   const shown=await page.locator('.evidence-card.shown').getAttribute('data-card');assert(shown);k.seen.add(shown);stats.privateCards++;
   await change(page,()=>page.getByRole('button',{name:'Hide card and finish',exact:true}).click());assert.equal(s.state.players[g.turn].notes[shown],'no');
  }else if(['turn','end'].includes(g.phase)){
   const candidates=Object.fromEntries(Object.entries(caseCategories(g)).map(([type,list])=>[type,list.filter(entry=>!k.seen.has(type+':'+entry.id)).map(entry=>entry.id)]));
   if(g.phase==='turn'&&g.turn===0&&stats.turns>=12&&!wrongDone){
    const owned=[...k.own][0],[type,id]=owned.split(':');await choice(page,'accuse',{suspect:'red',item:'key',room:'booking',[type]:id});assert(s.state.players[0].eliminated);wrongDone=true;
   }else if(Object.values(candidates).every(list=>list.length===1))await choice(page,'accuse',Object.fromEntries(Object.entries(candidates).map(([type,list])=>[type,list[0]])));
   else if(g.phase==='end'&&lastRumor?.turn===g.turn&&g.log.at(-1)==='No other player could disprove the rumor.'&&lastRumor.ids.every(id=>!k.own.has(id)))await choice(page,'accuse',Object.fromEntries(lastRumor.ids.map(id=>id.split(':'))));
   else if(canSuggest(g)){
    const room=currentRoom(g),tries=k.tried.get(room)||0;k.tried.set(room,tries+1);
    const suspect=candidates.suspect[tries%candidates.suspect.length],item=candidates.item[Math.floor(tries/candidates.suspect.length)%candidates.item.length];assert(suspect&&item);
    lastRumor={turn:g.turn,ids:['suspect:'+suspect,'item:'+item,'room:'+room]};await choice(page,'suggest',{suspect,item});stats.rumors++;
   }else if(g.phase==='end'){await change(page,()=>page.getByRole('button',{name:'End turn →',exact:true}).click());stats.turns++;k.turns++;}
   else{
    const passage=rooms.find(r=>r.id===currentRoom(g))?.passage;
    if(passage&&candidates.room.includes(passage)&&stats.passages<4){await change(page,()=>page.getByRole('button',{name:'Passage to '+g.config['room:'+passage],exact:true}).click());stats.passages++;}
    else{await change(page,()=>page.getByRole('button',{name:'Roll the dice',exact:true}).click());stats.rolls++;}
   }
  }else if(g.phase==='move'){
   const paths=reachable(g),targets=rooms.filter(r=>r.id!==g.players[g.turn].lastSuggestedRoom&&(!k.seen.has('room:'+r.id)||g.players[g.turn].summoned));
   const options=targets.length?targets:rooms.filter(r=>r.id!==currentRoom(g));let best=null;
   for(const room of options){const found=distance(g,'room:'+room.id),tries=k.tried.get(room.id)||0;for(const [node,path] of paths){const left=found.get(node);if(left===undefined)continue;const score=left+tries*3+(node.startsWith('room:')&&node!=='room:'+room.id?8:0);if(!best||score<best.score||score===best.score&&path.length>best.path.length)best={node,path,score};}}
   assert(best,'A legal move exists');
   if(best.node.startsWith('room:'))await change(page,()=>page.locator('[data-room="'+best.node.slice(5)+'"]').click());
   else{const [x,y]=best.node.split(',').map(Number);await change(page,()=>page.locator('.hall-tile[aria-label="Corridor column '+(x+1)+', row '+(y+1)+'"]').click());}
   assert.equal(s.state.phase,'end');stats.moves++;
  }else throw Error('Unknown phase '+g.phase);
  if(step%25===0)console.log(JSON.stringify({progress:true,step,...stats}));
  if(step%50===0)await privateStates();
 }
 assert(solved,'Six detectives must reach a correct accusation using their own cards and privately shown evidence');
 assert.notEqual(s.state.winner,null);assert(s.state.lastAccusation.correct);assert(knowledge.every(k=>k.turns>0),'All six detectives participated');
 const final=await privateStates();
 for(let i=0;i<6;i++){await synced(pages[i],s.revision);assert.equal(await pages[i].locator('.case-solution [data-card]').count(),3);assert.deepEqual(final[i].state.solution,s.state.solution);await pages[i].screenshot({path:folder+'/winner-'+i+'.png',fullPage:true});}
 const winner=s.state.players[s.state.winner].name;await pages[4].reload();await synced(pages[4],s.revision);assert.equal(await pages[4].locator('.case-solution [data-card]').count(),3);stats.reconnects++;
 assert.deepEqual(errors,[]);fs.writeFileSync(folder+'/report.json',JSON.stringify({stats,winner,turnsByPlayer:knowledge.map(k=>k.turns)},null,2));
 console.log(JSON.stringify({complete:true,...stats,winner,privacyVerified:true,allPlayersParticipated:true}));
}catch(error){for(let i=0;i<pages.length;i++)await pages[i].screenshot({path:folder+'/failure-'+i+'.png',fullPage:true}).catch(()=>{});fs.writeFileSync(folder+'/failure.json',JSON.stringify({error:error.message,stats,phase:s?.state?.phase},null,2));throw error;}
finally{await browser.close();}
