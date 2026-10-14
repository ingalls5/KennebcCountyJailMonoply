export const gameKey='kennebec-clue-v1';
export const rosterKey='kennebec-clue-roster-v1';
export const configKey='kennebec-clue-config-v1';
export const boardRevision=4;
export const suspects=[
 {id:'red',name:'Officer Red',color:'#b94f46',start:'8,0'},
 {id:'gold',name:'Officer Gold',color:'#c09232',start:'16,0'},
 {id:'silver',name:'Officer Silver',color:'#81929e',start:'24,8'},
 {id:'green',name:'Officer Green',color:'#4e8873',start:'16,24'},
 {id:'blue',name:'Officer Blue',color:'#497fba',start:'8,24'},
 {id:'purple',name:'Officer Purple',color:'#896eaa',start:'0,8'}
];
export const items=[
 {id:'key',name:'Key',icon:'/pawns/keys.svg'},
 {id:'cuffs',name:'911 Knife',icon:'/clue/weapons/911-knife.svg'},
 {id:'radio',name:'Radio',icon:'/pawns/walkie-talkie.svg'},
 {id:'light',name:'Flashlight',icon:'/pawns/flashlight.svg'},
 {id:'spray',name:'Taser',icon:'/pawns/taser.svg'},
 {id:'belt',name:'Inmate-made shank',icon:'/clue/weapons/shank.svg'},
 {id:'drugs',name:'Drugs',icon:'/clue/weapons/drugs.svg'}
];
export const rooms=[
 {id:'booking',name:'Intake',rect:[0,0,7,7],doors:[[6,3],[3,6]],passage:'sally',symbol:'booking',color:'#d9c9ac'},
 {id:'control',name:'Control',rect:[10,0,5,7],doors:[[12,6]],symbol:'control',color:'#b9d2cf'},
 {id:'medical',name:'Medical',rect:[0,9,7,4],doors:[[6,10]],symbol:'medical',color:'#d3ddd0'},
 {id:'visitation',name:'T-Unit',rect:[18,0,7,7],doors:[[18,3],[21,6]],passage:'kitchen',symbol:'visitation',color:'#d0c7d9'},
 {id:'briefing',name:'Briefing Room',rect:[0,14,7,4],doors:[[6,15]],symbol:'briefing',color:'#cec9b3'},
 {id:'yard',name:'Rec Yard',rect:[18,9,7,9],doors:[[18,11],[18,15]],symbol:'yard',color:'#b9cbb0'},
 {id:'kitchen',name:'Kitchen',rect:[0,20,7,5],doors:[[6,22],[3,20]],passage:'visitation',symbol:'kitchen',color:'#dcc1ae'},
 {id:'property',name:'4th Floor',rect:[10,20,5,5],doors:[[12,20]],symbol:'property',color:'#baccda'},
 {id:'sally',name:'Sally Port',rect:[18,20,7,5],doors:[[18,22],[21,20]],passage:'booking',symbol:'sally',color:'#d8c89c'}
];
export const categories={suspect:suspects,item:items,room:rooms};
export const cards=Object.entries(categories).flatMap(([type,list])=>list.map(entry=>({id:type+':'+entry.id,type,key:entry.id})));
const cardIds=new Set(cards.map(c=>c.id));
const originalCardIds=cards.filter(c=>c.id!=='item:drugs').map(c=>c.id);
export function caseCategories(game){const active=new Set(game.deck||originalCardIds);return Object.fromEntries(Object.entries(categories).map(([type,list])=>[type,list.filter(entry=>active.has(type+':'+entry.id))]));}
const phases=new Set(['turn','move','refute','view','end','over']);
const noteValues=new Set(['unknown','no','maybe','yes']);
const check=(condition,message)=>{if(!condition)throw Error(message);};
export function defaultConfig(){return Object.fromEntries(cards.map(card=>[card.id,categories[card.type].find(x=>x.id===card.key).name]));}
export function validateConfig(input){const clean=defaultConfig();for(const key of Object.keys(clean)){const name=input?.[key];check(typeof name==='string'&&name.trim().length>0&&name.trim().length<=32,'Give every room, suspect, and item a name of up to 32 characters.');clean[key]=name.trim();}for(const type of Object.keys(categories)){const names=Object.keys(clean).filter(k=>k.startsWith(type+':')).map(k=>clean[k].toLowerCase());check(new Set(names).size===names.length,'Use different names within each category.');}return clean;}
// Upgrade untouched defaults from their own revision; preserve customized names.
export function migrateConfig(input,fromRevision=1){
 if(fromRevision<4&&!Object.hasOwn(input||{},'item:drugs')){
  input={...input};let name='Drugs',suffix=2;
  while(Object.entries(input).some(([key,value])=>key.startsWith('item:')&&typeof value==='string'&&value.toLowerCase()===name.toLowerCase())){name='Drugs ('+suffix+')';suffix++;}
  input['item:drugs']=name;
 }
 const clean=validateConfig(input);
 function upgrade(type,id,oldName){
  const key=type+':'+id,name=categories[type].find(entry=>entry.id===id).name;
  if(clean[key]===oldName&&!Object.entries(clean).some(([other,value])=>other!==key&&other.startsWith(type+':')&&value.toLowerCase()===name.toLowerCase()))clean[key]=name;
 }
 if(fromRevision<2)for(const [id,oldName] of Object.entries({'booking':'Booking','control':'Control Room','visitation':'Visitation','property':'Property Room'}))upgrade('room',id,oldName);
 if(fromRevision<3)for(const [id,oldName] of Object.entries({'cuffs':'Handcuffs','spray':'OC Spray','belt':'Duty Belt'}))upgrade('item',id,oldName);
 return clean;
}
export function validateRoster(input){check(Array.isArray(input)&&input.length>=3&&input.length<=6,'Choose three to six players.');const names=new Set(),chosen=new Set();return input.map(p=>{const name=typeof p.name==='string'?p.name.trim():'';check(name.length>0&&name.length<=30,'Give every player a name of up to 30 characters.');check(!names.has(name.toLowerCase()),'Every player needs a different name.');check(suspects.some(s=>s.id===p.suspect)&&!chosen.has(p.suspect),'Choose a different suspect for each player.');names.add(name.toLowerCase());chosen.add(p.suspect);return {name,suspect:p.suspect};});}
export function label(game,id){return game.config[id]||id;}
export function rumorText(game,ids){return label(game,ids[0])+' killed the rookie using '+label(game,ids[1])+' in '+label(game,ids[2])+'.';}
const shuffle=(list,random)=>{const result=[...list];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
export function createGame(roster,config=defaultConfig(),random=Math.random){
 const players=validateRoster(roster).map(p=>({...p,hand:[],notes:{},eliminated:false,lastSuggestedRoom:null,summoned:false}));
 const solution=Object.keys(categories).map(type=>shuffle(cards.filter(c=>c.type===type),random)[0].id);
 shuffle(cards.filter(c=>!solution.includes(c.id)).map(c=>c.id),random).forEach((id,index)=>players[index%players.length].hand.push(id));
 return {version:1,boardRevision,deck:cards.map(card=>card.id),config:validateConfig(config),players,positions:Object.fromEntries(suspects.map(s=>[s.id,s.start])),itemRooms:{},solution,turn:0,phase:'turn',dice:[],steps:0,pending:null,winner:null,log:['The rookie was found dead. Rumors are spreading. Identify the killer, weapon, and room.'],turns:1};
}
const inside=(x,y,rect)=>x>=rect[0]&&y>=rect[1]&&x<rect[0]+rect[2]&&y<rect[1]+rect[3];
export function roomAt(x,y){return rooms.find(r=>inside(x,y,r.rect));}
export function isHall(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<25&&y<25&&!roomAt(x,y)&&!inside(x,y,[10,10,5,7]);}
export function isNode(node){if(typeof node!=='string')return false;if(node.startsWith('room:'))return rooms.some(r=>node==='room:'+r.id);const parts=node.split(',').map(Number);return parts.length===2&&node===parts.join(',')&&isHall(...parts);}
function doorExit(room,door){const [x,y]=door;return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(p=>isHall(...p)).map(p=>p.join(','));}
export function neighbors(node){
 if(node.startsWith('room:')){const room=rooms.find(r=>node==='room:'+r.id);return room?room.doors.flatMap(door=>doorExit(room,door)):[];}
 const [x,y]=node.split(',').map(Number);return [...[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(p=>isHall(...p)).map(p=>p.join(',')),...rooms.filter(r=>r.doors.some(d=>doorExit(r,d).includes(node))).map(r=>'room:'+r.id)];
}
export function reachable(game){
 if(game.phase!=='move')return new Map();
 const start=game.positions[game.players[game.turn].suspect],blocked=new Set(Object.entries(game.positions).filter(([id,node])=>id!==game.players[game.turn].suspect&&!node.startsWith('room:')).map(([,node])=>node));
 const paths=new Map([[start,[start]]]),queue=[start];
 for(let i=0;i<queue.length;i++){const node=queue[i],path=paths.get(node);if(path.length-1>=game.steps||node.startsWith('room:')&&node!==start)continue;for(const next of neighbors(node)){if(paths.has(next)||blocked.has(next))continue;paths.set(next,[...path,next]);queue.push(next);}}
 paths.delete(start);return paths;
}
export function currentRoom(game){const node=game.positions[game.players[game.turn].suspect];return node.startsWith('room:')?node.slice(5):null;}
export function canSuggest(game){const room=currentRoom(game),p=game.players[game.turn];return !p.eliminated&&['turn','end'].includes(game.phase)&&room&&(p.lastSuggestedRoom!==room||p.summoned)&&!game.suggested;}
export function actor(game){return game.phase==='refute'?game.pending.refuter:game.turn;}
export function matchingCards(game,index,suggestion=game.pending?.suggestion){return suggestion?game.players[index].hand.filter(c=>suggestion.includes(c)):[];}
function log(game,text){game.log.push(text);if(game.log.length>80)game.log.shift();}
function turnEnd(game){game.phase='end';game.steps=0;}
export function perform(original,action,random=Math.random){
 const game=structuredClone(original),p=game.players[game.turn],activeDeck=new Set(game.deck||originalCardIds);check(game.phase!=='over','This case is already closed.');check(!p.eliminated||['end','note'].includes(action.type),'Your investigation is over. You can still show cards on other players’ turns.');
 switch(action.type){
 case 'roll':check(game.phase==='turn','Roll at the start of your turn.');game.dice=[1+Math.floor(random()*6),1+Math.floor(random()*6)];game.steps=game.dice[0]+game.dice[1];game.phase='move';p.summoned=false;if(!reachable(game).size){turnEnd(game);log(game,p.name+' cannot move.');}break;
 case 'move':{check(game.phase==='move','Roll before moving.');check(reachable(game).has(action.node),'Choose an outlined space within your roll.');game.positions[p.suspect]=action.node;turnEnd(game);p.summoned=false;log(game,p.name+' moved to '+(currentRoom(game)?label(game,'room:'+currentRoom(game)):'the corridor')+'.');break;}
 case 'passage':{check(game.phase==='turn','Use a passage instead of rolling.');const room=rooms.find(r=>r.id===currentRoom(game));check(room?.passage,'This room has no passage.');game.positions[p.suspect]='room:'+room.passage;p.summoned=false;turnEnd(game);log(game,p.name+' took the staff passage to '+label(game,'room:'+room.passage)+'.');break;}
 case 'suggest':{check(canSuggest(game),'Enter a different room before spreading another rumor there.');const room=currentRoom(game),suggestion=['suspect:'+action.suspect,'item:'+action.item,'room:'+room];check(suspects.some(s=>s.id===action.suspect)&&activeDeck.has('item:'+action.item),'Choose a suspect and an item.');game.positions[action.suspect]='room:'+room;const summoned=game.players.find(p=>p.suspect===action.suspect);if(summoned&&summoned!==p)summoned.summoned=true;game.itemRooms[action.item]=room;p.lastSuggestedRoom=room;p.summoned=false;game.suggested=true;let refuter=null;for(let step=1;step<game.players.length;step++){const index=(game.turn+step)%game.players.length;if(matchingCards(game,index,suggestion).length){refuter=index;break;}}log(game,p.name+' spread a rumor: '+rumorText(game,suggestion));if(refuter===null){game.pending=null;turnEnd(game);log(game,'No other player could disprove the rumor.');}else{game.pending={suggestion,refuter,card:null};game.phase='refute';}break;}
 case 'show':check(game.phase==='refute','No player is showing a card right now.');check(matchingCards(game,game.pending.refuter).includes(action.card),'Show one of the matching cards in your hand.');game.pending.card=action.card;p.notes[action.card]='no';game.phase='view';break;
 case 'hide':check(game.phase==='view','There is no shown card to hide.');p.notes[game.pending.card]='no';game.pending=null;turnEnd(game);log(game,'A card challenging the rumor was shown privately to '+p.name+'.');break;
 case 'note':check(activeDeck.has(action.card)&&noteValues.has(action.value),'Choose a valid notebook mark.');check(Number.isInteger(action.player)&&action.player===actor(game),'Use your own notebook.');game.players[action.player].notes[action.card]=action.value;break;
 case 'accuse':{check(['turn','end'].includes(game.phase),'Finish moving or viewing the card before making an accusation.');const accusation=['suspect:'+action.suspect,'item:'+action.item,'room:'+action.room];check(accusation.every(id=>activeDeck.has(id)),'Choose a suspect, item, and room.');const correct=accusation.every(id=>game.solution.includes(id));game.lastAccusation={player:game.turn,cards:accusation,correct};if(correct){game.winner=game.turn;game.phase='over';log(game,p.name+' solved the case!');}else{p.eliminated=true;game.phase=game.players.every(p=>p.eliminated)?'over':'end';log(game,p.name+' made an incorrect accusation and is out of the investigation.');}break;}
 case 'end':check(['turn','end','move'].includes(game.phase),'Finish the private card handoff first.');let next=game.turn;for(let count=0;count<game.players.length;count++){next=(next+1)%game.players.length;if(!game.players[next].eliminated)break;}check(!game.players[next].eliminated,'Every investigator is out.');game.turn=next;game.phase='turn';game.steps=0;game.dice=[];game.pending=null;game.suggested=false;game.turns++;break;
 default:throw Error('Unknown game action.');
 }
 return game;
}
export function validateGame(game){
 check(game?.version===1,'Unknown saved game.');if((game.boardRevision||1)<boardRevision){game.config=migrateConfig(game.config,game.boardRevision||1);if(!Object.hasOwn(game,'deck'))game.deck=[...originalCardIds];game.boardRevision=boardRevision;}else validateConfig(game.config);check(Array.isArray(game.deck),'Missing case deck.');const activeDeck=new Set(game.deck);check(activeDeck.size===game.deck.length&&(game.deck.length===originalCardIds.length||game.deck.length===cards.length)&&originalCardIds.every(id=>activeDeck.has(id))&&game.deck.every(id=>cardIds.has(id)),'Invalid case deck.');validateRoster(game.players);check(phases.has(game.phase)&&Number.isInteger(game.turn)&&!!game.players[game.turn],'Invalid saved turn.');
 check(Number.isInteger(game.turns)&&game.turns>0&&Array.isArray(game.log)&&game.log.every(t=>typeof t==='string'),'Invalid saved history.');
 check(Array.isArray(game.solution)&&game.solution.length===3&&Object.keys(categories).every(type=>game.solution.filter(id=>id.startsWith(type+':')&&activeDeck.has(id)).length===1),'Invalid case file.');
 const dealt=[...game.solution];for(const p of game.players){check(Array.isArray(p.hand)&&p.hand.every(id=>activeDeck.has(id))&&typeof p.eliminated==='boolean'&&typeof p.summoned==='boolean','Invalid saved cards.');check(p.notes&&Object.entries(p.notes).every(([id,value])=>activeDeck.has(id)&&noteValues.has(value)),'Invalid notebook.');check(p.lastSuggestedRoom===null||rooms.some(r=>r.id===p.lastSuggestedRoom),'Invalid saved suggestion.');dealt.push(...p.hand);}
 check(dealt.length===game.deck.length&&new Set(dealt).size===game.deck.length,'Cards are missing or repeated.');check(suspects.every(s=>isNode(game.positions?.[s.id])),'Invalid board positions.');const hall=Object.values(game.positions).filter(node=>!node.startsWith('room:'));check(new Set(hall).size===hall.length,'Two pawns occupy the same corridor square.');
 check(game.itemRooms&&Object.entries(game.itemRooms).every(([id,room])=>activeDeck.has('item:'+id)&&rooms.some(r=>r.id===room)),'Invalid equipment positions.');check(Array.isArray(game.dice)&&(game.dice.length===0||game.dice.length===2&&game.dice.every(d=>Number.isInteger(d)&&d>=1&&d<=6))&&Number.isInteger(game.steps)&&game.steps>=0&&game.steps<=12,'Invalid dice.');
 if(['refute','view'].includes(game.phase)){const pending=game.pending;check(pending&&Array.isArray(pending.suggestion)&&pending.suggestion.length===3&&Object.keys(categories).every(type=>pending.suggestion.filter(id=>id.startsWith(type+':')&&activeDeck.has(id)).length===1)&&Number.isInteger(pending.refuter)&&!!game.players[pending.refuter]&&pending.refuter!==game.turn,'Invalid card handoff.');check(matchingCards(game,pending.refuter).length>0,'No matching card to show.');check(game.phase==='refute'?pending.card===null:matchingCards(game,pending.refuter).includes(pending.card),'Invalid shown card.');}else check(game.pending===null,'Unexpected card handoff.');
 check(game.phase==='over'?game.winner===null&&game.players.every(p=>p.eliminated)||Number.isInteger(game.winner)&&!!game.players[game.winner]&&!game.players[game.winner].eliminated:game.winner===null,'Invalid winner.');check(game.phase==='over'||!game.players[game.turn].eliminated||game.phase==='end','An eliminated player cannot take a turn.');
 return game;
}
export function loadGame(storage){try{storage??=globalThis.localStorage;const raw=storage.getItem(gameKey);return raw?validateGame(JSON.parse(raw)):null;}catch{return null;}}
export function coordinates(node,suspect='red'){
 if(!node.startsWith('room:'))return node.split(',').map(n=>Number(n)+.5);
 const room=rooms.find(r=>'room:'+r.id===node),index=suspects.findIndex(s=>s.id===suspect);
 return [room.rect[0]+room.rect[2]/2+(index%3-1)*.9,room.rect[1]+room.rect[3]-.8-Math.floor(index/3)*.85];
}
