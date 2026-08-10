# imessage brackets

Bracket-style tournament coordinator for iMessage games (e.g. Game Pigeon). Website/PWA only — it can't send or receive the actual game, it manages rooms, brackets, notifications, and self-reported results.

Before making product decisions or non-trivial changes, read:
- [ideas.md](ideas.md) — product spec: flows, v1 scope, and every locked-in decision (seeding, reporting/confirming, notifications, leaderboard). Treat this as the source of truth for "should it work this way" questions.
- [schema.md](schema.md) — data model / table design, matches the migration in `supabase/migrations/0001_init.sql`.

## Stack

- Next.js (App Router, TypeScript, Tailwind), installable as a PWA
- Supabase: Postgres, realtime (live bracket/lobby updates), storage (player photos)
- Vercel for hosting
- Web Push (VAPID) for notifications — no SMS/Twilio. Requires the app to be added to the home screen to work on iOS (16.4+), which is why that's a hard-blocking step in the join flow, not optional.

## Conventions

- `next.config.ts` has `agentRules: false` — `next dev` would otherwise regenerate `CLAUDE.md`/`AGENTS.md` on every run and clobber this file. Do not remove that flag.
- Supabase client: `src/lib/supabase.ts`
- Service worker (push + notificationclick handlers): `public/service-worker.js`, registered client-side via `src/app/register-sw.tsx`
- No accounts/passwords: phone number is the global player identity (across rooms, for the leaderboard); a per-player random-token link (`room_players.player_link_token`) is the auth mechanism for reporting/confirming within a room.
- Notifications are sent server-side (DB trigger / edge function reacting to `matches` row changes), never client-triggered — see ideas.md section 4b for the exact trigger conditions and copy per notification type. Never include a player's phone number in notification title/body.
