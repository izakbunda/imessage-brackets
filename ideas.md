imessage brackets

- goal: allow users to have a bracket-style competition for imessage games (e.g. Game Pigeon). The app is a coordinator, not a game engine — it can't send/receive the actual game (no public iMessage API), so it manages rooms, brackets, notifications, and results.

- design direction: iMessage-inspired visual style (chat-bubble elements, iOS-like UI/typography, blue/green accent language) rather than a generic neutral app look. See "visual design (Step 7)" section below for the full spec.

- flows:
    1. create "room"
        - create a room
        - choose one imessage game for the whole bracket (creator provides list of games available for now)
        - choose number of players (must be power of 2: 2/4/8/16/32, capped at 32 for v1)
        - choose seeding mode: automatic (random) or manual (creator sets it themselves) — decided at creation time
        - creator of room will immediately be the first player
        - room gets a short shareable code/link — code is human-friendly words (e.g. "swift-tiger-42" style), not raw alphanumeric
        - lobby roster (who's joined so far) updates live for the creator via realtime, no manual refresh needed

    2. join "room"
        - open join — anyone with the room code/link can join, up to the player cap, no creator approval needed
        - add self to pool of players
        - provide phone number + name + optional photo (uploaded from device, stored in cloud storage)
        - phone number is unique per room — same number can't occupy two player slots
        - phone number is also the player's identity ACROSS the whole app (not just within one room) — same number joining different rooms/brackets is recognized as the same player, so stats accumulate under them (see leaderboard/stats below). still no accounts/passwords — the per-player link is what authenticates actions, phone number is just the "who is this" key
        - required: add app to home screen (PWA) before/while joining — this is how notifications get delivered, not optional, hard blocked if skipped
        - name/photo are locked in once joined — no editing after the fact in v1

    2b. cancel room
        - creator can cancel/delete a room only while it's still in lobby (pre-lock) status — e.g. made it by mistake
        - once locked, no canceling — matches the "keep history" decision

    3. lock room / generate bracket
        - creator locks the room once player cap is reached (can't lock early — must be full)
        - if automatic seeding: locking immediately generates the bracket and goes live
        - if manual seeding: locking opens a seeding screen for the creator to arrange matchups by hand, then they confirm to generate and go live
        - single elimination only — no losers bracket, no 3rd place / consolation match, bracket ends at the final
        - room state: lobby -> locked (=in-progress) -> complete
        - bracket is publicly viewable via the room link, even by non-players (read-only, no login needed), and updates in real-time as matches resolve (e.g. via Supabase realtime) rather than requiring manual refresh

    4. match start (per matchup)
        - both players notified via web push (PWA installed to home screen) with opponent's name + number
        - "your match vs [name] is live — text them to play [game]"
        - later rounds: push can also include current bracket stats/standing

    4b. push notification triggers + content (full list for v1)
        - sent server-side (DB trigger / edge function on match row changes) — not dependent on any client being connected, since the point of push is offline delivery
        - opponent's phone number is NEVER included in notification body/lock screen — only visible after opening the app, to avoid exposing it anywhere the notification is visible on a locked phone

        a. match start (fires when both slots in a match are filled)
            - title: "Your match is live"
            - body: "[opponent name] — [game] — Round [N]"
            - tap opens: the match page (shows opponent name/photo/number there)

        b. opponent reported, awaiting your confirmation (fires when the OTHER player reports — only sent to the non-reporter)
            - title: "[opponent name] reported a result"
            - body: "They say they won [score if provided] — confirm?"
            - tap opens: match page with confirm action

        c. match resolved (fires to both players once confirmed)
            - if you won — title: "You're moving on!" / body: "You beat [opponent] — next round coming up"
            - if you lost — title: "Match over" / body: "[opponent] won — you're out of the bracket"
            - tap opens: bracket view for the room

        d. tournament complete (fires to everyone in the room once the final match confirms)
            - if you're the champion — title: "🏆 You won the bracket!" / body: "[game] — [room code]"
            - everyone else — title: "Tournament complete" / body: "[winner name] won the [game] bracket"
            - tap opens: final bracket view

    5. reporting a result
        - only the two players in that specific match can report/confirm (via their per-player link)
        - whoever reports first reports the winner (and can optionally include scores)
        - the other player just confirms ("yes, [player a] won") — no competing claims, no dispute flow needed
        - on confirmation, bracket auto-advances the winner to the next round
        - no timeout/auto-forfeit for v1 — match just sits open until someone reports and the other confirms, however long that takes

    6. bracket completion
        - final match confirmed -> room marked complete, winner displayed
        - rooms are kept, not disposable — history stays viewable after completion (bragging rights / future stats)

    7. leaderboard / stats (cross-room)
        - one global leaderboard (not scoped to friend groups), ranked by win count
        - filterable by game and by time period (this month / this year / all-time)
        - head-to-head lookup: type in another player's name or phone number to see your record against that specific person (win % against them specifically), computed on demand rather than pre-aggregated
        - players tracked by phone number + name, aggregated across every room/bracket they've ever played in

- v1 scope (explicit):
    - no native iOS/iMessage app — website only, installable as a PWA
    - one game per whole bracket, not per-match
    - no auto-detection of game results — self-report (with optional score) + confirm only, no dispute/conflict handling needed
    - no accounts — name + phone number + per-player link only; no phone number verification (trust the input); one phone number = one player per room
    - no ghosting/timeout handling — matches stay open indefinitely until resolved
    - room requires power-of-2 player counts (2/4/8/16...) — no bye logic, can't lock until full
    - notifications: web push only (no SMS/Twilio) — requires "add to home screen" (PWA), which is a required, hard-blocking step to join a room
        - iOS 16.4+ supports push only via home-screen-installed PWAs, which is why this is a hard requirement rather than best-effort
        - notifications used for: match start (opponent info), maybe result confirmations, maybe stats nudges in later rounds
    - game list is a fixed, hardcoded list for v1 (no admin/DB-editable list yet) — you'll provide the initial games
    - single elimination only, no losers bracket, no 3rd place match
    - seeding: creator picks automatic (random) or manual per room at creation time; no other seeding algorithms in v1
    - open join via code/link, no approval gate; bracket is publicly viewable by anyone with the link
    - rooms/history persist after completion (no auto-expiry/cleanup in v1)
    - photo upload optional, stored in cloud storage (e.g. Supabase storage)
    - phone number doubles as a persistent cross-room player identity, powering a global leaderboard/stats page — this is new scope beyond a single bracket and needs its own data model (player profile keyed by phone number, aggregated stats), not just per-room match records

- visual design (Step 7):
    - overall style: skeuomorphic/tactile — raised buttons with press-down spring animations, layered shadows, subtle gradients suggesting physical material, inset/grooved form fields. Full app character, not just accents — tab bar, buttons, cards, forms, leaderboard all get the treatment.
    - color: iOS-native blue (~#0A84FF) as primary accent, green (~#34C759) as secondary for confirmed/success states — mirrors iMessage's own blue/green bubble split.
    - bracket match cards: stay rectangular (not literal chat-bubble shapes) but get depth — shadow, subtle gradient, slight 3D tilt on tap. Color-coded by viewer: on your own player page, your side renders in the blue accent, opponent stays neutral — reinforces "which one is me." Public spectator view (no "you") stays neutral for everyone.
    - typography/shape: lean iOS-native — system-ui/SF Pro font stack (renders as actual San Francisco on iPhone, no font loading needed) with generous corner radius throughout, replacing the current Geist font.
    - background: subtle depth/gradient behind cards (like iOS Settings' grouped background), not flat white/dark — makes raised elements actually read as raised.
    - tab bar: icon + label per tab (Start/Join/Stats), raised/glossy bar, active tab gets a pressed-in glow.
    - motion: subtle micro-interactions via Framer Motion — buttons press/spring on tap, bracket cards tilt slightly on interaction, bottom sheet (report/confirm) slides up with spring physics rather than appearing instantly. Respects `prefers-reduced-motion` — skip WebGL scene and springs in favor of instant/simple transitions when that OS setting is on.
    - haptics: navigator.vibrate() on key taps (report, confirm, win) where supported. No sound effects for v1 (avoids unmuted-phone-in-public awkwardness).
    - celebration moments (the one WebGL spot, via react-three-fiber + drei, isolated so it doesn't weigh down other pages):
        - per-match win: a small celebration (e.g. confetti burst) plays whenever you win any match, not just the final — keeps momentum feeling good round to round.
        - per-match loss/elimination: a smaller, muted counterpart — a wilting/deflating trophy (mirrors the winner's rising trophy) — plays for every elimination, any round, not just the final.
        - tournament complete: champion gets the full moment — a 3D trophy (built from primitives, no asset pipeline) rising with a physics-based confetti burst. The runner-up (final loser specifically) gets the wilting-trophy counterpart at full scale to match. Everyone else just sees the plain "[winner] won the [game] bracket" text screen (they already got their elimination moment earlier in the bracket).
    - also fixes: the dark-mode contrast bug noted during Step 4 verification (light text on white cards) — same styling pass, not worth a separate fix.
    - new dependencies: framer-motion (spring/press micro-interactions), three + @react-three/fiber + @react-three/drei (celebration scenes only).

- tech stack: Next.js + Supabase (Postgres, realtime, storage) + Vercel — same pattern as other projects (portfolio, RAG chatbot)

- data model: see schema.md

- open questions:
    - none currently
