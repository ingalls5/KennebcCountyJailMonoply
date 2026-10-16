import {json,body,roomCode} from './rooms.js';
export {GameRoom} from './rooms.js';
export {NightShiftMap} from './night-shift-map.js';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
   try{
    if(request.method==='POST'&&request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Use this game site to join the room.'},403);
    if(['/api/night-shift/map','/api/night-shift/players','/api/night-shift/player','/api/night-shift/player/complete','/api/night-shift/player/new'].includes(url.pathname)){const stub=env.NIGHT_SHIFT_MAP.get(env.NIGHT_SHIFT_MAP.idFromName('shared-facility'));return await stub.fetch(request);}
    if(url.pathname==='/api/rooms'&&request.method==='POST'){
     const data=await body(request);
     for(let attempt=0;attempt<4;attempt++){const code=roomCode(),stub=env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(code));const response=await stub.fetch(new Request('https://room/init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,code})}));if(response.status!==409)return response;}
     return json({error:'Could not create a room. Please try again.'},503);
    }
    const match=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(public|join|state|start|restart|end|leave|remove|action))?$/);
    if(!match)return json({error:'Room not found. Check the six-character code.'},404);
    const stub=env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(match[1]));const forwarded=new Request('https://room/'+(match[2]||'public'),request);return await stub.fetch(forwarded);
   }catch(error){return json({error:error.message||'Could not reach the room.'},error.status||500);}
  }
  const response=await env.ASSETS.fetch(request),headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  return new Response(response.body,{status:response.status,headers});
 }
};
