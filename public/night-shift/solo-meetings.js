import {playerColors} from './player-rules.js?v=briefing-button-2';
import {chooseMeetingScene} from './meeting-result-rules.js?v=briefing-button-2';
// Solo practice uses the normal meeting UI without changing a saved shift or group.
export function createSoloMeetings({render,finished}){
 let state=null,generation=0,scheduledTurn=null,lastScene=null;const timers=new Set();
 function later(fn,ms){const run=generation,id=setTimeout(()=>{timers.delete(id);if(run===generation&&state)fn();},ms);timers.add(id);}
 function update(){if(!state)return;const m=state.meeting;if(['discussion','voting'].includes(state.phase)&&m.done.length===m.order.length&&m.voted.length===m.order.length)resolve();state.serverTime=Date.now();render(structuredClone(state));}
 function automate(){if(state?.phase!=='discussion')return;const m=state.meeting,id=m.order[m.turn];if(!id||id==='solo-you'||scheduledTurn===id)return;scheduledTurn=id;later(()=>{m.messages.push({id:crypto.randomUUID(),playerId:id,message:['I was busy with my assignments. What did you notice?','I passed through Intake, but I did not see enough to be sure.','We should compare what everyone saw before deciding.'][m.turn%3],at:Date.now()});update();later(()=>{m.done.push(id);m.turn++;scheduledTurn=null;if(m.turn===m.order.length)state.phase='voting';update();automate();},1500);},900);}
 function resolve(){const m=state.meeting,counts={};for(const vote of Object.values(m.votes))counts[vote]=(counts[vote]||0)+1;const ejectedId=m.order.find(id=>(counts[id]||0)>m.order.length/2)||null,scene=chooseMeetingScene(!!ejectedId,lastScene);lastScene=scene;state.phase='escort';if(ejectedId){state.members.find(p=>p.id===ejectedId).alive=false;if(ejectedId===state.me.id)state.me.alive=false;}m.result={ejectedId,counts,votes:{...m.votes},scene,seed:crypto.getRandomValues(new Uint32Array(1))[0],startedAt:Date.now(),endsAt:Date.now()+14000,route:null};}
 function close(){generation++;for(const timer of timers)clearTimeout(timer);timers.clear();state=null;scheduledTurn=null;finished();}
 return {
  active:()=>!!state,
  start(player){generation++;const colors=playerColors.filter(c=>c!==player.color),members=[{id:'solo-you',name:player.name,color:player.color||playerColors[0],alive:true,online:true},...Array.from({length:3},(_,i)=>({id:'practice-'+i,name:'Practice Officer '+(i+1),color:colors[i],alive:true,online:true}))];state={practice:true,status:'playing',phase:'discussion',round:1,roundEndsAt:null,host:false,serverTime:Date.now(),members,me:{...members[0]},meeting:{id:crypto.randomUUID(),number:1,callerId:'solo-you',reason:'emergency',startedAt:Date.now(),order:members.map(p=>p.id),turn:0,messages:[],done:[],votes:{},voted:[],myVote:null,result:null}};update();},
  async send(action,data){if(!state||data.meetingId!==state.meeting.id)throw Error('This practice meeting has ended.');const m=state.meeting;
   if(action==='speak'){if(state.phase!=='discussion'||m.order[m.turn]!==state.me.id)throw Error('Wait for your speaking turn.');const message=String(data.message||'').trim();if(!message||message.length>600)throw Error('Write a message of 1–600 characters.');m.messages.push({id:data.id,playerId:state.me.id,message,at:Date.now()});}
   else if(action==='speaker-done'){if(state.phase!=='discussion'||m.order[m.turn]!==state.me.id)throw Error('Wait for your speaking turn.');m.done.push(state.me.id);m.turn++;if(m.turn===m.order.length)state.phase='voting';}
   else if(action==='vote'){if(!['discussion','voting'].includes(state.phase)||m.myVote!==null)throw Error('Your vote is already submitted.');if(data.targetId!=='skip'&&!m.order.includes(data.targetId))throw Error('Choose an officer or Skip.');m.myVote=data.targetId;m.votes[state.me.id]=data.targetId;m.voted=Object.keys(m.votes);state.members.slice(1).forEach((member,i)=>later(()=>{m.votes[member.id]=data.targetId;m.voted=Object.keys(m.votes);update();},800*(i+1)));}
   else throw Error('Choose a practice meeting action.');update();automate();return structuredClone(state);
  },
  tick(){if(state?.phase==='escort'&&Date.now()>=state.meeting.result.endsAt)close();},close
 };
}
