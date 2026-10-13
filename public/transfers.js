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
 // Transfers come from completed payments, never unpaid debts or net balance guesses.
 if(!transfers?.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const groups=new Map();for(const transfer of transfers){const key=transfer.from+':'+transfer.to;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(transfer);}
 const stage=element('div','transfer-stage');stage.id='transferStage';stage.setAttribute('role','status');stage.setAttribute('aria-live','polite');stage.setAttribute('popover','manual');
 const rows=[];
 for(const items of groups.values()){
  const mixed=items.some(t=>t.kind==='money')&&items.some(t=>t.kind==='property');
  const {from,to}=items[0],row=element('div','transfer-row'+(mixed?' mixed-transfer':'')),sender=participant(from,players),receiver=participant(to,players),lane=element('div','transfer-lane');
  const label=items.map(t=>t.kind==='money'?'$'+t.amount.toLocaleString():spaces[t.index].name).join(' + ');
  lane.append(element('span','transfer-direction','→'),element('p','transfer-description',label));row.append(sender,lane,receiver);stage.append(row);rows.push({row,sender,receiver,items});
 }
 const supportsPopover=typeof stage.showPopover==='function';(supportsPopover?document.body:document.querySelector('dialog[open]')||document.body).append(stage);
 try{
  if(supportsPopover)stage.showPopover();
  const animations=[];
  for(const {row,sender,receiver,items} of rows){
   const rect=row.getBoundingClientRect(),a=sender.getBoundingClientRect(),b=receiver.getBoundingClientRect(),start=a.left+a.width/2-rect.left,end=b.left+b.width/2-rect.left;
   // A deed exchange can send cards both ways; each row keeps its own direction.
   const visible=items.slice(0,4);visible.forEach((transfer,index)=>{
    const token=packet(transfer);token.setAttribute('aria-hidden','true');row.append(token);const mixed=row.classList.contains('mixed-transfer'),y=transfer.kind==='property'?(mixed?65:12):(mixed?10:30);
    animations.push(token.animate([
     {transform:`translate(${start}px,${y}px) translateX(-50%) scale(.5) rotate(-10deg)`,opacity:0,offset:0},
     {transform:`translate(${start}px,${y}px) translateX(-50%) scale(1) rotate(-6deg)`,opacity:1,offset:.12},
     {transform:`translate(${(start+end)/2}px,${y-18-index*5}px) translateX(-50%) scale(1.08) rotate(6deg)`,opacity:1,offset:.5},
     {transform:`translate(${end}px,${y}px) translateX(-50%) scale(1) rotate(0deg)`,opacity:1,offset:.88},
     {transform:`translate(${end}px,${y}px) translateX(-50%) scale(.55) rotate(0deg)`,opacity:0,offset:1}
    ],{duration:1800,delay:index*140,easing:'ease-in-out',fill:'both'}).finished);
   });
  }
  await Promise.all(animations);await stage.animate([{opacity:1},{opacity:0}],{duration:300,delay:250,fill:'forwards'}).finished;
 }finally{if(supportsPopover&&stage.matches(':popover-open'))stage.hidePopover();stage.remove();}
}
