export class BoardCamera {
 constructor(board,viewport){this.board=board;this.viewport=viewport;this.enabled=true;this.targets=[];this.mode=null;this.frame=null;this.snapshot=null;this.view={x:0,y:0,scale:1};this.previous=0;this.transition=null;window.addEventListener('resize',()=>{if(!this.snapshot)return;this.sizeStage();if(this.frame===null&&!this.transition){this.previous=0;this.track(performance.now(),true);}});}
 sizeStage(){this.viewport.style.setProperty('--camera-height',Math.min(720,innerHeight*.66,Math.max(280,this.viewport.clientWidth*.8))+'px');}
 follow(targets,mode){this.targets=targets;this.mode=mode;if(!this.enabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!this.snapshot){this.snapshot={pageY:scrollY,left:this.viewport.scrollLeft,top:this.viewport.scrollTop,transform:this.board.style.transform};this.sizeStage();this.viewport.classList.add('camera-following');this.viewport.scrollLeft=0;this.viewport.scrollTop=0;this.view={x:0,y:0,scale:1};this.previous=0;
   const overlay=matchMedia('(max-width:1000px)').matches?Math.min(innerHeight*.3,document.querySelector('.control-card').getBoundingClientRect().height+16):16;window.scrollTo({top:Math.max(0,this.viewport.getBoundingClientRect().top+scrollY-overlay),behavior:'instant'});
  }
  this.viewport.dataset.cameraMode=mode;document.getElementById('cameraStatus').textContent=mode==='overview'?'Full board':mode==='dice'?'Following dice':'Following pawn';if(this.frame===null)this.frame=requestAnimationFrame(time=>this.track(time));
 }
 async focus(targets,mode){this.follow(targets,mode);if(!this.snapshot)return;const duration=mode==='overview'?1800:1600;this.transition={from:{...this.view},start:performance.now(),duration};await new Promise(resolve=>setTimeout(resolve,duration+100));}
 async overview(){await this.focus([this.board],'overview');if(this.snapshot)await new Promise(resolve=>setTimeout(resolve,1000));}
 async finish(){if(!this.snapshot)return;await this.focus([this.board],'overview');if(this.mode==='overview'&&!this.transition){if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;}}
 track(time,once=false){this.frame=null;if(!this.snapshot)return;const boardRect=this.board.getBoundingClientRect(),scale=this.view.scale,rects=this.targets.filter(target=>target.isConnected).map(target=>target.getBoundingClientRect());if(!rects.length){this.stop();return;}
  const left=(Math.min(...rects.map(r=>r.left))-boardRect.left)/scale,right=(Math.max(...rects.map(r=>r.right))-boardRect.left)/scale,top=(Math.min(...rects.map(r=>r.top))-boardRect.top)/scale,bottom=(Math.max(...rects.map(r=>r.bottom))-boardRect.top)/scale;
  const width=this.viewport.clientWidth-16,height=this.viewport.clientHeight-16,padding=this.board.clientWidth*.12;
  const desiredScale=this.mode==='overview'?Math.min(width/this.board.offsetWidth,height/this.board.offsetHeight):this.mode==='pawn'?3:Math.min(2.15,width/(right-left+padding*2),height/(bottom-top+padding*2));
  const delta=this.previous?Math.min(60,time-this.previous):16,smooth=this.previous?1-Math.exp(-delta/130):1;this.previous=time;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const position=scale=>{const scaledWidth=this.board.offsetWidth*scale,scaledHeight=this.board.offsetHeight*scale;return{x:scaledWidth<width?(width-scaledWidth)/2:clamp(width/2-(left+right)/2*scale,width-scaledWidth,0),y:scaledHeight<height?(height-scaledHeight)/2:clamp(height/2-(top+bottom)/2*scale,height-scaledHeight,0)};};
  if(this.transition){const {from,start,duration}=this.transition,progress=Math.min(1,(time-start)/duration),ease=progress*progress*(3-2*progress),target={...position(desiredScale),scale:desiredScale};for(const key of ['x','y','scale'])this.view[key]=from[key]+(target[key]-from[key])*ease;if(progress===1)this.transition=null;}
  else{this.view.scale+=(desiredScale-this.view.scale)*smooth;const target=position(this.view.scale);this.view.x+=(target.x-this.view.x)*smooth;this.view.y+=(target.y-this.view.y)*smooth;}
  this.board.style.transform=`translate(${this.view.x}px,${this.view.y}px) scale(${this.view.scale})`;
  if(!once)this.frame=requestAnimationFrame(next=>this.track(next));
 }
 stop(clear=true){if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.transition=null;if(this.snapshot){const saved=this.snapshot;this.board.style.transform=saved.transform;this.viewport.classList.remove('camera-following');this.viewport.style.removeProperty('--camera-height');this.viewport.scrollLeft=saved.left;this.viewport.scrollTop=saved.top;this.snapshot=null;window.scrollTo({top:saved.pageY,behavior:'instant'});}delete this.viewport.dataset.cameraMode;if(clear){this.targets=[];this.mode=null;}this.view={x:0,y:0,scale:1};this.previous=0;}
 setEnabled(value){this.enabled=value;if(!value)this.stop(false);else if(this.targets.length)this.follow(this.targets,this.mode);}
}
