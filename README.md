# Fuji City

A tiny, procedural city movie in an instant-photo frame: moving people, homebound cars and motorcycles, an east-to-west day/night cycle, original synthesized sound, and film-inspired color treatments. Watch it as a Sandbox, or **Play a day**: a gentle rail game where you send taxis to waving passengers before their landmark scrolls away.

**Play:** https://fuji-city.toyling.com/

The application is the self-contained [`city-flight.html`](city-flight.html). Open it directly in a modern browser, or serve this directory with `python3 -m http.server 8000`. There is no build step, backend, or application dependency. Optional Google Fonts need a connection; local font fallbacks keep the city usable offline.

## Explore

- **19 destinations:** Original, Paris, Munich, Istanbul, Seattle, New York, London, Ibiza, Tokyo, Mexico City, Singapore, Barcelona, Amsterdam, Lisbon, Kyoto, Bruges, Dublin, Dubrovnik, and Antalya.
- **102 named landmark motifs:** at least five per destination, selected reproducibly from each roll's seed and placed only on supported land. Antalya includes Yivli Minare, Saat Kulesi, Hadrian's Gate, Hidirlik Tower, and Kaleici. Original has fictional civic buildings.
- City-specific water, buildings, greenery, traffic density, driving side, typography, clocks, film defaults, and frame-rate tiers. Istanbul and Antalya use modern 12/3/6/9 clock numerals.
- Original film and Gamified pastel interfaces, light/dark/device appearance, keyboard controls, reduced-motion support, and high-contrast wheel indicators.
- Four workers handle terrain, walkers, film/audio preparation, and Chronicle processing. Traffic decisions remain on the main thread.

Each page load picks a random destination from all 19 cities, including Original, with that city's film and automatic frame-rate tier. Repeats are possible. The default print is a **600 px Polaroid, Close up**, in Gamified Light Paper. New roll and Revisit keep the selected city; the city wheel still lets you choose another. Reduced-motion preference starts the simulation paused. City options starts collapsed. The 132 px desktop clock has three controls stacked on its right: daylight, faster and slower.

In the two-column layout, the photo stays near the top of the viewport while the sidebar scrolls, until the shared layout ends. Space is reserved for the entire supported -2 to +2 degree paper rotation range, so changing cities or rolls does not resize or recenter the layout. Tall prints remain scrollable at the end; single-column mobile layouts use normal document scrolling so the photo cannot cover the controls. Full-window mode retains its independently scrolling sidebar. The small "Somewhere in," label leaves the selected city as the main heading.

A local-language hello is centered beneath the city name inside the header, aligned with the bottom of the adjacent clock, and flips like a classic station board when the destination changes. White letters on black mechanical tiles remain monochrome in both interfaces and themes; the board scales down within narrow headers. The city tooltip prefers the space above its control and otherwise moves below the ticker, leaving the greeting unobscured. Each city has one selected local greeting, including Japanese for Tokyo/Kyoto and English for multilingual Singapore. The print's existing white footer holds an original, handwritten-style two-line postcard, chosen from city imagery and the light at the start of the roll. New rolls avoid immediately repeating the previous verse; revisiting a landmark keeps it. Small prints use a shorter couplet from the same postcard, without changing the paper proportions. The writing reveal and letter flips are brief, respect UI/system motion settings, and settle when the page is hidden. Poems are original English text, not quotations. The optional handwriting font has local cursive fallbacks.

Dublin replaces Annecy in the current edition, with Liffey quays, brick courtyards, green squares, left-hand traffic and an Irish **Dia dhuit** greeting. Its five landmarks are Guinness Storehouse (industrial brickwork and glass rooftop Gravity Bar), Ha'penny Bridge, Custom House, the Spire and Trinity Campanile. IM Fell English lettering and a cream/gold-on-dark brewery-inspired clock are original stylistic choices, not official Guinness branding. Architecture references: [Guinness Storehouse](https://www.guinness-storehouse.com/en/whats-hoppening/the-gravity-bar) and [Visit Dublin](https://www.visitdublin.com/things-to-do/attractions).

