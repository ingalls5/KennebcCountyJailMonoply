import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {deed,gameKey,groupIndices} from '../public/economy.js';
import {spaces} from '../public/board.js';
const names=['Player 1','Player 2','Player 3','Player 4'],seed=Number(process.env.GAME_SEED||41013);
const colors=['brown','lightblue','pink','orange','red','yellow','green','blue'];
const goal=index=>colors.indexOf(spaces[index].group)%4;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const artifacts='.runtime/four-player-game-'+seed;fs.mkdirSync(artifacts,{recursive:true});
const errors=[],history=[],stats={seed,actions:0,rolls:0,turns:0,cards:0,purchases:0,offers:0,auctions:0,bids:0,trades:0,builds:0,specialChecks:0,mortgages:0,redemptions:0,sales:0,bail:0,freeCards:0,bankruptcies:0,reloads:0,rentPayments:0,salaryPayments:0};
let page,last;
try{
 page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 await page.addInitScript(initial=>{let n;try{n=Number(sessionStorage.getItem('game-test-rng'))||initial;localStorage.setItem('kennebc-sound-v1','off');}catch{n=initial;}Math.random=()=>{n^=n<<13;n^=n>>>17;n^=n<<5;n>>>=0;try{sessionStorage.setItem('game-test-rng',String(n));}catch{}return n/4294967296;};},seed);
 await page.goto('http://127.0.0.1:8791/');await page.locator('#addPlayer').click();await page.locator('#addPlayer').click();
 for(let index=0;index<4;index++)await page.locator('#playerRows input').nth(index).fill(names[index]);await page.locator('#playerRows select').nth(3).selectOption('energy-drink');await page.getByRole('button',{name:'Enter the board',exact:false}).click();await page.waitForURL('**/board');assert.equal(await page.locator('.token').count(),4);assert.match(await page.locator('#playerRoster').innerText(),/Player 4 · \$1,500/);await page.screenshot({path:artifacts+'/start.png',fullPage:true});
 const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),gameKey);
 const initial={players:names.map(name=>({name,cash:1500,position:0,bankrupt:false})),phase:'roll',turn:0,properties:spaces.map((s,i)=>deed(i)?{owner:null,buildings:0,mortgaged:false}:null),bank:{houses:32,hotels:12},debts:[]};
 async function ready(){for(let count=0;count<6;count++){await page.waitForFunction(()=>document.getElementById('drawDialog').open||!document.getElementById('reset').disabled);if(await page.locator('#drawDialog').evaluate(d=>d.open)){stats.cards++;const prior=await state();const position=await page.locator('.token').nth(prior?.turn??0).getAttribute('data-space');assert(['chance','chest'].includes(spaces[Number(position)].type));assert.equal(await page.locator('#transferStage').count(),0);await page.getByRole('button',{name:'Continue',exact:false}).click();}else return;}throw Error('Card sequence failed to settle');}
 function audit(g,before){
  assert.equal(g.players.length,4);assert(g.players.every(p=>Number.isInteger(p.cash)&&p.cash>=0));assert(g.players.every(p=>Number.isInteger(p.position)&&p.position>=0&&p.position<40));
  const properties=g.properties.filter(Boolean);assert.equal(g.bank.houses+properties.reduce((sum,p)=>sum+(p.buildings<5?p.buildings:0),0),32);assert.equal(g.bank.hotels+properties.filter(p=>p.buildings===5).length,12);assert(g.bank.houses>=0&&g.bank.hotels>=0);
  for(const p of properties){assert(Number.isInteger(p.buildings)&&p.buildings>=0&&p.buildings<=5);if(p.owner!==null)assert(!g.players[p.owner].bankrupt);if(p.mortgaged)assert.equal(p.buildings,0);}
  for(const color of colors){const group=spaces.flatMap((s,i)=>s.group===color?[g.properties[i]]:[]);assert(Math.max(...group.map(p=>p.buildings))-Math.min(...group.map(p=>p.buildings))<=1);}
  for(const deck of ['chance','chest']){const ids=[...g.cards[deck],...g.players.flatMap(p=>p.freeCards.filter(c=>c.deck===deck).map(c=>c.id))].sort((a,b)=>a-b);assert.deepEqual(ids,Array.from({length:16},(_,i)=>i));}
  const balances=before.players.map(p=>p.cash);for(const t of g.transfers||[])if(t.kind==='money'){assert(t.amount>0&&Number.isInteger(t.amount));if(t.from!==null)balances[t.from]-=t.amount;if(t.to!==null)balances[t.to]+=t.amount;}assert.deepEqual(g.players.map(p=>p.cash),balances,'Every cash change must match a completed transfer');
  for(const event of g.events||[]){if(event.includes('Rent for'))stats.rentPayments++;if(event.includes('collected $200 at Briefing'))stats.salaryPayments++;}
  assert.equal(g.phase==='purchase',g.offer!==null);assert.equal(g.phase==='auction',g.auction!==null);if(g.phase==='debt')assert(g.debts.length>0);if(g.phase==='over')assert.equal(g.players.filter(p=>!p.bankrupt).length,1);
 }
 async function act(locator,type){const before=await state()||initial;await locator.click();await ready();const g=await state();assert.equal(await page.locator('#gameError').innerText(),'');assert.equal(await page.locator('#turnError').innerText(),'');assert.deepEqual(errors,[]);audit(g,before);const pawnStates=await page.locator('.token').evaluateAll(tokens=>tokens.map(token=>({position:Number(token.dataset.space),hidden:token.hidden})));assert.deepEqual(pawnStates,g.players.map(player=>({position:player.position,hidden:player.bankrupt})),'All four board pawns must match the saved game');stats.actions++;if(type in stats)stats[type]++;if(type==='builds'&&g.properties.some((p,i)=>p?.buildings===5&&before.properties[i]?.buildings!==5))stats.specialChecks++;history.push({type,turn:before.turn,phase:g.phase,events:g.events,cash:g.players.map(p=>p.cash),positions:g.players.map(p=>p.position)});last=g;return g;}
 async function options(){if(!(await page.locator('#turnDialog').evaluate(d=>d.open)))await page.locator('#showTurnOptions').click();}
 async function viewProperty(index){if(await page.locator('#turnDialog').evaluate(d=>d.open))await page.getByRole('button',{name:'View board & manage properties',exact:true}).click();await page.locator(`[data-index="${index}"]`).click();}
 async function propertyAction(index,pattern,type){await viewProperty(index);return act(page.locator('#spaceDetails').getByRole('button',{name:pattern}),type);}
 async function trade(index,buyer,exchange,cash){await viewProperty(index);await page.locator('#spaceDetails summary').click();await page.locator('#spaceDetails details select').nth(0).selectOption(String(buyer));await page.locator('#spaceDetails details select').nth(1).selectOption(exchange===null?'':String(exchange));await page.locator('#spaceDetails details input').fill(String(cash));return act(page.getByRole('button',{name:'Confirm trade',exact:true}),'trades');}
 async function manage(g){
  const owner=g.turn;
  for(const [index,p] of g.properties.entries()){
   if(!p||p.owner!==owner||!spaces[index].group||goal(index)===owner||groupIndices(index).some(i=>g.properties[i].buildings))continue;const buyer=goal(index);if(g.players[buyer].bankrupt)continue;
   const exchange=g.properties.findIndex((q,i)=>q?.owner===buyer&&spaces[i].group&&goal(i)===owner&&!groupIndices(i).some(j=>g.properties[j].buildings));const other=exchange<0?null:exchange,cash=other===null?deed(index).price:Math.max(0,deed(index).price-deed(other).price);const interest=p.mortgaged?Math.ceil(deed(index).mortgage*.1):0;
   if(g.players[buyer].cash>=cash+interest+150){g=await trade(index,buyer,other,cash);break;}
  }
  const mortgaged=g.properties.findIndex((p,i)=>p?.owner===owner&&p.mortgaged&&g.players[owner].cash>Math.ceil(deed(i).mortgage*1.1)+300);if(mortgaged>=0)g=await propertyAction(mortgaged,/Lift mortgage/,'redemptions');
  if(!stats.mortgages&&g.players[owner].cash>600){const index=g.properties.findIndex((p,i)=>p?.owner===owner&&!p.mortgaged&&!groupIndices(i).some(j=>g.properties[j].buildings));if(index>=0){g=await propertyAction(index,/^Mortgage/,'mortgages');g=await propertyAction(index,/Lift mortgage/,'redemptions');}}
  for(let built=0;built<3;built++){
   const index=g.properties.findIndex((p,i)=>{if(!p||p.owner!==owner||!deed(i).buildCost||p.buildings===5||p.mortgaged)return false;const group=groupIndices(i);return group.every(j=>g.properties[j].owner===owner&&!g.properties[j].mortgaged)&&p.buildings===Math.min(...group.map(j=>g.properties[j].buildings))&&g.players[owner].cash>=deed(i).buildCost+150&&(p.buildings===4?g.bank.hotels>0:g.bank.houses>0);});
   if(index<0)break;g=await propertyAction(index,/Install Camera|Add Special Checks/,'builds');
  }
  return g;
 }
 for(let step=0;step<2500;step++){
  let g=await state();if(g?.phase==='over')break;
  const phase=g?.phase||'roll';
  if(phase==='roll'){
   if(g)g=await manage(g);if(g?.players[g.turn].inJail&&g.players[g.turn].freeCards.length){await options();await act(page.getByRole('button',{name:'Use get-out-free card',exact:true}),'freeCards');continue;}
   if(g?.players[g.turn].inJail&&g.players[g.turn].jailTurns>0&&g.players[g.turn].cash>300){await options();await act(page.getByRole('button',{name:'Pay $50 bail',exact:true}),'bail');continue;}
   const open=await page.locator('#turnDialog').evaluate(d=>d.open);await act(open?page.locator('#turnActions').getByRole('button',{name:/Roll again|Roll the dice/}):page.locator('#roll'),'rolls');
   if(stats.rolls%50===0){const before=await state();await page.setViewportSize({width:stats.rolls%100===0?1440:390,height:stats.rolls%100===0?1100:844});await page.reload();assert.deepEqual(await state(),before);stats.reloads++;await page.screenshot({path:artifacts+'/roll-'+stats.rolls+'.png',fullPage:true});console.log(JSON.stringify({progress:true,rolls:stats.rolls,actions:stats.actions,cash:before.players.map(p=>p.cash),active:before.players.filter(p=>!p.bankrupt).length}));}
  }else if(phase==='purchase'){
   await options();stats.offers++;if(g.players[g.turn].cash>=deed(g.offer).price+150&&stats.offers%7!==1)await act(page.getByRole('button',{name:/^Buy ·/}),'purchases');else await act(page.getByRole('button',{name:'Send to auction',exact:true}),'auctions');
  }else if(phase==='auction'){
   await options();const a=g.auction,buyer=g.players[a.actor],cap=Math.min(buyer.cash-100,Math.floor(deed(a.index).price*(goal(a.index)===a.actor?1.15:.8))),bid=a.high+10;
   if(bid<=cap){await page.locator('#auctionBid').fill(String(bid));await act(page.getByRole('button',{name:'Place bid',exact:true}),'bids');}else await act(page.getByRole('button',{name:'Pass on this auction',exact:true}),'passes');
  }else if(phase==='action'){
   await manage(g);await options();await act(page.getByRole('button',{name:/^End turn/}),'turns');
  }else if(phase==='debt'){
   const owner=g.debts[0].payer,amount=g.debts[0].amount,assets=g.players[owner].cash+g.properties.reduce((sum,p,i)=>p?.owner===owner?sum+(p.mortgaged?0:deed(i).mortgage)+p.buildings*(deed(i).buildCost||0)/2:sum,0);
   if(assets<amount){await options();await act(page.getByRole('button',{name:'Declare bankruptcy',exact:true}),'bankruptcies');}
   else{const mortgage=g.properties.findIndex((p,i)=>p?.owner===owner&&!p.mortgaged&&!groupIndices(i).some(j=>g.properties[j].buildings));if(mortgage>=0)await propertyAction(mortgage,/^Mortgage/,'mortgages');else{const upgraded=g.properties.findIndex(p=>p?.owner===owner&&p.buildings>0);assert(upgraded>=0,'Debt must have an asset that can be sold');await propertyAction(upgraded,/Remove all upgrades in group/,'sales');}}
  }else throw Error('Unknown phase: '+phase);
 }
 const g=await state();assert.equal(g.phase,'over','The complete game must reach a winner within the action limit');stats.winner=g.players[g.winner].name;stats.finalCash=g.players.map(p=>p.cash);await page.screenshot({path:artifacts+'/winner.png',fullPage:true});
 assert.equal(g.turn,g.winner,'The winning player must be the active player');assert.match(await page.locator('#turnSummary').innerText(),new RegExp(stats.winner+' · Cash'));assert.equal(await page.locator('#roll').isDisabled(),true);assert.equal(await page.locator('.token:not([hidden])').count(),1);assert((await page.locator('.roster-player.active').innerText()).startsWith(stats.winner+' · $'+g.players[g.winner].cash.toLocaleString()));assert.match(await page.locator('#moveStatus').innerText(),new RegExp(stats.winner+' wins!'));
 const final=await state();await page.reload();assert.deepEqual(await state(),final);assert.match(await page.locator('#turnDialogTitle').innerText(),new RegExp(stats.winner+' wins!'));assert.deepEqual(errors,[]);
 await page.locator('#closeTurnDialog').click();await page.locator('#reset').click();const restarted=await state();assert.equal(restarted.phase,'roll');assert.equal(restarted.turn,0);assert(restarted.players.every(p=>p.cash===1500&&p.position===0&&!p.bankrupt&&!p.inJail));assert(restarted.properties.every(p=>!p||p.owner===null&&p.buildings===0&&!p.mortgaged));assert.deepEqual(restarted.bank,{houses:32,hotels:12});assert.equal(await page.locator('.token:not([hidden])').count(),4);assert.equal(await page.locator('#roll').isDisabled(),false);stats.restartVerified=true;
 fs.writeFileSync(artifacts+'/report.json',JSON.stringify({stats,final,history},null,2));console.log(JSON.stringify({complete:true,...stats}));
} catch(error){fs.writeFileSync(artifacts+'/failure.json',JSON.stringify({error:error.message,stats,last,history},null,2));if(page)await page.screenshot({path:artifacts+'/failure.png',fullPage:true}).catch(()=>{});throw error;} finally{await browser.close();}
