import {pawns} from './players.js';
import {spaces} from './board.js';

function element(tag,className,text){const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;}
function participant(index,players){
 const node=element('div','transfer-person');node.dataset.player=index===null?'bank':index;
 if(index===null)node.append(element('span','transfer-bank','🏦'));
 else{const img=document.createElement('img');img.src=pawns.find(p=>p.id===players[index].pawn).icon;img.alt='';node.append(img);}
 node.append(element('strong','',index===null?'Bank':players[index].name));return node;
}
function packet(transfer){
 if(transfer.kind==='money')return element('span','transfer-packet money-packet','$'+transfer.amount.toLocaleString());
 const space=spaces[transfer.index],node=element('span','transfer-packet deed-packet '+(space.group||'neutral'));
 node.append(element('i','deed-strip'),element('small','','PROPERTY'),element('strong','',space.name));return node;
}
export async function animateTransfers(transfers,players){
 // Show completed transfers in order, with a single lane for both directions.
 if(!transfers?.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const stage=element('div','transfer-stage');stage.id='transferStage';stage.setAttribute('role','status');stage.setAttribute('aria-live','polite');stage.setAttribute('popover','manual');
 const row=element('div','transfer-row'),lane=element('div','transfer-lane'),direction=element('span','transfer-direction'),description=element('p','transfer-description');lane.append(direction,description);stage.append(row);
 const supportsPopover=typeof stage.showPopover==='function';(supportsPopover?document.body:document.querySelector('dialog[open]')||document.body).append(stage);
 try{
  let leftIndex,rightIndex,left,right;
  for(const [index,transfer] of transfers.entries()){
   const samePair=left&&(transfer.from===leftIndex&&transfer.to===rightIndex||transfer.from===rightIndex&&transfer.to===leftIndex);
   if(!samePair){leftIndex=transfer.from;rightIndex=transfer.to;left=participant(leftIndex,players);right=participant(rightIndex,players);row.replaceChildren(left,lane,right);}
   if(supportsPopover&&!stage.matches(':popover-open'))stage.showPopover();
   const forward=transfer.from===leftIndex;direction.textContent=forward?'→':'←';description.textContent=transfer.kind==='money'?'Payment · $'+transfer.amount.toLocaleString():'Deed · '+spaces[transfer.index].name;
   stage.dataset.step=index;row.dataset.from=transfer.from===null?'bank':transfer.from;row.dataset.to=transfer.to===null?'bank':transfer.to;row.dataset.kind=transfer.kind;
   // Measure each step so returning deeds use the same lane, even after resizing.
   const rect=row.getBoundingClientRect(),a=left.getBoundingClientRect(),b=right.getBoundingClientRect(),leftX=a.left+a.width/2-rect.left,rightX=b.left+b.width/2-rect.left,start=forward?leftX:rightX,end=forward?rightX:leftX;
   const token=packet(transfer);token.setAttribute('aria-hidden','true');row.append(token);const y=50-token.offsetHeight/2;
   await token.animate([
    {transform:`translate(${start}px,${y}px) translateX(-50%) scale(.5)`,opacity:0,offset:0},
    {transform:`translate(${start}px,${y}px) translateX(-50%) scale(1)`,opacity:1,offset:.12},
    {transform:`translate(${(start+end)/2}px,${y}px) translateX(-50%) scale(1.04)`,opacity:1,offset:.5},
    {transform:`translate(${end}px,${y}px) translateX(-50%) scale(1)`,opacity:1,offset:.88},
    {transform:`translate(${end}px,${y}px) translateX(-50%) scale(.55)`,opacity:0,offset:1}
   ],{duration:3200,easing:'ease-in-out',fill:'both'}).finished;
   token.remove();if(index<transfers.length-1)await new Promise(resolve=>setTimeout(resolve,400));
  }
  await stage.animate([{opacity:1},{opacity:0}],{duration:400,delay:400,fill:'forwards'}).finished;
 }finally{if(supportsPopover&&stage.matches(':popover-open'))stage.hidePopover();stage.remove();}
}
