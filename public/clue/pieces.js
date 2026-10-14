import {suspects,items,rooms,label} from './rules.js';
import {roomIcon} from './map-art.js';

const node=(tag,className,text)=>{
 const element=document.createElement(tag);
 if(className)element.className=className;
 if(text!==undefined)element.textContent=text;
 return element;
};

export function suspectBadge(suspect,index){
 const badge=node('span','suspect-chip',String(index+1));
 badge.style.setProperty('--suspect-color',suspect.color);
 badge.setAttribute('aria-hidden','true');
 return badge;
}

export function pawnIcon(suspect){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 40 48');
 svg.setAttribute('aria-hidden','true');
 svg.innerHTML=`<circle cx="20" cy="10" r="8" fill="${suspect.color}" stroke="#fff3d5" stroke-width="2"/><path d="M9 21h22l5 21H4z" fill="${suspect.color}" stroke="#fff3d5" stroke-width="2"/><path d="m20 25 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z" fill="#fff3d5"/>`;
 return svg;
}

export function evidenceCard(game,id,className=''){
 const [type,key]=id.split(':'),card=node('div','evidence-card '+className);
 card.dataset.card=id;
 card.append(node('small','',type==='suspect'?'Suspect':type==='item'?'Weapon':'Room'));
 if(type==='item'){
  const image=node('img');image.src=items.find(item=>item.id===key).icon;image.alt='';card.append(image);
 }
 if(type==='suspect'){
  const playerIndex=game.players.findIndex(player=>player.suspect===key);
  card.append(suspectBadge(suspects.find(suspect=>suspect.id===key),playerIndex>=0?playerIndex:suspects.findIndex(suspect=>suspect.id===key)));
 }
 if(type==='room')card.append(roomIcon(rooms.find(room=>room.id===key).symbol));
 card.append(node('strong','',label(game,id)));
 if(type==='suspect'){
  const role=game.players.find(player=>player.suspect===key)?.personality;
  if(role)card.append(node('span','suspect-personality',role));
 }
 return card;
}
