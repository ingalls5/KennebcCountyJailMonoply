# KennebcCountyJailMonoply

A new Monopoly-style board project hosted on a separate Cloudflare Worker. The first version recreates a classic 40-space board with property colors, four corner spaces, railroads, utilities, Chance, and Community Chest. Select spaces to inspect them, enlarge the board on small screens, or roll two dice to move a preview token. This is a board preview; buying property, money, cards, and multiplayer are not implemented yet.

Run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. `npm run deploy` publishes the new Worker `kennebc-county-jail-monoply`. No database is required. Keep credentials out of the repository.
