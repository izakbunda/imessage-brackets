-- room_players.player_link_token is the sole "auth" credential for a player
-- (see schema.md) and must never be exposed through the public REST API via
-- the anon key, even though bracket/roster data itself is meant to be public
-- (per ideas.md's "publicly viewable bracket" decision).
--
-- The row-level "using (true)" policy from 0002 only controls which ROWS are
-- visible, not which COLUMNS -- anon currently has full-row SELECT, so
-- player_link_token is readable by anyone who queries the table directly
-- (the anon key is public, embedded in the client bundle). Restrict columns
-- explicitly instead.
revoke select on room_players from anon, authenticated;
grant select (id, room_id, player_id, seed_position, joined_at) on room_players to anon, authenticated;
