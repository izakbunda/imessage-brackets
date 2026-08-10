-- Bucket for optional player photos uploaded during join. Public read (photos
-- appear in the publicly viewable bracket per ideas.md); writes only via the
-- service role key from server actions, same pattern as the DB tables.
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "player photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'player-photos');
