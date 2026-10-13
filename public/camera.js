export class BoardCamera {
 constructor(board,viewport){this.board=board;this.viewport=viewport;this.enabled=true;this.targets=[];this.mode=null;this.frame=null;this.snapshot=null;this.view={x:0,y:0,scale:1};this.previous=0;}
 follow(targets,mode){this.targets=targets;this.mode=mode;if(!this.enabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!this.snapshot){this.snapshot={pageY:scrollY,left:this.viewport.scrollLeft,top:this.viewport.scrollTop,transform:this.board.style.transform};this.viewport.style.setProperty('--camera-height',Math.min(720,innerHeight*.66,Math.max(280,this.viewport.clientWidth*.8))+'px');this.viewport.classList.add('camera-following');this.viewport.scrollLeft=0;this.viewport.scrollTop=0;this.view={x:0,y:0,scale:1};this.previous=0;
   const overlay=matchMedia('(max-width:1000px)').matches?Math.min(innerHeight*.3,document.querySelector('.control-card').getBoundingClientRect().height+16):16;window.scrollTo({top:Math.max(0,this.viewport.getBoundingClientRect().top+scrollY-overlay),behavior:'instant'});
  }
  this.viewport.dataset.cameraMode=mode;document.getElementById('cameraStatus').textContent=mode==='dice'?'Following dice':'Following pawn';if(this.frame===null)this.frame=requestAnimationFrame(time=>this.track(time));
 }
 async focus(targets,mode){this.follow(targets,mode);if(this.snapshot)await new Promise(resolve=>setTimeout(resolve,500));}
 track(time){this.frame=null;if(!this.snapshot)return;const boardRect=this.board.getBoundingClientRect(),scale=this.view.scale,rects=this.targets.filter(target=>target.isConnected).map(target=>target.getBoundingClientRect());if(!rects.length){this.stop();return;}
  const left=(Math.min(...rects.map(r=>r.left))-boardRect.left)/scale,right=(Math.max(...rects.map(r=>r.right))-boardRect.left)/scale,top=(Math.min(...rects.map(r=>r.top))-boardRect.top)/scale,bottom=(Math.max(...rects.map(r=>r.bottom))-boardRect.top)/scale;
  const width=this.viewport.clientWidth-16,height=this.viewport.clientHeight-16,padding=this.board.clientWidth*.12;
  const desiredScale=this.mode==='pawn'?3:Math.min(2.15,width/(right-left+padding*2),height/(bottom-top+padding*2));
  const delta=this.previous?Math.min(60,time-this.previous):16,smooth=this.previous?1-Math.exp(-delta/130):1;this.previous=time;this.view.scale+=(desiredScale-this.view.scale)*smooth;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value)),scaledWidth=this.board.offsetWidth*this.view.scale,scaledHeight=this.board.offsetHeight*this.view.scale;
  const x=scaledWidth<width?(width-scaledWidth)/2:clamp(width/2-(left+right)/2*this.view.scale,width-scaledWidth,0),y=scaledHeight<height?(height-scaledHeight)/2:clamp(height/2-(top+bottom)/2*this.view.scale,height-scaledHeight,0);
  this.view.x+=(x-this.view.x)*smooth;this.view.y+=(y-this.view.y)*smooth;this.board.style.transform=`translate(${this.view.x}px,${this.view.y}px) scale(${this.view.scale})`;
  this.frame=requestAnimationFrame(next=>this.track(next));
 }
 stop(clear=true){if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;if(this.snapshot){const saved=this.snapshot;this.board.style.transform=saved.transform;this.viewport.classList.remove('camera-following');this.viewport.style.removeProperty('--camera-height');this.viewport.scrollLeft=saved.left;this.viewport.scrollTop=saved.top;this.snapshot=null;window.scrollTo({top:saved.pageY,behavior:'instant'});}delete this.viewport.dataset.cameraMode;if(clear){this.targets=[];this.mode=null;}this.view={x:0,y:0,scale:1};this.previous=0;}
 setEnabled(value){this.enabled=value;if(!value)this.stop(false);else if(this.targets.length)this.follow(this.targets,this.mode);}
}
