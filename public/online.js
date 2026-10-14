const seatKey='kennebec-room-seats-v1';
export const gamePath=kind=>kind==='clue'?'/clue':'/board';
export const setupPath=kind=>kind==='clue'?'/clue-setup':'/setup';
export function readSeat(kind,code){try{const seats=JSON.parse(localStorage.getItem(seatKey)||'{}');code=code||localStorage.getItem('kennebec-last-room-'+kind);const seat=seats[code];return seat?.kind===kind?{...seat,code}:null;}catch{return null;}}
export function keepSeat(snapshot){const seats=JSON.parse(localStorage.getItem(seatKey)||'{}');seats[snapshot.code]={kind:snapshot.kind,token:snapshot.token};localStorage.setItem(seatKey,JSON.stringify(seats));localStorage.setItem('kennebec-last-room-'+snapshot.kind,snapshot.code);}
export function forgetSeat(kind,code){try{const seats=JSON.parse(localStorage.getItem(seatKey)||'{}');delete seats[code];localStorage.setItem(seatKey,JSON.stringify(seats));if(localStorage.getItem('kennebec-last-room-'+kind)===code)localStorage.removeItem('kennebec-last-room-'+kind);}catch{}}
export async function request(url,{method='GET',token,body}={}){
 const headers={};if(token)headers.Authorization='Bearer '+token;if(body)headers['Content-Type']='application/json';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const response=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.error||'Could not reach the room.'),{status:response.status,snapshot:result.snapshot});return result;}catch(error){if(!error.status)error.message='Connection interrupted. Your seat is saved; reconnecting…';throw error;}finally{clearTimeout(timer);}
}
export function stateActor(snapshot){const g=snapshot.state;if(!g)return null;if(snapshot.kind==='clue')return g.phase==='refute'?g.pending.refuter:g.turn;return g.phase==='auction'?g.auction.actor:g.phase==='debt'?g.debts[0].payer:g.turn;}
export class OnlineRoom {
 constructor(kind,code){this.kind=kind;this.code=code;this.seat=readSeat(kind,code);this.snapshot=null;this.onchange=()=>{};this.onstatus=()=>{};this.oninvalid=()=>{};this.timer=null;this.polling=false;this.stopped=false;}
 get viewer(){return this.snapshot?.viewer??null;}
 get canAct(){return !!this.snapshot?.state&&!this.snapshot.motion&&!this.snapshot.trade&&stateActor(this.snapshot)===this.viewer;}
 apply(snapshot){if(!this.snapshot||snapshot.revision>=this.snapshot.revision){const changed=!this.snapshot||snapshot.revision>this.snapshot.revision;this.snapshot=snapshot;const banner=typeof document!=='undefined'?document.querySelector('.online-banner'):null;if(banner)banner.dataset.revision=snapshot.revision;if(changed)this.onchange(snapshot);}this.onstatus('Connected · You’re '+(this.snapshot?.members[this.viewer]?.name||'joining'));return snapshot;}
 async connect(){if(!this.seat)throw Error('Join this room to take your player seat.');try{const snapshot=await request('/api/rooms/'+this.code+'/state',{token:this.seat.token});if(snapshot.kind!==this.kind)throw Error('This room is for the other game.');this.apply(snapshot);this.schedule();return snapshot;}catch(error){if([401,404].includes(error.status)){this.stop();this.oninvalid(error);}throw error;}}
 schedule(){clearTimeout(this.timer);if(!this.stopped)this.timer=setTimeout(()=>this.poll(),document.hidden?5000:1500);}
 async poll(){if(this.polling||this.stopped)return;this.polling=true;try{this.apply(await request('/api/rooms/'+this.code+'/state',{token:this.seat.token}));}catch(error){this.onstatus(error.message);if([401,404].includes(error.status)){this.stop();this.oninvalid(error);}}finally{this.polling=false;this.schedule();}}
 async send(path,action){const payload={revision:this.snapshot.revision,id:crypto.randomUUID(),...(path==='action'?{action}:action||{})};let result;
  try{
   try{result=await request('/api/rooms/'+this.code+'/'+path,{method:'POST',token:this.seat.token,body:payload});}
   catch(error){if(!error.status)result=await request('/api/rooms/'+this.code+'/'+path,{method:'POST',token:this.seat.token,body:payload});else throw error;}
  }catch(error){
   // A lost end response can be retried after the room has already been deleted.
   if(path==='end'&&error.status===404){this.stop();return {ended:true,code:this.code,kind:this.kind};}
   if(error.snapshot)this.apply(error.snapshot);throw error;
  }
  if(result.ended){this.stop();return result;}
  return result.left?result:this.apply(result);
 }
 action(action){return this.send('action',action);}
 stop(){this.stopped=true;clearTimeout(this.timer);}
}
export function roomBanner(kind,code,parent){const banner=document.createElement('section');banner.className='online-banner';const title=document.createElement('strong');title.textContent='Room '+code;const status=document.createElement('span');status.id='onlineConnection';status.textContent='Connecting…';const link=document.createElement('input');link.type='text';link.readOnly=true;link.value=location.origin+setupPath(kind)+'?room='+code;link.setAttribute('aria-label','Invite link');const copy=document.createElement('button');copy.type='button';copy.textContent='Copy invite link';copy.onclick=async()=>{try{await navigator.clipboard.writeText(link.value);copy.textContent='Copied!';}catch{link.focus();link.select();copy.textContent='Select and copy the link';}};banner.append(title,status,link,copy);parent.prepend(banner);return status;}
