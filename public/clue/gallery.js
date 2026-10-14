import {suspects,items,rooms,defaultConfig} from './rules.js';
import {evidenceCard,pawnIcon} from './pieces.js';

// Public sample pieces only: the preview never opens a saved case or room.
const sample={config:defaultConfig(),players:suspects.map((suspect,index)=>({name:'Player '+(index+1),suspect:suspect.id,personality:suspect.personality}))};
sample.players.forEach(player=>sample.config['suspect:'+player.suspect]=player.name);

suspects.forEach((suspect,index)=>{
 const figure=document.createElement('figure');figure.className='pawn-sample';figure.dataset.pawn=suspect.id;
 const stage=document.createElement('div');stage.className='pawn-stage';stage.append(pawnIcon(suspect));
 const caption=document.createElement('figcaption'),role=document.createElement('strong'),name=document.createElement('span');
 role.textContent=suspect.personality;name.textContent='Player '+(index+1);caption.append(role,name);figure.append(stage,caption);
 document.getElementById('pawnGallery').append(figure);
 document.getElementById('suspectGallery').append(evidenceCard(sample,'suspect:'+suspect.id));
});
items.forEach(item=>document.getElementById('weaponGallery').append(evidenceCard(sample,'item:'+item.id)));
rooms.forEach(room=>document.getElementById('roomGallery').append(evidenceCard(sample,'room:'+room.id)));
