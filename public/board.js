const property=(name,group,price)=>({name,type:'property',group,price});
const special=(name,type,icon,detail,price)=>({name,type,icon,detail,price});
export const spaces=[
 special('GO','go','↗','Collect $200 each time you pass GO.'),
 property('Mediterranean Avenue','brown',60),special('Community Chest','chest','▣','A surprise from the community card deck.'),property('Baltic Avenue','brown',60),special('Income Tax','tax','$','Pay $200.',200),
 special('Reading Railroad','railroad','🚂','One of four railroads.',200),property('Oriental Avenue','lightblue',100),special('Chance','chance','?','Draw a Chance card.'),property('Vermont Avenue','lightblue',100),property('Connecticut Avenue','lightblue',120),
 special('Jail / Just Visiting','jail','▥','Just visiting? Stay on the outside of the jail.'),property('St. Charles Place','pink',140),special('Electric Company','utility','☀','One of two utilities.',150),property('States Avenue','pink',140),property('Virginia Avenue','pink',160),
 special('Pennsylvania Railroad','railroad','🚂','One of four railroads.',200),property('St. James Place','orange',180),special('Community Chest','chest','▣','A surprise from the community card deck.'),property('Tennessee Avenue','orange',180),property('New York Avenue','orange',200),
 special('Free Parking','parking','🚘','Take a break in Free Parking.'),property('Kentucky Avenue','red',220),special('Chance','chance','?','Draw a Chance card.'),property('Indiana Avenue','red',220),property('Illinois Avenue','red',240),
 special('B. & O. Railroad','railroad','🚂','One of four railroads.',200),property('Atlantic Avenue','yellow',260),property('Ventnor Avenue','yellow',260),special('Water Works','utility','💧','One of two utilities.',150),property('Marvin Gardens','yellow',280),
 special('Go to Jail','gotojail','↙','Go directly to Jail. Do not pass GO.'),property('Pacific Avenue','green',300),property('North Carolina Avenue','green',300),special('Community Chest','chest','▣','A surprise from the community card deck.'),property('Pennsylvania Avenue','green',320),
 special('Short Line','railroad','🚂','One of four railroads.',200),special('Chance','chance','?','Draw a Chance card.'),property('Park Place','blue',350),special('Luxury Tax','tax','◆','Pay $100.',100),property('Boardwalk','blue',400)
];
export function position(index){if(index<=10)return {row:11,column:11-index,side:'bottom'};if(index<=20)return {row:21-index,column:1,side:'left'};if(index<=30)return {row:1,column:index-19,side:'top'};return {row:index-29,column:11,side:'right'};}
export function move(start,total){const landed=(start+total)%40;return {position:landed===30?10:landed,passedGo:start+total>=40,sentToJail:landed===30};}
