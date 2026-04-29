-- Household invite links — replaces the per-list share_links for guest access.
-- Anyone with the plaintext token can accept the invite (once logged in) and
-- become a full household member. Only the hash is stored here.

create table household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  token_hash   text not null unique,
  created_by   uuid references auth.users(id) on delete set null,
  expires_at   timestamptz,
  max_uses     int,          -- null = unlimited
  use_count    int not null default 0,
  created_at   timestamptz not null default now()
);

alter table household_invites enable row level security;

-- Members of the household can view and create invites for their household
create policy "invites: members can manage"
  on household_invites for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  )
  with check (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );
