# Resumen artwork — approved concept, 2026-10-26

The earlier SummaryIcon implementation used these transparent SVG assets, recreated locally from the owner-selected Resumen concept. Current coins use the PNG follow-up documented below; car/gift/average remain SVG:

- coins-stacks.svg: light-theme two-stack cylindrical coin illustration with elliptical highlights and gradient sides.
- coins-stacks-dark.svg: same geometry with muted dark-theme green artwork.
- car-flat.svg: compact filled car silhouette with transparent windows/lights.
- gift-flat.svg: filled gift box with ribbon cutouts and outlined bow.
- average-bars.svg: three ascending rounded bars with graduated opacity.

No SVG has an opaque background. Car/gift/bars consume currentColor from the active semantic summaryIcon token. Coin gradient stops use explicit artwork colors in separate theme assets: Android rendering of currentColor inside gradient definitions was inspected and produced black fills, so those stops are intentionally fixed per asset. These illustration colors are artwork, not a second application palette.

Original coins-3d.png/car-3d.png/gift-3d.png remain preserved as historical assets; current SummaryIcon no longer references them. Official platform and navigation artwork remains unchanged. The average bars are decorative, not a chart or extra metric. No externally fetched runtime assets, new dependency or personal data is embedded.

## Current coin PNG reference follow-up — 2026-10-26

The owner supplied a cropped light/dark reference and explicitly requested PNG coins. SummaryIcon now uses coins-reference-light.png / coins-reference-dark.png for coins. Both are original imagegen outputs copied unchanged into this folder:1254x1254 RGBA with alpha extrema0..255 and fully transparent corner pixels. No solid background is embedded. Other decorative icons remain the existing transparent SVGs. Earlier coin SVGs and historical PNGs are preserved but not used by current SummaryIcon.

Generation used the built-in image_gen tool with transparent_background=true, not CLI/API-key fallback. Reference: the owner-supplied screenshot crop dated2026-10-26 20:17:26. No post-generation image edits/resizing were performed. The icon has no currency markings or text.

Final light prompt:
Use case: product asset reconstruction. Output ONLY one isolated PNG icon on genuine transparent alpha background, NOT a screenshot or a card. Reference image contains two Cash Driver summary cards; recreate ONLY the green coin-stack illustration on the LEFT light-theme card, as closely as possible. EXACT composition: two neat cylindrical stacks of plain unmarked green coins, short stack at front-left with THREE coins, tall stack at rear-right with FIVE coins. Tall stack approximately1.7 times short-stack height. Two stacks slightly overlap; same elliptical top perspective as reference. Soft mint green elliptical top faces with thin pale rim highlights; rich emerald cylindrical sides with soft realistic horizontal seams; restrained dimensional shading and fine ambient occlusion. Tiny soft contact shadow directly under stacks with transparent falloff, no solid floor plane. No dollar/euro symbols, embossing, text, sparkles, additional coins, glossy plastic, flat vector outlines or black borders. Faithfully match compact reference geometry, mint-to-green colors, gentle top-left lighting and smooth three-dimensional finish. Frame tightly around the COMPLETE illustration: icon should occupy about88 percent of canvas width and height with evenly small transparent margins. Square canvas, crisp high resolution. No background, no green card, no UI labels, no checkerboard baked into pixels. This PNG will be displayed at80dp in a mobile UI.

Final dark edit prompt (inputs: generated light icon + owner screenshot crop):
Edit Image1 ONLY to make the DARK-THEME version of this same PNG coin icon. Image2 is the style reference: match the coin illustration inside the RIGHT dark summary card. Preserve Image1 geometry exactly: same two overlapping cylindrical stacks, three coins front-left and five coins rear-right, identical sizes, perspective, framing, canvas, highlights positions, transparency and small contact shadow. Change ONLY green color grading and lighting intensity: use subdued desaturated sage/forest green, muted mint top ellipses and darker emerald shaded sides, like the right-hand reference card's coins. Reduce the bright saturated lime/mint of Image1, keep crisp pale rim highlights and fine seams. Output a single isolated icon with genuine transparent alpha, no card, UI, text, symbols, solid background, floor or checkerboard. Do not add/remove coins, change crop, rearrange stacks or introduce outlines. Keep dimensional smooth finish. Intended to be visible at80dp on a dark-green mobile card.
