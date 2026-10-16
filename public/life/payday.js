import {spaces,crisisSpaces,inEntry,inCrisis,salary} from './rules.js?v=payday-1';
export function crossedPayDays(previous,next){
 if(!previous||previous.phase!=='roll'||!next.dice||previous.turn!==next.turn)return [];
 const index=next.turn,old=previous.players[index],p=next.players[index];
 if(inEntry(old)||inEntry(p))return [];
 const crisis=inCrisis(old)&&inCrisis(p);if(inCrisis(old)!==inCrisis(p))return [];
 const start=crisis?old.crisisPosition:old.position,end=crisis?p.crisisPosition:p.position,track=crisis?crisisSpaces:spaces;
 if(end<=start)return [];
 return Array.from({length:end-start},(_,i)=>start+i+1).filter(n=>crisis?track[n].payday:track[n].type==='payday').map(n=>({index,amount:salary(old),at:(n-start)/(end-start)}));
}
export function moneyTransfers(previous,next){
 if(!previous)return [];
 const paydays=crossedPayDays(previous,next).map(c=>({...c,payday:true})),changes=[...paydays];
 next.players.forEach((p,index)=>{const old=previous.players[index];if(!old)return;const paid=paydays.filter(c=>c.index===index).reduce((sum,c)=>sum+c.amount,0),amount=p.cash-old.cash-paid;if(amount)changes.push({index,amount,at:1,payday:false});});
 return changes;
}
export function paycheckEffects({money,reduced,onMoney,activePlayer}){
 let version=0,frame=0,shown=new Map(),crossings=[],flights=new Set();
 const display=(p,i)=>shown.has(i)?shown.get(i):p.cash;
 function reset(){version++;cancelAnimationFrame(frame);document.querySelectorAll('.payday-notice,.payday-cash').forEach(n=>n.remove());shown.clear();crossings=[];flights.clear();}
 function prepare(previous,next){reset();crossings=moneyTransfers(previous,next);for(const c of crossings)shown.set(c.index,previous.players[c.index].cash);}
 async function award(crossing,token){
  const id=version,from=shown.get(crossing.index),to=from+crossing.amount;shown.set(crossing.index,to);
  const target=crossing.index===activePlayer()?document.querySelector('#turnStats .stat strong'):document.querySelectorAll('#careerRoster .officer-card')[crossing.index]?.querySelector('.officer-numbers strong'),box=token?.getBoundingClientRect(),destination=target?.getBoundingClientRect();
  const notice=document.createElement('div');notice.className='payday-notice'+(crossing.amount<0?' money-out':'');notice.setAttribute('role','status');notice.textContent=`${crossing.payday?'Pay Day!':crossing.amount>0?'Money received':'Payment'} ${crossing.amount>0?'+':'−'}${money(Math.abs(crossing.amount))}`;document.body.append(notice);
  const x=Math.max(85,Math.min(innerWidth-85,box?box.left+box.width/2:innerWidth/2)),y=Math.max(70,Math.min(innerHeight-90,box?box.top:innerHeight/2));notice.style.left=x+'px';notice.style.top=y+'px';
  const nodes=[notice],animations=[];
  if(!reduced()){
   animations.push(notice.animate([{opacity:0,transform:'translate(-50%,10px) scale(.9)'},{opacity:1,transform:'translate(-50%,-10px) scale(1)',offset:.15},{opacity:1,transform:'translate(-50%,-22px)',offset:.8},{opacity:0,transform:'translate(-50%,-35px)'}],{duration:1800,fill:'forwards'}));
   const balanceX=destination?Math.max(20,Math.min(innerWidth-30,destination.left+destination.width/2)):innerWidth-65,balanceY=destination?Math.max(30,Math.min(innerHeight-40,destination.top)):90;
   const outgoing=crossing.amount<0,sx=outgoing?balanceX:x,sy=outgoing?balanceY:y,tx=outgoing?x:balanceX,ty=outgoing?y:balanceY;
   for(let i=0;i<3;i++){const bill=document.createElement('div');bill.className='payday-cash'+(outgoing?' money-out':'');bill.dataset.direction=outgoing?'out':'in';bill.textContent='$';bill.setAttribute('aria-hidden','true');bill.style.left=sx+'px';bill.style.top=sy+'px';document.body.append(bill);nodes.push(bill);animations.push(bill.animate([{transform:'translate(-50%,-50%) rotate(-12deg)',opacity:0},{transform:`translate(${(tx-sx)*.35}px,${(ty-sy)*.35-45}px) rotate(8deg)`,opacity:1,offset:.35},{transform:`translate(${tx-sx}px,${ty-sy}px) rotate(0deg)`,opacity:0}],{duration:1100,delay:i*130,fill:'both',easing:'ease-in-out'}));}
   target?.animate([{background:outgoing?'#edc5b7':'#c3e3ad',transform:'scale(1)'},{background:outgoing?'#fae7df':'#e8f4df',transform:'scale(1.08)',offset:.5},{background:'transparent',transform:'scale(1)'}],{duration:900,delay:600});
  }
  const counter=reduced()?Promise.resolve(onMoney(crossing.index,to)):new Promise(resolve=>{const start=performance.now();function count(now){if(id!==version){resolve();return;}const progress=Math.min(1,(now-start)/600);onMoney(crossing.index,Math.round(from+(to-from)*progress));if(progress<1)requestAnimationFrame(count);else resolve();}requestAnimationFrame(count);});
  if(reduced())await new Promise(r=>setTimeout(r,850));else await Promise.allSettled([...animations.map(a=>a.finished),counter]);
  nodes.forEach(n=>n.remove());if(id!==version)return;
 }
 function trigger(crossing,token){const work=award(crossing,token);flights.add(work);work.finally(()=>flights.delete(work));}
 async function watch(animation,token){
  if(!crossings.length)return;const id=version,waiting=[...crossings];
  function tick(){if(id!==version)return;const progress=animation.effect.getComputedTiming().progress;if(progress!==null)while(waiting.length&&progress>=waiting[0].at-.001)trigger(waiting.shift(),token);frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);await animation.finished.catch(()=>{});if(id!==version)return;cancelAnimationFrame(frame);while(waiting.length)trigger(waiting.shift(),token);await Promise.allSettled([...flights]);
 }
 async function instant(tokens){for(const crossing of crossings)trigger(crossing,tokens[crossing.index]);await Promise.allSettled([...flights]);}
 return {prepare,display,watch,instant,hasTransfers:()=>crossings.length>0};
}
