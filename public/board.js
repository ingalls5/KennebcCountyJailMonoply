const property=(name,group,price)=>({name,type:'property',group,price});
const special=(name,type,icon,detail,price)=>({name,type,icon,detail,price});
export const spaces=[
 special('Briefing','go','↗','Collect $200 each time you pass Briefing.'),
 property('HD8','brown',60),special('Supervisors Office','chest','▣','Draw a card from the Supervisors Office.'),property('HD10','brown',60),special('Mainely Vending','tax','vending','Pay $200.',200),
 special('Sgt. Christanson','railroad','🚓','One of four railroads.',200),property('OB1','lightblue',100),special('Chance','chance','?','Draw a Chance card.'),property('OB2','lightblue',100),property('OB3','lightblue',120),
 special('Two Bridges','jail','▥','The jail and visiting space is now Two Bridges.'),property('Golf','pink',140),special('Taser Instructor','utility','☀','One of two utilities.',150),property('Michael','pink',140),property('Quebec','pink',160),
 special('Dept. Boag','railroad','🚓','One of four railroads.',200),property('Hotel','orange',180),special('Supervisors Office','chest','▣','Draw a card from the Supervisors Office.'),property('November','orange',180),property('Kilo','orange',200),
 special('Hospital Coverage','parking','🏥','Take a break on Hospital Coverage.'),property('Lima','red',220),special('Chance','chance','?','Draw a Chance card.'),property('CL201','red',220),property('Juliet','red',240),
 special('Dept. Gilley','railroad','🚓','One of four railroads.',200),property('Papa','yellow',260),property('Delta','yellow',260),special('OC Instructor','utility','💧','One of two utilities.',150),property('T-Unit','yellow',280),
 special('Go to Jail','gotojail','↙','Go directly to Two Bridges. Do not pass Briefing.'),property('Charlie','green',300),property('Foxtrot','green',300),special('Supervisors Office','chest','▣','Draw a card from the Supervisors Office.'),property('Bravo','green',320),
 special('Dept. Clapperton','railroad','🚓','One of four railroads.',200),special('Chance','chance','?','Draw a Chance card.'),property('Echo','blue',350),special('Quit Early','tax','◆','Pay $100.',100),property('A-Unit','blue',400)
];
export function position(index){if(index<=10)return {row:11,column:11-index,side:'bottom'};if(index<=20)return {row:21-index,column:1,side:'left'};if(index<=30)return {row:1,column:index-19,side:'top'};return {row:index-29,column:11,side:'right'};}
export function move(start,total){const landed=(start+total)%40;return {position:landed===30?10:landed,passedGo:start+total>=40,sentToJail:landed===30};}
