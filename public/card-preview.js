import {cardGraphic} from './card-art.js';
import {chance,chest} from './economy.js';
const cards=[...chance.map(card=>({...card,deck:'Chance'})),...chest.map(card=>({...card,deck:'Supervisors Office'}))];
const dialog=document.getElementById('cardTestDialog'),selector=document.getElementById('cardNumber');let index=0,returnToTurn=false;
cards.forEach((card,i)=>{const option=document.createElement('option');option.value=i;option.textContent=(i+1)+' · '+card.deck+' · '+card.text;selector.append(option);});
function render(){const card=cards[index];selector.value=index;document.getElementById('cardPreview').classList.toggle('supervisor-card',index>=16);document.getElementById('cardDeck').textContent=card.deck+' · Card '+(index+1);document.getElementById('cardSymbol').replaceChildren(cardGraphic(index+1));document.getElementById('cardText').textContent=card.text;document.getElementById('cardCounter').textContent=(index+1)+' of '+cards.length;document.getElementById('previousCard').disabled=index===0;document.getElementById('nextCard').disabled=index===cards.length-1;}
function open(){const turnDialog=document.getElementById('turnDialog');returnToTurn=turnDialog.open;if(returnToTurn)turnDialog.close();render();dialog.showModal();selector.focus();}
document.getElementById('testCards').onclick=open;document.getElementById('testCardsTurn').onclick=open;
selector.onchange=()=>{index=Number(selector.value);render();};
document.getElementById('previousCard').onclick=()=>{if(index>0){index--;render();if(index===0)document.getElementById('nextCard').focus();}};
document.getElementById('nextCard').onclick=()=>{if(index<cards.length-1){index++;render();if(index===cards.length-1)document.getElementById('previousCard').focus();}};
document.getElementById('closeCardTest').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{if(returnToTurn){returnToTurn=false;document.getElementById('turnDialog').showModal();}});
