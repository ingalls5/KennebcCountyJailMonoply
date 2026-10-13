import {loadGame as loadClue} from './clue/rules.js';
import {loadPlayers} from './players.js';
import {gameKey} from './economy.js';

// Only offer a continuation when the board can restore this saved roster.
// Visiting the game shelf never writes to or replaces a saved game.
try {
  const roster=loadPlayers();
  const game=JSON.parse(localStorage.getItem(gameKey));
  if(roster.length && game?.version===1 && Array.isArray(game.players) &&
    game.players.length===roster.length && roster.every((p,i)=>p.name===game.players[i].name&&p.pawn===game.players[i].pawn) &&
    game.properties?.length===40 && Number.isInteger(game.turn) && game.players[game.turn]) {
    const finished=game.phase==='over';
    document.getElementById('continueGame').firstChild.textContent=finished?'View last game ':'Continue game ';
    document.getElementById('savedGameSummary').textContent=`${roster.length} player${roster.length===1?'':'s'} · ${finished?'Game finished':game.players[game.turn].name+"’s turn"}`;
    document.getElementById('savedGame').hidden=false;
  }
} catch {
  // Missing or unreadable storage leaves the normal play option available.
}

const clue=loadClue();
if(clue){
  const finished=clue.phase==='over';
  document.getElementById('continueClue').firstChild.textContent=finished?'View last case ':'Continue case ';
  document.getElementById('savedClueSummary').textContent=`${clue.players.length} detectives · ${finished?'Case closed':clue.players[clue.turn].name+"’s turn"}`;
  document.getElementById('savedClue').hidden=false;
}
