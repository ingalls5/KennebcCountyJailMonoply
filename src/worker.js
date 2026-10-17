import {json,body,roomCode} from './rooms.js';
export {GameRoom} from './rooms.js';
export {NightShiftMap} from './night-shift-map.js';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
   try{
    if(request.method==='POST'&&request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Use this game site to join the room.'},403);
    if(url.pathname==='/api/night-shift/rooms'&&request.method==='POST'){
     const data=await body(request),shared=env.NIGHT_SHIFT_MAP.get(env.NIGHT_SHIFT_MAP.idFromName('shared-facility'));
     const saved=await(await shared.fetch(new Request('https://facility/api/night-shift/map'))).json();
     if(!saved.layout)return json({error:'Save the jail map before creating a game.'},409);
     for(let attempt=0;attempt<4;attempt++){const code=roomCode(),stub=env.NIGHT_SHIFT_MAP.get(env.NIGHT_SHIFT_MAP.idFromName('night-shift-room:'+code));const result=await stub.fetch(new Request('https://session/session/init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:data.name,code,layout:saved.layout,mapRevision:saved.revision})}));if(result.status!==409)return result;}
     return json({error:'Could not create a room. Please try again.'},503);
    }
    const shiftRoom=url.pathname.match(/^\/api\/night-shift\/rooms\/([A-Z2-9]{6})\/(join|state|map|start|sync|begin|cancel|finish|travel|end|leave)$/);
    if(shiftRoom){const payload=request.method==='POST'?JSON.stringify(await body(request)):undefined;const stub=env.NIGHT_SHIFT_MAP.get(env.NIGHT_SHIFT_MAP.idFromName('night-shift-room:'+shiftRoom[1]));return await stub.fetch(new Request('https://session/session/'+shiftRoom[2],{method:request.method,headers:request.headers,...(payload!==undefined?{body:payload}:{})}));}
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
