# KennebcCountyJailMonoply

A collection of county-jail board games on Cloudflare: Monoply, Clue, and Life on the Inside. The homepage at `/` offers all three games and continuation for saved sessions. Each game supports one-device play or room codes for separate devices.

## Life on the Inside

A county-jail Life-style game at `/life-setup` and `/life` for 2–6 players, on one device or separate devices with a room code. Everyone starts with $1,000. Choose the Academy ($500, 12 spaces, graduate as an Officer) or start jail work (+$300, 8 spaces, Rookie salary). The existing winding board has 100 main spaces, 20 starting spaces, and the ten-space Mid-Life Crisis branch; all spaces share one road width and distance.

Green Pay Days pay salary when passed or landed on: Rookie $200, Officer $350, FTO $500, Corporal $650, Supervisor $800. Spinning itself has no cost or salary. Career-choice spaces offer paid training for a higher salary or a LIFE tile for staying in your job. Blue LIFE spaces award a face-down tile on landing. The 28-event deck includes money choices, marriage, children, and buying/selling a home. Reputation, energy, and exhaustion costs have been removed.

The bank contains 60 original LIFE tiles worth $100–$1,000. Awarded tile IDs are held in each player's `lifeTiles`; the shuffled `tileDeck` and `tileCursor` remain authoritative. Online projections expose counts only until the whole game finishes, hiding every held ID and the bank order even from the host. When the bank is empty, a tile can be taken from a retired player; if none has one, no tile is awarded. Retired players skip turns, but their tiles can remain in play. At the final briefing, reveal every tile and score cash + tile bonuses + home sale value + $100 per child. Exact ties share the win. Debt reduces the score.

Stop 56 offers the main road (continue at 57) or Mid-Life Crisis (ten dilemmas, rejoin at 67). C5 is a Pay Day. The first and final crisis choices are required for players who take the detour; other dilemmas happen on landing. Graduation, completion of the first jail shift, the fork, and the final crisis space stop unused movement. A crossed career review resolves before the fork choice. The detour is integrated into the board with full-width junctions.

Saves keep `version:1`, `boardSize:100`, and the same local key `kennebec-life-v1`; `ruleSet:life-tiles-v1` identifies the new rules. Older careers migrate without resetting money, rank, seats, pending decisions, or positions. The old meters are removed, tile and family fields begin empty, and the four new event IDs are appended to the existing deck. Older 36-space saves retain their relative progress. Online rooms migrate on restoration. Ending a game clears only that session and returns its players home.

`npm run build` creates the deployment bundle. Focused rule checks live in `tests/life.test.mjs`; the existing `test:life-browser` and `test:life-board-browser` scripts are available when a full game or board check is requested. The user has asked to review draft changes without automatic full-game runs. Keep `public/life/board-mockup.png` current by capturing the preview board when its art changes.

## Economy

Players start with $1,500 and collect $200 when passing Briefing. Deed prices and rent schedules use the classic US board. Full color groups double unimproved rent. Officers use the four railroad rent levels; instructors charge 4× or 10× the dice total. Mainely Vending charges $200 and Quit Early charges $100. Hospital Coverage pays no jackpot.

Unowned spaces can be bought or auctioned, including when the landing player cannot afford the list price. Rent, taxes, and card payments transfer automatically. Chance and Supervisors Office use shuffled 16-card decks with cash, movement, repairs, and get-out-free effects. Doubles, three-double jail entry, $50 bail, and the three jail attempts are supported.

Own an unmortgaged color group to build evenly. The bank has 32 Camera tokens and 12 Special Checks tokens. Buildings sell for half cost; selling all buildings in a group is available when there are not enough Camera tokens to replace Special Checks. Mortgage values are half the list price. Lifting a mortgage costs principal plus 10% interest, rounded up to whole dollars. Players can agree to trades of one deed, an optional return deed, and cash; developed color groups must be cleared first, and mortgage transfers collect 10% interest.

An unpaid debt blocks play until the debtor raises cash or declares bankruptcy. Bankruptcy transfers assets to a player creditor; deeds returned to the bank are auctioned. The last remaining player wins. Balances, positions, ownership, buildings, deck order, auctions, and debts are saved in browser local storage. Player setup with the same names and pawns resumes that game. New Game asks before resetting the economy. For local mode, everyone takes turns on the same device. Online rooms synchronize the game across separate devices.

