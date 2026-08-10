create extension if not exists "pgcrypto";

create table players (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  name text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create type room_status as enum ('lobby', 'locked', 'complete', 'canceled');
create type seeding_mode as enum ('auto', 'manual');

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  creator_player_id uuid not null references players(id),
  game text not null,
  player_count int not null,
  seeding_mode seeding_mode not null,
  status room_status not null default 'lobby',
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz
);

create table room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  player_id uuid not null references players(id),
  seed_position int,
  player_link_token uuid not null default gen_random_uuid(),
  joined_at timestamptz not null default now(),
  unique (room_id, player_id),
  unique (player_link_token)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  round_number int not null,
  slot_in_round int not null,
  room_player_1_id uuid references room_players(id),
  room_player_2_id uuid references room_players(id),
  player_1_score int,
  player_2_score int,
  winner_room_player_id uuid references room_players(id),
  reported_by_room_player_id uuid references room_players(id),
  reported_at timestamptz,
  confirmed_at timestamptz
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  unique (player_id, endpoint)
);
