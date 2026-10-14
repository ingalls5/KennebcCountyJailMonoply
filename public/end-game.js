// Ending a whole game is separate from ending a player's turn.
export function bindEndGame({available,ready,end,reportError,clue=false,online=false}){
 const buttons=[...document.querySelectorAll('[data-end-game]')];
 let pending=false;
 function update(){for(const button of buttons){button.hidden=!available();button.disabled=pending||!ready();}}
 for(const button of buttons)button.onclick=async()=>{
  if(pending||!available()||!ready())return;
  const message=(online?'End this game for everyone in the room?':'End this game?')+' No winner will be declared.'+(clue?' The case file will be revealed.':'');
  if(!confirm(message)||!available()||!ready())return;
  pending=true;update();
  try{await end();}catch(error){reportError(error.message);}finally{pending=false;update();}
 };
 return {update};
}