## Development

Run `npm ci`, `npm run dev`, `npm test`, `npm run test:browser`, `npm run test:economy-browser`, `npm run test:home-browser`, and `npm run build`. Local development uses port 8791. `npm run deploy` publishes the Worker `kennebc-county-jail-monoply`. Online rooms use the SQLite-backed `GAME_ROOMS` Durable Object binding in `wrangler.jsonc`; local play needs no backend storage. Keep credentials out of the repository. In this cloud workspace, use `npm_config_cache=/tmp/kennebc-npm-cache` for installation and `XDG_CONFIG_HOME="$PWD/.runtime/xdg-config" WRANGLER_SEND_METRICS=false` for Wrangler commands.

Cameras replace houses and Special Checks replace hotels in the interface and board tokens. Up to four Cameras upgrade to one Special Checks token. Prices, rent schedules, repair charges, bank inventory, and saved game compatibility stay the same. The space named Hotel is a separate property name.

Landing and turn decisions open in a modal dialog, including purchases, auctions, rent/payment summaries, debt resolution, doubles, and ending the turn. The dialog can be closed to manage property without advancing play, and reopened with Turn options. Rent remains automatic and is reported as paid; closing a popup cannot bypass an unresolved debt or purchase.


Cards use 16 original themed illustrations, shown in real draw popups. Draw metadata records which cards were drawn, including chained draws, while payment and movement rules stay unchanged.

The follow camera frames both dice during their random rolls, then transitions to a 3× closeup of the moving pawn. Card moves across the board are framed before returning to the pawn closeup. The full board and previous viewing position return when motion finishes. Follow camera can be switched off; reduced-motion settings keep the board stationary. Run `npm run test:camera-browser` to verify desktop/phone tracking, framing, restoration, and the toggle.

## Kennebec County Jail Clue

Open `/clue-setup` to choose three to six detectives. Each player enters their suspect name and chooses one of six unique roles: FTO, Supervisor, Intake Officer, Booking Officer, Utility Officer, or Floor Officer. Customize the case lets the host rename the nine rooms and seven weapons. `/clue` restores that case. Only joined players appear as suspects in a new case. One card from each category is hidden, and the remaining cards are dealt evenly. Dice movement follows corridor squares, room doors, occupied squares, and four corner staff passages. Room rumors summon the suspect and weapon; the first clockwise player holding a matching card privately chooses one to show. Incorrect accusers stop investigating but still challenge rumors. A correct accusation wins, or the case is revealed if all detectives make wrong accusations.

Each case stores its card deck. Older six-weapon cases retain their original 21 cards and hidden answer; New cases include seven weapons and nine rooms, plus one suspect card for each joined player (19–22 total cards). Older cases keep their existing suspect names and deck until a new case starts.

Hands, shown cards, and notebooks are covered at device handoffs and after reloading. In local mode this is pass-and-play privacy, and browser local storage holds the complete case. In online mode, only the player’s own hand and notebook (plus a card privately shown to them) are delivered to their device. The hidden envelope stays on the server until the case closes. Clue uses its own `kennebec-clue-v1`, roster, and configuration keys and does not modify Monoply saves. New-case setup confirms before replacing an existing case.

Run `npm test`, `npm run test:clue-browser`, and `npm run test:home-browser` for the deduction rules, a complete four-player investigation using private cards obtained through the UI, private handoff restoration, notebook persistence, restart, animations, phone/tablet fit, and separate game saves. `CLUE_SEED` selects the repeatable browser-test shuffle. Browser artifacts are saved under ignored `.runtime/clue`.

## Room-code multiplayer

Both `/setup` and `/clue-setup` offer **Use a room code** and **One device**. The host creates a room with their name and pawn/suspect, shares the code or invite link, and starts when enough players join (2–6 for Monoply; 3–6 for Clue). Players reconnect from the same browser using the saved seat. Existing local saves are separate and remain available.

`src/rooms.js` persists one authoritative room per Durable Object. Seats use unguessable bearer credentials stored in the joining browser; invite links contain only the room code. The server checks the player’s identity, phase, and revision before applying an action, generates dice results, and handles duplicate requests without applying an action twice. Clients poll for updates every 1.5 seconds (5 seconds in a hidden tab). Idle rooms expire seven days after their last action.

