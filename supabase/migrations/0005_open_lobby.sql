-- Open lobby mode: player_count becomes optional. NULL means "open" —
-- any number of players can join until the creator manually locks the
-- room, rather than committing to a fixed target at creation time.
alter table rooms alter column player_count drop not null;