Each destination's postcard is signed on the right with an absurd, invented honorary title: Dublin's **Acting Minister for Just One More Verse**, Seattle's **Senior Vice President of Light Drizzle**, and seventeen more. These are original English poems, not quotations, translations, or imitations of real poets. City-specific daylight and night imagery draws on local places and everyday culture: Istanbul ferry tea, Tokyo station melodies, Lisbon fado, Dublin quay footsteps and fiddle music, Singapore hawker tables, and more. Signatures finish the writing animation; tiny prints use a shorter comic title without changing the paper proportions.

**Read the local paper** in the notebook changes with the selected city, combining local landmark jokes with miniature-traffic absurdities. It is labeled **entirely made up / local satire**; none of its headlines or poet titles represent real reporting, offices or writers. The stories work offline as accessible, high-contrast text following the existing light/dark palette. The page and full-window backgrounds retain the original film or Gamified styling, without newspaper wallpaper.

The opening landmark is drawn from each city's complete set using the fresh roll's random seed, including on first load. The notebook identifies it; revisiting keeps it. Random selection allows repeats. Wheel gestures wait for 350 ms of quiet before committing, preserve their visible fractional position when a snap is interrupted, and use matching current/neighbor typography to avoid flicker. The wheel owns its preview label; city-clock lighting refreshes never overwrite an in-progress film selection.

## Play a day

**Play a day** (City options, beside Pause) turns one 06:00–21:00 day over the selected city into a short run. Sandbox stays the default on every visit and behaves exactly as before; nothing here changes while a day isn't running. This is milestone M1 of [`GAME-DESIGN.md`](GAME-DESIGN.md), built as described in [`M1-BUILD-PLAN.md`](M1-BUILD-PLAN.md).

