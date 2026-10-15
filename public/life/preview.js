import {createBoard} from './board.js?v=smooth-cars-1';
import {spinnerMax,spinnerStep} from './rules.js?v=smooth-cars-1';
const board=createBoard(document.getElementById('careerTiles'));
let angle=0;
for(const {button,path} of board.pathButtons)button.onclick=()=>{board.setPath(path);document.getElementById('previewSpinResult').textContent=path==='academy'?'Academy route: spin through 12 spaces, stop at graduation, then join the main road.':'Jail route: spin through 8 work spaces, finish the first shift, then join the main road.';};
board.spin.onclick=async()=>{board.spin.disabled=true;const number=1+Math.floor(Math.random()*spinnerMax),next=Math.ceil(angle/360)*360+1080+(number-1)*spinnerStep;const animation=board.needle.animate([{transform:`rotate(${angle}deg)`},{transform:`rotate(${next}deg)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1800,easing:'cubic-bezier(.15,.65,.12,1)',fill:'forwards'});await animation.finished;angle=next;board.needle.style.transform=`rotate(${angle}deg)`;animation.cancel();document.getElementById('previewSpinResult').textContent='Spinner: '+number+' · Board preview only';board.spin.disabled=false;};
