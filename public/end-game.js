import {forgetSeat} from './online.js';

export function clearEndedGame(kind,roomCode,storageKeys=[]){
 if(roomCode)forgetSeat(kind,roomCode);
 else for(const key of storageKeys)localStorage.removeItem(key);
 location.replace('/');
}

// Ending a whole game is separate from ending a player's turn.
export function bindEndGame({available,ready,end,reportError,online=false}){
 const buttons=[...document.querySelectorAll('[data-end-game]')];
 let pending=false;
 function update(){for(const button of buttons){button.hidden=!available();button.disabled=pending||!ready();}}
 for(const button of buttons)button.onclick=async()=>{
  if(pending||!available()||!ready())return;
  const message=online?'End this game for everyone in the room? The room and its game data will be deleted. Everyone will return to the homepage.':'End this game? This deletes its saved progress and player setup and returns you to the homepage.';
  if(!confirm(message)||!available()||!ready())return;
  pending=true;update();
  try{await end();}catch(error){reportError(error.message);}finally{pending=false;update();}
 };
 return {update};
}
