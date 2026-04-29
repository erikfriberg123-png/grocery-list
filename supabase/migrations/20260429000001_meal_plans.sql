create table if not exists meal_plans (
  id           uuid        primary key default gen_random_uuid(),
  household_id uuid        not null references households(id) on delete cascade,
  week_start   date        not null,
  day          smallint    not null check (day between 0 and 6),
  recipe_id    uuid        references recipes(id) on delete set null,
  meal_name    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (household_id, week_start, day)
);

alter table meal_plans enable row level security;

create policy "household members can manage meal plans"
  on meal_plans for all
  using  (is_household_member(household_id))
  with check (is_household_member(household_id));