- **The camera is the timer.** A start card picks a pace (**Sunday drive**, **Commute** or **Rush**: ×0.8, ×1 or ×1.15 flight speed, fares every 35, 25 or 18 s, signal holds of 12, 10 or 8 s, token refills every 5, 6 or 8 s) and a 6- or 10-minute day (x150 or x90 clock). Choices are saved in `fuji-city:game-settings:v1`. Start day resets the roll, sets 06:00 and plays the city, even with reduced motion.
- **Passengers and taxis.** A passenger appears in the top half of the print waving a gold flag lettered with a landmark ahead. Tap within 35 world units to send a gold taxi from their curb; it routes to that landmark's curb. Arrive before the drop-off scrolls off the bottom: +40, plus 1 per second left (up to +20), with streak multipliers of ×1.1, ×1.2 and ×1.3 at 3, 5 and 10 fares. A taxi that crashes, falls behind or misses its deadline costs −10. Unpicked passengers who scroll away cost nothing but the streak. At most two passengers wait at once. Each fare is validated once with a real route and only offered when an estimated trip fits comfortably inside its deadline.
- **Spawn tokens.** Every taxi or car costs one of three tokens, which refill on their own. The cursor ring previews each tap: green for a clear lane, amber and dashed for a crowded gap, gold over a passenger with a clear curb, white over a junction.
- **One-tap signals.** Tapping a junction gives green to the other direction: 1 s amber, 0.5 s all-red, the preset's hold, a 1 s amber tail, then the normal 24 s cycle. If your taxi is waiting there, the tap gives green to its side and a taxi crossing on your green earns +5. Busy approaches show count badges, and **+N through** pops when the hold ends. Taps during a pedestrian crossing wait for the walkers. Mini-roundabouts are self-running. Taps never cause crashes; only spawns can.
- **Crash causes.** When a vehicle you added crashes, both vehicles are outlined in red and the gap it was dropped into is ringed for 0.6 s (a static 1.5 s with reduced motion), and the status line says why: *dropped into a crowded gap* or *met cross traffic N s after you added it*.
- **Score and no hard game over.** Any vehicle reaching home in view adds +10 (+15 if you added it); each crashed vehicle −30; a vehicle lost in water −50. Waiting longer than a full signal cycle costs −0.125 per vehicle-second, capped so busy cities cannot drain a good day. Junctions you flipped are graded as they leave: Smooth +5, Jammed −5. The score never drops below 0 and nothing ends a day early. With Collisions off, the run is **Relaxed** and capped at ★★.
- **HUD and locks.** The Polaroid footer shows a day bar with rush-hour ticks at 08:00 and 17:00, the score, tokens, streak and pace, collapsing to one line on small prints. The Chronicle gains a **Today** row. Clock, print size, frame rate and camera are locked during a day (*"Locked for today. Try it in Sandbox."*). Changing city, rolling or revisiting asks *"Abandon today?"*. A reload resumes nothing.
- **Sunset.** At 21:00 taps stop for five quiet seconds. The postcard becomes your score card (`9/11 fares · 142 home · 2 wrecks · ★★☆`, the city's evening line, and the poet *certifying* your points), and the local paper prints a **DAY N EDITION** led by up to three stories about your day, still labeled entirely made up. Stars: 300, 600 and 900 points for a 10-minute day, ×0.6 for 6 minutes. **Play another day**, **Back to Sandbox** (a fresh poem and paper) or **Read today's paper**.
- **Keyboard.** Focus the city: **F** cycles waiting passengers, **T** sends a taxi, **J** / **Shift+J** cycles junctions, **Enter** acts on the aim (taxi, flip or spawn). Status announcements cover fares, deadlines under 10 s, crash causes and the end of the day, never score ticks.
- **Tips.** Three one-time tips (`fuji-city:game-tips:v1`): send a taxi, wave it through a junction, and taps never cause crashes. Game storage is only read once you open the start card, and the game still plays when storage is unavailable.

Pace, deadlines, scoring and stars were tuned in scripted full-day simulations across Original, Paris, London, Lisbon and Tokyo: a passive day scores about 0, and a player who sends taxis on clear curbs and flips junctions for them scores roughly 100–1,000. The base flight speed matches Sandbox (about 42 s from top to bottom at 600 px Close) rather than the design draft's faster ×1.4, which let the camera outrun taxis queued on single-lane streets. Human playtests (M1 Step 12) are still to come.

## Controls

First-time visitors see just a hand tapping a legal, visible road: no guide panel, steps, automatic scrolling or settings changes. The hint never clicks for you or overrides pause. Only successfully adding a vehicle, by pointer or keyboard, completes it and saves `fuji-city:first-play:v1` as `done` in browser-local storage, including a spawn before the hint appears. Earlier completed visits remain remembered; an old skipped guide is not completion. The hand is static with UI/system reduced motion, and tracking pauses while hidden. Unavailable storage is explained visibly. **Show road-click hint** in City notebook & extras replays the hint.

Click a road to add a randomly painted vehicle. Each shuffled pair contains a car and a motorcycle. New vehicles start at their planned cruising speed; a temporarily unavailable home no longer freezes them mid-road. They continue along legal roads and retry their home search. Red lights, pedestrians, wrecks, blocked exits, and close traffic still require a stop. A deliberately paused city stays paused.

Focus the city and press **L** to find a lane, use arrow keys to aim, and press **Enter** to spawn. Crowded clicks can cause collisions; rescue helicopters carry wrecks to the Junkyard.

Rescues run concurrently. Each crash gets the nearest available helicopter without interrupting another crew's assignment. When all crews are busy, crashes wait in arrival order and keep their roads blocked. A helicopter becomes available immediately after delivering its cargo and can take the next queued call from its current location. If no helicopters remain, a single backup crew arrives; the queue does not create an unlimited fleet. All active wrecks participate in traffic safety and rendering. Turning off new collisions lets existing and queued rescues finish; a new city or roll clears them. Recovery totals count each delivered vehicle once. Every delivered car stays queued until packed and collected; only the artwork is capped, with a count for additional waiting cars.

After delivery (or a cancelled pickup), an unneeded helicopter chooses a random viewport edge and departure point. It keeps that choice throughout the exit, including window resizing, but remains immediately available for queued calls. Helicopters lower wrecks onto stable, slightly randomized positions on the intake conveyor.

A straw-hatted **guard** starts asleep in his chair when the yard first appears. He wakes, stretches and sneezes once per roll, with an original synthesized sneeze and a brief **AH-CHOO!** text effect. He directs helicopter deliveries and hops or leans away from dropping cargo, but never carries wrecks. The intake belt feeds each car into the hydraulic crusher; a second belt carries its compacted pack to a large ribbed scrap container and drops it inside. One cycle takes about 4.9 running seconds: intake 1.6, press 1.4, output 1.5, drop 0.4. Belts support the cargo until the final short drop. Processing pauses with playback or a hidden tab; reduced motion suppresses decorative motion while preserving processing state. The lit yard floor and container count stay readable at night.

Once **every recovered car is packed and no delivery is pending**, the container waits **five real running seconds**, independent of city-clock speed and manual winding. A new rescue or unpacked arrival resets that wait. Pauses and hidden-tab time do not count. An old steam locomotive, tender and single container flatcar appear at the pickup point, already facing the nearest safe screen exit. The container hoist takes 0.8 seconds, then the train drives **forward only** along the shortest safe spur and fully clears the screen in 0.6–1.8 seconds: at most 2.6 running seconds in total, apart from frame-boundary rounding. No reversing or perimeter lap. Black smoke, an original synthesized whistle and rhythmic chuffs remain.

The packed batch is sealed when the train is dispatched. The hoist loads the whole container, never loose or unprocessed cars. Fresh helicopter arrivals remain on the intake belt for a separate batch, whose processing resumes after loading. Historical recovery totals never decrease. Sound respects mute, volume and pause; reduced motion shows a stationary train without animated smoke or wheels. The bay stays visible until departure, and a new city or roll clears the guard, conveyors, container, timer and train.

The spur avoids the visible map; explicit map-exclusion clipping also protects it from smoke, rails and the hoist after resizing or scrolling. If no safe onscreen pickup point exists beside the map, the route stays offscreen instead of crossing the city. Tracks appear just ahead of the engine and fade across two train lengths behind the train's movement, disappearing fully before departure ends.

Waterfront boats now travel in world coordinates rather than being painted into terrain tiles. Launches and ferries follow the river bends, larger cargo vessels stay offshore, and gently shifting courses and wakes follow their actual heading. Narrow canals use a single smaller-boat channel; wider waterways have separated opposing traffic. Bridge decks mask boats passing beneath them, shoreline clipping keeps hulls and wakes in water, and moored dock boats remain stationary. Visible vessels are generated deterministically from the roll, channel and running time, with a 64-vessel rendering cap and no growing population cache.

**Rare coastal wildlife:** a whale or beluga may surface after the first 75–135 running seconds, with subsequent opportunities spaced 120–300 seconds apart. Each appearance lasts about 14 seconds: underwater shadow, gradual emergence, a small exhalation plume, tail lift, dive and fading ripples. Only one can appear at a time, away from shore and nearby boats; opportunities with no suitable visible water are skipped. No whales appear in narrow inland waterways or dry cities. These are stylized cameos, not claims about local species distributions. Boat and wildlife animation freezes while paused, hidden, or under UI/system reduced motion. Manual clock changes do not accelerate sightings; a new city or roll restarts water life.

Drag, scroll, click, or use arrow keys on the wheel controls. Colorful strokes distinguish wheels from ordinary buttons. The size wheel runs from 100 to 1000 px, then full-window mode; **Escape** leaves full-window mode without requiring browser fullscreen.

Wind the analog clock by dragging. Its right-side controls, from top to bottom, are **daylight** (sun icon: jumps to noon, preserving speed), **faster** and **slower** (clock rate, not vehicle speed). Daylight preserves the city, its journeys and playback state. There is no clock-reset button. With the clock focused, **Home** selects 06:00 and **End** selects 21:00. There is no separate digital readout; the analog control still exposes exact time to assistive technology. Speed changes briefly show plain multipliers such as **x1**, **x2**, **x16**, or **x1800** below the dial. Fractional rates use up to two decimal places, without thousands notation. Night scales scene colors toward a moonlit blue instead of flattening them into one shade, so midnight keeps at least 80% of the noon tonal contrast between roads, ground, water and vehicles; the clock regression checks this.

## Scope and references

This is a stylized, flat, procedurally generated miniature, **not an accurate street map, driving simulator, or trained driving agent**. Large/medium/small are artistic presets, not population classifications. Landmarks are original simplified drawings, not surveyed replicas. The About panel lists each city's available places and links to heritage or visitor references; a general reference does not imply that every depicted place belongs to a UNESCO property.

Film treatments and instant-paper proportions are visual approximations, not official Fujifilm simulations or licensed Polaroid products. Sound is synthesized locally; no Mini Metro recordings or soundtrack assets are included. Frame-rate controls request a target; actual performance depends on the browser, hardware, and visible traffic.

## Optional production analytics

GA4 stream **`G-XPQERNETR9`** is configured only for the current page at `https://fuji-city.toyling.com/` (including its `index.html` and `city-flight.html` aliases). Local files, development servers and archived versions never load the analytics tag. This integration must be explicitly published before it can collect production traffic.

**Temporary pre-worldwide-release mode:** `REQUIRE_ANALYTICS_CONSENT = false` in `installAnalytics()` hides the automatic consent prompt and enables production analytics by default, while respecting existing explicit opt-outs. Default enablement is never written as consent. **Set this flag to `true` before worldwide release** to restore the automatic opt-in prompt and prevent analytics loading until permission is given.

In either mode, **City notebook & extras → Analytics privacy** opens the allow/decline controls. Explicit choices are stored locally as `fuji-city:analytics:v1`. Withdrawal disables the stream, stops application events and deletes this application's host-only `fuji_city_` cookies on `fuji-city.toyling.com` (path `/`) without deleting unrelated cookies. Advertising storage, ad personalization, ad user data and Google signals stay disabled. Analytics failures do not block play and are reported visibly.

GA4 can report measured visitors' referral sites, approximate countries, browsers/devices and repeat visits using pseudonymous cookies, **not named identities**. The integration sends a canonical page URL without query strings or fragments and only the referring origin, not its path or query. It never sends poem text, coordinates, seeds, names or email addresses. Cookie lifetime is 90 days, refreshed by visits. Reports exclude opt-outs and blocked tags, so they are not a complete visitor count.

| Event | Meaning |
| --- | --- |
| `page_view` | One page view after analytics is enabled and the tag is ready |
| `vehicle_spawn` | Successful player spawn; `vehicle_type` is `car` or `bike` |
| `city_selected` | Selected destination changes |
| `play_start`, `play_pause` | Analytics starts observation of running playback, or player changes playback |
| `play_time` | Naturally running, visible-tab seconds; emitted every 30 seconds and flushed on pause, city change, hiding or leaving |
| `new_roll` | Player requests a new roll |

Events include `city_id` and `ui_style`. `play_time` includes `play_seconds`; it measures running simulation time, not attention or productivity. After publication, GA4 Realtime can confirm measured traffic. For parameter-level exploration, register event-scoped custom dimensions `city_id`, `ui_style`, `vehicle_type`, and an event-scoped custom metric `play_seconds` with Seconds units in the property's Custom definitions. These property settings require owner access and are not created by this repository.

Implementation references: [Google consent mode](https://developers.google.com/tag-platform/security/guides/consent), [GA4 configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), and [Google privacy policy](https://policies.google.com/privacy).

## Regression checks

Tests use Playwright and do not ship with the deployed page.

```sh
bun install
bunx playwright install chromium
bun tests/versions.mjs
bun tests/startup.mjs
bun tests/onboarding.mjs
bun tests/navigation.mjs
bun tests/layout.mjs
bun tests/clock.mjs
bun tests/postcards.mjs
bun tests/wheels.mjs
bun tests/motion.mjs
bun tests/rescue.mjs
bun tests/train.mjs
bun tests/water-life.mjs
bun tests/analytics.mjs
bun tests/game-mode.mjs
bun tests/day-run.mjs
bun tests/fares.mjs
bun tests/signals.mjs
bun tests/day-card.mjs
bun tests/stress.mjs --rounds=10
```

Google Chrome is used automatically at its standard macOS application path when available. Elsewhere the tests use Playwright Chromium. Set `CHROME_PATH` to select another Chromium executable, or `CITY_HTML` to test a different application copy.

The onboarding regression checks fresh and returning visits, actual pointer/keyboard spawning, early completion, replay, narrow/landscape layouts, reduced motion and unavailable storage. Other regressions seed a completed hint. The train regression covers continuous intake/press/output/drop positions, the all-packed gate, the strict five-real-second threshold at different clock rates and frame intervals, manual clock changes, paused/hidden behavior, concurrent deliveries, sealed batches, repeated collections, reset, responsive rendering and synthesized WAV output. Postcard checks cover all 19 newspaper editions, right-aligned comic titles, offline fonts and footer fit from 100 to 1000 px. The motion regression checks 80 lane samples, first-frame departure without a home, later home acquisition, pedestrian/wreck yielding, and deliberate pause. Each stress round visits all 19 destinations, renders every landmark motif, checks seed stability and dry-land placement, spawns via real mouse and keyboard input, creates traffic jams, completes rescues, exercises themes and responsive layouts, and runs a dense full-window scene at a requested 60 FPS.

Reports and screenshots are saved locally in ignored `test-results/`. Browser animation-frame intervals are diagnostic measurements, not a guarantee of game-rendered FPS.

Analytics regression uses a stub vendor script: no test traffic reaches the real GA4 property. It checks preview default-on behavior without saved consent, existing opt-outs, the restored opt-in mode's no-requests-before-consent behavior, the production allowlist, remembered decisions, withdrawal and cookie cleanup, safe URL fields, gameplay/time events, mobile consent controls and blocked-script behavior.

Play a day regressions drive the game through a test-only `?game-test=1` hook (`window.__fujiGame`) that advances the same frame function as playback in fixed 0.02 s steps; production pages never expose it. `game-mode` checks the hidden hook, Sandbox's unchanged flight pace and global signals, the start card and saved choices, and abandoning. `day-run` covers x90/x150 days, every clock and view lock, abandon prompts, preset pacing, a 20-crash storm that floors the score at 0 and still reaches dusk, the +15 homecoming, HUD fit from 100 to 1000 px and full window, and reduced-motion starts. `fares` checks steady, dry, routable fares in five cities (including left-hand London and Tokyo), a real pointer tap that sends a taxi, delivery, deadline failure, free misses, tokens, crash flashes in both motion modes and F/T keys. `signals` samples the amber/all-red/hold/tail sequence, pending flips during crossings, roundabouts, J/Enter, pointer taps, 1,000 random junction taps without a single crash, and taxi priority. `day-card` checks the score postcard, end card, DAY N paper, postcard fit across print sizes, Back to Sandbox and Play another day.

The startup regression controls only the initial random draw to verify all 19 destinations, their matching controls, city defaults and workers, plus preserved manual selection and roll behavior. The rescue regression covers simultaneous collision detection, nearest-available assignment, busy-crew queues, immediate reassignment after delivery, multi-incident road blocking and rendering, backup dispatch, exact recovery totals, retention of every uncollected delivery, cancelled empty calls and city resets.

Junkyard checks also cover intake-belt landing positions, four-direction helicopter exits, the guard's once-per-roll wake/sneeze, delivery guidance and lean-away dodge, fixed guard position during processing, and safe container handoff. Railway checks verify shortest-path fixtures and sample rendered pixels across loading/departure, both interfaces, themes, narrow screens and full-window mode: no map overlap, stable routes without extra laps, a pickup duration of at most 2.6 seconds, forward-only travel for every carriage, the tail clearing the screen, two-train-length rail fading, and complete track cleanup. The water-life regression checks world-space motion and tangent headings across all 19 cities, bounded generation, bank/bridge masking, pause and both motion preferences, deterministic routes, both species' animation phases, rarity over a simulated hour, small-print rendering and reset.

## Versions and deployment

The version picker lives inside **City notebook & extras**, keeping the city heading clear. It preserves v0–v15 alongside the current v16. Archived pages have large, labeled previous/next chevrons at the top: left goes older, right goes newer, and v15 leads back to the current page. The first version disables the older control. Links support keyboard focus/Enter and preserve explicit light/dark theme parameters without taking over the city's arrow-key controls. Archives with a notebook also keep their picker there; earlier pages retain their original picker location.

Archives live in [`versions/`](versions/), with the catalog at [`versions/manifest.json`](versions/manifest.json); catalog paths are relative to that folder. Only the current application stays in the repository root. Archived simulation code is intentionally unchanged; only the marked version-navigation blocks are updated, with their full-file hashes refreshed. Old limitations remain. The navigation regression checks the notebook picker, chronological links, boundary controls, theme propagation, mobile layouts, and full-window access.

Work locally by default. Do not push changes or deploy without explicit approval.

Pushing `main` runs the GitHub Pages workflow. `scripts/build-site.mjs` prepares the ignored `_site/` output, and `tests/versions.mjs` verifies source hashes and navigation before deployment. The site publishes the current application and the `versions/` folder, creating `index.html` from the current application so the repository keeps a single current source. Previously published flat archive URLs redirect to their new locations, preserving theme parameters and fragments; the old catalog URL remains compatible. Tests, dependencies, and local reports are not published. The custom domain `fuji-city.toyling.com` is set in the repository's Pages settings, not a `CNAME` file (Actions deployments ignore it); the former `https://gencay.github.io/fuji-city/` address redirects there, keeping paths.
