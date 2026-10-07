# Fuji City

A tiny, procedural city movie in an instant-photo frame: moving people, homebound cars and motorcycles, an east-to-west day/night cycle, original synthesized sound, and film-inspired color treatments.

**Play:** https://gencay.github.io/fuji-city/

The application is the self-contained [`city-flight.html`](city-flight.html). Open it directly in a modern browser, or serve this directory with `python3 -m http.server 8000`. There is no build step, backend, or application dependency. Optional Google Fonts need a connection; local font fallbacks keep the city usable offline.

## Explore

- **19 destinations:** Original, Paris, Munich, Istanbul, Seattle, New York, London, Ibiza, Tokyo, Mexico City, Singapore, Barcelona, Amsterdam, Lisbon, Kyoto, Bruges, Annecy, Dubrovnik, and Antalya.
- **102 named landmark motifs:** at least five per destination, selected reproducibly from each roll's seed and placed only on supported land. Antalya includes Yivli Minare, Saat Kulesi, Hadrian's Gate, Hidirlik Tower, and Kaleici. Original has fictional civic buildings.
- City-specific water, buildings, greenery, traffic density, driving side, typography, clocks, film defaults, and frame-rate tiers. Istanbul and Antalya use modern 12/3/6/9 clock numerals.
- Original film and Gamified pastel interfaces, light/dark/device appearance, keyboard controls, reduced-motion support, and high-contrast wheel indicators.
- Four workers handle terrain, walkers, film/audio preparation, and Chronicle processing. Traffic decisions remain on the main thread.

The default is a **600 px Polaroid, Close up, Auto 30 FPS**, in Gamified Light Paper. Reduced-motion preference starts the simulation paused. The 176 px desktop clock has stacked faster/slower controls on its right.

In the two-column layout, the photo stays near the top of the viewport while the sidebar scrolls, until the shared layout ends. Tall prints remain scrollable at the end; single-column mobile layouts use normal document scrolling so the photo cannot cover the controls. Full-window mode retains its independently scrolling sidebar. The small "Somewhere," label leaves the selected city as the main heading.

## Controls

Click a road to add a randomly painted vehicle. Each shuffled pair contains a car and a motorcycle. New vehicles start at their planned cruising speed; a temporarily unavailable home no longer freezes them mid-road. They continue along legal roads and retry their home search. Red lights, pedestrians, wrecks, blocked exits, and close traffic still require a stop. A deliberately paused city stays paused.

Focus the city and press **L** to find a lane, use arrow keys to aim, and press **Enter** to spawn. Crowded clicks can cause collisions; rescue helicopters carry wrecks to the Junkyard.

Drag, scroll, click, or use arrow keys on the wheel controls. Colorful strokes distinguish wheels from ordinary buttons. The size wheel runs from 100 to 1000 px, then full-window mode; **Escape** leaves full-window mode without requiring browser fullscreen.

Wind the analog clock by dragging. Its right-side buttons change the clock rate, not vehicle speed. With the clock focused, **Home** selects 06:00 and **End** selects 21:00. The digital readout remains visible.

## Scope and references

This is a stylized, flat, procedurally generated miniature, **not an accurate street map, driving simulator, or trained driving agent**. Large/medium/small are artistic presets, not population classifications. Landmarks are original simplified drawings, not surveyed replicas. The About panel lists each city's available places and links to heritage or visitor references; a general reference does not imply that every depicted place belongs to a UNESCO property.

Film treatments and instant-paper proportions are visual approximations, not official Fujifilm simulations or licensed Polaroid products. Sound is synthesized locally; no Mini Metro recordings or soundtrack assets are included. Frame-rate controls request a target; actual performance depends on the browser, hardware, and visible traffic.

## Regression checks

Tests use Playwright and do not ship with the deployed page.

```sh
bun install
bunx playwright install chromium
bun tests/versions.mjs
bun tests/layout.mjs
bun tests/motion.mjs
bun tests/stress.mjs --rounds=10
```

Google Chrome is used automatically at its standard macOS application path when available. Elsewhere the tests use Playwright Chromium. Set `CHROME_PATH` to select another Chromium executable, or `CITY_HTML` to test a different application copy.

The motion regression checks 80 lane samples, first-frame departure without a home, later home acquisition, pedestrian/wreck yielding, and deliberate pause. Each stress round visits all 19 destinations, renders every landmark motif, checks seed stability and dry-land placement, spawns via real mouse and keyboard input, creates traffic jams, completes rescues, exercises themes and responsive layouts, and runs a dense full-window scene at a requested 60 FPS.

Reports and screenshots are saved locally in ignored `test-results/`. Browser animation-frame intervals are diagnostic measurements, not a guarantee of game-rendered FPS.

## Versions and deployment

The in-page version picker preserves v0–v14 alongside the current v15. Archives live in [`versions/`](versions/), with the catalog at [`versions/manifest.json`](versions/manifest.json); catalog paths are relative to that folder. Only the current application stays in the repository root. Archived simulation code is intentionally unchanged; old limitations remain.

Pushing `main` runs the GitHub Pages workflow. `scripts/build-site.mjs` prepares the ignored `_site/` output, and `tests/versions.mjs` verifies source hashes and navigation before deployment. The site publishes the current application and the `versions/` folder, creating `index.html` from the current application so the repository keeps a single current source. Previously published flat archive URLs redirect to their new locations, preserving theme parameters and fragments; the old catalog URL remains compatible. Tests, dependencies, and local reports are not published.
