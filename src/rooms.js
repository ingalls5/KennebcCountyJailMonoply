import {createGame,defaultConfig,validateConfig,boardRevision,migrateConfig,validateGame,suspects,perform as clueAction,actor as clueActor,reachable as clueReachable} from '../public/clue/rules.js';
import {newGame,perform as monopolyAction} from '../public/economy.js';
import {pawns} from '../public/players.js';
import {createGame as createLife,perform as lifeAction,pawns as lifePawns,validateGame as validateLife} from '../public/life/rules.js';

const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function body(request){const reader=request.body?.getReader();if(!reader)return {};let length=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>10000){await reader.cancel();fail(413,'The request is too large.');}chunks.push(value);}try{const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}const data=JSON.parse(new TextDecoder().decode(bytes));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{fail(400,'Send a valid game request.');}}
export function random(){return crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;}
export function roomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>alphabet[n%alphabet.length]).join('');}
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
export function monopolyActor(game){return game.phase==='auction'?game.auction.actor:game.phase==='debt'?game.debts[0].payer:game.turn;}
export function project(room,member){
 const playerIndex=room.members.findIndex(p=>p.id===member.id);
 let state=room.state?structuredClone(room.state):null;
 if(state&&room.kind==='clue'){
  if(state.phase!=='over')delete state.solution;
  state.players.forEach((p,i)=>{if(i!==playerIndex){p.hand=[];p.notes={};}});
  if(state.pending&&!(state.phase==='view'&&state.turn===playerIndex))state.pending.card=null;
 }else if(state){delete state.cards;if(room.kind==='life'){delete state.deck;if(state.pending?.type==='jobs')state.pending.cards=state.pending.cards.map((rank,i)=>state.pending.revealed.includes(i)?rank:null);if(state.pending?.careerCards)state.pending.careerCards=state.pending.careerCards.map((rank,i)=>state.pending.revealed.includes(i)?rank:null);if(state.pending?.houseCards)state.pending.houseCards=state.pending.houseCards.map((id,i)=>state.pending.revealed.includes(i)?id:null);state.lifeTilesRemaining=state.tileDeck.length-state.tileCursor;delete state.tileDeck;delete state.tileCursor;state.players.forEach(p=>{p.lifeTileCount=p.lifeTiles.length;if(state.phase!=='over')delete p.lifeTiles;});}}
 const motion=room.motion?{id:room.motion.id,actor:room.motion.actor,route:room.motion.next.route,dice:room.motion.dice,acknowledged:room.motion.acknowledged}:null;
 return {code:room.code,kind:room.kind,status:state?'playing':'lobby',revision:room.revision,round:room.round||0,viewer:playerIndex,host:room.host===member.id,members:room.members.map(p=>({id:p.id,name:p.name,choice:p.choice,...(room.kind==='life'?{pegGender:p.pegGender||'male'}:{}),host:p.id===room.host})),config:room.config,state,motion,trade:room.trade||null,event:room.event||null};
}
export class GameRoom {
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.room=null;ctx.blockConcurrencyWhile(async()=>{this.room=await ctx.storage.get('room')||null;if(this.room?.kind==='clue'&&(this.room.layoutRevision||1)<boardRevision){this.room.config=migrateConfig(this.room.config,this.room.layoutRevision||1);if(this.room.state){this.room.state=validateGame(this.room.state);}this.room.layoutRevision=boardRevision;}if(this.room?.kind==='life'&&this.room.state)this.room.state=validateLife(this.room.state);});}
 async persist(){await this.ctx.storage.put('room',this.room);await this.ctx.storage.setAlarm(Date.now()+7*24*60*60*1000);}
 async alarm(){await this.ctx.storage.deleteAll();this.room=null;}
 async fetch(request){return this.ctx.blockConcurrencyWhile(async()=>{try{return await this.handle(request);}catch(error){return json({error:error.message},error.status||400);}});}
 async handle(request){
  const path=new URL(request.url).pathname;
  if(path==='/init'&&request.method==='POST'){
   if(this.room)fail(409,'Room code is already in use.');const data=await body(request);if(!['clue','monoply','life'].includes(data.kind))fail(400,'Choose a game.');
   const member=this.newMember(data,[]),config=data.kind==='clue'?validateConfig(data.config||defaultConfig()):null;
   this.room={code:data.code,kind:data.kind,layoutRevision:boardRevision,config,members:[member],host:member.id,state:null,revision:1,round:0,processed:[],motion:null,trade:null,event:null};await this.persist();return json({...project(this.room,member),token:member.token},201);
  }
  if(!this.room)fail(404,'That room was not found or has expired. Check the code or create a new room.');
  if(path==='/public'&&request.method==='GET')return json({code:this.room.code,kind:this.room.kind,status:this.room.state?'playing':'lobby',config:this.room.config,choices:this.room.members.map(p=>p.choice),count:this.room.members.length});
  if(path==='/join'&&request.method==='POST'){
   if(this.room.state)fail(409,'This game has started. Use the browser you joined with to reconnect.');if(this.room.members.length>=6)fail(409,'This room already has six players.');const member=this.newMember(await body(request),this.room.members);this.room.members.push(member);if(!this.room.host)this.room.host=member.id;this.room.revision++;await this.persist();return json({...project(this.room,member),token:member.token},201);
  }
  const credential=request.headers.get('Authorization')?.replace(/^Bearer /,'');const member=this.room.members.find(p=>p.token===credential);if(!member)fail(401,'Your player seat could not be verified. Join the room from the setup page.');
  if(path==='/state'&&request.method==='GET')return json(project(this.room,member));
  if(request.method!=='POST')fail(405,'Use a valid game action.');
  const data=await body(request);if(typeof data.id!=='string'||data.id.length>80)fail(400,'The action needs an identifier.');const actionId=member.id+':'+data.id;
  if(this.room.processed.includes(actionId))return json(project(this.room,member));
  if(data.revision!==this.room.revision)return json({error:'The game changed. Your screen has refreshed; try again.',snapshot:project(this.room,member)},409);
  const index=this.room.members.indexOf(member);let event=null;
  if(path==='/start'||path==='/restart'){
   if(member.id!==this.room.host)fail(403,'Only the room host can start a game.');if(this.room.motion)fail(409,'Finish the current move first.');if(path==='/start'&&this.room.state)fail(409,'This game has already started.');
   const minimum=this.room.kind==='clue'?3:2;if(this.room.members.length<minimum)fail(400,`You need at least ${minimum} players to start.`);
   const roster=this.room.members.map(p=>this.room.kind==='clue'?{name:p.name,suspect:p.choice}:{name:p.name,pawn:p.choice,...(this.room.kind==='life'?{pegGender:p.pegGender||'male'}:{})});this.room.state=this.room.kind==='clue'?createGame(roster,this.room.config,random):this.room.kind==='life'?createLife(roster,random):newGame(roster);this.room.trade=null;this.room.round++;this.room.event=null;
  }else if(path==='/end'){
   if(member.id!==this.room.host)fail(403,'Only the room host can end the game.');
   if(!this.room.state)fail(409,'There is no game to end.');
   if(this.room.motion)fail(409,'Finish the current move before ending the game.');
   const {code,kind}=this.room;
   await this.ctx.storage.deleteAll();await this.ctx.storage.deleteAlarm();this.room=null;
   return json({ended:true,code,kind});
  }else if(path==='/leave'){
   if(this.room.state)fail(409,'The game has started. Your seat is kept so you can reconnect.');this.room.members.splice(index,1);if(this.room.host===member.id)this.room.host=this.room.members[0]?.id||null;
  }else if(path==='/remove'){
   if(member.id!==this.room.host||this.room.state)fail(403,'Only the host can remove players before the game starts.');const target=this.room.members.findIndex(p=>p.id===data.player&&p.id!==member.id);if(target<0)fail(400,'Choose another player.');this.room.members.splice(target,1);
  }else if(path==='/action'){
   if(!this.room.state)fail(409,'Wait for the host to start the game.');const action=data.action;if(!action||typeof action.type!=='string')fail(400,'Choose a game action.');
   if(this.room.kind==='life'){
    if(this.room.state.turn!==index)fail(403,'Wait for your turn.');
    if(!['roll','choose','end'].includes(action.type))fail(400,'Choose a valid career action.');
    this.room.state=lifeAction(this.room.state,{type:action.type,index:action.index},random);
    event={id:crypto.randomUUID(),type:action.type,actor:index};
   }else if(this.room.kind==='clue'){
    if(action.type==='note'){
     if(!this.room.state.deck.includes(action.card)||!['unknown','no','maybe','yes'].includes(action.value))fail(400,'Choose a valid notebook mark.');if(this.room.state.phase==='over')fail(409,'This case is closed.');const next=structuredClone(this.room.state);if(next.players[index].hand.includes(action.card)&&action.value!=='no')fail(400,'A card in your hand is ruled out.');next.players[index].notes[action.card]=action.value;this.room.state=next;
    }else{
     if(clueActor(this.room.state)!==index)fail(403,'Wait for your turn.');if(!['roll','move','passage','suggest','show','hide','accuse','end'].includes(action.type))fail(400,'Choose a valid game action.');
     const before=this.room.state;this.room.state=clueAction(before,action,random);event={id:crypto.randomUUID(),type:action.type,actor:index,from:before.positions[before.players[index].suspect],to:this.room.state.positions[before.players[index].suspect],path:action.type==='move'?clueReachable(before).get(action.node):null};
    }
   }else if(action.type==='continue-card'){
    const motion=this.room.motion;if(!motion||motion.actor!==index)fail(403,'Only the moving player can continue this card.');const count=motion.next.route.filter(s=>s.card).length;if(action.cardIndex!==motion.acknowledged||motion.acknowledged>=count)fail(409,'This card has already been continued.');motion.acknowledged++;
   }else if(action.type==='finish-motion'){
    const motion=this.room.motion;if(!motion||motion.actor!==index)fail(403,'Only the moving player can finish this move.');if(motion.acknowledged!==motion.next.route.filter(s=>s.card).length)fail(409,'Read and continue the drawn cards first.');this.room.state=motion.next;event={id:motion.id,type:motion.type,actor:index,transfers:motion.next.transfers};this.room.motion=null;
   }else if(['accept-trade','decline-trade','cancel-trade'].includes(action.type)){
    const trade=this.room.trade;if(!trade)fail(409,'There is no trade offer.');if(action.type==='cancel-trade'?index!==trade.from:index!==trade.to)fail(403,'This trade decision belongs to another player.');if(action.type==='accept-trade'){this.room.state=monopolyAction(this.room.state,{type:'trade',...trade.action});event={id:crypto.randomUUID(),type:'trade',actor:trade.from,transfers:this.room.state.transfers};}this.room.trade=null;
   }else{
    if(this.room.motion||this.room.trade)fail(409,'Finish the move or trade offer first.');if(monopolyActor(this.room.state)!==index)fail(403,'Wait for your turn.');if(!['roll','buy','auction','bid','pass','build','sell','sell-group','mortgage','redeem','trade','bail','free-card','end','bankrupt'].includes(action.type))fail(400,'Choose a valid game action.');
    const clean={...action};if(clean.type==='roll')clean.dice=[1+Math.floor(random()*6),1+Math.floor(random()*6)];const next=monopolyAction(this.room.state,clean);
    if(clean.type==='trade'){this.room.trade={id:crypto.randomUUID(),from:index,to:Number(clean.player),action:{index:Number(clean.index),player:Number(clean.player),cash:Number(clean.cash),exchange:clean.exchange===null||clean.exchange===''?null:Number(clean.exchange)}};}
    else if(next.route.length||clean.type==='roll'){this.room.motion={id:crypto.randomUUID(),type:action.type,actor:index,next,dice:clean.type==='roll'?clean.dice:[],acknowledged:0};}
    else{this.room.state=next;event={id:crypto.randomUUID(),type:clean.type,actor:index,transfers:next.transfers};}
   }
  }else fail(404,'This game action was not found.');
  this.room.revision++;if(event)this.room.event=event;this.room.processed.push(actionId);this.room.processed=this.room.processed.slice(-128);await this.persist();return json(path==='/leave'?{left:true,code:this.room.code}:project(this.room,member));
 }
 newMember(data,members){
  const name=typeof data.name==='string'?data.name.trim():'';if(!name||name.length>30)fail(400,'Enter your name (up to 30 characters).');if(members.some(p=>p.name.toLowerCase()===name.toLowerCase()))fail(409,'Choose a different player name.');
  const kind=this.room?.kind||data.kind,list=kind==='clue'?suspects:kind==='life'?lifePawns:pawns;if(!list.some(p=>p.id===data.choice))fail(400,kind==='clue'?'Choose a role.':'Choose a valid pawn.');if(members.some(p=>p.choice===data.choice))fail(409,kind==='clue'?'That role is already taken. Choose another.':'Choose an available pawn.');if(kind==='life'&&data.pegGender!==undefined&&!['male','female'].includes(data.pegGender))fail(400,'Choose a male or female driver peg.');return {id:crypto.randomUUID(),token:token(),name,choice:data.choice,...(kind==='life'?{pegGender:data.pegGender||'male'}:{})};
 }
}
