# KennebcCountyJailMonoply

A collection of county-jail board games on Cloudflare: Monoply, Clue, and Life on the Inside. The homepage at `/` offers all three games and continuation for saved sessions. Each game supports one-device play or room codes for separate devices.

## Life on the Inside

An original career game at `/life-setup` and `/life` for 2–6 players. Players choose **Go to the Academy** ($500 cost, +3 reputation, Officer rank) or **Start on the floor** (+$300). Both use 1 energy. Each career starts with $1,000, 3 reputation and 7 energy before this choice.

The 36-stop path uses a single die and 24 shuffled, original event cards with decisions. Every rolled turn pays $200 plus $150 per rank above Rookie and costs 1 energy. Crossing a promotion review offers advancement even if the die passes the space; its decision replaces the landing event. Promotion costs reputation equal to the new rank index and 2 energy. Ranks are Rookie, Officer, FTO, Corporal, Supervisor. Other stops offer overtime, training, days off and county events. Reputation/energy range from 0–10. A decision leaving zero energy costs $200 and restores energy to 3. Negative savings count as debt. These amounts and ranks are fictional game rules.

No exact roll is needed to retire, and retirees skip future turns. Once everyone retires, the score is savings + $100 × reputation + $50 × energy, with exact ties sharing the win. Local saves use only `kennebec-life-v1`. Online rooms use the existing authoritative server, seat credentials, revision checks and idempotency; event order stays on the server. End game confirms, clears only that career session, and returns participants home.

Run `npm test` and `npm run test:life-browser` with the dev server on port 8791. Tests cover every event option, Academy routes, promotions, exhaustion, complete 2–6-player simulations, six-player local play and six isolated online browsers through retirement, phone layouts, reconnect and deletion.

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
