export function drivingEffects(board){
 const layer=document.createElement('div');layer.className='life-camera-layer';layer.append(...board.childNodes);board.append(layer);
 const button=document.createElement('button');button.type='button';button.className='text-button';let muted=localStorage.getItem('life-driving-muted')==='true';
 const label=()=>{button.textContent=muted?'Car sound: off':'Car sound: on';button.setAttribute('aria-pressed',String(!muted));};label();board.parentElement.querySelector('.board-heading').append(button);
 let ctx,buffer,source,gain,frame=0,serial=0;
 const prepare=()=>{try{ctx??=new(window.AudioContext||window.webkitAudioContext)();ctx.resume().catch(()=>{});if(!buffer)fetch('/audio/car-engine.mp3').then(r=>r.arrayBuffer()).then(b=>ctx.decodeAudioData(b)).then(b=>buffer=b).catch(()=>{});}catch{}};
 document.addEventListener('pointerdown',prepare,{once:true,capture:true});document.addEventListener('keydown',prepare,{once:true,capture:true});
 const silence=()=>{if(source){try{source.stop();}catch{}source=null;}};
 button.onclick=()=>{muted=!muted;localStorage.setItem('life-driving-muted',String(muted));if(muted)silence();else prepare();label();};
 function sound(){if(document.hidden||muted||source||!buffer||ctx?.state!=='running')return;source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;gain=ctx.createGain();gain.gain.value=.22;source.connect(gain).connect(ctx.destination);source.start();}
 function reset(){serial++;cancelAnimationFrame(frame);silence();layer.style.transition='';layer.style.transform='';delete board.dataset.cameraMode;}
 function follow(token,animation){
  const id=++serial;let x=0,y=0,scale=1,last=0;board.dataset.cameraMode='following-car';
  function tick(time){if(id!==serial)return;const timing=animation.effect.getComputedTiming(),active=timing.progress!==null&&animation.currentTime>=animation.effect.getTiming().delay;
   if(active){const w=board.clientWidth,h=board.clientHeight,style=getComputedStyle(token),px=parseFloat(style.left),py=parseFloat(style.top),zoom=2.4;
    const tx=Math.max(w*(1-zoom),Math.min(0,w/2-px*zoom)),ty=Math.max(h*(1-zoom),Math.min(0,h/2-py*zoom));
    const ease=1-Math.exp(-Math.min(50,time-(last||time-16))/140);scale+=(zoom-scale)*ease;x+=(tx-x)*ease;y+=(ty-y)*ease;layer.style.transform=`translate(${x}px,${y}px) scale(${scale})`;sound();
   }last=time;frame=requestAnimationFrame(tick);
  }frame=requestAnimationFrame(tick);
 }
 async function overview(){const id=++serial;cancelAnimationFrame(frame);silence();layer.style.transition='transform 1100ms cubic-bezier(.22,.65,.3,1)';layer.style.transform='translate(0px,0px) scale(1)';board.dataset.cameraMode='overview';await new Promise(r=>setTimeout(r,1100));if(id===serial){layer.style.transition='';delete board.dataset.cameraMode;}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});window.addEventListener('pagehide',reset);
 return {reset,follow,overview};
}
