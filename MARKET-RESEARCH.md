# Fuji City: Market Research (traffic and road games, autumn 2026)

*Prepared Oct 7, 2026 (PT) to go with `GAME-DESIGN.md`. Every quote below is copied word for word from a public comment or review and links back to it. Wishlist and player numbers come from the developers themselves unless marked otherwise. Reddit blocks direct fetches, so threads were read through the Arctic Shift Reddit archive. Comment scores are the archived values and may lag the live site.*

---

## 1. TL;DR

- **The space is crowded, and everyone in it is building the same thing.** Four "traffic is the whole game" titles are due within months of each other: Traffic Architect (Nov 3), Trafficity (Nov 16), Highways & Co. (2026, no date yet) and Junxions (Early Access, 2026). Transport Fever 3 is coming too. All four are **road builders**. Each one is "the traffic part of Cities: Skylines, by itself". Players have noticed: about a dozen comments read like *"Isn't this just Mini Motorways / Cities: Skylines?"*
- **None of them has a moving camera, a day clock, crashes, landmarks, or a sense of humor.** Three of the four developers turned down accidents and day/night in public, saying they get in the way of the build-and-test loop. Players keep asking for both anyway.
- **What players want most:** (1) to play on their own device, meaning Mac, iPad, phone or Deck; (2) a sense of purpose without a death clock; (3) real places; (4) more kinds of transport; (5) a demo or free try. Fuji City already answers 1, 3 and 5, and its design can answer 2.
- **Where Fuji City would lose:** anyone looking for road tools, interchanges, or simulation accuracy. Don't present it as a traffic simulator.
- **Where Fuji City can win:** a short, funny, cozy-but-tense **"help the city as it scrolls past"** game you can play in a browser. It's closer to Mini Motorways' "relaxing and stressful at the same time" feeling plus TOEM's photo collecting than to a traffic simulator.

---

## 2. Competitor table

Steam prices are US list prices on Oct 7, 2026 (several are on sale today). Review numbers are Steam "all languages" totals.

