-- =============================================================
-- Migration: list templates
-- Tables: list_templates, list_template_items
-- RLS enabled on both tables.
-- =============================================================

create table list_templates (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table list_template_items (
  id               uuid primary key default gen_random_uuid(),
  template_id      uuid not null references list_templates(id) on delete cascade,
  name             text not null,
  normalized_name  text,
  category         text,
  quantity         numeric,
  unit             text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table list_templates      enable row level security;
alter table list_template_items enable row level security;

-- list_templates: household members can read and write

create policy "household members can select templates"
  on list_templates for select
  using (is_household_member(household_id));

create policy "household members can insert templates"
  on list_templates for insert
  with check (is_household_member(household_id));

create policy "household members can delete templates"
  on list_templates for delete
  using (is_household_member(household_id));

-- list_template_items: access is scoped through the parent template's household

create policy "household members can select template items"
  on list_template_items for select
  using (
    exists (
      select 1 from list_templates lt
      where lt.id = template_id
        and is_household_member(lt.household_id)
    )
  );

create policy "household members can insert template items"
  on list_template_items for insert
  with check (
    exists (
      select 1 from list_templates lt
      where lt.id = template_id
        and is_household_member(lt.household_id)
    )
  );

create policy "household members can delete template items"
  on list_template_items for delete
  using (
    exists (
      select 1 from list_templates lt
      where lt.id = template_id
        and is_household_member(lt.household_id)
    )
  );
