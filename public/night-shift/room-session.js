const key='night-shift-room-v1';
let seat=null;try{seat=JSON.parse(localStorage.getItem(key));if(!/^[A-Z2-9]{6}$/.test(seat?.code)||typeof seat?.token!=='string')seat=null;}catch{}
export const roomSeat=()=>seat;
export function clearRoom(){seat=null;try{localStorage.removeItem(key);}catch{}}
function remember(data){seat={code:data.code,token:data.token};try{localStorage.setItem(key,JSON.stringify(seat));}catch{}delete data.token;return data;}
async function send(url,body,credential){const response=await fetch(url,{method:body?'POST':'GET',cache:'no-store',headers:{...(credential?{Authorization:'Bearer '+credential}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();if(!response.ok)throw Object.assign(Error(value.error||'Could not reach the game.'),{status:response.status});return value;}
export async function createRoom(name){return remember(await send('/api/night-shift/rooms',{name}));}
export async function joinRoom(name,code){code=code.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Enter the six-character room code.');return remember(await send('/api/night-shift/rooms/'+code+'/join',{name}));}
export function roomRequest(action,body){if(!seat)throw Error('Join a game first.');return send('/api/night-shift/rooms/'+seat.code+'/'+action,body,seat.token);}