Monoply moves hold their economic result on the server while the moving player reads and continues any drawn cards. Peers watch the same dice, pawn route, and cards. Cash/deed transfers use the existing animation and recorded sounds. Online trades remain offers until the recipient explicitly accepts; the proposing player cannot accept on their behalf.

Clue projections exclude the hidden solution and other players’ cards/notebooks, including from the host. Waiting players can use their own notebook. Wrong accusers still refute suggestions on their own devices.

Run `npm run test:online-browser` against `npm run dev` for four independent browser contexts in each game: room creation/joining, private cards/notes, synchronized board state, card staging, recipient-approved trades, refresh/reconnect, and phone layouts. `npm test` includes server identity, state projection, persistence, duplicate-action, and stale-revision checks. Local regression tests choose One device explicitly; `npm run test:game-browser` plays Monoply from setup to a winner and a restart.

## Clue board draft

Open `/clue-preview` to inspect the board without creating players, starting a case, or joining a room. The draft uses the game’s room layout, doors, and shared room illustrations. Its nine numbered rooms can be selected on the board or from the room list, and the board can be enlarged on small screens. Previewing never reads or changes game saves or makes room-service requests. Links are available from the homepage and Clue setup.

## Night Shift groups and meetings

At `/night-shift-setup`, create a game and share its six-character code, or join with a code. A host starts with three to twelve players on their own devices. One killer is chosen on the server; only that player's response contains their role and sabotage assignments. Officers receive six private tasks. Solo practice remains available.

Everyone uses the same visible station locations, and nearby players see the same Working animation for ordinary tasks, repairs, and sabotage. Any player may operate an ordinary station to blend in. Only the killer may activate sabotage or travel through Skidgel tunnels. Floor changes in group games use stairs, elevators, or authorized tunnels; the directory cannot teleport players.

Six physical sabotage mini-games cut power, disrupt radios, destabilize equipment, jam doors, corrupt receipts, or disconnect cameras. One sabotage may be active at a time, with a 45-second cooldown and a short grace period after repairs. Power pauses powered tasks; radio and equipment settings drift; records require an archive check; jammed doors block movement until a nearby manual release is repaired; disabled cameras lose their feed. Completed assignments are retained. Repairs use ordinary mini-games at the original station (or either side of a locked door).

Each group keeps a snapshot of the shared jail map. Map-builder edits affect future groups. The existing `NIGHT_SHIFT_MAP` binding stores group rooms under separate Durable Object identities, with server-authorized movement, station work, and tunnel travel. Reconnecting restores the seat, role, and assignments and cancels abandoned station work. Idle groups expire after 24 hours; End game deletes that group's data and returns all devices home without deleting the shared map. Players have random distinct colors, black uniforms, and duty belts. Killers can eliminate nearby officers with the Kill button or K, subject to a server-enforced cooldown and wall checks. Fallen officers can finish their private tasks as ghosts. Three-minute rounds automatically bring everyone to Briefing for a typed meeting. Living players speak in a clockwise order and may vote for a player or Skip at any point during the conversation. The meeting resolves only after every living player has both finished speaking and submitted a ballot. There is no discussion or voting countdown; disconnected living players must reconnect to submit their turn and vote. A player needs more than half of all eligible votes to be escorted through the Sallyport doors by Goodchild. Ties and no majority remove nobody. The next round starts after the shared result animation. The server chooses one of five comic Goodchild escorts or three all-clear scenes and shares its scene and timing with every device; consecutive scenes in the same group do not repeat. Living players can also call a meeting at the red button in Briefing; the caller speaks first. Eliminated players spectate. Round timers and result transitions use Durable Object alarms and are checked on reconnect; votes and chat persist on the server. Match victory remains a future mechanic.

Focused checks (with `npm run dev` running locally):

```bash
node --test tests/night-shift-sabotage.test.mjs tests/night-shift-meetings.test.mjs
node tests/night-shift-sabotage-browser.mjs
node tests/night-shift-group-browser.mjs
TEST_TIMED=1 node tests/night-shift-meetings-browser.mjs
```

The group browser check creates three isolated seats, exercises shared effects and repair, reconnects, verifies killer-only tunnel travel, tests actual door collisions and camera outages, and ends the group. It changes and restores only the local development map.

The meeting browser check uses four devices to verify typed turns, reconnecting, private votes, a majority escort, Skip, spectators, and the actual three-minute round timer. It changes and restores only the local development map. Run map-changing browser checks sequentially.
