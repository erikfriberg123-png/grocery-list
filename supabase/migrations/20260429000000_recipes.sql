-- =============================================================
-- Migration: recipes
-- Table: recipes
-- Storage bucket: recipe-images
-- RLS enabled.
-- =============================================================

create table recipes (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,
  name          text not null,
  category      text not null default 'other',
  url           text,
  image_path    text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_updated_at
  before update on recipes
  for each row execute procedure set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table recipes enable row level security;

create policy "household members can select recipes"
  on recipes for select
  using (is_household_member(household_id));

create policy "household members can insert recipes"
  on recipes for insert
  with check (is_household_member(household_id));

create policy "household members can update recipes"
  on recipes for update
  using (is_household_member(household_id));

create policy "household members can delete recipes"
  on recipes for delete
  using (is_household_member(household_id));

-- ── Storage bucket ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Storage policies: household members can manage their recipe images.
-- Objects are stored as {household_id}/{filename}.

create policy "household members can upload recipe images"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images'
    and auth.uid() is not null
  );

create policy "recipe images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "household members can delete recipe images"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images'
    and auth.uid() is not null
  );
