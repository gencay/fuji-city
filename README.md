# Fuji City

A tiny, procedural city movie in an instant-photo frame: moving people, homebound cars and motorcycles, an east-to-west day/night cycle, original synthesized sound, and film-inspired color treatments.

**Play:** https://gencay.github.io/fuji-city/

The application is the self-contained [`city-flight.html`](city-flight.html). Open it directly in a modern browser, or serve this directory with `python3 -m http.server 8000`. There is no build step, backend, or application dependency. Optional Google Fonts need a connection; local font fallbacks keep the city usable offline.

## Explore

- **19 destinations:** Original, Paris, Munich, Istanbul, Seattle, New York, London, Ibiza, Tokyo, Mexico City, Singapore, Barcelona, Amsterdam, Lisbon, Kyoto, Bruges, Dublin, Dubrovnik, and Antalya.
- **102 named landmark motifs:** at least five per destination, selected reproducibly from each roll's seed and placed only on supported land. Antalya includes Yivli Minare, Saat Kulesi, Hadrian's Gate, Hidirlik Tower, and Kaleici. Original has fictional civic buildings.
- City-specific water, buildings, greenery, traffic density, driving side, typography, clocks, film defaults, and frame-rate tiers. Istanbul and Antalya use modern 12/3/6/9 clock numerals.
- Original film and Gamified pastel interfaces, light/dark/device appearance, keyboard controls, reduced-motion support, and high-contrast wheel indicators.
- Four workers handle terrain, walkers, film/audio preparation, and Chronicle processing. Traffic decisions remain on the main thread.

The default is a **600 px Polaroid, Close up, Auto 30 FPS**, in Gamified Light Paper. Reduced-motion preference starts the simulation paused. The 132 px desktop clock has four controls stacked on its right: reset, daylight, faster and slower.

In the two-column layout, the photo stays near the top of the viewport while the sidebar scrolls, until the shared layout ends. Space is reserved for the entire supported -2 to +2 degree paper rotation range, so changing cities or rolls does not resize or recenter the layout. Tall prints remain scrollable at the end; single-column mobile layouts use normal document scrolling so the photo cannot cover the controls. Full-window mode retains its independently scrolling sidebar. The small "Somewhere," label leaves the selected city as the main heading.

A local-language hello is centered beneath the city name inside the header, aligned with the bottom of the adjacent clock, and flips like a classic station board when the destination changes. White letters on black mechanical tiles remain monochrome in both interfaces and themes; the board scales down within narrow headers. The city tooltip prefers the space above its control and otherwise moves below the ticker, leaving the greeting unobscured. Each city has one selected local greeting, including Japanese for Tokyo/Kyoto and English for multilingual Singapore. The print's existing white footer holds an original, handwritten-style two-line postcard, chosen from city imagery and the light at the start of the roll. New rolls avoid immediately repeating the previous verse; revisiting a landmark keeps it. Small prints use a shorter couplet from the same postcard, without changing the paper proportions. The writing reveal and letter flips are brief, respect UI/system motion settings, and settle when the page is hidden. Poems are original English text, not quotations. The optional handwriting font has local cursive fallbacks.

Dublin replaces Annecy in the current edition, with Liffey quays, brick courtyards, green squares, left-hand traffic and an Irish **Dia dhuit** greeting. Its five landmarks are Guinness Storehouse (industrial brickwork and glass rooftop Gravity Bar), Ha'penny Bridge, Custom House, the Spire and Trinity Campanile. IM Fell English lettering and a cream/gold-on-dark brewery-inspired clock are original stylistic choices, not official Guinness branding. Architecture references: [Guinness Storehouse](https://www.guinness-storehouse.com/en/whats-hoppening/the-gravity-bar) and [Visit Dublin](https://www.visitdublin.com/things-to-do/attractions).

Each destination's postcard is signed on the right with an absurd, invented honorary title: Dublin's **Acting Minister for Just One More Verse**, Seattle's **Senior Vice President of Light Drizzle**, and seventeen more. These are original English poems, not quotations, translations, or imitations of real poets. City-specific daylight and night imagery draws on local places and everyday culture: Istanbul ferry tea, Tokyo station melodies, Lisbon fado, Dublin quay footsteps and fiddle music, Singapore hawker tables, and more. Signatures finish the writing animation; tiny prints use a shorter comic title without changing the paper proportions.

**Read the local paper** in the notebook changes with the selected city, combining local landmark jokes with miniature-traffic absurdities. It is labeled **entirely made up / local satire**; none of its headlines or poet titles represent real reporting, offices or writers. The stories work offline as accessible, high-contrast text following the existing light/dark palette. The page and full-window backgrounds retain the original film or Gamified styling, without newspaper wallpaper.

The opening landmark is drawn from each city's complete set using the fresh roll's random seed, including on first load. The notebook identifies it; revisiting keeps it. Random selection allows repeats. Wheel gestures wait for 350 ms of quiet before committing, preserve their visible fractional position when a snap is interrupted, and use matching current/neighbor typography to avoid flicker.

## Controls

First-time visitors receive a five-step, skippable guide covering road clicks, city selection, film, print sizing and the clock. A briefly animated hand points at a legal lane or the real control; it never spawns vehicles, changes settings or overrides pause automatically. **Try control** focuses the real target for keyboard use. The hand stays static with UI/system reduced motion, and tracking pauses when the tab is hidden. Skip or Finish saves `fuji-city:first-play:v1` in browser-local storage; unavailable storage is explained visibly. **Replay first-play guide** in City notebook & extras starts it again. Escape dismisses the guide and still exits full-window mode.

