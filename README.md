# KennebcCountyJailMonoply

A custom Monopoly-style game on Cloudflare, with renamed county-jail spaces, equipment pawns, and animated dice and movement. The homepage at `/` offers game selection, with Monoply ready to play and a playable Kennebec County Jail Clue draft. `/setup` supports one to six named players with unique pawns, and `/board` opens the game. The homepage offers continuation for a matching saved game without altering it. Both games support room codes for separate devices; one-device play remains available.

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

Open `/clue-setup` to choose three to six detectives and rename any of the nine rooms, six suspects, or six equipment items under Customize the case. `/clue` restores that case. A new case randomly hides one card in each category and deals the remaining 18. Dice movement follows corridor squares, room doors, occupied squares, and four corner staff passages. Room suggestions summon the suspect and equipment; the first clockwise player holding a matching card privately chooses one to show. Incorrect accusers stop investigating but still disprove suggestions. A correct accusation wins, or the case is revealed if all detectives make wrong accusations.

Hands, shown cards, and notebooks are covered at device handoffs and after reloading. In local mode this is pass-and-play privacy, and browser local storage holds the complete case. In online mode, only the player’s own hand and notebook (plus a card privately shown to them) are delivered to their device. The hidden envelope stays on the server until the case closes. Clue uses its own `kennebec-clue-v1`, roster, and configuration keys and does not modify Monoply saves. New-case setup confirms before replacing an existing case.

Run `npm test`, `npm run test:clue-browser`, and `npm run test:home-browser` for the deduction rules, a complete four-player investigation using private cards obtained through the UI, private handoff restoration, notebook persistence, restart, animations, phone/tablet fit, and separate game saves. `CLUE_SEED` selects the repeatable browser-test shuffle. Browser artifacts are saved under ignored `.runtime/clue`.

## Room-code multiplayer

Both `/setup` and `/clue-setup` offer **Use a room code** and **One device**. The host creates a room with their name and pawn/suspect, shares the code or invite link, and starts when enough players join (2–6 for Monoply; 3–6 for Clue). Players reconnect from the same browser using the saved seat. Existing local saves are separate and remain available.

`src/rooms.js` persists one authoritative room per Durable Object. Seats use unguessable bearer credentials stored in the joining browser; invite links contain only the room code. The server checks the player’s identity, phase, and revision before applying an action, generates dice results, and handles duplicate requests without applying an action twice. Clients poll for updates every 1.5 seconds (5 seconds in a hidden tab). Idle rooms expire seven days after their last action.

Monoply moves hold their economic result on the server while the moving player reads and continues any drawn cards. Peers watch the same dice, pawn route, and cards. Cash/deed transfers use the existing animation and recorded sounds. Online trades remain offers until the recipient explicitly accepts; the proposing player cannot accept on their behalf.

Clue projections exclude the hidden solution and other players’ cards/notebooks, including from the host. Waiting players can use their own notebook. Wrong accusers still refute suggestions on their own devices.

Run `npm run test:online-browser` against `npm run dev` for four independent browser contexts in each game: room creation/joining, private cards/notes, synchronized board state, card staging, recipient-approved trades, refresh/reconnect, and phone layouts. `npm test` includes server identity, state projection, persistence, duplicate-action, and stale-revision checks. Local regression tests choose One device explicitly; `npm run test:game-browser` plays Monoply from setup to a winner and a restart.
