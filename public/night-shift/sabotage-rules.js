// Shared names and effects; role assignment and authorization live on the server.
export const sabotages=[
 {id:'power',name:'Cut power',game:'wires',repair:'Restore power',effect:'Lights are out. Powered stations pause until the breaker is restored.'},
 {id:'radio',name:'Disrupt radios',game:'radio',repair:'Reset radio relay',effect:'Radio frequencies drift. Retune carefully or restore the relay.'},
 {id:'equipment',name:'Tamper with equipment',game:'calibrate',repair:'Repair equipment controls',effect:'Calibration readings and pressure gauges are unstable.'},
 {id:'doors',name:'Jam doors',game:'keypad',repair:'Release jammed doors',effect:'Marked doors are locked. Use a manual release at a jammed doorway.'},
 {id:'records',name:'Scramble records',game:'records',repair:'Restore records terminal',effect:'Intake receipts are unreliable. Check the archive before stamping each file.'},
 {id:'cameras',name:'Disable cameras',game:'sequence',repairGame:'wires',repair:'Reconnect camera system',effect:'Camera feeds have lost their signal.'}
];
export const sabotageFor=id=>sabotages.find(s=>s.id===id)||null;
export const poweredGames=new Set(['wires','sequence','calibrate','keypad','timing','radio','fingerprint','valves']);
export function affectedTask(game,effect){return !!effect&&(effect.type==='power'?poweredGames.has(game):effect.type==='radio'?game==='radio':effect.type==='equipment'?['calibrate','timing'].includes(game):effect.type==='records'?game==='records':false);}
export const sabotageCooldown=45000;
