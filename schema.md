# data model

relational (Postgres / Supabase). phone number is the global player identity; per-player links are the auth mechanism (no passwords/accounts).

## players
global identity, shared across every room a person ever joins.

- id (pk)
- phone_number (unique, not null) — the identity key
- name (not null)
- photo_url (nullable)
- created_at

## rooms
- id (pk)
- code (unique, short, for the shareable join link)
- creator_player_id (fk -> players.id)
- game (text — single game for the whole bracket)
- player_count (int, nullable — fixed target size chosen at creation (2/4/8/16/32), or null for an "open" room where any number of players can join and the creator manually locks it whenever they're ready. Once locked, this is finalized to the actual participant count regardless of which mode was used, since round math needs a real number from then on. Fixed sizes no longer need to be a power of 2 for bracket generation to work — see bye handling below.)
- seeding_mode (enum: 'auto' | 'manual')
- status (enum: 'lobby' | 'locked' | 'complete' | 'canceled') — canceled only reachable from lobby
- created_at
- locked_at (nullable)
- completed_at (nullable)

## room_players
a player's participation in one specific room — this is what actually fills bracket slots. separate from `players` because seed position / per-room link are room-scoped, while identity (phone/name) is global.

- id (pk)
- room_id (fk -> rooms.id)
- player_id (fk -> players.id)
- seed_position (int, nullable until bracket generated)
- player_link_token (unique, random UUID — the sole "auth" for this player in this room, no secondary check; this is what site.com/room/{code}/player/{token} resolves to)
- push_subscription_id (fk -> push_subscriptions.id, nullable until they grant notification permission)
- joined_at

unique constraint: (room_id, player_id) — enforces "one phone number = one player per room"

## matches
- id (pk)
- room_id (fk -> rooms.id)
- round_number (int, 1 = first round)
- slot_in_round (int — position within the round, used to compute bracket advancement: winner of match N feeds into round+1 slot N/2)
- room_player_1_id (fk -> room_players.id, nullable until previous round resolves)
- room_player_2_id (fk -> room_players.id, nullable until previous round resolves)
- player_1_score (int, nullable)
- player_2_score (int, nullable)
- winner_room_player_id (fk -> room_players.id, nullable until confirmed)
- reported_by_room_player_id (fk -> room_players.id, nullable)
- reported_at (nullable)
- confirmed_at (nullable — null = pending confirmation, set = match resolved and bracket can advance)

a match is "resolved" when confirmed_at is set. advancement logic: on confirm, find the round+1 match where slot_in_round = floor(this.slot_in_round / 2) and set its room_player_1_id or room_player_2_id (based on even/odd slot) to winner_room_player_id.

byes (non-power-of-2 player counts): the bracket always has 2^ceil(log2(N)) round-1 slots. Players fill them in order; any shortfall becomes byes — round-1 matches with only one slot filled. Those are auto-resolved the moment the bracket is generated (winner_room_player_id = the lone player, confirmed_at = now) and immediately advanced into their round-2 slot via the same floor(slot/2) rule, with no reporting/confirming needed. See generateBracketSkeleton and resolveByeMatches in the app code.

## push_subscriptions
- id (pk)
- player_id (fk -> players.id) — tied to the global player, not per-room, since one device/PWA install serves all rooms that phone number joins
- endpoint (text, the browser push endpoint URL)
- p256dh_key (text)
- auth_key (text)
- created_at

## leaderboard / stats (derived, not stored)
no separate stats table for v1 — compute on read from `matches` + `room_players` + `rooms`:

- **win count per player**: count matches where winner_room_player_id resolves (via room_players) to that player_id
- **filter by game**: join through rooms.game
- **filter by time period**: filter on matches.confirmed_at
- **head-to-head**: given player A and player B, find all matches where {room_player_1, room_player_2} resolve to {A, B} via room_players, count wins each

worth revisiting as a materialized view or a denormalized `player_stats` table later if the leaderboard gets slow — not needed at this scale (friend-group volume).
