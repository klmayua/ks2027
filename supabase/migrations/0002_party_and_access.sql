-- Party structure, and the access model the whole platform hangs off.
--
-- The access rule in one sentence: you can see your own scope and everything beneath it. A ward
-- officer sees their ward; an LGA officer sees every ward in their LGA; the state executive sees
-- the state. This is enforced in RLS rather than in the application, so a mistake in a page
-- component cannot leak another ward's data.

create type structure_level as enum ('state', 'senatorial', 'lga', 'ward', 'polling_unit');
create type alignment       as enum ('aligned', 'passive', 'aggrieved', 'reconciled', 'unknown');

create table person (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  full_name     text not null,
  phone         text,
  home_ward_id  text references ward(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table party_position (
  id            text primary key,          -- 'ward:chairman'
  title         text not null,
  level         structure_level not null,
  rank          integer not null,
  load_bearing  boolean not null default false
);

-- An appointment binds a person to a position at a scope. Exactly one scope column is non-null,
-- matching the position's level.
create table appointment (
  id             uuid primary key default gen_random_uuid(),
  person_id      uuid not null references person(id) on delete cascade,
  position_id    text not null references party_position(id) on delete restrict,
  level          structure_level not null,
  district       senatorial_district,
  lga_code       text references lga(code) on delete restrict,
  ward_id        text references ward(id) on delete restrict,
  polling_unit_id text references polling_unit(id) on delete restrict,
  alignment      alignment not null default 'unknown',
  assessment_note text,
  assessed_at    timestamptz,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  constraint appointment_scope_matches_level check (
    case level
      when 'state'        then district is null and lga_code is null and ward_id is null and polling_unit_id is null
      when 'senatorial'   then district is not null and lga_code is null and ward_id is null and polling_unit_id is null
      when 'lga'          then lga_code is not null and ward_id is null and polling_unit_id is null
      when 'ward'         then ward_id is not null and polling_unit_id is null
      when 'polling_unit' then polling_unit_id is not null
    end
  )
);

create index appointment_person_idx on appointment(person_id);
create index appointment_ward_idx   on appointment(ward_id) where ended_at is null;
create index appointment_lga_idx    on appointment(lga_code) where ended_at is null;

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

-- The current user's person row.
create or replace function current_person_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from person where auth_user_id = auth.uid() limit 1;
$$;

-- Highest level the current user holds an active appointment at.
create or replace function current_max_level()
returns structure_level
language sql stable security definer set search_path = public
as $$
  select a.level
  from appointment a
  join person p on p.id = a.person_id
  where p.auth_user_id = auth.uid()
    and a.ended_at is null
  order by array_position(
    array['state','senatorial','lga','ward','polling_unit']::structure_level[], a.level
  )
  limit 1;
$$;

-- Can the current user see this ward? True when they hold an active appointment at the state
-- level, at the ward's senatorial district, at its LGA, or at the ward itself.
create or replace function can_see_ward(target_ward_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from appointment a
    join person p on p.id = a.person_id
    left join ward w on w.id = target_ward_id
    left join lga  l on l.code = w.lga_code
    where p.auth_user_id = auth.uid()
      and a.ended_at is null
      and (
            a.level = 'state'
        or (a.level = 'senatorial'   and a.district = l.district)
        or (a.level = 'lga'          and a.lga_code = w.lga_code)
        or (a.level = 'ward'         and a.ward_id  = target_ward_id)
        or (a.level = 'polling_unit' and a.polling_unit_id in (
              select id from polling_unit where ward_id = target_ward_id))
      )
  );
$$;

-- State-level officers only. Used for anything covering the whole structure.
create or replace function is_state_officer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from appointment a
    join person p on p.id = a.person_id
    where p.auth_user_id = auth.uid()
      and a.ended_at is null
      and a.level in ('state', 'senatorial')
  );
$$;

alter table person         enable row level security;
alter table party_position enable row level security;
alter table appointment    enable row level security;

create policy position_read on party_position for select using (auth.uid() is not null);

-- A person can always read themselves; officers can read people within their scope.
create policy person_read on person for select using (
  auth_user_id = auth.uid()
  or is_state_officer()
  or (home_ward_id is not null and can_see_ward(home_ward_id))
);

create policy person_self_update on person for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy appointment_read on appointment for select using (
  is_state_officer()
  or person_id = current_person_id()
  or (ward_id is not null and can_see_ward(ward_id))
);

-- Alignment assessments are sensitive: they record what the war room thinks of a named party
-- officer. Only state-level officers may write them.
create policy appointment_write on appointment for all
  using (is_state_officer())
  with check (is_state_officer());
