export const escortScenes=[
 {id:'clipboard',caption:'Goodchild insists on finishing the paperwork first.'},
 {id:'coffee',caption:'One last sip. Then it is time to go.'},
 {id:'wrong-door',caption:'Goodchild takes the scenic route. Other door!'},
 {id:'shuffle',caption:'A little Sallyport shuffle on the way out.'},
 {id:'paper-trail',caption:'Goodchild brought the paperwork. All of it.'},
 {id:'flashlight',caption:'Goodchild checks the route with a very serious flashlight inspection.'},
 {id:'keys',caption:'Goodchild has every key except the one needed. Found it!'},
 {id:'radio',caption:'Goodchild calls in the slowest transport of the shift.'},
 {id:'salute',caption:'Goodchild makes this a full ceremonial send-off.'},
 {id:'red-carpet',caption:'A VIP exit. Goodchild even rolls out the red carpet.'}
];
export const clearScenes=[
 {id:'all-clear',caption:'Goodchild checks the empty doorway. Everybody stays!'},
 {id:'coffee-break',caption:'No escort? Goodchild finally gets a coffee break.'},
 {id:'case-closed',caption:'Goodchild stamps the paperwork: BACK TO WORK.'},
 {id:'victory-dance',caption:'No escort today. Goodchild celebrates with a tiny victory dance.'},
 {id:'donut-break',caption:'Everybody stays. Goodchild has a very important donut to inspect.'}
];
export function chooseMeetingScene(ejected,previous){const pool=(ejected?escortScenes:clearScenes).filter(s=>s.id!==previous);return pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length].id;}
export function sceneCaption(id){return [...escortScenes,...clearScenes].find(s=>s.id===id)?.caption||'Goodchild is handling the meeting result.';}
