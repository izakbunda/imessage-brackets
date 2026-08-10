-- RLS strategy: this app has no Supabase Auth (no accounts, phone number + a
-- per-player link token is the identity model — see schema.md). Rather than
-- fight RLS into checking a token that isn't a Supabase JWT claim, reads are
-- public (brackets are meant to be publicly viewable per ideas.md) and all
-- writes go through Next.js server route handlers using the service role key,
-- which validate player_link_token in application code before writing.
-- The anon key therefore gets SELECT only, never INSERT/UPDATE/DELETE.

alter table players enable row level security;
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table matches enable row level security;
alter table push_subscriptions enable row level security;

create policy "players are publicly readable" on players
  for select using (true);

create policy "rooms are publicly readable" on rooms
  for select using (true);

create policy "room_players are publicly readable" on room_players
  for select using (true);

create policy "matches are publicly readable" on matches
  for select using (true);

-- push_subscriptions is the one exception: it holds device push endpoints,
-- not bracket data, and has no reason to be publicly readable.
-- no select policy -> no anon access at all; service role bypasses RLS.
