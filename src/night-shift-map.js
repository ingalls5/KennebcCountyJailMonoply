import {validateLayout} from '../public/night-shift/layout.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export class NightShiftMap {
 constructor(ctx){this.ctx=ctx;}
 async fetch(request){return this.ctx.blockConcurrencyWhile(async()=>{try{
 const saved=await this.ctx.storage.get('map')||{revision:0,layout:null};
 if(request.method==='GET')return json(saved);
 if(request.method!=='POST')return json({error:'Use a valid map action.'},405);
 const reader=request.body?.getReader();if(!reader)return json({error:'Send a map.'},400);let size=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>300000){await reader.cancel();return json({error:'That map is too large.'},413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const data=JSON.parse(new TextDecoder().decode(bytes));
 if(data.revision!==saved.revision)return json({error:'The shared map changed on another device. Export your edits as a backup, then reload before editing the latest map.'},409);
 const next={revision:saved.revision+1,layout:validateLayout(data.layout),updatedAt:new Date().toISOString()};await this.ctx.storage.put('map',next);return json(next);
 }catch(e){return json({error:e.message||'Could not save the map.'},400);}});}
}
