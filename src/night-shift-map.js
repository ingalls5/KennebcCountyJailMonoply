import {playerColors} from '../public/night-shift/player-rules.js';
import {handleSession,sessionAlarm} from './night-shift-session.js';
import {assignTasks,repairTaskPlacements} from './night-shift-assignments.js';
import {validateLayout} from '../public/night-shift/layout.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export class NightShiftMap {
 constructor(ctx){this.ctx=ctx;}
 async fetch(request){return this.ctx.blockConcurrencyWhile(async()=>{try{
 if(new URL(request.url).pathname.startsWith('/session/'))return await handleSession(this.ctx,request);
 const saved=await this.ctx.storage.get('map')||{revision:0,layout:null};
 const path=new URL(request.url).pathname;if(path!=='/api/night-shift/map'&&path!=='/'){return await this.playerRequest(request,saved,path);}
 if(request.method==='GET')return json(saved);
 if(request.method!=='POST')return json({error:'Use a valid map action.'},405);
 const reader=request.body?.getReader();if(!reader)return json({error:'Send a map.'},400);let size=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>300000){await reader.cancel();return json({error:'That map is too large.'},413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const data=JSON.parse(new TextDecoder().decode(bytes));
 if(data.revision!==saved.revision)return json({error:'The shared map changed on another device. Export your edits as a backup, then reload before editing the latest map.'},409);
 const next={revision:saved.revision+1,layout:validateLayout(data.layout),updatedAt:new Date().toISOString()};await this.ctx.storage.put('map',next);return json(next);
 }catch(e){return json({error:e.message||'Could not save the map.'},400);}});}
 async alarm(){return this.ctx.blockConcurrencyWhile(()=>sessionAlarm(this.ctx));}
 async playerRequest(request,saved,path){const create=path==='/api/night-shift/players';if(!create&&!['/api/night-shift/player','/api/night-shift/player/complete','/api/night-shift/player/new'].includes(path))return json({error:'Player route not found.'},404);let credential=request.headers.get('Authorization')?.replace(/^Bearer /,''),player=credential?await this.ctx.storage.get('player:'+credential):null;if(!create&&!player)return json({error:'Start a shift to receive your private tasks.'},401);if(!saved.layout)return json({error:'Save the jail map before starting a shift.'},409);const layout=validateLayout(saved.layout);
 const project=()=>({id:player.id,name:player.name,color:player.color,round:player.round,mapRevision:player.mapRevision,tasks:player.tasks,completed:player.completed});
 if(request.method==='GET'&&!create&&path==='/api/night-shift/player'){if(!player.color){player.color=playerColors[crypto.getRandomValues(new Uint32Array(1))[0]%playerColors.length];await this.ctx.storage.put('player:'+credential,player);}if(player.mapRevision!==saved.revision){player.tasks=assignTasks(layout);player.completed=[];player.mapRevision=saved.revision;player.round++;await this.ctx.storage.put('player:'+credential,player);}if(repairTaskPlacements(player,layout))await this.ctx.storage.put('player:'+credential,player);return json(project());}
 if(request.method!=='POST')return json({error:'Use a valid player action.'},405);const raw=await request.text();if(raw.length>2000)return json({error:'Player request is too large.'},413);let data;try{data=JSON.parse(raw);}catch{return json({error:'Send a valid player request.'},400);}
 if(create||path==='/api/night-shift/player/new'){const name=typeof data.name==='string'?data.name.trim():player?.name;if(!name||name.length>24)return json({error:'Enter a name with 1 to 24 characters.'},400);if(create){credential=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');player={id:crypto.randomUUID(),round:0};}player={...player,name,color:player.color||playerColors[crypto.getRandomValues(new Uint32Array(1))[0]%playerColors.length],round:player.round+1,mapRevision:saved.revision,tasks:assignTasks(layout),completed:[]};await this.ctx.storage.put('player:'+credential,player);return json({...project(),...(create?{token:credential}:{})});}
 if(path==='/api/night-shift/player/complete'){if(player.mapRevision!==saved.revision||data.round!==player.round)return json({error:'Your shift changed. Reload to get your current tasks.'},409);if(!player.tasks.some(t=>t.id===data.taskId))return json({error:'That task is not assigned to you.'},403);if(!player.completed.includes(data.taskId)){player.completed.push(data.taskId);await this.ctx.storage.put('player:'+credential,player);}return json(project());}return json({error:'Player action not found.'},404);
 }

}