| Game | Developer | Release / status | Platforms | Price | Core loop | Praised for | Complaints / requests | Sources |
|---|---|---|---|---|---|---|---|---|
| **Trafficity** | Onramp Games (solo) | **Nov 16, 2026**. No demo | Win, Mac | TBA | 2D top-down "city builder focused on traffic". City levels hand you a batch of buildings and a road budget, and satisfaction depends on commute times. Full refund when you demolish. 4 procedural biomes. **Deliberately no accidents and no day/night** | Clean "Google Maps" look, the trailer, ease of building | Trains and transit (dev: not at 1.0), Mac/iOS/mobile, OSM and real maps, dark mode, a demo, "isn't this Mini Motorways?", "AI slop" accusations | [Steam](https://store.steampowered.com/app/5185750/Trafficity/), [r/indiegames thread](https://www.reddit.com/r/indiegames/comments/1wfh5h5/), [r/CityBuilders "just one more lane"](https://www.reddit.com/r/CityBuilders/comments/1wovuag/) |
| **Traffic Architect** | Green Signal Games (Grenagar, solo) | **Nov 3, 2026**. Free Steam demo since Sep 24. A free browser version was on CrazyGames from March 2026 | Win (Mac asked for) | TBA ("cheap… close to mini motorways") | 3D Mini Motorways-style game: the city grows by itself and you build roads, interchanges, signals, buses, rail and metro. One-click interchanges. A district can overflow and end the run | Simulation depth, the browser playtest, the dev's responsiveness ("40 hours" player) | "AI-coded" and disclosure arguments (the most common topic in its threads), bland or odd art ("trees bigger than high-rises"), harsh game over, unclear purpose in the trailer, CS1-style ramps | [Steam](https://store.steampowered.com/app/5028050/Traffic_Architect/), [r/CityBuilders suburbs post](https://www.reddit.com/r/CityBuilders/comments/1x02b0q/), 26 more threads (§7) |
| **Highways & Co.** | iamsahaj (TheGreaT1803, solo, web stack/pixi) | "Coming soon" (2026). In August the dev promised a demo "in < 30 days", but Steam lists none yet | Win, Mac, Linux | ~$10–15 (dev, per [Phenixx Gaming](https://web.phenixxgaming.com/2026/08/25/highways-co-revealed/)) | Puzzle **scenarios** in the style of Freeways and Poly Bridge: build roads, open them to traffic, meet throughput thresholds, optimize budget. Deterministic sim. **No RNG events** | The pitch ("for people who hate building cities but love fixing traffic"), road tools, the art. The dev reports 20k wishlists in under a week and 50k in a month | Demo now, Mac/Linux, left-hand traffic, bikes/transit, real-map import, realistic markings | [Steam](https://store.steampowered.com/app/5096600/Highways__Co/), [r/IndieGaming 961-pt post](https://www.reddit.com/r/IndieGaming/comments/1vsov9w/), [20k wishlists post](https://www.reddit.com/r/IndieDev/comments/1vy4mvl/) |
| **Junxions** | CyberStorm, published by Hooded Horse | Early Access "2026". Slipped from 2025 | Win | TBA | Detailed traffic-engineering sandbox plus hand-made challenge maps. **Import any real place by coordinates** | Depth, real-world import ("Fixing local intersections will be so much fun") | Delays, rough UI in early footage | [Steam](https://store.steampowered.com/app/1447250/Junxions/), [r/CitiesSkylines](https://www.reddit.com/r/CitiesSkylines/comments/1d8q4w8/), [r/Junxions](https://www.reddit.com/r/Junxions/comments/1qs3yfs/) |
| Mini Motorways | Dinosaur Polo Club | 2021 | Win, Mac, Apple Arcade, Switch | $9.99 | Draw roads until the city overwhelms you. Real-city maps, daily and weekly challenges, GIF export | **24,516 reviews, 96% positive**. Among the 1,500 newest English reviews, **286 (19%) mention relaxing/chill/calm/cozy**, and many say "relaxing *and* stressful" | Random spawns feel unfair (about 14 of 56 recent negatives), wants control over **pace**, traffic lights feel useless | [Steam](https://store.steampowered.com/app/1127500/) |
| Mini Metro | Dinosaur Polo Club | 2015 | Win, Mac, Linux, mobile | $9.99 | Subway-line version of the above | 16,802 reviews, 96% positive | — | [Steam](https://store.steampowered.com/app/287980/) |
| Freeways | Captain Games | 2018 | Win, Mac | $4.99 | Draw interchanges, 160 levels | 2,224 reviews, 90% positive | Looks dated (per H&Co dev) | [Steam](https://store.steampowered.com/app/780210/) |
| GRIDROAD | RAJACORP | Dec 2024 | Win, Mac, Linux | $9.99 | Junction-optimization puzzles with light tuning and a global leaderboard | 437 reviews, 85% positive. Players praise the leaderboard | "more annoyingly frustrating than fun" | [Steam](https://store.steampowered.com/app/2677310/) |
| **Traffix** (closest to signal tapping) | Infinity Games | 2019 (mobile port) | Win, Mac | $4.99 | **Tap traffic lights in real time** to avoid crashes, 32 city levels | 84 reviews, **67% (Mixed)**. "Deceptively difficult!" | QTE-like timing only, double-click controls, an extra car slips through randomly and crashes, no way to clear a pile-up, too stressful | [Steam](https://store.steampowered.com/app/1102580/) |
| RUSH (web) | jeetle.games | Jul 2026, free browser | Web | Free | Control the lights at one intersection | "Pretty fun!" (59-pt post) | Unclear why a crash happened. Wants a second, linked intersection | [r/MiniMotorways](https://www.reddit.com/r/MiniMotorways/comments/1vaca63/) |
| Cities: Skylines I / II | Colossal Order | 2015 / 2023 | PC | $29.99 / $49.99 | Full city builder. Traffic is the part players love | CS1: 291k reviews, 93%. CS2: 92k reviews, **56% (Mixed)** | Players constantly say "the traffic part is the best part" | [CS1](https://store.steampowered.com/app/255710/), [CS2](https://store.steampowered.com/app/949230/) |
| TOEM (photo comparable) | Something We Made | 2021 | PC, consoles | $19.99 | Cozy photo adventure | **12,540 reviews, 99% positive** | — | [Steam](https://store.steampowered.com/app/1307580/) |

Other references people brought up in threads: Urban Flow and Conduct Together ([comment](https://www.reddit.com/r/MiniMotorways/comments/1vaca63/_/p0lyil6/)), NIMBY Rails (OSM-based, 90% of 2,326 reviews positive), Transport Fever 3, and Traffic Light Incremental, an itch.io jam game praised on [r/incremental_games](https://www.reddit.com/r/incremental_games/comments/m4mw1j/).

**Signals of how big the genre is:** Next Indie's X post announcing Trafficity got **656 likes, 294 bookmarks and 34.8k impressions** ([post](https://x.com/nexindie/status/2102767442959163409)). The H&Co dev says one YouTube trailer on an empty channel went viral (150k views at 20k wishlists, later "700k views") and that a Japanese outlet (Automaton) picked it up. Traffic Architect's browser build reports **150k+ plays and a 9.2 rating** on CrazyGames.

---

## 3. What players actually want

These are rough counts of **distinct commenters** raising each theme across the ~1,000 comments I read (devs excluded). They're for ranking, not statistics.

| # | Theme | ~Count | Representative quotes |
|---|---|---|---|
| 1 | **"Can I play it on my device?"** (Mac, iPad/iOS, phone, Steam Deck, Linux, console) | **~23** | "Need this on iOS to play on iPad" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/paequcl/)). "If you made this available on mac (I'm broke, using my office macbook) I'll buy it!" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/p9vpb95/)) |
| 2 | **"Isn't this just Mini Motorways / C:S?"** and genre fatigue | **~15** | "Too many games not only in same genre (of city building). But literally in road building." ([link](https://www.reddit.com/r/IndieGaming/comments/1w8us7g/_/p86076k/)). "The genre is suddenly getting a lot of competition" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/paj2mzz/)) |
| 3 | **Transit and other modes** (trains, buses, bikes, trams) | **~15** | "Where train?!?" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/pa6gst8/)). The H&Co dev calls transit "probably top 3 suggestions" ([link](https://www.reddit.com/r/IndieDev/comments/1vsoim9/_/p4tay8n/)) |
| 4 | **Suspicion of AI-made games, and disclosure** | **~14** (mostly Traffic Architect) | "I think you should be open with your potential consumers and let them know in what way AI was used." ([link](https://www.reddit.com/r/CityBuilders/comments/1x02b0q/_/pehggnu/)). r/tycoon now requires an AI disclosure on promo posts ([thread](https://www.reddit.com/r/tycoon/comments/1sg0waf/)) |
| 5 | **Real places** (OSM, "my neighborhood", real countries) | **~11** | "There's something extra satisfying about fixing traffic in places you actually know." ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/pbbfo71/)). "Fixing local intersections will be so much fun." ([link](https://www.reddit.com/r/CitiesSkylines/comments/1d8q4w8/_/l79bijr/)) |
| 6 | **Look and feel sells it** (clean, readable, "Google Maps" style) | **~10** | "this very simple clean Google Street-esgue art style is really appealing" (29 pts, [link](https://www.reddit.com/r/CityBuilders/comments/1wovuag/_/pbqctbf/)). "I have 0 interest in this stuff and even I want to get it" ([link](https://www.reddit.com/r/IndieDev/comments/1vy4mvl/_/p5w9alz/)) |
| 7 | **Demo / try before buying** | **~9** | "demos have driven a big chunk of my game purchases recently." ([link](https://www.reddit.com/r/IndieGaming/comments/1vsov9w/_/p4nr95k/)). "will wait till its out and read reviews.....too much trash nowadays LOL" ([link](https://www.reddit.com/r/tycoon/comments/1vi4wtj/_/p2hcfw4/)) |
| 8 | **Purpose and goals, but no death clock** | **~9** each way | Against pressure: "instead of disempowering mechanics such as time limits, every increasing pressure, fail scenarios, etc." ([link](https://www.reddit.com/r/indiegames/comments/1vpbx2z/_/p3wm4ch/)). "a race against the death clock" ([link](https://www.reddit.com/r/IndieGaming/comments/1vsov9w/_/p4sxej3/)). For purpose: "it felt empty and without purpose" ([link](https://www.reddit.com/r/DestroyMyGame/comments/1ry4a4q/_/obbvnc1/)). "Like I see roads, why?" ([link](https://www.reddit.com/r/DestroyMyGame/comments/1ry4a4q/_/obsbsjo/)) |
| 9 | **Price / free** | **~7** | "What will be the pricing? (plz say it'll be free 🥺🤞)" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/paffk3n/)). "In the end it'll be an under $5 game." ([link](https://www.reddit.com/r/CityBuilders/comments/1wovuag/_/pbwz8cv/)) |
| 10 | **Accidents, events, imperfect drivers** | **~6** | "Will there be accidents?" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/pa8hf3d/)). "bad road network design (too many conflict points) does increase the chance of accidents." ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/paf9uz8/)) |
| 11 | **Left-hand traffic** | **~5** | "As someone from a left-hand traffic country, this would be a nice toggle" ([link](https://www.reddit.com/r/IndieGaming/comments/1vsov9w/_/p4nxly2/)) |
| 12 | **Dark mode / night palette** | **~4** (Onramp: "the most requested feature" after transit) | "Will the game (eventually) have a dark mode?" ([link](https://www.reddit.com/r/CityBuilders/comments/1wovuag/_/pbx6ktq/)) |
| 13 | **Peak hours and day/night** | **~4** | "add peak hours and day night cycle :D" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/pa8qzg6/)) |
| 14 | **Passive / watchable play** | **~3** | "I'm kind of into city builders that I can just hang back and watch or be kind of passive with right now." ([link](https://www.reddit.com/r/CityBuilders/comments/1x02b0q/_/pehuneq/)) |

**Lessons from games that already shipped**

- **Mini Motorways' magic is the mix of relaxing and stressful.** *"Somehow the most relaxing game and the most stressful game simultaneously."* ([review](https://steamcommunity.com/profiles/76561199558445868/recommended/1127500/)). The criticism is that it's random and can't be paced: *"I REALLY wish they would simply have multiple difficulty levels that changes the PACE of the regular game mode."* ([review](https://steamcommunity.com/profiles/76561198080236337/recommended/1127500/)). *"You just keep going until the RNG spawns an impossible to manage building and screws you over."* ([review](https://steamcommunity.com/profiles/76561198026453558/recommended/1127500/))
- **A game built only on light tapping lands at Mixed (Traffix, 67%).** *"Do you like Quick TIme Events? This game is just endless stream of Quick TIme Events and nothing else."* ([review](https://steamcommunity.com/profiles/76561198021187429/recommended/1102580/)). *"the accident mechanism is a cascade without remedy - once there is an accident, all oncoming vehicles simply pile in; there is no way to clear it."* ([review](https://steamcommunity.com/profiles/76561198342181811/recommended/1102580/)). *"I play small casual puzzle games to wind down, not wind up"* ([review](https://steamcommunity.com/profiles/76561198037492679/recommended/1102580/))
- **Mini Motorways players think its traffic lights are useless.** *"My only issue is that traffic lights are functionally useless"* ([post, 43 pts](https://www.reddit.com/r/MiniMotorways/comments/1q9m3f9/)). Asked for instead: *"make it so when the traffic light is clicked it will prioritize a different flow of traffic"* ([post, 51 pts](https://www.reddit.com/r/MiniMotorways/comments/1uzi7ov/)).
- **Randomness only works when it comes from the player's own choices.** Traffic Architect's dev, after his demo: *"realism the player can't control reads as noise. Realism that answers to what they built reads as depth."* ([post](https://www.reddit.com/r/SoloDevelopment/comments/1wua159/)). Trafficity's dev skipped day/night because *"We don't want you to have to wait a full day/night cycle (could be 10 or 15 min) to see if the solution you tried worked."* ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/pa8lolc/))
- **Free browser players are a different crowd.** Traffic Architect's dev on CrazyGames: *"for many players it was too hard and punishing, with realistic traffic behavior casual players bounce off."* ([link](https://www.reddit.com/r/ClaudeCode/comments/1vjvawt/_/p2qcuib/)). A skeptic: *"It's just a site for free games for kids lol."* ([link](https://www.reddit.com/r/ClaudeCode/comments/1vjvawt/_/p2q9kh3/))

---

## 4. Market gaps: where Fuji City can win, and where it loses

### White space nobody else covers

| Fuji City strength | Competitors | Evidence of demand |
|---|---|---|
| **Moving camera / rail structure.** The camera is the timer, so there's no build-iterate loop | None. All four are top-down builders with a free camera | Lots of "isn't this Mini Motorways?" (theme #2). A new verb is the clearest way to stand apart |
| **Crashes that only player-spawned cars cause, cleared by helicopters, sent to a junkyard** | All four left accidents out on purpose | ~6 players ask for accidents. Fuji's crashes follow from player choices, which is the "realism that answers to what they built" lesson. Helicopters fix Traffix's "no way to clear it" complaint |
| **A day clock with rush hours** | Trafficity explicitly has none. The others don't mention one | Peak-hour and day/night asks (theme #13) |
| **19 real cities, left-hand traffic in 5, real landmarks** | Junxions imports real maps (deep). The rest are procedural | Real-place asks (#5) and left-hand asks (#11). Mini Motorways' real-city maps are a known draw. *Be honest: the street layouts are procedural, not the real map.* |
| **Humor and satire** (*Almost-Daily*, poet titles) | None | The jokes take care of themselves in threads: "Just one more lane bro…" (61 pts, [link](https://www.reddit.com/r/pcgaming/comments/1wcontu/_/p902yuk/)). "'One More Lane' would be a genius name for this game." ([link](https://www.reddit.com/r/pcgaming/comments/1wcontu/_/p90dmla/)). Trafficity's best Reddit post was the meme title "just one more lane should do it" (202 pts) |
| **Instant-photo look and the album** | None in the traffic genre | TOEM is 99% positive across 12.5k reviews. Mini Motorways lists "Export GIFs" as a feature. A postcard is easy to share |
| **Browser, free, runs anywhere, 10-minute sessions** | Traffic Architect had a free browser version. The rest are paid Steam games | Platform asks (#1), demo asks (#7), price asks (#9) |
| **A Sandbox "just watch" mode** | Creative modes exist, but they're for building | Watchable play (#14) |

### Where Fuji City competes head-on and loses

- **Road building and interchanges.** Fuji City has none. Anyone who wants "the best road building tools you'll ever use" will go to H&Co or Trafficity.
- **Traffic engineering realism.** The same critic who went after both H&Co and Traffic Architect over ramps, gores and curb radii ([link](https://www.reddit.com/r/CityBuilders/comments/1vh8asl/_/p23iktk/)) would go after Fuji City's grid too. Stay out of r/CitiesSkylines-style "accurate sim" framing.
- **Signal tapping by itself.** Traffix (Mixed) and RUSH already do it. A real-time light game with nothing else on top plays like a QTE.
- **Transit.** It's a top-3 request and Fuji City doesn't have it. Traffic Architect does. Don't promise it.

---

## 5. Recommendations for the seven design-doc systems

| System | Verdict | What to do | Evidence |
|---|---|---|---|
| **4.1 One day run** | **Keep. Add a Daily seed** | Keep 10 minutes, but test a **6-minute "commute" preset** as the default for browser players. Add a **daily seed** that's the same city and the same day for everyone, and put the seed on the postcard. **No hard game over**: the day always ends at 21:00, and failure gets reported in the paper. | Mini Motorways' daily/weekly challenges and GRIDROAD's leaderboard get praised. "Maybe online scoreboard somehow?" ([link](https://www.reddit.com/r/indiegames/comments/1vpbx2z/_/p3wn9vg/)). The game-over complaints ([link](https://www.reddit.com/r/playmygame/comments/1wtf3ld/_/pcubjzp/)) and the "death clock" dislike (#8). "It will be for like 10 mins… more like an arcade" suggests short sessions fit the expectation |
| **4.2 Signal tapping** | **Keep, but change it** | (a) **One tap only**, no double-click or hold. Hit targets of at least 44 px (already planned). (b) Make the effect **visible right away**: a queue-count badge that drains, and a small "+N through" pop. (c) Treat it as a **priority flip** ("main flow north-south"), not a light-timing puzzle. (d) Tie it to the other systems: a jammed junction blocks a taxi's route, so taps matter to fares. (e) **Never** let a tap cause a crash. Your governor already guarantees this, so say it in the tutorial. | Traffix's double-click and "random second car" complaints. MM's "traffic lights are functionally useless" and "click to prioritize a different flow" (51 pts). RUSH's "Excited for a level two where you have to manage a second intersection that is connected" ([link](https://www.reddit.com/r/MiniMotorways/comments/1vaca63/_/p0m0lkq/)) |
| **4.3 Passengers and taxis** | **Keep. This is the main verb** | Push it as the hero mechanic, since it's what gives each tap a *why*. Landmark flags tie into the real-cities appeal. When a taxi crashes, show a **0.5 s "why" flash** (a red outline on the gap you spawned into) before the helicopter arrives. | "Like I see roads, why?" and "without purpose" (#8). RUSH: "if there were some animation or effect that appears for a moment … it would be clearer what just happened." ([link](https://www.reddit.com/r/MiniMotorways/comments/1vaca63/_/p0lklxr/)) |
| **4.4 Hover** | **Keep. Promote Calm flight** | Keep fuel, but make **Hover toggle the default on touch**. Ship **pace presets** (Sunday drive / Commute / Rush) right away, and say clearly that slower pace is a valid way to play, not a cheat. | "multiple difficulty levels that changes the PACE" (MM review). "wind down, not wind up" (Traffix review). Many relaxing+stressful MM reviews |
| **4.5 Junkyard and Garage** | **Change: smaller and later** | Cut the Garage from 13 upgrades to **about 6** for M3: Crew Two, Smart signals I, Big tank, Token pocket, Taxi radio, Wide lens. Keep **Refund all**. Coins should never gate *fun*, only add flavor. Make the economy the last core system you build. | Onramp: "you're never sitting around waiting for money" ([link](https://www.reddit.com/r/indiegames/comments/1wfh5h5/_/pacbbdr/)). Traffic Architect money and no-refund complaints ([link](https://www.reddit.com/r/MiniMotorways/comments/1vmisgv/_/p4csha6/)) |
| **4.6 World tour** | **Keep, but loosen the gates** | Open **3 cities from the start**, one of them left-hand (London or Tokyo), so the real-cities and left-hand-traffic hooks show up in the first session. Stars unlock **postcards, paper editions and album pages**, not the right to play. All cities stay playable in Practice. | Traffix: "you can only play the current level... period." and "Basically it is unplayable for me now" ([review](https://steamcommunity.com/profiles/76561198142260748/recommended/1102580/)). Real-place (#5) and left-hand (#11) demand |
| **4.7 Album** | **Keep. Make it the sharing engine** | Every day-end postcard and album photo gets **"Save PNG"** (and later "copy link with seed"). Keep composition scoring simple (in frame, golden hour). Push rare-moment hints, since they make good clips. | TOEM at 99% positive. MM's GIF export. The H&Co dev: interest "should be decided within 5 seconds of looking at one screenshot" ([link](https://www.reddit.com/r/IndieDev/comments/1vy4mvl/_/p61fr08/)) |

**New features suggested by the research**

1. **Night print / dark palette toggle.** You already render night, and dark mode is Trafficity's #2 request. Cheap to do.
2. **"Works on your phone, iPad and Mac, free, right now"** should be a headline feature. That means touch QA on iPad/iPhone Safari and a sensible single-column layout. This is the #1 theme.
3. **Separate volume sliders (music / city / UI)** and windowed play. Traffix and MM reviewers complain about missing both.
4. **Rush-hour event days**, like a match crowd or a festival. Traffic Architect's demo ends on a stadium emptying onto your roads. You could do a *landmark event*, e.g. "Eiffel Tower fireworks at 20:30", which also feeds the album.
5. **An honest "How Fuji City was made" note**, including any AI-tool use, on the itch/Steam page and in Reddit posts. AI arguments took over the Traffic Architect threads, and r/tycoon requires disclosure.
6. **Not recommended now:** transit, road building, OSM import. They're popular asks, but they pull you into the crowded part of the market.

---

## 6. Positioning

**One-line pitch options**

- *"You can't stop the camera. You can only help the city before it scrolls away."*
- *"One day over Tokyo (or Paris, or Dublin): wave traffic through, race taxis to the landmarks, photograph the whale. The local paper will review you."*
- *"Not a road builder. A rail game where the city is the ride."*
- *"Mini Motorways' calm, a rail shooter's pace, and a newspaper that roasts you."* (Use comparisons carefully, because "is this just Mini Motorways?" is the reflex.)

Avoid "traffic simulator" and "city builder" as the lead words. That lane is full and it brings in engineering critics.

**Tags.** The tags competitors use are Simulation, Transportation, City Builder, Minimalist, Relaxing, Top-Down, Procedural Generation, Casual, Puzzle. For Fuji City on Steam/itch: **Casual, Relaxing, Arcade, Simulation, Transportation, Top-Down, Procedural Generation, Minimalist, Cozy, Short, Singleplayer, Browser/HTML5 (itch), Free to Play**, plus a photography-type tag *if* Steam's tag list has one (check it in Steamworks; I didn't verify the exact tag name). Skip City Builder.

**How to post on Reddit, based on what worked**

1. **Post a native video or GIF, not a YouTube link.** Trafficity's YouTube-link posts got 1–8 points, while its native clip with a meme title, "just one more lane should do it", got **202** ([post](https://www.reddit.com/r/CityBuilders/comments/1wovuag/)). r/IndieDev's bot says outright that GIFs and images do better than links.
2. **Lead with a "for people who…" pitch.** "I'm making a game for people who love fixing traffic in city builder games" got **961** points ([post](https://www.reddit.com/r/IndieGaming/comments/1vsov9w/)). Its body listed inspirations and *what it fixes in each one* ("mini motorways: but I don't like the time crunch"), and a commenter called that "might be the best pitch" ([link](https://www.reddit.com/r/indiegames/comments/1vpbx2z/_/p4guq98/)). Fuji City's version: *"for people who'd rather watch the city than build it, but still want something to do."*
3. **Show the payoff in the first two seconds:** a crash, the helicopter lifting it, then the newspaper headline. The trailer critique said: "have a late game teaser up front" ([link](https://www.reddit.com/r/DestroyMyGame/comments/1ry4a4q/_/obftrth/)).
4. **Include a playable link.** Fuji City can do what Traffic Architect did on CrazyGames: "try it now, free, in your browser." That answers the "wait for reviews" and "demo please" crowd, but expect casual players to bounce if the difficulty is harsh.
5. **Go to the right niche subs:** r/MiniMotorways and r/MiniMetro (Traffic Architect's posts there got 120 and 29), r/CityBuilders, r/WebGames, r/playmygame, r/cozygames for the album and Sandbox. Dev-process posts (r/IndieDev, r/threejs-style tech write-ups) did well for Traffic Architect. Read each sub's self-promo and AI-disclosure rules first.
6. **Reply to everyone and ship small fixes in public.** All three devs did, and the "Someone called out my lane markings, so I added them" post did well ([post](https://www.reddit.com/r/IndieDev/comments/1vvhwwk/)).
7. **Timing.** Traffic Architect launches Nov 3 and Trafficity Nov 16, so people in the genre will be searching then. Fuji City is free and different, so you can post around those dates as "something different while you wait," but don't frame it as a rival road builder. Think about press too: the H&Co dev says a few Reddit posts plus an Automaton pickup brought about 1.8k wishlists in 3 days, and Fuji City has Japanese appeal (Tokyo, Kyoto, the "Fuji" name).

---

## 7. Sources and coverage

**Reddit threads read in full (posts plus every archived comment)**: about 1,000 comments excluding bots.

- **Trafficity:** 7 threads, ~144 comments. [r/indiegames 1wfh5h5](https://www.reddit.com/r/indiegames/comments/1wfh5h5/) (the post you shared, archived 26 pts; several "Seen on Ad" comments suggest it ran as a promoted post), r/CityBuilders 1wovuag and 1wcwsdd, r/shittyskylines 1wd9516, r/IndieDev 1wfhsfo and 1wi3ffz, r/SoloDevelopment 1wdjuwt.
- **Traffic Architect:** 27 threads, ~410 comments. [r/CityBuilders 1x02b0q](https://www.reddit.com/r/CityBuilders/comments/1x02b0q/) (your link, posted today, mostly an AI argument), plus r/MiniMotorways (1vmisgv, 1wi22mm, 1ruinh8), r/pcgaming 1wcontu, r/indiegames 1vryi97, r/ClaudeCode (1vjvawt, 1skf838), r/openttd 1rvd26i, r/tycoon (1sg0waf, 1vi4wtj, 1ruho3y), r/DestroyMyGame 1ry4a4q, r/BaseBuildingGames 1vz2www, r/SoloDevelopment (1waxm51, 1wua159), r/CityBuilders (1wp8wo9, 1vh8asl, 1wdlzy6), r/SimCity (1wskrrf, 1vsrz9y), r/playmygame (1wtf3ld, 1ruj5tr), r/pcmasterrace 1w78tas, r/MiniMetro (1wq0tsm, 1rx86fj), r/transit 1vzz0u8.
- **Highways & Co.:** 8 threads, ~366 comments. r/IndieGaming (1vsov9w, 1w8us7g), r/indiegames (1vpbx2z, 1vsqmkz), r/IndieDev (1vsoim9, 1vy4mvl, 1vvhwwk), r/IndieGameWishlist 1wlz6jw.
- **Junxions:** 3 threads, ~70 comments. r/CitiesSkylines 1d8q4w8, r/Junxions 1qs3yfs and 1rdrwik. The "NDA AMA" turned out to be a joke by a community member, so I didn't use it as fact.
- **Signal-control comparables:** r/MiniMotorways 1vaca63 (RUSH), 1uzi7ov, 1q9m3f9, 1uy0kfb, and r/incremental_games m4mw1j.

**Steam:** store data, tags and review totals for 17 apps. Full review text for **Traffix (all 84)**, **Mini Motorways (1,500 newest English)** and **GRIDROAD (307 English)**.
**X:** two searches (game names). The useful items were the Next Indie and Onramp announcement metrics and Traffic Architect demo posts. Little real discussion turned up.

**Couldn't access, or not verified**

- Live reddit.com and old.reddit.com, including the `.json` endpoints, returned "blocked by network security" both from the box and from the fetch tool. I used the Arctic Shift archive instead, so very recent comments and live scores may be missing.
- I didn't see each subreddit's top posts beyond those listed. Archive full-text search kept timing out.
- Highways & Co. demo status: the dev promised one in August, Steam shows none. Price is from a press article quoting the dev.
- Freeways review text timed out (only the totals are used). SteamDB wishlist and follower data wasn't checked, so wishlist figures are the developers' own claims.
- The archive only had a stub for r/indiegames' rules and sidebar. Check each sub's self-promotion rules before posting.
