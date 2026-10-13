const preferenceKey='kennebc-sound-v1';

class GameSound {
 constructor(){
  this.enabled=true;try{this.enabled=localStorage.getItem(preferenceKey)!=='off';}catch{}
  this.context=null;this.master=null;this.buffer=null;this.sources=new Set();this.controls=[];this.seed=0x6d2b79f5;this.lastPawn=-Infinity;
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
 stopAll(){for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();}
 voice(source,nodes,start,duration,level){
  const envelope=this.context.createGain();envelope.gain.setValueAtTime(.0001,start);envelope.gain.exponentialRampToValueAtTime(level,start+.008);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
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
 dice(durationMs){return this.play(start=>{
  const duration=durationMs/1000,beats=Math.max(1,Math.round(duration)),beat=duration/beats;
  for(let hop=0;hop<beats;hop++)for(const fraction of [.04,.18,.42,.76,.98]){const time=start+(hop+fraction)*beat,level=.07+(1-hop/beats)*.045;this.noise(time,.045,2200+this.random()*1400,level);this.tone(time,.055,650+this.random()*250,290,.035,'triangle');}
 });}
 pawn(durationMs){
  const now=this.context?.currentTime??0;if(now-this.lastPawn<.14)return;this.lastPawn=now;
  this.play(start=>{this.tone(start,.11,310,540,.055);const landing=start+Math.max(.08,durationMs/1000*.82);this.tone(landing,.085,220,105,.07);this.noise(landing,.035,1500,.035);});
 }
 transfer(kind,durationMs){return this.play(start=>{
  const duration=durationMs/1000;
  if(kind==='money'){for(const fraction of [.06,.3,.56,.76])this.noise(start+duration*fraction,.12,3300,.07);[1568,2093,2637].forEach((frequency,i)=>this.tone(start+duration*.87+i*.045,.15,frequency,frequency*.99,.045,'triangle'));}
  else{for(const fraction of [.06,.28,.53,.74])this.noise(start+duration*fraction,.2,1800,.085);const arrival=start+duration*.9;this.tone(arrival,.09,180,75,.065);this.noise(arrival,.05,1000,.04);}
 });}
}
export const sound=new GameSound();
