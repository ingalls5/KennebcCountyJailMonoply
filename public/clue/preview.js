import {rooms,suspects,isHall} from './rules.js';
import {roomArt,roomDoor} from './map-art.js';

const map=document.getElementById('previewMap');
const viewport=document.getElementById('previewViewport');
const list=document.getElementById('previewRooms');
const roomButtons=new Map(),listButtons=new Map();
const node=(tag,className,text)=>{
  const element=document.createElement(tag);
  if(className)element.className=className;
  if(text!==undefined)element.textContent=text;
  return element;
};

function select(room){
  roomButtons.forEach((button,id)=>button.setAttribute('aria-pressed',String(id===room.id)));
  listButtons.forEach((button,id)=>button.setAttribute('aria-pressed',String(id===room.id)));
  const number=rooms.indexOf(room)+1;
  document.getElementById('previewRoomName').textContent=number+'. '+room.name;
  const doorText=room.doors.length===1?'1 doorway':room.doors.length+' doorways';
  const passage=rooms.find(other=>other.id===room.passage);
  document.getElementById('previewRoomDetails').textContent=doorText+' to the corridors.'+(passage?' Staff passage to '+passage.name+'.':'');
  if(viewport.classList.contains('enlarged')){
    const button=roomButtons.get(room.id);
    button.scrollIntoView({block:'center',inline:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
}

// The preview uses the game's room rectangles, doors, and artwork.
for(let y=0;y<25;y++)for(let x=0;x<25;x++){
  if(!isHall(x,y))continue;
  const tile=node('span','hall-tile');
  tile.style.gridArea=`${y+1}/${x+1}/${y+2}/${x+2}`;
  const start=suspects.find(s=>s.start===x+','+y);
  if(start){tile.classList.add('start-square');tile.style.setProperty('--suspect-color',start.color);}
  tile.setAttribute('aria-hidden','true');
  map.append(tile);
}
rooms.forEach((room,index)=>{
  const [x,y,width,height]=room.rect;
  const button=node('button','clue-room preview-room');
  button.type='button';button.dataset.room=room.id;
  button.style.gridArea=`${y+1}/${x+1}/${y+height+1}/${x+width+1}`;
  button.style.setProperty('--room-color',room.color);
  button.setAttribute('aria-label',`Room ${index+1}: ${room.name}`);
  button.setAttribute('aria-pressed','false');
  button.append(node('span','preview-number',index+1),roomArt(room.id),node('span','room-name',room.name));
  if(room.passage)button.append(node('span','room-passage','STAFF PASSAGE →'));
  button.onclick=()=>select(room);
  map.append(button);roomButtons.set(room.id,button);

  for(const [dx,dy] of room.doors){
    map.append(roomDoor(room,dx,dy));
  }
  const row=node('li'),choice=node('button','preview-room-choice');choice.type='button';
  choice.setAttribute('aria-pressed','false');choice.append(node('span','preview-list-number',index+1),node('span','',room.name));
  choice.onclick=()=>select(room);row.append(choice);list.append(row);listButtons.set(room.id,choice);
});

document.getElementById('previewZoom').onclick=event=>{
  const enlarged=viewport.classList.toggle('enlarged');
  event.currentTarget.setAttribute('aria-pressed',String(enlarged));
  event.currentTarget.textContent=enlarged?'Fit board':'Enlarge board';
};
