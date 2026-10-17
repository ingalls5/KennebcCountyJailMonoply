export const escortScenes=[
 {id:'clipboard',caption:'Goodchild insists on finishing the paperwork first.'},
 {id:'coffee',caption:'One last sip. Then it is time to go.'},
 {id:'wrong-door',caption:'Goodchild takes the scenic route. Other door!'},
 {id:'shuffle',caption:'A little Sallyport shuffle on the way out.'},
 {id:'paper-trail',caption:'Goodchild brought the paperwork. All of it.'}
];
export const clearScenes=[
 {id:'all-clear',caption:'Goodchild checks the empty doorway. Everybody stays!'},
 {id:'coffee-break',caption:'No escort? Goodchild finally gets a coffee break.'},
 {id:'case-closed',caption:'Goodchild stamps the paperwork: BACK TO WORK.'}
];
export function chooseMeetingScene(ejected,previous){const pool=(ejected?escortScenes:clearScenes).filter(s=>s.id!==previous);return pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length].id;}
export function sceneCaption(id){return [...escortScenes,...clearScenes].find(s=>s.id===id)?.caption||'Goodchild is handling the meeting result.';}
