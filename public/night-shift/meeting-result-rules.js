export const escortScenes=[
 {id:'clipboard',caption:'Goodchild unrolls a wall of paperwork before the escort.'},
 {id:'coffee',caption:'A spilled coffee turns the escort into a cleanup operation.'},
 {id:'wrong-door',caption:'Goodchild leads the player to the supply closet, then doubles back.'},
 {id:'shuffle',caption:'Goodchild and the player dance, spin, and shuffle to the exit.'},
 {id:'paper-trail',caption:'Goodchild and the player chase a paperwork tornado.'},
 {id:'flashlight',caption:'A blackout sends Goodchild searching for the exit by flashlight.'},
 {id:'keys',caption:'Keys scatter across the Sallyport. Goodchild scrambles to recover them.'},
 {id:'radio',caption:'Goodchild radios for a cart, loads the player, and wheels them out.'},
 {id:'salute',caption:'A salute turns into a synchronized high-step parade.'},
 {id:'red-carpet',caption:'Goodchild unrolls a red carpet and invites the player down it.'}
];
export const clearScenes=[
 {id:'all-clear',caption:'Goodchild checks the empty exit, then searches behind a chair.'},
 {id:'coffee-break',caption:'Goodchild wrestles with the coffee machine and gets an oversized cup.'},
 {id:'case-closed',caption:'A giant stamp sends approved paperwork flying.'},
 {id:'victory-dance',caption:'Goodchild dances and spins under a mirror ball and confetti.'},
 {id:'donut-break',caption:'A runaway donut rolls around Briefing with Goodchild in pursuit.'}
];
export function chooseMeetingScene(ejected,previous){const pool=(ejected?escortScenes:clearScenes).filter(s=>s.id!==previous);return pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length].id;}
export function sceneCaption(id){return [...escortScenes,...clearScenes].find(s=>s.id===id)?.caption||'Goodchild is handling the meeting result.';}
