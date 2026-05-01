-- Allow household members to read each other's profiles
create policy "profiles: household members read"
  on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from household_members hm1
      join household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
        and hm2.user_id = profiles.id
    )
  );
