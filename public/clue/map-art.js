const icons={
 booking:'M8 9h24v28H8z M14 17h12M14 24h12M14 31h8 M27 5v9',
 control:'M5 7h32v23H5z M21 30v7M12 37h18M11 13h8v10h-8z M24 13h7M24 19h7M24 25h7',
 medical:'M16 5h10v11h11v10H26v11H16V26H5V16h11z',
 visitation:'M7 7h10v12H7z M25 7h10v12H25z M4 25h16v12H4z M22 25h16v12H22z M21 3v36',
 briefing:'M6 6h30v22H6z M11 12h20M11 18h13M16 28v9M26 28v9M12 37h18',
 yard:'M5 5h32v32H5z M21 5v32M5 21h32 M15 21a6 6 0 1 0 12 0a6 6 0 1 0-12 0',
 kitchen:'M8 4v13M13 4v13M18 4v13M8 13h10v5l-5 4v16 M30 4v34M30 4c-9 8-9 16 0 16',
 property:'M5 12h32v25H5z M5 12l6-7h20l6 7M5 23h32M17 17h8M17 29h8',
 sally:'M5 8h32v29H5z M12 8v29M20 8v29M28 8v29M4 16h34M17 3h8'
};
const roomTiles={booking:[0,0],control:[1,0],medical:[2,0],visitation:[0,1],briefing:[1,1],yard:[2,1],kitchen:[0,2],property:[1,2],sally:[2,2]};
const updatedTiles={yard:0,property:1,sally:2};
export function roomDoor(room,dx,dy){
 const [x,y,width,height]=room.rect;
 let ex=dx,ey=dy,angle=0;
 if(dx===x+width-1){ex++;angle=90;}
 else if(dx===x){ex--;angle=-90;}
 else if(dy===y+height-1){ey++;angle=180;}
 else ey--;
 const door=document.createElement('span');
 door.className='room-door';
 door.setAttribute('aria-hidden','true');
 // Keep the full door face outside the room so it cannot cover room labels.
 // The corridor entrance and game movement coordinates stay at the same cell.
 const cx=(dx+ex)/2+.5+(ex-dx)*.65;
 const cy=(dy+ey)/2+.5+(ey-dy)*.65;
 door.style.left=cx/25*100-2+'%';
 door.style.top=cy/25*100-2+'%';
 door.style.setProperty('--door-angle',angle+'deg');
 return door;
}
export function roomArt(id){
 const [column,row]=roomTiles[id];
 const art=document.createElement('span');
 art.className='room-art';
 art.setAttribute('aria-hidden','true');
 if(id==='sally'){
  art.classList.add('room-art-sally');
 }else if(Object.hasOwn(updatedTiles,id)){
  art.classList.add('room-art-updated');
  art.style.backgroundPosition=`${updatedTiles[id]*50}% 50%`;
 }else art.style.backgroundPosition=`${column*50}% ${row*50}%`;
 return art;
}
export function roomIcon(symbol){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 42 42');svg.setAttribute('aria-hidden','true');svg.classList.add('room-symbol');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[symbol]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','2');path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','round');svg.append(path);return svg;}
