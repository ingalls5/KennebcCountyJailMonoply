export const gameKey='kennebec-life-v1';
export const spaceCount=100,lastSpace=spaceCount-1;
export const spinnerMax=10,spinnerStep=360/spinnerMax;
export const ranks=['Rookie','Officer','FTO','Corporal','Supervisor'];
export const colors=['#bc5948','#497d9b','#b48a32','#6c8661','#8b6ba4','#368e89'];
export const pawns=[
 {id:'badge',name:'Badge',icon:'/pawns/badge.svg'},
 {id:'keys',name:'Key',icon:'/pawns/keys.svg'},
 {id:'walkie-talkie',name:'Radio',icon:'/pawns/walkie-talkie.svg'},
 {id:'energy-drink',name:'Energy Drink',icon:'/pawns/energy-drink.svg'},
 {id:'flashlight',name:'Flashlight',icon:'/pawns/flashlight.svg'},
 {id:'white-key-card',name:'Key Card',icon:'/pawns/white-key-card.svg'}
];
const option=(label,cash=0,reputation=0,energy=0)=>({label,cash,reputation,energy});
// Original career events. Values are game money, rather than county pay rates.
export const events=[
 {id:'holiday',title:'Holiday coverage',icon:'☀',text:'The holiday roster has an empty spot. Your family has plans, too.',options:[option('Take the holiday shift',650,1,-3),option('Keep your day off',0,0,3)]},
 {id:'rookie',title:'Show a rookie the ropes',icon:'★',text:'A new officer could use someone who remembers their own first day.',options:[option('Take time to mentor',0,3,-2),option('Help after your round',0,1,0)]},
 {id:'vending',title:'Mainely Vending strikes again',icon:'▣',text:'Your snack is hanging by one corner. The whole break room is watching.',options:[option('Buy a second snack',-50,0,2),option('Walk away with dignity',0,1,0)]},
 {id:'overtime',title:'Mandatory overtime',icon:'◷',text:'You are asked to stay. There is money in another shift, but energy is running low.',options:[option('Stay for the full shift',700,0,-4),option('Arrange a shift swap',-100,1,1)]},
 {id:'training',title:'A seat in training',icon:'▤',text:'A course opens up. Invest in your skills or cover the floor for extra pay.',options:[option('Attend the course',-150,3,-1),option('Cover the floor',350,0,-2)]},
 {id:'reports',title:'The report pile',icon:'▤',text:'There is paperwork left at the end of the shift. A careful report gets noticed.',options:[option('Finish it properly',0,2,-2),option('Get help from the team',-50,1,0)]},
 {id:'boots',title:'Boots have seen better days',icon:'◇',text:'Another long round makes the decision for you. How much do you spend?',options:[option('Buy the comfortable pair',-300,0,3),option('Get the budget pair',-100,0,1)]},
 {id:'inspection',title:'Inspection day',icon:'✓',text:'The unit needs a final check before inspection. Lead the sweep or support your partner.',options:[option('Lead the inspection prep',100,3,-2),option('Support your partner',0,1,1)]},
 {id:'swap',title:'A favor on the roster',icon:'⇄',text:'A coworker needs a shift covered. They offer to return the favor later.',options:[option('Cover their shift',300,2,-3),option('Offer a smaller swap',0,1,-1)]},
 {id:'lunch',title:'Break room potluck',icon:'☕',text:'Someone remembered the slow cooker. You can make time for the crew.',options:[option('Bring food and join in',-100,2,2),option('Take a quick coffee break',-25,0,1)]},
 {id:'radio',title:'A radio on its last bar',icon:'▥',text:'Your radio battery needs attention before the next round.',options:[option('Check the whole team’s gear',0,2,-1),option('Swap your battery',0,1,0)]},
 {id:'snow',title:'Snowstorm coverage',icon:'❄',text:'The roads are rough and relief is delayed. Time to make a plan.',options:[option('Stay until relief arrives',600,2,-4),option('Coordinate nearby coverage',100,2,-1)]},
 {id:'checks',title:'A second set of eyes',icon:'◎',text:'A teammate asks you to double-check the log before handoff.',options:[option('Review the whole log',0,3,-2),option('Check it together',0,1,-1)]},
 {id:'praise',title:'A note of thanks',icon:'✉',text:'Your calm response helped a difficult shift. The supervisor noticed.',options:[option('Share credit with the crew',0,3,1),option('Ask for a training opportunity',-100,4,-1)]},
 {id:'car',title:'The car will not start',icon:'⚙',text:'After a long shift, your car adds one last surprise.',options:[option('Pay for the repair',-400,0,0),option('Arrange rides for a while',-100,1,-2)]},
 {id:'fitness',title:'Rec yard challenge',icon:'↗',text:'The crew starts a friendly fitness challenge. Join in or catch your breath.',options:[option('Join the challenge',-50,1,3),option('Take a quiet break',0,0,2)]},
 {id:'payroll',title:'Payroll correction',icon:'$',text:'An old overtime entry needs fixing. Check your records before the deadline.',options:[option('Find the missing paperwork',500,1,-2),option('Ask payroll to investigate',200,0,0)]},
 {id:'weekend',title:'A weekend opens up',icon:'☀',text:'For once, the schedule gives you a choice. What do you do with the time?',options:[option('Pick up extra hours',500,0,-3),option('Spend it away from work',-100,0,4)]},
 {id:'equipment',title:'Equipment check',icon:'◇',text:'The gear locker needs organizing before the next crew arrives.',options:[option('Organize and inventory it',100,2,-2),option('Handle the essentials',0,1,-1)]},
 {id:'handoff',title:'A clean handoff',icon:'⇄',text:'A clear briefing can save the next shift a lot of confusion.',options:[option('Give a thorough briefing',0,2,-1),option('Build a shared checklist',-100,3,0)]},
 {id:'fundraiser',title:'Crew fundraiser',icon:'♥',text:'The team is collecting for a coworker who needs a hand.',options:[option('Contribute to the fund',-250,3,1),option('Volunteer your time',0,2,-2)]},
 {id:'alarm',title:'A very long night',icon:'◷',text:'An alarm, a head count, and a stack of reports. This shift has everything.',options:[option('Take the lead',250,3,-4),option('Work steadily with the team',100,1,-2)]},
 {id:'budget',title:'Plan for the future',icon:'$',text:'Retirement is getting closer. A little planning now could make a difference.',options:[option('Take a paid extra shift',450,0,-2),option('Make time for yourself',0,1,2)]},
 {id:'coffee',title:'The last pot of coffee',icon:'☕',text:'You have a break before the next round. Make it count.',options:[option('Buy a round for the crew',-75,2,2),option('Enjoy a quiet cup',-25,0,3)]}
];
export const spaces=Array.from({length:spaceCount},(_,i)=>{
 if(i===0)return {name:'First briefing',type:'start',icon:'★'};
 if(i===lastSpace)return {name:'Retirement',type:'retire',icon:'☀'};
 if(i%18===0)return {name:'Promotion review',type:'promotion',icon:'★'};
 if(i%10===5)return {name:'Choose your shift',type:'shift',icon:'◷'};
 if(i%10===9)return {name:'Days off',type:'rest',icon:'☕'};
 return {name:['','On the roster','County curveball',''][i%4]||'On the roster',type:'event',icon:'?'};
});
export const chapters=['THE ACADEMY','FIND YOUR FEET','ON THE ROSTER','SHOW THE ROPES','LEAD THE SHIFT','THE HOME STRETCH'];
const shuffle=(list,random)=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function validateRoster(roster){
 if(!Array.isArray(roster)||roster.length<2||roster.length>6)throw Error('Choose two to six players.');
 const names=new Set(),chosen=new Set();
 return roster.map(p=>{const name=typeof p.name==='string'?p.name.trim():'';if(!name||name.length>30)throw Error('Give every player a name of up to 30 characters.');if(names.has(name.toLowerCase()))throw Error('Each player needs a different name.');if(!pawns.some(c=>c.id===p.pawn)||chosen.has(p.pawn))throw Error('Choose a different pawn for each player.');names.add(name.toLowerCase());chosen.add(p.pawn);return {name,pawn:p.pawn};});
}
export function createGame(roster,random=Math.random){return {version:1,boardSize:spaceCount,players:validateRoster(roster).map(p=>({...p,position:0,cash:1000,reputation:3,energy:7,rank:0,retired:false,academyDone:false})),turn:0,phase:'choice',deck:shuffle(events.map(e=>e.id),random),cursor:0,dice:null,route:[],pending:{type:'academy'},log:['The crew has arrived for their first briefing.'],turns:0};}
export const score=p=>p.cash+p.reputation*100+p.energy*50;
export function standings(game){return game.players.map((p,i)=>({...p,index:i,score:score(p)})).sort((a,b)=>b.score-a.score);}
const clamp=n=>Math.max(0,Math.min(10,n));
function apply(player,effect){player.cash+=effect.cash;player.reputation=clamp(player.reputation+effect.reputation);player.energy=clamp(player.energy+effect.energy);}
function entry(g,text){g.log.push(text);g.log=g.log.slice(-30);}
export function decision(game){
 if(!game.pending)return null;
 const p=game.players[game.turn];
 if(game.pending.type==='academy')return {title:'Go to the Academy?',icon:'★',text:'Begin with academy training or start earning on the floor. The Academy costs $500, builds 3 reputation, and starts you at Officer rank for higher shift pay.',options:[{...option('Go to the Academy',-500,3,-1),promote:true},option('Start on the floor',300,0,-1)]};
 if(game.pending.type==='event')return events.find(e=>e.id===game.pending.id);
 if(game.pending.type==='shift')return {title:'Your shift. Your call.',icon:'◷',text:'Money, experience, or a little breathing room? Choose what you need today.',options:[option('Work overtime',550,0,-3),option('Take a training shift',-100,3,-1),option('Take a recovery day',-50,0,4)]};
 if(game.pending.type==='rest')return {title:'You earned a day off.',icon:'☕',text:'Step away from the floor. Choose how you spend your time.',options:[option('A quiet day at home',0,0,3),option('Get away for the day',-150,1,5)]};
 const cost=p.rank+1;
 return {title:'Promotion review',icon:'★',text:p.rank>=4?'You have reached Supervisor. Keep setting an example.':`Promotion to ${ranks[p.rank+1]} needs ${cost} reputation and 2 energy. Higher rank adds $150 to each turn’s pay.`,options:[{...option(p.rank>=4?'Lead by example':`Step up to ${ranks[p.rank+1]}`,0,-cost,-2),promote:true,disabled:p.rank>=4||p.reputation<cost||p.energy<2},option('Build experience first',0,2,2)]};
}
export function perform(before,action,random=Math.random){
 if(!before||before.phase==='over')throw Error('This career has finished.');
 const g=structuredClone(validateGame(before)),p=g.players[g.turn];
 if(action.type==='roll'){
  if(g.phase!=='roll')throw Error('Finish this shift before spinning again.');
  g.dice=1+Math.floor(random()*spinnerMax);const start=p.position,end=Math.min(lastSpace,start+g.dice);g.route=Array.from({length:end-start},(_,i)=>start+i+1);p.position=end;
  const pay=200+p.rank*150;p.cash+=pay;p.energy=clamp(p.energy-1);entry(g,`${p.name} spun ${g.dice} and earned $${pay} in shift pay.`);
  // Passing reviews gives every career a chance to advance, even with large rolls.
  const review=g.route.some(n=>spaces[n].type==='promotion');
  if(end===lastSpace){p.retired=true;g.phase='end';g.pending=null;entry(g,`${p.name} retired with a score of ${score(p).toLocaleString('en-US')}.`);}
  else {let type=review?'promotion':spaces[end].type;if(type==='event'){if(g.cursor===g.deck.length){g.deck=shuffle(events.map(e=>e.id),random);g.cursor=0;}g.pending={type,id:g.deck[g.cursor++]};}else g.pending={type};g.phase='choice';}
 }else if(action.type==='choose'){
  if(g.phase!=='choice')throw Error('There is no decision to make.');
  const event=decision(g),choice=Number.isInteger(action.index)?event.options[action.index]:null;
  if(!choice||choice.disabled)throw Error('Choose an available option.');
  const academy=g.pending.type==='academy';apply(p,choice);if(choice.promote)p.rank++;
  // Exhaustion costs game money, then gives enough rest to keep playing.
  let recovery='';if(p.energy===0){p.cash-=200;p.energy=3;recovery=' Exhaustion: $200 recovery cost; energy restored to 3.';}
  entry(g,`${p.name}: ${choice.label}.${recovery}`);g.pending=null;g.phase=academy?'roll':'end';if(academy)p.academyDone=true;
 }else if(action.type==='end'){
  if(g.phase!=='end')throw Error('Resolve the shift before ending your turn.');
  g.turns++;g.route=[];
  if(g.players.every(p=>p.retired)){g.phase='over';entry(g,'The whole crew has retired. Final scores are in.');}
  else {do{g.turn=(g.turn+1)%g.players.length;}while(g.players[g.turn].retired);g.phase=g.players[g.turn].academyDone?'roll':'choice';g.pending=g.phase==='choice'?{type:'academy'}:null;g.dice=null;}
 }else throw Error('Choose a valid career action.');
 return g;
}
export function validateGame(g){
 if(g?.version!==1||!Array.isArray(g.players))throw Error('This saved career could not be read.');
 validateRoster(g.players);
 const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const savedSize=g.boardSize===undefined?36:g.boardSize;if(![36,spaceCount].includes(savedSize))throw Error('This saved career could not be read.');
 if(!['roll','choice','end','over'].includes(g.phase)||!integer(g.turn,0,g.players.length-1)||!integer(g.turns,0,10000)||!Array.isArray(g.deck)||g.deck.length!==events.length||new Set(g.deck).size!==events.length||g.deck.some(id=>!events.some(e=>e.id===id))||!integer(g.cursor,0,g.deck.length)||!Array.isArray(g.log)||g.log.some(t=>typeof t!=='string')||!Array.isArray(g.route)||g.route.some(n=>!integer(n,1,savedSize-1))||(g.dice!==null&&!integer(g.dice,1,spinnerMax)))throw Error('This saved career could not be read.');
 for(const p of g.players)if(!integer(p.position,0,savedSize-1)||!Number.isSafeInteger(p.cash)||!integer(p.rank,0,4)||!integer(p.reputation,0,10)||!integer(p.energy,0,10)||typeof p.retired!=='boolean'||typeof p.academyDone!=='boolean'||p.retired!==(p.position===savedSize-1))throw Error('This saved career could not be read.');
 if(g.phase==='choice'&&(!g.pending||!['academy','promotion','shift','rest','event'].includes(g.pending.type)||(g.pending.type==='event'&&!events.some(e=>e.id===g.pending.id))))throw Error('This saved career could not be read.');
 if(g.phase==='over'?!g.players.every(p=>p.retired):g.phase!=='end'&&g.players[g.turn].retired)throw Error('This saved career could not be read.');
 if(savedSize!==spaceCount){
  const migrated=structuredClone(g),position=n=>Math.round(n/(savedSize-1)*lastSpace);
  migrated.boardSize=spaceCount;migrated.players.forEach(p=>p.position=position(p.position));migrated.route=migrated.route.map(position);
  return migrated;
 }
 return g;
}
export function loadGame(){try{return validateGame(JSON.parse(localStorage.getItem(gameKey)));}catch{return null;}}
