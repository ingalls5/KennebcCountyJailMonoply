import {spaces} from './board.js';
export const gameKey='kennebc-economy-v1';
const rents={1:[2,10,30,90,160,250],3:[4,20,60,180,320,450],6:[6,30,90,270,400,550],8:[6,30,90,270,400,550],9:[8,40,100,300,450,600],11:[10,50,150,450,625,750],13:[10,50,150,450,625,750],14:[12,60,180,500,700,900],16:[14,70,200,550,750,950],18:[14,70,200,550,750,950],19:[16,80,220,600,800,1000],21:[18,90,250,700,875,1050],23:[18,90,250,700,875,1050],24:[20,100,300,750,925,1100],26:[22,110,330,800,975,1150],27:[22,110,330,800,975,1150],29:[24,120,360,850,1025,1200],31:[26,130,390,900,1100,1275],32:[26,130,390,900,1100,1275],34:[28,150,450,1000,1200,1400],37:[35,175,500,1100,1300,1500],39:[50,200,600,1400,1700,2000]};
export function deed(index){const space=spaces[index];if(!['property','railroad','utility'].includes(space?.type))return null;return {price:space.price,mortgage:space.price/2,buildCost:space.group?({brown:50,lightblue:50,pink:100,orange:100,red:150,yellow:150,green:200,blue:200}[space.group]):null,rents:rents[index]||null};}
export function groupIndices(index){return spaces.flatMap((s,i)=>s.group&&s.group===spaces[index].group?[i]:[]);}
export function ownsGroup(game,index,owner){const group=groupIndices(index);return group.length>0&&group.every(i=>game.properties[i].owner===owner);}
export function rent(game,index,diceTotal=0,modifier=null){const property=game.properties[index],space=spaces[index];if(!property||property.owner===null||property.mortgaged)return 0;const owned=game.properties.filter((p,i)=>p?.owner===property.owner&&spaces[i].type===space.type).length;
 if(space.type==='railroad')return 25*2**(owned-1)*(modifier==='double-railroad'?2:1);
 if(space.type==='utility')return diceTotal*(modifier==='ten-utility'||owned===2?10:4);
 return rents[index][property.buildings]*(property.buildings===0&&ownsGroup(game,index,property.owner)?2:1);
}
function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
const chance=[
 {text:'Advance to Briefing. Collect $200.',to:0},{text:'Advance to Juliet.',to:24},{text:'Advance to Golf.',to:11},
 {text:'Advance to the nearest instructor. If owned, pay ten times a fresh dice roll.',nearest:'utility',modifier:'ten-utility'},
 {text:'Advance to the nearest officer. If owned, pay double the usual railroad rent.',nearest:'railroad',modifier:'double-railroad'},
 {text:'Advance to the nearest officer. If owned, pay double the usual railroad rent.',nearest:'railroad',modifier:'double-railroad'},
 {text:'Bank pays you a dividend of $50.',cash:50},{text:'Get out of Two Bridges free.',free:true},
 {text:'Go back three spaces.',back:3},{text:'Go directly to Two Bridges.',jail:true},
 {text:'General repairs: pay $25 per house and $100 per hotel.',repairs:[25,100]},
 {text:'Pay a $15 fine.',cash:-15},{text:'Take a trip to Sgt. Christanson.',to:5},{text:'Advance to A-Unit.',to:39},
 {text:'Pay each other player $50.',each:-50},{text:'Your building loan matures. Collect $150.',cash:150}
];
const chest=[
 {text:'Advance to Briefing. Collect $200.',to:0},{text:'Bank error in your favor. Collect $200.',cash:200},{text:'Doctor’s fee. Pay $50.',cash:-50},
 {text:'From sale of stock, collect $50.',cash:50},{text:'Get out of Two Bridges free.',free:true},{text:'Go directly to Two Bridges.',jail:true},
 {text:'Holiday fund matures. Collect $100.',cash:100},{text:'Income tax refund. Collect $20.',cash:20},{text:'It is your birthday. Collect $10 from each other player.',each:10},
 {text:'Life insurance matures. Collect $100.',cash:100},{text:'Pay hospital fees of $100.',cash:-100},{text:'Pay school fees of $50.',cash:-50},
 {text:'Receive a consultancy fee of $25.',cash:25},{text:'Street repairs: pay $40 per house and $115 per hotel.',repairs:[40,115]},
 {text:'You won second prize in a beauty contest. Collect $10.',cash:10},{text:'You inherit $100.',cash:100}
];
export function newGame(roster){return {version:1,players:roster.map(p=>({...p,position:0,cash:1500,bankrupt:false,inJail:false,jailTurns:0,freeCards:[]})),turn:0,phase:'roll',extraRoll:false,doubles:0,properties:spaces.map((s,i)=>deed(i)?{owner:null,buildings:0,mortgaged:false}:null),bank:{houses:32,hotels:12},debts:[],offer:null,auction:null,cards:{chance:shuffle(chance.map((_,i)=>i)),chest:shuffle(chest.map((_,i)=>i))},log:['Each player starts with $1,500. Passing Briefing pays $200.'],route:[],lastDice:[],winner:null,liquidations:[],resumeJail:null};}
export function loadGame(roster){try{const raw=JSON.parse(localStorage.getItem(gameKey));if(raw?.version===1&&raw.players.length===roster.length&&roster.every((p,i)=>p.name===raw.players[i].name&&p.pawn===raw.players[i].pawn)&&raw.properties.length===40&&Number.isInteger(raw.turn)&&raw.players[raw.turn])return raw;}catch{}return newGame(roster);}
function note(g,text){g.log.unshift(text);g.log=g.log.slice(0,60);}
function requireRule(ok,message){if(!ok)throw Error(message);}
function current(g){return g.players[g.turn];}
function actionDone(g){g.offer=null;g.auction=null;if(g.liquidations.length){startAuction(g,g.liquidations.shift());return;}g.phase=g.extraRoll?'roll':'action';if(current(g).bankrupt&&!g.debts.length)nextTurn(g);}
function pay(g,payer,payee,amount,label){if(amount>0)g.debts.push({payer,payee,amount,label});}
function settle(g){while(g.debts.length){const d=g.debts[0],p=g.players[d.payer];if(p.bankrupt){g.debts.shift();continue;}if(p.cash<d.amount){g.phase='debt';return;}p.cash-=d.amount;if(d.payee!==null)g.players[d.payee].cash+=d.amount;note(g,`${p.name} paid $${d.amount}${d.payee!==null?' to '+g.players[d.payee].name:''}: ${d.label}.`);g.debts.shift();}if(g.phase==='debt'){if(g.resumeJail){const total=g.resumeJail.total;g.resumeJail=null;const p=current(g);p.inJail=false;p.jailTurns=0;moveAndLand(g,total);settle(g);}else actionDone(g);}}
function sendJail(g){const p=current(g);p.position=10;p.inJail=true;p.jailTurns=0;g.extraRoll=false;g.doubles=0;g.route.push({position:10,jump:true});note(g,`${p.name} goes to Two Bridges.`);}
function advance(g,target,collect=true){const p=current(g);if(collect&&target<=p.position){p.cash+=200;note(g,`${p.name} collected $200 at Briefing.`);}p.position=target;g.route.push({position:target,jump:true});}
function draw(g,deck,depth){const ids=g.cards[deck],id=ids.shift(),card=(deck==='chance'?chance:chest)[id];if(!card.free)ids.push(id);note(g,`${deck==='chance'?'Chance':'Supervisors Office'}: ${card.text}`);const p=current(g);
 if(card.free){p.freeCards.push({deck,id});return;}
 if(card.jail){sendJail(g);return;}
 if(card.to!==undefined){advance(g,card.to);land(g,depth+1);return;}
 if(card.back){p.position=(p.position-card.back+40)%40;g.route.push({position:p.position,jump:true});land(g,depth+1);return;}
 if(card.nearest){let target=(p.position+1)%40;while(spaces[target].type!==card.nearest)target=(target+1)%40;advance(g,target);if(card.modifier==='ten-utility'){g.utilityDice=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];note(g,'Utility dice: '+g.utilityDice.join(' + ')+'.');}land(g,depth+1,card.modifier);return;}
 if(card.cash>0){p.cash+=card.cash;note(g,`${p.name} collected $${card.cash}.`);}
 if(card.cash<0)pay(g,g.turn,null,-card.cash,card.text);
 if(card.each)g.players.forEach((other,i)=>{if(i!==g.turn&&!other.bankrupt)pay(g,card.each>0?i:g.turn,card.each>0?g.turn:i,Math.abs(card.each),card.text);});
 if(card.repairs){let total=0;g.properties.forEach(property=>{if(property?.owner===g.turn)total+=property.buildings===5?card.repairs[1]:property.buildings*card.repairs[0];});pay(g,g.turn,null,total,'Repairs');}
}
function moveAndLand(g,total){const p=current(g),start=p.position;g.phase='action';for(let step=1;step<=total;step++)g.route.push({position:(start+step)%40,jump:false});if(start+total>=40){p.cash+=200;note(g,`${p.name} collected $200 at Briefing.`);}p.position=(start+total)%40;note(g,`${p.name} rolled ${g.lastDice.join(' + ')} and landed on ${spaces[p.position].name}.`);land(g);}
function land(g,depth=0,modifier=null){requireRule(depth<5,'Too many chained cards.');const p=current(g),space=spaces[p.position],property=g.properties[p.position];
 if(property){if(property.owner===null){g.offer=p.position;g.phase='purchase';return;}if(property.owner!==g.turn&&!property.mortgaged){const diceTotal=modifier==='ten-utility'?g.utilityDice.reduce((a,b)=>a+b,0):g.lastDice.reduce((a,b)=>a+b,0);pay(g,g.turn,property.owner,rent(g,p.position,diceTotal,modifier),'Rent for '+space.name);}return;}
 if(space.type==='tax')pay(g,g.turn,null,space.price,space.name);
 if(space.type==='gotojail')sendJail(g);
 if(space.type==='chance'||space.type==='chest')draw(g,space.type,depth);
 if(space.type==='parking')note(g,'Hospital Coverage: no payment or Free Parking jackpot.');
}
function owned(g,index,owner){const p=g.properties[index];requireRule(p&&p.owner===owner,'You do not own this space.');return p;}
function manager(g){return g.phase==='debt'?g.debts[0].payer:g.turn;}
function nextTurn(g){requireRule(!g.debts.length&&g.offer===null&&!g.auction,'Resolve this landing first.');const active=g.players.map((p,i)=>!p.bankrupt?i:null).filter(i=>i!==null);if(active.length===1&&g.players.length>1){g.phase='over';g.winner=active[0];note(g,`${g.players[g.winner].name} wins!`);return;}do{g.turn=(g.turn+1)%g.players.length;}while(g.players[g.turn].bankrupt);g.phase='roll';g.extraRoll=false;g.doubles=0;}
function startAuction(g,index){g.offer=null;g.phase='auction';const actor=g.players[g.turn].bankrupt?g.players.findIndex(p=>!p.bankrupt):g.turn;g.auction={index,high:0,bidder:null,passed:[],actor};}
function auctionNext(g){const a=g.auction,eligible=g.players.flatMap((p,i)=>!p.bankrupt&&!a.passed.includes(i)&&p.cash>a.high?[i]:[]);if(a.bidder!==null&&!eligible.some(i=>i!==a.bidder)){g.players[a.bidder].cash-=a.high;g.properties[a.index].owner=a.bidder;note(g,`${g.players[a.bidder].name} bought ${spaces[a.index].name} at auction for $${a.high}.`);actionDone(g);return;}if(!eligible.length&&a.bidder===null){note(g,`${spaces[a.index].name} received no auction bids.`);actionDone(g);return;}do{a.actor=(a.actor+1)%g.players.length;}while(!eligible.includes(a.actor)||a.actor===a.bidder);}
function assetsValue(g,owner){return g.players[owner].cash+g.properties.reduce((total,p,i)=>p?.owner===owner?total+(p.mortgaged?0:deed(i).mortgage)+p.buildings*deed(i).buildCost/2:total,0);}
export function perform(original,action){const g=structuredClone(original);g.route=[];requireRule(g.players.length>0,'Set up players first.');requireRule(g.phase!=='over','This game is finished.');const p=current(g),owner=manager(g);
 if(action.type==='roll'){
  requireRule(g.phase==='roll','Finish your landing before rolling again.');const dice=action.dice;requireRule(Array.isArray(dice)&&dice.length===2&&dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6),'Invalid dice.');g.lastDice=dice;g.utilityDice=null;const total=dice[0]+dice[1],double=dice[0]===dice[1];let jailRelease=false;g.phase='action';g.extraRoll=false;
  if(p.inJail){p.jailTurns++;if(double){p.inJail=false;p.jailTurns=0;jailRelease=true;note(g,`${p.name} rolled doubles and left Two Bridges.`);}else if(p.jailTurns<3){note(g,`${p.name} stays in Two Bridges.`);return g;}else{if(p.cash<50){g.resumeJail={total};pay(g,g.turn,null,50,'Two Bridges bail');g.extraRoll=false;settle(g);return g;}p.cash-=50;p.inJail=false;p.jailTurns=0;jailRelease=true;note(g,`${p.name} paid $50 to leave Two Bridges.`);}}
  if(!jailRelease){g.doubles=double?g.doubles+1:0;g.extraRoll=double;if(g.doubles===3){sendJail(g);return g;}}
  moveAndLand(g,total);settle(g);if(g.phase==='action'&&g.extraRoll)g.phase='roll';
 }else if(action.type==='buy'){
  requireRule(g.phase==='purchase','There is no property to buy.');const index=g.offer,cost=deed(index).price;requireRule(p.cash>=cost,'Not enough cash. Mortgage property or send this space to auction.');p.cash-=cost;g.properties[index].owner=g.turn;note(g,`${p.name} bought ${spaces[index].name} for $${cost}.`);actionDone(g);
 }else if(action.type==='auction'){
  requireRule(g.phase==='purchase','There is no property to auction.');startAuction(g,g.offer);
 }else if(action.type==='bid'){
  requireRule(g.phase==='auction','No auction is running.');const a=g.auction,bid=Number(action.amount),bidder=g.players[a.actor];requireRule(Number.isInteger(bid)&&bid>a.high&&bid<=bidder.cash,'Bid a whole dollar amount above the current bid and within your cash.');a.high=bid;a.bidder=a.actor;auctionNext(g);
 }else if(action.type==='pass'){
  requireRule(g.phase==='auction','No auction is running.');g.auction.passed.push(g.auction.actor);auctionNext(g);
 }else if(['build','sell','sell-group','mortgage','redeem'].includes(action.type)){
  requireRule(g.phase!=='auction','Finish the auction first.');const index=Number(action.index),property=owned(g,index,owner),d=deed(index),group=groupIndices(index),who=g.players[owner];
  if(action.type==='build'){
   requireRule(g.phase!=='debt','Resolve the debt before building.');requireRule(ownsGroup(g,index,owner)&&group.every(i=>!g.properties[i].mortgaged),'Own the whole color group with no mortgages before building.');requireRule(property.buildings<5&&property.buildings===Math.min(...group.map(i=>g.properties[i].buildings)),'Build evenly across the color group.');requireRule(who.cash>=d.buildCost,'Not enough cash to build.');
   if(property.buildings===4){requireRule(g.bank.hotels>0,'The bank has no hotels left.');g.bank.hotels--;g.bank.houses+=4;}else{requireRule(g.bank.houses>0,'The bank has no houses left.');g.bank.houses--;}property.buildings++;who.cash-=d.buildCost;note(g,`${who.name} built on ${spaces[index].name} for $${d.buildCost}.`);
  }else if(action.type==='sell'){
   requireRule(property.buildings>0&&property.buildings===Math.max(...group.map(i=>g.properties[i].buildings)),'Sell buildings evenly across the color group.');if(property.buildings===5){requireRule(g.bank.houses>=4,'The bank needs four houses to replace the hotel.');g.bank.hotels++;g.bank.houses-=4;}else g.bank.houses++;property.buildings--;who.cash+=d.buildCost/2;note(g,`${who.name} sold a building on ${spaces[index].name} for $${d.buildCost/2}.`);
  }else if(action.type==='sell-group'){
   requireRule(group.some(i=>g.properties[i].buildings>0),'This group has no buildings to sell.');let refund=0;for(const i of group){const item=g.properties[i];requireRule(item.owner===owner,'You must own the whole group.');refund+=item.buildings*deed(i).buildCost/2;if(item.buildings===5)g.bank.hotels++;else g.bank.houses+=item.buildings;item.buildings=0;}who.cash+=refund;note(g,`${who.name} sold all buildings in the group for $${refund}.`);
  }else if(action.type==='mortgage'){
   requireRule(!property.mortgaged&&group.every(i=>g.properties[i].buildings===0),'Sell all buildings in this color group before mortgaging.');property.mortgaged=true;who.cash+=d.mortgage;note(g,`${who.name} mortgaged ${spaces[index].name} for $${d.mortgage}.`);
  }else{requireRule(g.phase!=='debt','Resolve the debt before lifting a mortgage.');const cost=Math.ceil(d.mortgage*1.1);requireRule(property.mortgaged&&who.cash>=cost,'You need the mortgage amount plus 10% interest.');property.mortgaged=false;who.cash-=cost;note(g,`${who.name} lifted the mortgage on ${spaces[index].name} for $${cost}.`);}settle(g);
 }else if(action.type==='trade'){
  requireRule(g.phase!=='auction','Finish the auction before trading.');const index=Number(action.index),property=owned(g,index,owner),buyer=Number(action.player),cash=Number(action.cash),other=action.exchange===null||action.exchange===''?null:Number(action.exchange);
  requireRule(Number.isInteger(buyer)&&buyer!==owner&&g.players[buyer]&&!g.players[buyer].bankrupt,'Choose another active player.');requireRule(Number.isInteger(cash)&&cash>=0,'Enter a whole dollar amount for the trade.');requireRule(groupIndices(index).every(i=>g.properties[i].buildings===0),'Sell every building in this group before trading.');
  if(other!==null){owned(g,other,buyer);requireRule(groupIndices(other).every(i=>g.properties[i].buildings===0),'The other property’s group must have no buildings.');}
  const buyerInterest=property.mortgaged?Math.ceil(deed(index).mortgage*.1):0,sellerInterest=other!==null&&g.properties[other].mortgaged?Math.ceil(deed(other).mortgage*.1):0;
  requireRule(g.players[buyer].cash>=cash+buyerInterest&&g.players[owner].cash+cash>=sellerInterest,'Both players need enough cash for the trade and mortgage interest.');
  g.players[buyer].cash-=cash+buyerInterest;g.players[owner].cash+=cash-sellerInterest;property.owner=buyer;if(other!==null)g.properties[other].owner=owner;
  note(g,`${g.players[owner].name} traded ${spaces[index].name} to ${g.players[buyer].name} for $${cash}${other!==null?' and '+spaces[other].name:''}.`);if(buyerInterest||sellerInterest)note(g,'Mortgage transfer interest paid to the bank: $'+(buyerInterest+sellerInterest)+'.');settle(g);
 }else if(action.type==='bail'||action.type==='free-card'){
  requireRule(p.inJail&&g.phase==='roll','Pay bail or use a card before rolling in Two Bridges.');if(action.type==='bail'){requireRule(p.cash>=50,'Raise $50 before paying bail.');p.cash-=50;note(g,`${p.name} paid $50 bail.`);}else{requireRule(p.freeCards.length>0,'You do not have a get-out-free card.');const card=p.freeCards.shift();g.cards[card.deck].push(card.id);note(g,`${p.name} used a get-out-free card.`);}p.inJail=false;p.jailTurns=0;
 }else if(action.type==='end'){
  requireRule(g.phase==='action','Finish the landing or roll your doubles before ending the turn.');nextTurn(g);
 }else if(action.type==='bankrupt'){
  requireRule(g.phase==='debt','Bankruptcy is only available for an unpaid debt.');const d=g.debts[0],loser=g.players[d.payer];requireRule(assetsValue(g,d.payer)<d.amount,'You can raise enough money by selling buildings or mortgaging property.');
  g.properties.forEach((property,index)=>{if(property?.owner!==d.payer)return;if(property.buildings===5)g.bank.hotels++;else g.bank.houses+=property.buildings;loser.cash+=property.buildings*(deed(index).buildCost||0)/2;property.buildings=0;property.owner=d.payee;if(d.payee===null){property.mortgaged=false;g.liquidations.push(index);}else if(property.mortgaged)pay(g,d.payee,null,Math.ceil(deed(index).mortgage*.1),'Interest on inherited mortgage');});
  if(d.payee!==null)g.players[d.payee].cash+=loser.cash;loser.cash=0;loser.bankrupt=true;if(d.payer===g.turn)g.resumeJail=null;if(d.payee!==null)g.players[d.payee].freeCards.push(...loser.freeCards);else loser.freeCards.forEach(card=>g.cards[card.deck].push(card.id));loser.freeCards=[];note(g,`${loser.name} is bankrupt.`);g.debts=g.debts.filter(debt=>debt.payer!==d.payer);if(d.payer===g.turn)g.extraRoll=false;settle(g);
 }else throw Error('Unknown game action.');
 return g;
}
