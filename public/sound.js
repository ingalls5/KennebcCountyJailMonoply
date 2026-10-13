const preferenceKey='kennebc-sound-v1';

class GameSound {
 constructor(){
  this.enabled=true;try{this.enabled=localStorage.getItem(preferenceKey)!=='off';}catch{}
  this.context=null;this.master=null;this.buffer=null;this.diceBuffers=[];this.diceLoading=null;this.generation=0;
  this.transferBuffers={};this.transferLoading=null;
  this.transferFiles=Promise.all(['paper-fan-1','paper-fan-2','paper-slide','paper-place','money-count','money-stack'].map(async name=>{const response=await fetch('audio/'+name+'.wav');if(!response.ok)throw Error('Recording unavailable');return[name,await response.arrayBuffer()];})).catch(()=>[]);
  this.diceFiles=Promise.all([1,2,3].map(number=>fetch('audio/dice-roll-'+number+'.wav').then(response=>{if(!response.ok)throw Error('Recording unavailable');return response.arrayBuffer();}))).catch(()=>[]);this.sources=new Set();this.controls=[];this.seed=0x6d2b79f5;this.lastPawn=-Infinity;
 }
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 bind(controls){
  this.controls=controls;this.updateControls();
  controls.forEach(button=>button.addEventListener('click',()=>{this.setEnabled(!this.enabled);if(this.enabled)this.unlock();}));
  // Unlock audio within the user's tap/key press, before any animation awaits.
  document.addEventListener('pointerdown',event=>{if(event.target.closest('button,input,select,summary'))this.unlock();},{capture:true});
  document.addEventListener('click',event=>{if(event.target.closest('button,input,select,summary'))this.unlock();},{capture:true});
  document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))this.unlock();},{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stopAll();});
 }
 updateControls(){for(const button of this.controls){button.textContent='Sound: '+(this.enabled?'on':'off');button.setAttribute('aria-pressed',String(this.enabled));}}
 setEnabled(enabled){this.enabled=enabled;try{localStorage.setItem(preferenceKey,enabled?'on':'off');}catch{}if(!enabled)this.stopAll();this.updateControls();}
 unlock(){
  if(!this.enabled)return;
  try{
   if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.65;
    const compressor=this.context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=6;this.master.connect(compressor);compressor.connect(this.context.destination);
    this.buffer=this.context.createBuffer(1,this.context.sampleRate,this.context.sampleRate);const data=this.buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=this.random()*2-1;
   }
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
  }catch{this.stopAll();this.context=null;}
 }
 stopAll(){this.generation++;for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();}
 voice(source,nodes,start,duration,level,recorded=false){
  const envelope=this.context.createGain();envelope.gain.setValueAtTime(.0001,start);envelope.gain.exponentialRampToValueAtTime(level,start+.008);if(recorded){envelope.gain.setValueAtTime(level,start+Math.max(.01,duration-.018));envelope.gain.linearRampToValueAtTime(.0001,start+duration);}else envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
  let tail=source;for(const node of nodes){tail.connect(node);tail=node;}tail.connect(envelope);envelope.connect(this.master);this.sources.add(source);
  source.onended=()=>{this.sources.delete(source);source.disconnect();nodes.forEach(node=>node.disconnect());envelope.disconnect();};source.start(start);source.stop(start+duration+.02);
 }
 tone(start,duration,from,to,level,type='sine'){
  const oscillator=this.context.createOscillator();oscillator.type=type;oscillator.frequency.setValueAtTime(from,start);oscillator.frequency.exponentialRampToValueAtTime(to,start+duration);this.voice(oscillator,[],start,duration,level);
 }
 noise(start,duration,frequency,level){const source=this.context.createBufferSource();source.buffer=this.buffer;const filter=this.context.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.65;this.voice(source,[filter],start,duration,level);}
 play(build){
  if(!this.enabled||!this.context||this.context.state==='closed'||document.hidden)return()=>{};
  const previous=new Set(this.sources);
  try{build(this.context.currentTime+.015);}catch{/* Audio availability never blocks a game action. */}
  const sources=[...this.sources].filter(source=>!previous.has(source));return()=>{for(const source of sources){try{source.stop();}catch{}}};
 }
 async loadDice(){
  if(this.diceBuffers.length||!this.context)return this.diceBuffers;
  if(!this.diceLoading){const context=this.context;this.diceLoading=this.diceFiles.then(files=>Promise.all(files.map(file=>context.decodeAudioData(file.slice(0))))).then(buffers=>this.diceBuffers=buffers).catch(()=>[]);}
  return this.diceLoading;
 }
 dice(durationMs){
  let cancelled=false,stop=()=>{};const began=performance.now(),generation=this.generation;
  const play=()=>{if(cancelled||generation!==this.generation||!this.diceBuffers.length)return;const duration=Math.max(0,(durationMs-(performance.now()-began))/1000);if(duration<.05)return;
   stop=this.play(start=>{const beats=Math.max(1,Math.round(duration)),beat=duration/beats;for(let hop=0;hop<beats;hop++){const buffer=this.diceBuffers[Math.floor(this.random()*this.diceBuffers.length)],source=this.context.createBufferSource();source.buffer=buffer;this.voice(source,[],start+hop*beat,Math.min(buffer.duration,beat),.6,true);}});
  };
  if(this.diceBuffers.length)play();else this.loadDice().then(play);
  return()=>{cancelled=true;stop();};
 }
 pawn(durationMs){
  const now=this.context?.currentTime??0;if(now-this.lastPawn<.14)return;this.lastPawn=now;
  this.play(start=>{this.tone(start,.11,310,540,.055);const landing=start+Math.max(.08,durationMs/1000*.82);this.tone(landing,.085,220,105,.07);this.noise(landing,.035,1500,.035);});
 }
 async loadTransfers(){
  if(Object.keys(this.transferBuffers).length||!this.context)return this.transferBuffers;
  if(!this.transferLoading){const context=this.context;this.transferLoading=this.transferFiles.then(files=>Promise.all(files.map(async([name,file])=>[name,await context.decodeAudioData(file.slice(0))]))).then(buffers=>this.transferBuffers=Object.fromEntries(buffers)).catch(()=>({}));}
  return this.transferLoading;
 }
 transfer(kind,durationMs,direction=1){
  let cancelled=false,stop=()=>{};const began=performance.now(),generation=this.generation;
  const play=()=>{if(cancelled||generation!==this.generation)return;const duration=Math.max(0,(durationMs-(performance.now()-began))/1000);if(duration<.05)return;
   stop=this.play(start=>{
    // Every transfer voice is recorded foley; no oscillator or generated noise.
    const recording=(name,fraction,maxDuration,level)=>{const buffer=this.transferBuffers[name];if(!buffer)return;const source=this.context.createBufferSource();source.buffer=buffer;const nodes=[];if(this.context.createStereoPanner){const pan=this.context.createStereoPanner();pan.pan.value=(fraction*2-1)*.65*direction;nodes.push(pan);}this.voice(source,nodes,start+duration*fraction,Math.min(buffer.duration,maxDuration,duration*(1-fraction)),level,true);};
    if(duration<.65){recording(kind==='money'?'money-stack':'paper-place',.02,duration*.9,.7);return;}
    const fan=this.random()<.5?'paper-fan-1':'paper-fan-2';
    if(kind==='money'){recording(fan,.04,.65,.55);recording('money-count',.28,Math.min(.85,duration*.3),.65);recording('money-stack',.84,Math.min(.8,duration*.14),.75);}
    else{recording(fan,.04,.65,.75);recording('paper-slide',.4,.6,.8);recording('paper-place',.78,.7,.9);}
   });
  };
  if(Object.keys(this.transferBuffers).length)play();else this.loadTransfers().then(play);
  return()=>{cancelled=true;stop();};
 }
}
export const sound=new GameSound();