Click a road to add a randomly painted vehicle. Each shuffled pair contains a car and a motorcycle. New vehicles start at their planned cruising speed; a temporarily unavailable home no longer freezes them mid-road. They continue along legal roads and retry their home search. Red lights, pedestrians, wrecks, blocked exits, and close traffic still require a stop. A deliberately paused city stays paused.

Focus the city and press **L** to find a lane, use arrow keys to aim, and press **Enter** to spawn. Crowded clicks can cause collisions; rescue helicopters carry wrecks to the Junkyard.

Rescues run concurrently. Each crash gets the nearest available helicopter without interrupting another crew's assignment. When all crews are busy, crashes wait in arrival order and keep their roads blocked. A helicopter becomes available immediately after delivering its cargo and can take the next queued call from its current location. If no helicopters remain, a single backup crew arrives; the queue does not create an unlimited fleet. All active wrecks participate in traffic safety and rendering. Turning off new collisions lets existing and queued rescues finish; a new city or roll clears them. Recovery totals count each delivered vehicle once, while the Junkyard displays the latest eight.

Drag, scroll, click, or use arrow keys on the wheel controls. Colorful strokes distinguish wheels from ordinary buttons. The size wheel runs from 100 to 1000 px, then full-window mode; **Escape** leaves full-window mode without requiring browser fullscreen.

Wind the analog clock by dragging. Its right-side controls, from top to bottom, are **reset** (circular-arrow icon: restores 09:00 and x1800), **daylight** (sun icon: jumps to noon, preserving speed), **faster** and **slower** (clock rate, not vehicle speed). Neither shortcut resets the city, its journeys or the playback state. With the clock focused, **Home** selects 06:00 and **End** selects 21:00. There is no separate digital readout; the analog control still exposes exact time to assistive technology. Speed changes briefly show plain multipliers such as **x1**, **x2**, **x16**, or **x1800** below the dial. Fractional rates use up to two decimal places, without thousands notation.

## Scope and references

This is a stylized, flat, procedurally generated miniature, **not an accurate street map, driving simulator, or trained driving agent**. Large/medium/small are artistic presets, not population classifications. Landmarks are original simplified drawings, not surveyed replicas. The About panel lists each city's available places and links to heritage or visitor references; a general reference does not imply that every depicted place belongs to a UNESCO property.

Film treatments and instant-paper proportions are visual approximations, not official Fujifilm simulations or licensed Polaroid products. Sound is synthesized locally; no Mini Metro recordings or soundtrack assets are included. Frame-rate controls request a target; actual performance depends on the browser, hardware, and visible traffic.

## Regression checks

Tests use Playwright and do not ship with the deployed page.

```sh
bun install
bunx playwright install chromium
bun tests/versions.mjs
bun tests/onboarding.mjs
bun tests/navigation.mjs
bun tests/layout.mjs
bun tests/clock.mjs
bun tests/postcards.mjs
bun tests/wheels.mjs
bun tests/motion.mjs
bun tests/rescue.mjs
bun tests/stress.mjs --rounds=10
```

Google Chrome is used automatically at its standard macOS application path when available. Elsewhere the tests use Playwright Chromium. Set `CHROME_PATH` to select another Chromium executable, or `CITY_HTML` to test a different application copy.

The onboarding regression checks fresh and returning visits, actual pointer/keyboard spawning, control changes, completion, skipping, replay, narrow/landscape layouts, reduced motion and unavailable storage. Other regressions seed a completed guide. Postcard checks cover all 19 newspaper editions, right-aligned comic titles, offline fonts and footer fit from 100 to 1000 px. The motion regression checks 80 lane samples, first-frame departure without a home, later home acquisition, pedestrian/wreck yielding, and deliberate pause. Each stress round visits all 19 destinations, renders every landmark motif, checks seed stability and dry-land placement, spawns via real mouse and keyboard input, creates traffic jams, completes rescues, exercises themes and responsive layouts, and runs a dense full-window scene at a requested 60 FPS.

Reports and screenshots are saved locally in ignored `test-results/`. Browser animation-frame intervals are diagnostic measurements, not a guarantee of game-rendered FPS.

The rescue regression covers simultaneous collision detection, nearest-available assignment, busy-crew queues, immediate reassignment after delivery, multi-incident road blocking and rendering, backup dispatch, exact recovery totals, the bounded gallery, cancelled empty calls and city resets.

## Versions and deployment

The version picker lives inside **City notebook & extras**, keeping the city heading clear. It preserves v0–v14 alongside the current v15. Archived pages have large, labeled previous/next chevrons at the top: left goes older, right goes newer, and v14 leads back to the current page. The first version disables the older control. Links support keyboard focus/Enter and preserve explicit light/dark theme parameters without taking over the city's arrow-key controls. Archives with a notebook also keep their picker there; earlier pages retain their original picker location.

Archives live in [`versions/`](versions/), with the catalog at [`versions/manifest.json`](versions/manifest.json); catalog paths are relative to that folder. Only the current application stays in the repository root. Archived simulation code is intentionally unchanged; only the marked version-navigation blocks are updated, with their full-file hashes refreshed. Old limitations remain. The navigation regression checks the notebook picker, chronological links, boundary controls, theme propagation, mobile layouts, and full-window access.

Work locally by default. Do not push changes or deploy without explicit approval.

Pushing `main` runs the GitHub Pages workflow. `scripts/build-site.mjs` prepares the ignored `_site/` output, and `tests/versions.mjs` verifies source hashes and navigation before deployment. The site publishes the current application and the `versions/` folder, creating `index.html` from the current application so the repository keeps a single current source. Previously published flat archive URLs redirect to their new locations, preserving theme parameters and fragments; the old catalog URL remains compatible. Tests, dependencies, and local reports are not published.
