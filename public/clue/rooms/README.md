# Overhead room illustrations

`jail-interiors.png` is original AI-generated game artwork: a transparent,
three-by-three atlas of fictional jail interiors. It is not a photograph,
floor plan, or verified depiction of Kennebec County Jail.

Tiles run left to right, top to bottom:

1. Intake: booking counter, computers, benches, property tray
2. Control: officer console and monitors
3. Medical: examination bed, medical supplies, sink and cart
4. T-Unit: cells, bunks, toilet fixtures and dayroom table
5. Briefing Room: meeting table, chairs and whiteboard
6. Rec Yard: basketball hoop, bench and exercise equipment
7. Kitchen: commercial counters, range, sinks and prep space
8. 4th Floor: fictional housing dayroom, bunks and officer desk
9. Sally Port: transport van, vehicle gates and guard station

`roomArt` in `map-art.js` chooses the tile by stable room ID. The shared
stylesheet places the transparent furnishings over the separately credited
photographed concrete floor. Room names, doors, game positions and movement
rules remain independent of the artwork.

`jail-interiors-updated.png` is a separate transparent three-panel replacement
atlas, left to right:

1. Rec Yard: basketball court, fence, bench and green steel workout station
2. 4th Floor: galvanized air ducts, ventilation grilles, shelving, boxes and totes
3. Sally Port: a police patrol car beside an empty parking bay, wall lockers and
   vehicle gates; no computer or workstation

Rec Yard and 4th Floor use the replacement atlas. Sally Port now uses
`sally-port.png`, a standalone edit with a single vertical row of lockers along
the right wall, a police car in the left bay and an empty right parking bay.
The other six rooms retain their original artwork. The replacements were
generated and edited using the original atlas as a visual reference, and depict
fictional game interiors.
