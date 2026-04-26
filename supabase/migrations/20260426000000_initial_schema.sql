-- =============================================================
-- Migration: initial schema
-- Tables: profiles, households, household_members, shopping_lists,
--         shopping_items, categories, category_sort_orders,
--         share_links, ai_import_jobs
-- RLS enabled on every table in this file.
-- Order: tables → helper function → RLS + policies → seed → trigger
-- =============================================================

-- =============================================================
-- Tables
-- =============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table household_members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'member'
                  check (role in ('owner', 'member')),
  created_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

create table shopping_lists (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  archived_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table shopping_items (
  id               uuid primary key default gen_random_uuid(),
  list_id          uuid not null references shopping_lists(id) on delete cascade,
  name             text not null,
  normalized_name  text,
  category         text,
  quantity         numeric,
  unit             text,
  note             text,
  status           text not null default 'active'
                     check (status in ('active', 'checked')),
  sort_order       integer not null default 0,
  added_by         uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table categories (
  key         text primary key,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table category_sort_orders (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  category_key  text not null references categories(key) on delete cascade,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (household_id, category_key)
);

create table share_links (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references shopping_lists(id) on delete cascade,
  token_hash  text not null unique,
  token_salt  text not null,
  permission  text not null default 'view'
                check (permission in ('view', 'add_only', 'edit')),
  created_by  uuid references auth.users(id) on delete set null,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table ai_import_jobs (
  id            uuid primary key default gen_random_uuid(),
  list_id       uuid not null references shopping_lists(id) on delete cascade,
  type          text not null check (type in ('image', 'recipe')),
  status        text not null default 'pending'
                  check (status in ('pending', 'processing', 'done', 'failed')),
  source_url    text,
  storage_path  text,
  result        jsonb,
  error         text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================
-- Helper function (must come after household_members table)
-- =============================================================
create or replace function is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hid
      and user_id = auth.uid()
  );
$$;

-- =============================================================
-- Enable RLS
-- =============================================================
alter table profiles              enable row level security;
alter table households            enable row level security;
alter table household_members     enable row level security;
alter table shopping_lists        enable row level security;
alter table shopping_items        enable row level security;
alter table categories            enable row level security;
alter table category_sort_orders  enable row level security;
alter table share_links           enable row level security;
alter table ai_import_jobs        enable row level security;

-- =============================================================
-- RLS policies: profiles
-- =============================================================
create policy "profiles: owner read"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: owner update"
  on profiles for update
  using (id = auth.uid());

-- =============================================================
-- RLS policies: households
-- =============================================================
create policy "households: members read"
  on households for select
  using (is_household_member(id));

create policy "households: members update"
  on households for update
  using (is_household_member(id));

-- =============================================================
-- RLS policies: household_members
-- =============================================================
create policy "household_members: member read"
  on household_members for select
  using (is_household_member(household_id));

create policy "household_members: owner insert"
  on household_members for insert
  with check (
    exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
    )
  );

create policy "household_members: owner delete"
  on household_members for delete
  using (
    exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
    )
  );

-- =============================================================
-- RLS policies: shopping_lists
-- =============================================================
create policy "shopping_lists: members read"
  on shopping_lists for select
  using (is_household_member(household_id));

create policy "shopping_lists: members insert"
  on shopping_lists for insert
  with check (is_household_member(household_id));

create policy "shopping_lists: members update"
  on shopping_lists for update
  using (is_household_member(household_id));

create policy "shopping_lists: members delete"
  on shopping_lists for delete
  using (is_household_member(household_id));

-- =============================================================
-- RLS policies: shopping_items
-- =============================================================
create policy "shopping_items: members read"
  on shopping_items for select
  using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

create policy "shopping_items: members insert"
  on shopping_items for insert
  with check (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

create policy "shopping_items: members update"
  on shopping_items for update
  using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

create policy "shopping_items: members delete"
  on shopping_items for delete
  using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

-- =============================================================
-- RLS policies: categories (read-only for all authenticated users)
-- =============================================================
create policy "categories: authenticated read"
  on categories for select
  to authenticated
  using (true);

-- =============================================================
-- RLS policies: category_sort_orders
-- =============================================================
create policy "category_sort_orders: members read"
  on category_sort_orders for select
  using (is_household_member(household_id));

create policy "category_sort_orders: members insert"
  on category_sort_orders for insert
  with check (is_household_member(household_id));

create policy "category_sort_orders: members update"
  on category_sort_orders for update
  using (is_household_member(household_id));

create policy "category_sort_orders: members delete"
  on category_sort_orders for delete
  using (is_household_member(household_id));

-- =============================================================
-- RLS policies: share_links
-- =============================================================
create policy "share_links: members read"
  on share_links for select
  using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

create policy "share_links: members insert"
  on share_links for insert
  with check (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

create policy "share_links: members update"
  on share_links for update
  using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

-- =============================================================
-- RLS policies: ai_import_jobs
-- =============================================================
create policy "ai_import_jobs: members read"
  on ai_import_jobs for select
  using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

create policy "ai_import_jobs: members insert"
  on ai_import_jobs for insert
  with check (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id
        and is_household_member(sl.household_id)
    )
  );

-- =============================================================
-- Seed: system categories
-- =============================================================
insert into categories (key, sort_order) values
  ('produce',   1),
  ('dairy',     2),
  ('meat',      3),
  ('seafood',   4),
  ('frozen',    5),
  ('pantry',    6),
  ('bakery',    7),
  ('drinks',    8),
  ('snacks',    9),
  ('hygiene',  10),
  ('cleaning', 11),
  ('pets',     12),
  ('baby',     13),
  ('pharmacy', 14),
  ('other',    15);

-- =============================================================
-- Trigger: auto-create profile + household on signup
-- =============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into profiles (id, email)
  values (new.id, new.email);

  insert into households (name)
  values (split_part(new.email, '@', 1) || '''s list')
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
