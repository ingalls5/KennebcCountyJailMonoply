export const gameKey='kennebec-life-v1';
export const spaceCount=100,lastSpace=spaceCount-1;
export const spinnerMax=10,spinnerStep=360/spinnerMax;
export const ranks=['Rookie','Officer','FTO','Corporal','Supervisor','Programs','Classification','Sergeant','Staff Sergeant','Lieutenant','Captain'];
export const colors=['#bc5948','#497d9b','#b48a32','#6c8661','#8b6ba4','#368e89'];
export const pawns=[
 {id:'badge',name:'Red Car',icon:'/life/cars/badge.svg'},
 {id:'keys',name:'Blue Car',icon:'/life/cars/keys.svg'},
 {id:'walkie-talkie',name:'Gold Car',icon:'/life/cars/walkie-talkie.svg'},
 {id:'energy-drink',name:'Green Car',icon:'/life/cars/energy-drink.svg'},
 {id:'flashlight',name:'Purple Car',icon:'/life/cars/flashlight.svg'},
 {id:'white-key-card',name:'Teal Car',icon:'/life/cars/white-key-card.svg'}
];
export const ruleSet='life-tiles-v1';
export const salaries=[200,350,500,650,800,850,900,1000,1150,1300,1500];
export const salary=p=>salaries[p.rank];
const option=(label,cash=0,tiles=0,extra={})=>({label,cash,tiles,...extra});
// Original face-down LIFE tiles. Values are game dollars, revealed at the final briefing.
const tileNames=['Help your community','Raise a family','Make a difference','A lifetime of service','Learn a new skill','Be there for a friend','Build a happy home','A career to remember'];
export const lifeTiles=Array.from({length:60},(_,i)=>({id:'life-'+String(i+1).padStart(2,'0'),name:tileNames[i%tileNames.length],value:[100,200,300,400,500,600,800,1000][i%8]}));
const tileById=new Map(lifeTiles.map(t=>[t.id,t]));
export const tileCount=p=>Array.isArray(p.lifeTiles)?p.lifeTiles.length:p.lifeTileCount||0;
export const tileBonus=p=>(p.lifeTiles||[]).reduce((n,id)=>n+(tileById.get(id)?.value||0),0);
export const familyBonus=p=>(p.children||0)*100;
export const homeValue=p=>p.home?.value||0;
export const score=p=>p.cash+tileBonus(p)+homeValue(p)+familyBonus(p);
export const entryTracks={
 academy:[
  {name:'Enrollment',short:'ENROLL',text:'Your Academy training starts here.'},
  {name:'Uniforms',short:'UNIFORM',text:'Buy your Academy uniforms.',cash:-100},
  {name:'Classroom Training',short:'CLASS',text:'Complete your first classes. Collect a LIFE tile.',tiles:1},
  {name:'Policy Quiz',short:'QUIZ',text:'Pass your policy quiz. Collect a LIFE tile.',tiles:1},
  {name:'Study Break',short:'BREAK',text:'Buy lunch with your classmates.',cash:-25},
  {name:'Defensive Tactics',short:'TACTICS',text:'Complete defensive tactics training. Collect a LIFE tile.',tiles:1},
  {name:'Report Writing',short:'REPORT',text:'Finish your report-writing course. Collect a LIFE tile.',tiles:1},
  {name:'First Aid',short:'FIRST AID',text:'Earn your first aid certificate. Collect a LIFE tile.',tiles:1},
  {name:'PREA Training',short:'PREA',text:'Pay $75 to complete your PREA training.',cash:-75},
  {name:'Final Exam',short:'EXAM',text:'Pass your final exam. Collect a LIFE tile.',tiles:1},
  {name:'Rest Before Graduation',short:'REST',text:'Celebrate finishing the Academy with your classmates.',cash:-50},
  {name:'Graduation',short:'GRAD',text:'Collect a LIFE tile, reveal two of five unknown job cards, and choose one job before joining the main road.',tiles:1,graduate:true}
 ],
 jail:[
  {name:'Clock In',short:'CLOCK IN',text:'Your jail career starts here.'},
  {name:'Orientation',short:'ORIENT',text:'Meet the crew. Collect a LIFE tile.',tiles:1},
  {name:'First Rounds',short:'ROUNDS',text:'Complete your first rounds and collect $100.',cash:100},
  {name:'Equipment Check',short:'GEAR',text:'Buy the gear you need for the job.',cash:-75},
  {name:'Shift Pay',short:'PAY DAY',text:'Collect your first $200 paycheck.',cash:200},
  {name:'Break Room',short:'BREAK',text:'Buy lunch with your new crew.',cash:-25},
  {name:'Work with an FTO',short:'FTO',text:'Complete a shift with your FTO. Collect a LIFE tile.',tiles:1},
  {name:'First Shift Complete',short:'JOIN',text:'Finish your first shift, collect a LIFE tile, and join First Briefing. Your chosen job determines your salary at each Pay Day.',tiles:1}
 ]
};
export const inEntry=p=>Number.isInteger(p.entryPosition);
export const crisisFork=55,crisisRejoin=66;
export const crisisSpaces=[
 {name:'Burnout',lines:['BURN','OUT'],text:'Take time to make a memory, or take another paycheck.',options:[option('Take unpaid leave',-900,2),option('Work extra shifts',250)]},
 {name:'Family Time',lines:['FAMILY','TIME'],text:'A family milestone falls on a weekend you could work.',options:[option('Be there for your family',-650,2),option('Take the overtime',550)]},
 {name:'Car Trouble',lines:['CAR','TROUBLE'],text:'Your car needs major repairs. Spend more for reliability or keep the old car running.',options:[option('Replace the unreliable car',-1000,1),option('Patch it up',-200)]},
 {name:'Broken Trust',lines:['BROKEN','TRUST'],text:'A mistake has damaged a friendship. Making it right takes more than words.',options:[option('Make amends and help out',-250,1),option('Give each other some space')]},
 {name:'Promotion Setback',lines:['PROMOTION','SETBACK'],payday:true,text:'Collect your salary at this Pay Day. Then decide whether to invest in another career opportunity.',options:[option('Pay for career training',-600,0,{promote:true}),option('Focus on extra work',250)]},
 {name:'Impulse Purchase',lines:['IMPULSE','PURCHASE'],text:'A big purchase promises a fresh start. Decide what matters to you.',options:[option('Buy the adventure you wanted',-1200,2),option('Keep the money in savings')]},
 {name:'Always the Backup',lines:['ALWAYS','BACKUP'],text:'The crew needs a hand, but your family has plans too.',options:[option('Help the crew',300),option('Make a family memory',-300,2)]},
 {name:'Change of Direction',lines:['CHANGE','DIRECTION'],text:'A specialty could change your career. Training costs money now but can increase future salary.',options:[option('Train for a new role',-850,1,{promote:true}),option('Stay and work extra shifts',450)]},
 {name:'Retirement Worries',lines:['RETIREMENT','WORRIES'],text:'Plan for your next chapter or earn more money now.',options:[option('Invest in your retirement plans',-500,2),option('Take extra work',450)]},
 {name:'A New Chapter',lines:['STOP','RESET'],text:'Choose how to start your next chapter, then rejoin the main road at Stop 67.',options:[option('Celebrate a fresh start',-600,2),option('Chase the next paycheck',300)]}
];
export const inCrisis=p=>Number.isInteger(p.crisisPosition);
function offerCrisis(g,p){g.pending={type:'crisis-fork'};g.phase='choice';entry(g,`${p.name} reached the path choice at Stop 56.`);}
function enterCrisis(g,p){p.crisisTaken=true;p.crisisPosition=0;g.pending={type:'crisis',spinAgain:true};g.phase='choice';entry(g,`${p.name} entered Mid-Life Crisis.`);}
const legacyHomes=[{id:'starter',name:'Starter Home',price:700,value:900},{id:'family',name:'Family Home',price:1400,value:1800}];
export const homes=[
 {id:'used-camper',name:'Used Camper',price:250,value:300},
 {id:'tiny-trailer',name:'Tiny Trailer',price:350,value:400},
 {id:'single-wide',name:'Older Single-Wide',price:450,value:550},
 {id:'fixer-cabin',name:'Fixer-Upper Cabin',price:550,value:650},
 {id:'park-model',name:'Park Model Trailer',price:650,value:750},
 {id:'small-condo',name:'Small Condo',price:750,value:900},
 {id:'old-bungalow',name:'Old Bungalow',price:850,value:1000},
 {id:'mill-house',name:'Mill Worker House',price:950,value:1150},
 {id:'small-ranch',name:'Small Ranch',price:1100,value:1300},
 {id:'double-wide',name:'Used Double-Wide',price:1250,value:1450}
];
// Cash and LIFE-tile choices replace reputation and energy entirely.
export const events=[
 {id:'holiday',title:'Holiday coverage',icon:'☀',text:'Work the holiday or make a memory with your family.',options:[option('Take the holiday shift',650),option('Keep your day off',0,1)]},
 {id:'rookie',title:'Show a rookie the ropes',icon:'★',text:'Help someone at the start of their career.',options:[option('Volunteer to mentor',0,1),option('Cover an extra round',150)]},
 {id:'vending',title:'Mainely Vending strikes again',icon:'▣',text:'Your snack is hanging by one corner.',options:[option('Buy a second snack',-50),option('Save your money')]},
 {id:'overtime',title:'Overtime or home time',icon:'◷',text:'There is money in another shift, but you have plans at home.',options:[option('Stay for the full shift',700),option('Keep your family plans',-100,1)]},
 {id:'training',title:'A seat in training',icon:'▤',text:'Learn a skill or cover the floor for extra pay.',options:[option('Attend the course',-150,1),option('Cover the floor',350)]},
 {id:'reports',title:'The report pile',icon:'▤',text:'Finish a busy shift and decide how to handle the paperwork.',options:[option('Help the whole crew finish',0,1),option('Finish your paid extra hours',100)]},
 {id:'boots',title:'Boots have seen better days',icon:'◇',text:'Buy a new pair of work boots.',options:[option('Buy the comfortable pair',-300),option('Get the budget pair',-100)]},
 {id:'inspection',title:'Inspection day',icon:'✓',text:'The unit needs a final check before inspection.',options:[option('Lead the paid preparation',100),option('Help your partner succeed',0,1)]},
 {id:'swap',title:'A favor on the roster',icon:'⇄',text:'A coworker needs a shift covered.',options:[option('Cover their shift',300),option('Make a favor-for-favor swap',0,1)]},
 {id:'lunch',title:'Break room potluck',icon:'☕',text:'Make time for a meal with your crew.',options:[option('Bring food for everyone',-100,1),option('Buy a quick lunch',-25)]},
 {id:'radio',title:'A radio on its last bar',icon:'▥',text:'The gear locker needs attention.',options:[option('Help organize the team’s gear',0,1),option('Buy a replacement accessory',-50)]},
 {id:'snow',title:'Snowstorm coverage',icon:'❄',text:'The roads are rough and relief is delayed.',options:[option('Stay until relief arrives',600),option('Help a stranded coworker',-100,1)]},
 {id:'checks',title:'A second set of eyes',icon:'◎',text:'A teammate asks for help before handoff.',options:[option('Stay and help your teammate',0,1),option('Take the paid extra round',150)]},
 {id:'praise',title:'A note of thanks',icon:'✉',text:'Your work made a difference.',options:[option('Celebrate with the crew',-100,1),option('Accept a cash award',200)]},
 {id:'car',title:'The car will not start',icon:'⚙',text:'Your car adds one last surprise after work.',options:[option('Pay for the repair',-400),option('Arrange rides for a while',-100)]},
 {id:'fitness',title:'Rec yard challenge',icon:'↗',text:'Join a friendly challenge or work the event.',options:[option('Join and make a memory',-50,1),option('Work the event',150)]},
 {id:'payroll',title:'Payroll correction',icon:'$',text:'An old overtime entry needs fixing.',options:[option('Find the missing paperwork',500),option('Let payroll settle it',200)]},
 {id:'weekend',title:'A weekend opens up',icon:'☀',text:'Choose extra hours or a trip with people you care about.',options:[option('Pick up extra hours',500),option('Take a weekend trip',-100,1)]},
 {id:'equipment',title:'Equipment check',icon:'◇',text:'The gear locker needs organizing.',options:[option('Work the paid inventory',100),option('Volunteer to help the crew',0,1)]},
 {id:'handoff',title:'A clean handoff',icon:'⇄',text:'Share what you know with the next shift.',options:[option('Build a shared checklist',-100,1),option('Finish a paid handoff shift',150)]},
 {id:'fundraiser',title:'Crew fundraiser',icon:'♥',text:'The team is collecting for a coworker who needs help.',options:[option('Contribute to the fund',-250,2),option('Volunteer your time',0,1)]},
 {id:'alarm',title:'A very long night',icon:'◷',text:'A busy night brings extra work and a chance to help.',options:[option('Take the paid lead shift',250),option('Stay to support a teammate',0,1)]},
 {id:'budget',title:'Plan for the future',icon:'$',text:'Earn more now or make a memory for later.',options:[option('Take a paid extra shift',450),option('Make time for yourself',-100,1)]},
 {id:'coffee',title:'The last pot of coffee',icon:'☕',text:'Make a little time for your crew.',options:[option('Buy a round for everyone',-75,1),option('Enjoy a quiet cup',-25)]},
 {id:'wedding',title:'Wedding bells',icon:'♥',text:'Choose a male or female spouse. Either choice costs $150 and awards one LIFE tile.',options:[option('Marry a male spouse',-150,1,{marry:true,spouse:'male'}),option('Marry a female spouse',-150,1,{marry:true,spouse:'female'})]},
 {id:'baby',title:'A growing family',icon:'♥',text:'Welcome a child into your family. Each child adds $100 to your retirement total.',options:[option('Take a family trip to celebrate',-200,2,{children:1}),option('Celebrate at home',-75,1,{children:1})]},
 {id:'house',title:'Buy a home',icon:'⌂',text:'Choose a home. Its sale value is added to your retirement total.',options:homes.map(home=>option('Buy the '+home.name,-home.price,0,{home}))},
 {id:'anniversary',title:'A milestone worth celebrating',icon:'★',text:'You have a story worth remembering.',options:[option('Celebrate with family and friends',-250,2),option('Enjoy a small celebration',-50,1)]}
];
export const familySpaces={
 13:{name:'Get Married',eventId:'wedding',lines:['GET','MARRIED']},
 23:{name:'Buy a House',eventId:'house',lines:['BUY A','HOUSE']},
 33:{name:'Have a Child',eventId:'baby',lines:['HAVE A','CHILD']},
 43:{name:'Have a Child',eventId:'baby',lines:['HAVE A','CHILD']},
 63:{name:'Divorce',eventId:'divorce',lines:['DIVORCE','NEW CHAPTER']},
 73:{name:'Have a Child',eventId:'baby',lines:['HAVE A','CHILD']}
};
export const spaces=Array.from({length:spaceCount},(_,i)=>{
 if(familySpaces[i])return {...familySpaces[i],type:'event',icon:familySpaces[i].eventId==='house'?'⌂':'♥'};
 if(i===0)return {name:'First briefing',type:'start',icon:'★'};
 if(i===lastSpace)return {name:'Retirement',type:'retire',icon:'☀'};
 if(i===crisisFork)return {name:'Choose your path',type:'fork',icon:'⇄'};
 if(i%18===0)return {name:'Career choice',type:'promotion',icon:'★'};
 if(i%10===5)return {name:'Pay Day',type:'payday',icon:'$'};
 if(i%10===9)return {name:'Collect a LIFE tile',type:'life',icon:'★'};
 return {name:'Life event',type:'event',icon:'?'};
});
export const chapters=['THE ACADEMY','FIND YOUR FEET','ON THE ROSTER','SHOW THE ROPES','LEAD THE SHIFT','THE HOME STRETCH'];
const shuffle=(list,random)=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function validateRoster(roster){
 if(!Array.isArray(roster)||roster.length<2||roster.length>6)throw Error('Choose two to six players.');
 const names=new Set(),chosen=new Set();return roster.map(p=>{const name=typeof p.name==='string'?p.name.trim():'';if(!name||name.length>30)throw Error('Give every player a name of up to 30 characters.');if(names.has(name.toLowerCase()))throw Error('Each player needs a different name.');if(!pawns.some(c=>c.id===p.pawn)||chosen.has(p.pawn))throw Error('Choose a different pawn for each player.');if(p.pegGender!==undefined&&!['male','female'].includes(p.pegGender))throw Error('Choose a male or female driver peg.');names.add(name.toLowerCase());chosen.add(p.pawn);return {name,pawn:p.pawn,pegGender:p.pegGender||'male'};});
}
export function createGame(roster,random=Math.random){return {version:1,ruleSet,boardSize:spaceCount,players:validateRoster(roster).map(p=>({...p,position:0,cash:1000,rank:0,retired:false,academyDone:false,careerPath:null,entryPosition:null,crisisPosition:null,crisisDone:false,crisisTaken:false,lifeTiles:[],married:false,children:0,home:null})),turn:0,phase:'choice',deck:shuffle(events.map(e=>e.id),random),cursor:0,tileDeck:shuffle(lifeTiles.map(t=>t.id),random),tileCursor:0,dice:null,route:[],pending:{type:'academy'},log:['The crew has arrived. Build a life and collect memories along the way.'],turns:0};}
export function standings(game){return game.players.map((p,index)=>({...p,index,score:game.phase==='over'?score(p):p.cash})).sort((a,b)=>b.score-a.score);}
function entry(g,text){g.log.push(text);g.log=g.log.slice(-30);}
function awardTiles(g,p,count,random){
 let received=0;
 for(let n=0;n<count;n++){
  if(g.tileCursor<g.tileDeck.length)p.lifeTiles.push(g.tileDeck[g.tileCursor++]);
  else {const donors=g.players.filter(other=>other!==p&&other.retired&&other.lifeTiles.length);if(!donors.length)break;const donor=donors[Math.floor(random()*donors.length)];p.lifeTiles.push(donor.lifeTiles.pop());entry(g,`${p.name} took a face-down LIFE tile from retired player ${donor.name}.`);}
  received++;
 }
 if(received)entry(g,`${p.name} collected ${received} LIFE tile${received===1?'':'s'}. Values stay hidden until the final briefing.`);
 if(received<count)entry(g,'No LIFE tiles are available in the bank or from retired players.');
}
function offerJobs(g,graduate,random){g.pending={type:'jobs',graduate,cards:shuffle(ranks.map((_,i)=>i).slice(1),random).slice(0,5),revealed:[]};g.phase='choice';}
function collectPay(g,p,count){if(count){const pay=salary(p)*count;p.cash+=pay;entry(g,`${p.name} collected $${pay} at ${count===1?'Pay Day':count+' Pay Days'}.`);}}
export function decision(game){
 if(!game.pending)return null;const p=game.players[game.turn];
 if(game.pending.type==='academy')return {title:'Choose your career path',icon:'★',text:'Go to the Academy for $500, then reveal two job cards and choose one at graduation. Or collect $300 and start your first day by drawing one unknown job card.',options:[option('Go to the Academy',-500),option('Start my first day on the job',300)]};
 if(game.pending.type==='jobs'){
  const {cards,revealed,graduate}=game.pending,limit=graduate?2:1,ready=revealed.length===limit;
  return {title:ready?'Choose your job':graduate?'Graduation · Reveal two job cards':'Your first job · Draw a card',icon:'▤',jobCards:true,text:ready?(graduate?'Your two jobs are revealed. Choose the one you want to keep.':'Your job is revealed. Accept it to start your first day.'):(graduate?'Pick two of these five face-down cards. After both are revealed, choose one job.':'Pick one of these five face-down cards. The job stays unknown until you pick it.'),options:[...cards.map((rank,i)=>option(revealed.includes(i)?`${ranks[rank]} · $${salaries[rank]} per Pay Day`:`Job card ${i+1}`,0,0,{drawJob:i,faceDown:!revealed.includes(i),disabled:ready||revealed.includes(i)})),...(ready?revealed.map(i=>option(`${graduate?'Choose':'Accept'} ${ranks[cards[i]]} · $${salaries[cards[i]]} per Pay Day`,0,0,{acceptJob:i})):[])]};
 }
 if(game.pending.type==='entry'){const space=entryTracks[p.careerPath][p.entryPosition];return {title:(p.careerPath==='academy'?'Academy · ':'Jail career · ')+space.name,icon:space.tiles?'★':'$',text:space.text,options:[option(space.graduate?'Graduate and draw two job cards':p.entryPosition===entryTracks[p.careerPath].length-1?'Join the main career road':'Continue',space.cash||0,space.tiles||0,{promote:!!space.promote})]};}
 if(game.pending.type==='crisis-fork')return {title:'Mid-Life Crisis · Choose your path',icon:'⇄',text:'Stay on the main road, or take ten spaces of difficult choices between cash now, career changes, and LIFE tiles for retirement. The main road continues at Stop 57; the detour rejoins at Stop 67.',options:[option('Stay on the main road'),option('Take the Mid-Life Crisis detour')]};
 if(game.pending.type==='crisis'){const space=crisisSpaces[p.crisisPosition];return {...space,title:'Mid-Life Crisis · '+space.name,icon:'⚡',options:space.options.map(o=>({...o,disabled:!!o.promote&&p.rank===ranks.length-1}))};}
 if(game.pending.type==='life'||game.pending.type==='rest')return {title:'Collect a LIFE tile',icon:'★',text:'A milestone worth remembering. Keep your tile face down; its cash bonus is revealed when everyone has retired.',options:[option('Collect your LIFE tile',0,1)]};
 if(game.pending.type==='shift')return {title:'Choose your next move',icon:'$',text:'Take extra work or make a memory for retirement.',options:[option('Work overtime',550),option('Take a class',-100,1),option('Enjoy a day off',-50,1)]};
 if(game.pending.type==='divorce')return p.married?{title:'Divorce',icon:'♥',text:'Your marriage ends. Choose how to handle the legal costs. Your home, children, and LIFE tiles stay with you.',options:[option('Settle amicably',-300,0,{divorce:true}),option('Hire a lawyer',-600,1,{divorce:true})]}:{title:'A new chapter',icon:'♥',text:'You are single, so there is no divorce to resolve. Choose how to spend this next chapter.',options:[option('Enjoy time with friends',-100,1),option('Keep saving')]};
 if(game.pending.type==='event'){
  const event=events.find(e=>e.id===game.pending.id);
  if(event.id==='house')return {...event,text:p.home?'Sell your current home and choose a new one. The old home’s value is credited toward this purchase.':event.text,options:event.options.map(o=>({...o,cash:o.cash+homeValue(p)}))};
  if(event.id==='wedding'&&p.married)return {...event,title:'Celebrate your anniversary',text:'You are already married. Celebrate another year together.',options:[option('Celebrate with friends',-250,2),option('Keep it small',-50,1)]};
  return event;
 }
 const opportunities=ranks.map((name,rank)=>({name,rank})).filter(job=>job.rank>p.rank);
 return {title:'Career choice',icon:'★',text:opportunities.length?'Choose a new job and pay its training cost, or keep your current job and collect a LIFE tile. Each job pays its listed salary at every Pay Day.':`You are a ${ranks[p.rank]}. Celebrate what you have achieved with a LIFE tile.`,options:[...opportunities.map(job=>option(`${job.name} · Pay $${300*job.rank} · Salary $${salaries[job.rank]}`,-300*job.rank,0,{promoteTo:job.rank})),option('Keep my career and collect a LIFE tile',0,1)]};
}
export function perform(before,action,random=Math.random){
 if(!before||before.phase==='over')throw Error('This career has finished.');
 const g=structuredClone(validateGame(before)),p=g.players[g.turn];
 if(action.type==='roll'){
  if(g.phase!=='roll')throw Error('Finish this turn before spinning again.');g.dice=1+Math.floor(random()*spinnerMax);entry(g,`${p.name} spun ${g.dice}.`);
  if(inEntry(p)){const start=p.entryPosition,end=Math.min(entryTracks[p.careerPath].length-1,start+g.dice);g.route=Array.from({length:end-start},(_,i)=>start+i+1);p.entryPosition=end;g.pending={type:'entry'};g.phase='choice';return g;}
  if(inCrisis(p)){const start=p.crisisPosition,end=Math.min(crisisSpaces.length-1,start+g.dice);g.route=Array.from({length:end-start},(_,i)=>start+i+1);collectPay(g,p,g.route.filter(n=>crisisSpaces[n].payday).length);p.crisisPosition=end;g.pending={type:'crisis'};g.phase='choice';return g;}
  const start=p.position,target=Math.min(lastSpace,start+g.dice),familyStop=Object.keys(familySpaces).map(Number).find(n=>n>start&&n<=target),end=Math.min(target,familyStop??lastSpace,!p.crisisDone&&start<=crisisFork?crisisFork:lastSpace),fork=!p.crisisDone&&end===crisisFork;g.route=Array.from({length:end-start},(_,i)=>start+i+1);p.position=end;collectPay(g,p,g.route.filter(n=>spaces[n].type==='payday').length);
  const review=g.route.some(n=>spaces[n].type==='promotion');
  if(fork){if(review){g.pending={type:'promotion',thenCrisis:true};g.phase='choice';}else offerCrisis(g,p);return g;}
  if(familySpaces[end]){g.pending=review?{type:'promotion',thenFamily:true}:{...(familySpaces[end].eventId==='divorce'?{type:'divorce'}:{type:'event',id:familySpaces[end].eventId}),spinAgain:true};g.phase='choice';return g;}
  if(end===lastSpace){p.retired=true;g.phase='end';g.pending=null;entry(g,`${p.name} retired. LIFE tile values will be revealed at the final briefing.`);}
  else if(spaces[end].type==='payday'&&!review){g.pending=null;g.phase='end';}
  else{let type=review?'promotion':spaces[end].type;if(type==='fork')type='event';if(type==='event'&&spaces[end].eventId){g.pending=spaces[end].eventId==='divorce'?{type:'divorce'}:{type:'event',id:spaces[end].eventId};}else if(type==='event'){if(g.cursor===g.deck.length){g.deck=shuffle(events.map(e=>e.id),random);g.cursor=0;}g.pending={type,id:g.deck[g.cursor++]};}else g.pending={type};g.phase='choice';}
 }else if(action.type==='choose'){
  if(g.phase!=='choice')throw Error('There is no decision to make.');const event=decision(g),choice=Number.isInteger(action.index)?event.options[action.index]:null;if(!choice||choice.disabled)throw Error('Choose an available option.');
  if(g.pending.type==='jobs'){
   if(Number.isInteger(choice.drawJob))g.pending.revealed.push(choice.drawJob);
   else if(Number.isInteger(choice.acceptJob)){p.rank=g.pending.cards[choice.acceptJob];entry(g,`${p.name} chose ${ranks[p.rank]} with a $${salary(p)} Pay Day salary.`);g.pending=null;g.phase='roll';g.dice=null;g.route=[];}
   return g;
  }
  const spinAgain=!!g.pending.spinAgain,thenFamily=!!g.pending.thenFamily,academy=g.pending.type==='academy',forkChoice=g.pending.type==='crisis-fork',thenCrisis=!!g.pending.thenCrisis,finishCrisis=g.pending.type==='crisis'&&p.crisisPosition===crisisSpaces.length-1,finishEntry=g.pending.type==='entry'&&p.entryPosition===entryTracks[p.careerPath].length-1,fullStop=spinAgain||finishEntry||finishCrisis||forkChoice;
  p.cash+=choice.cash;if(Number.isInteger(choice.promoteTo))p.rank=choice.promoteTo;if(choice.promote)p.rank=Math.min(ranks.length-1,p.rank+1);if(choice.marry){p.married=true;p.spouse=choice.spouse||null;}if(choice.divorce){p.married=false;p.spouse=null;}if(choice.children)p.children+=choice.children;if(choice.home)p.home=structuredClone(choice.home);if(choice.tiles)awardTiles(g,p,choice.tiles,random);
  entry(g,`${p.name}: ${event.title} — ${choice.label}.`);g.pending=null;g.phase=academy||fullStop?'roll':'end';if(fullStop){g.route=[];g.dice=null;entry(g,`${p.name} resolved the full stop and can spin again.`);}
  if(academy){p.academyDone=true;p.careerPath=action.index===0?'academy':'jail';p.entryPosition=0;if(p.careerPath==='jail')offerJobs(g,false,random);}if(finishEntry){p.entryPosition=null;if(p.careerPath==='academy')offerJobs(g,true,random);}
  if(finishCrisis){p.crisisPosition=null;p.crisisDone=true;p.position=crisisRejoin;entry(g,`${p.name} rejoined the main road at Stop ${crisisRejoin+1}.`);}
  if(thenFamily){const id=familySpaces[p.position].eventId;g.pending={...(id==='divorce'?{type:'divorce'}:{type:'event',id}),spinAgain:true};g.phase='choice';}
  if(thenCrisis)offerCrisis(g,p);if(forkChoice){if(action.index===1)enterCrisis(g,p);else{p.crisisDone=true;p.crisisTaken=false;p.position=crisisFork+1;}}
 }else if(action.type==='end'){
  if(g.phase!=='end')throw Error('Resolve the turn before ending it.');g.turns++;g.route=[];
  if(g.players.every(p=>p.retired)){g.phase='over';entry(g,'Everyone has retired. Reveal all LIFE tiles and add their bonuses, home values, and $100 per child to savings.');}
  else{do{g.turn=(g.turn+1)%g.players.length;}while(g.players[g.turn].retired);g.phase=g.players[g.turn].academyDone?'roll':'choice';g.pending=g.phase==='choice'?{type:'academy'}:null;g.dice=null;}
 }else throw Error('Choose a valid career action.');return g;
}
export function validateGame(source){
 const invalid=()=>{throw Error('This saved career could not be read.');},integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 if(source?.version!==1||!Array.isArray(source.players))invalid();validateRoster(source.players);
 const size=source.boardSize===undefined?36:source.boardSize;if(![36,spaceCount].includes(size))invalid();
 if(!['roll','choice','end','over'].includes(source.phase)||!integer(source.turn,0,source.players.length-1)||!integer(source.turns,0,10000)||!Array.isArray(source.deck)||new Set(source.deck).size!==source.deck.length||source.deck.some(id=>!events.some(e=>e.id===id))||!integer(source.cursor,0,source.deck.length)||!Array.isArray(source.log)||source.log.some(t=>typeof t!=='string')||!Array.isArray(source.route)||source.route.some(n=>!integer(n,1,size-1))||(source.dice!==null&&!integer(source.dice,1,spinnerMax)))invalid();
 for(const p of source.players)if(!integer(p.position,0,size-1)||!Number.isSafeInteger(p.cash)||!integer(p.rank,0,ranks.length-1)||typeof p.retired!=='boolean'||typeof p.academyDone!=='boolean'||p.retired!==(p.position===size-1)||(p.careerPath!==undefined&&![null,'academy','jail'].includes(p.careerPath)))invalid();
 let g=source;
 if(size!==spaceCount||source.ruleSet!==ruleSet){
  if(source.ruleSet!==undefined&&source.ruleSet!==ruleSet)invalid();
  const legacyIds=events.slice(0,24).map(e=>e.id);if(source.ruleSet===undefined&&!legacyIds.every(id=>source.deck.includes(id)))invalid();
  g=structuredClone(source);
  if(size!==spaceCount){const position=n=>Math.round(n/(size-1)*lastSpace);g.players.forEach(p=>p.position=position(p.position));g.route=g.route.map(position);g.boardSize=spaceCount;}
  if(source.ruleSet!==ruleSet){g.ruleSet=ruleSet;g.deck.push(...events.filter(e=>!g.deck.includes(e.id)).map(e=>e.id));g.tileDeck=shuffle(lifeTiles.map(t=>t.id),Math.random);g.tileCursor=0;g.players.forEach(p=>{delete p.reputation;delete p.energy;p.lifeTiles=[];p.married=false;p.children=0;p.home=null;});g.log.push('Saved career updated to money, salaries, and LIFE tiles.');}
 }
 if(g.deck.length!==events.length||g.tileDeck?.length!==lifeTiles.length||new Set(g.tileDeck).size!==lifeTiles.length||g.tileDeck.some(id=>!tileById.has(id))||!integer(g.tileCursor,0,lifeTiles.length))invalid();
 const held=[];for(const p of g.players){
  if(!Array.isArray(p.lifeTiles)||p.lifeTiles.some(id=>!tileById.has(id))||(p.pegGender!==undefined&&!['male','female'].includes(p.pegGender))||typeof p.married!=='boolean'||(p.spouse!==undefined&&![null,'male','female'].includes(p.spouse))||!integer(p.children,0,1000)||(p.home!==null&&![...homes,...legacyHomes].some(h=>h.id===p.home?.id&&h.value===p.home.value&&h.price===p.home.price)))invalid();held.push(...p.lifeTiles);
  if((p.crisisDone!==undefined&&typeof p.crisisDone!=='boolean')||(p.crisisTaken!==undefined&&typeof p.crisisTaken!=='boolean')||(p.crisisPosition!==undefined&&p.crisisPosition!==null&&(!integer(p.crisisPosition,0,crisisSpaces.length-1)||p.crisisDone||!p.academyDone||inEntry(p)||p.position!==crisisFork||p.retired)))invalid();
  if(p.entryPosition!==undefined&&p.entryPosition!==null&&(!integer(p.entryPosition,0,(entryTracks[p.careerPath]?.length||0)-1)||!p.academyDone||p.position!==0||p.retired))invalid();
 }
 if(new Set(held).size!==held.length||held.length!==g.tileCursor||held.some(id=>!g.tileDeck.slice(0,g.tileCursor).includes(id)))invalid();
 if(g.pending?.type==='jobs'){
  const j=g.pending,p=g.players[g.turn];
  if(g.phase!=='choice'||typeof j.graduate!=='boolean'||!Array.isArray(j.cards)||j.cards.length!==5||new Set(j.cards).size!==5||j.cards.some(n=>!integer(n,1,ranks.length-1))||!Array.isArray(j.revealed)||new Set(j.revealed).size!==j.revealed.length||j.revealed.length>(j.graduate?2:1)||j.revealed.some(n=>!integer(n,0,4))||!p.academyDone||p.careerPath!==(j.graduate?'academy':'jail')||(j.graduate?inEntry(p):p.entryPosition!==0))invalid();
 }
 const p=g.players[g.turn];if(g.phase==='choice'&&(!g.pending||!['academy','entry','crisis-fork','crisis','promotion','life','rest','shift','event','divorce','jobs'].includes(g.pending.type)||(g.pending.type==='event'&&!events.some(e=>e.id===g.pending.id))||(g.pending.type==='entry'&&!inEntry(p))||(g.pending.type==='crisis'&&!inCrisis(p))||(g.pending.type==='crisis-fork'&&(p.position!==crisisFork||p.crisisDone||inCrisis(p)||inEntry(p)||!p.academyDone))||(g.pending.thenCrisis!==undefined&&(g.pending.thenCrisis!==true||g.pending.type!=='promotion'||p.position!==crisisFork||p.crisisDone||inEntry(p)||inCrisis(p)))))invalid();
 if(g.phase==='over'?!g.players.every(p=>p.retired):g.phase!=='end'&&p.retired)invalid();return g;
}
export function loadGame(){try{return validateGame(JSON.parse(localStorage.getItem(gameKey)));}catch{return null;}}
