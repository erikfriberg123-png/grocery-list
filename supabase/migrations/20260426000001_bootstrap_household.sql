-- bootstrap_user_household: idempotent function that creates a profile +
-- household + household_member for any authed user who was created before
-- the handle_new_user trigger was deployed.
create or replace function bootstrap_user_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  -- Return early if the user already has a household
  select household_id into v_household_id
  from household_members
  where user_id = auth.uid()
  limit 1;

  if v_household_id is not null then
    return v_household_id;
  end if;

  -- Ensure profile row exists
  insert into profiles (id, email)
  select auth.uid(), u.email
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do nothing;

  -- Create a default household
  insert into households (name)
  values ('Mitt hushåll')
  returning id into v_household_id;

  -- Add the user as owner
  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'owner');

  return v_household_id;
end;
$$;

-- Grant execute to authenticated users only
grant execute on function bootstrap_user_household() to authenticated;
