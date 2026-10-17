export function taskNode(tag,attrs={},text){const svgTags=new Set(['svg','path','circle','rect','ellipse','line','polygon','polyline','g','text','defs','clipPath','linearGradient','stop']);const node=svgTags.has(tag)?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);for(const [key,value]of Object.entries(attrs||{})){if(value===false||value===null||value===undefined)continue;if(key==='class'||key==='className')node.setAttribute('class',value);else if(key==='style'&&typeof value==='object')Object.assign(node.style,value);else if(key==='dataset')Object.assign(node.dataset,value);else if(key==='disabled'||key==='checked'||key==='hidden')node[key]=!!value;else node.setAttribute(key,value===true?'':String(value));}if(text!==undefined)node.textContent=text;return node;}
export function createTaskKit({stage,instructions,feedback,finish,progress,isActive}){
 const cleanups=[],draggedAt=new WeakMap();let disposed=false;
 const usable=()=>!disposed&&isActive();
 const cleanup=fn=>{cleanups.push(fn);return fn;};
 const listen=(target,event,handler,options)=>{const wrapped=e=>{if(usable())return handler(e);};target.addEventListener(event,wrapped,options);cleanup(()=>target.removeEventListener(event,wrapped,options));return wrapped;};
 const status=text=>{if(!usable())return;feedback.dataset.tone='neutral';feedback.textContent=text;};
 const wrong=text=>{if(!usable())return;feedback.dataset.tone='error';feedback.textContent=text;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)stage.animate([{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:170});};
 const button=(label,handler,attrs={})=>{const node=taskNode('button',{type:'button',...attrs},label);if(handler)listen(node,'click',handler);return node;};
 const suppressDropClick=source=>listen(source,'click',e=>{if(e.detail>0&&performance.now()-(draggedAt.get(source)||-1000)<450){e.preventDefault();e.stopImmediatePropagation();}},true);
 const drag=(source,targets,onDrop,onMove)=>{
  source.classList.add('machine-draggable');source.style.touchAction='none';suppressDropClick(source);let start=null,ghost=null,dragging=false;
  const allTargets=()=>Array.from(typeof targets==='function'?targets():targets||[]).filter(t=>t?.isConnected&&!t.disabled&&t.getAttribute('aria-disabled')!=='true');
  const clear=()=>{if(start)try{source.releasePointerCapture(start.id);}catch{}ghost?.remove();ghost=null;for(const target of allTargets())target.classList.remove('machine-drop-hover');source.classList.remove('machine-dragging');start=null;dragging=false;};
  cleanup(clear);
  listen(source,'pointerdown',e=>{if(e.button>0||source.disabled)return;draggedAt.delete(source);start={id:e.pointerId,x:e.clientX,y:e.clientY};dragging=false;source.setPointerCapture(e.pointerId);});
  listen(source,'pointermove',e=>{if(!start||e.pointerId!==start.id)return;if(!dragging&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<7)return;if(!dragging){dragging=true;source.classList.add('machine-dragging');ghost=taskNode('div',{class:'machine-drag-ghost','aria-hidden':'true'},source.getAttribute('data-drag-label')||source.textContent);source.closest('dialog').append(ghost);}e.preventDefault();ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';const hit=document.elementFromPoint(e.clientX,e.clientY);for(const target of allTargets())target.classList.toggle('machine-drop-hover',target===hit||target.contains(hit));onMove?.(e);});
  listen(source,'pointerup',e=>{if(!start||e.pointerId!==start.id)return;if(dragging){draggedAt.set(source,performance.now());const hit=document.elementFromPoint(e.clientX,e.clientY),target=allTargets().find(t=>t===hit||t.contains(hit));if(target)onDrop(target,e);else status('Move the item onto its matching equipment.');}clear();});
  listen(source,'pointercancel',clear);
 };
 const dial=(node,onTurn)=>{
  node.classList.add('machine-turnable');node.style.touchAction='none';if(!node.hasAttribute('tabindex'))node.tabIndex=0;suppressDropClick(node);let pointer=null,last=0,remainder=0;
  const clear=()=>{if(pointer!==null)try{node.releasePointerCapture(pointer);}catch{}pointer=null;remainder=0;};cleanup(clear);
  const angle=e=>{const r=node.getBoundingClientRect();return Math.atan2(e.clientY-r.y-r.height/2,e.clientX-r.x-r.width/2);};
  listen(node,'pointerdown',e=>{if(e.button>0||node.disabled)return;draggedAt.delete(node);pointer=e.pointerId;last=angle(e);remainder=0;node.setPointerCapture(pointer);});
  listen(node,'pointermove',e=>{if(e.pointerId!==pointer||node.disabled)return;let delta=angle(e)-last;last=angle(e);if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;remainder+=delta;let steps=0;while(Math.abs(remainder)>=.35&&steps++<8&&usable()&&!node.disabled){const direction=Math.sign(remainder);remainder-=direction*.35;draggedAt.set(node,performance.now());onTurn(direction);}});
  listen(node,'pointerup',clear);listen(node,'pointercancel',clear);
  listen(node,'keydown',e=>{if(node.disabled)return;if(['ArrowRight','ArrowUp','+','='].includes(e.key)){e.preventDefault();onTurn(1);}else if(['ArrowLeft','ArrowDown','-','−'].includes(e.key)){e.preventDefault();onTurn(-1);}});
 };
 const dispose=()=>{if(disposed)return;disposed=true;for(const fn of cleanups.splice(0)){try{fn();}catch{}}};
 return {stage,instructions,feedback,node:taskNode,button,listen,cleanup,status,wrong,finish,drag,dial,progress,dispose};
}
