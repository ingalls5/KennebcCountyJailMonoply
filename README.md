# KennebcCountyJailMonoply

A custom Monopoly-style game on Cloudflare, with renamed county-jail spaces, equipment pawns, and animated dice and movement. The welcome page supports one to six named players with unique pawns. Everyone plays on the same device.

## Economy

Players start with $1,500 and collect $200 when passing Briefing. Deed prices and rent schedules use the classic US board. Full color groups double unimproved rent. Officers use the four railroad rent levels; instructors charge 4× or 10× the dice total. Mainely Vending charges $200 and Quit Early charges $100. Hospital Coverage pays no jackpot.

Unowned spaces can be bought or auctioned, including when the landing player cannot afford the list price. Rent, taxes, and card payments transfer automatically. Chance and Supervisors Office use shuffled 16-card decks with cash, movement, repairs, and get-out-free effects. Doubles, three-double jail entry, $50 bail, and the three jail attempts are supported.

Own an unmortgaged color group to build evenly. The bank has 32 Camera tokens and 12 Special Checks tokens. Buildings sell for half cost; selling all buildings in a group is available when there are not enough Camera tokens to replace Special Checks. Mortgage values are half the list price. Lifting a mortgage costs principal plus 10% interest, rounded up to whole dollars. Players can agree to trades of one deed, an optional return deed, and cash; developed color groups must be cleared first, and mortgage transfers collect 10% interest.

An unpaid debt blocks play until the debtor raises cash or declares bankruptcy. Bankruptcy transfers assets to a player creditor; deeds returned to the bank are auctioned. The last remaining player wins. Balances, positions, ownership, buildings, deck order, auctions, and debts are saved in browser local storage. Player setup with the same names and pawns resumes that game. New Game asks before resetting the economy. This is a shared-device game, not online multiplayer.

## Development

Run `npm ci`, `npm run dev`, `npm test`, `npm run test:browser`, `npm run test:economy-browser`, and `npm run build`. Local development uses port 8791. `npm run deploy` publishes the Worker `kennebc-county-jail-monoply`. No database is required. Keep credentials out of the repository. In this cloud workspace, use `npm_config_cache=/tmp/kennebc-npm-cache` for installation and `XDG_CONFIG_HOME="$PWD/.runtime/xdg-config" WRANGLER_SEND_METRICS=false` for Wrangler commands.

Cameras replace houses and Special Checks replace hotels in the interface and board tokens. Up to four Cameras upgrade to one Special Checks token. Prices, rent schedules, repair charges, bank inventory, and saved game compatibility stay the same. The space named Hotel is a separate property name.

Landing and turn decisions open in a modal dialog, including purchases, auctions, rent/payment summaries, debt resolution, doubles, and ending the turn. The dialog can be closed to manage property without advancing play, and reopened with Turn options. Rent remains automatic and is reported as paid; closing a popup cannot bypass an unresolved debt or purchase.

Use Test cards on the board or Test all cards in the turn popup to browse cards 1–32. Cards 1–16 are Chance; 17–32 are Supervisors Office. Previewing does not draw cards or alter cash, positions, saved turns, or deck order. Previous/Next and a direct numbered selector are available. Run `npm run test:cards-browser` to verify this flow locally.
