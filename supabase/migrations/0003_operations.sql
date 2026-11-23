-- Reconciliation, directives, election day and commitments.
--
-- Two things are load-bearing here and are enforced in the database rather than the application:
--
--   1. A result submission requires an accreditation reference. Tier two cannot become tier one by
--      a client-side mistake — the check constraint refuses the row.
--   2. Nothing simulated is publishable. Every table that feeds a public surface carries a
--      `published` flag that only a state officer can set, and the public read policies filter on
--      it.

-- ---------------------------------------------------------------------------
-- Reconciliation
-- ---------------------------------------------------------------------------

create type reconciliation_stage as enum (
  'identified','assigned','engaged','ask_tabled','agreed','reconciled','refused'
);
create type stakeholder_kind as enum (
  'governorship_aspirant','legislator_serving','legislator_former','party_officer',
  'traditional','financier','union_association','other'
);
create type ask_category as enum (
  'position','recognition','process_review','financial','constituency_commitment','none_stated'
);

create table stakeholder (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  kind          stakeholder_kind not null,
  bloc          text,
  district      senatorial_district not null,
  lga_code      text not null references lga(code) on delete restrict,
  stage         reconciliation_stage not null default 'identified',
  ask           ask_category not null default 'none_stated',
  ask_detail    text,
  handler_id    uuid references person(id) on delete set null,
  refusal_note  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Which ward structures a stakeholder is assessed to carry. This is the value at stake in
-- reconciling them, so it is a relation rather than a text field.
create table stakeholder_ward (
  stakeholder_id uuid not null references stakeholder(id) on delete cascade,
  ward_id        text not null references ward(id) on delete restrict,
  primary key (stakeholder_id, ward_id)
);

create table stakeholder_contact (
  id             uuid primary key default gen_random_uuid(),
  stakeholder_id uuid not null references stakeholder(id) on delete cascade,
  handler_id     uuid references person(id) on delete set null,
  channel        text not null check (channel in ('in_person','phone','emissary','written')),
  note           text not null,
  moved_to_stage reconciliation_stage,
  occurred_at    timestamptz not null default now()
);

create index stakeholder_contact_idx on stakeholder_contact(stakeholder_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Directives
-- ---------------------------------------------------------------------------

create type directive_priority as enum ('routine','priority','urgent');

create table directive (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  title          text not null,
  body           text not null,
  issued_by      uuid references person(id) on delete set null,
  issued_by_role text not null,
  scope_kind     text not null check (scope_kind in ('state','district','lga','ward','wing')),
  scope_values   text[] not null default '{}',
  priority       directive_priority not null default 'routine',
  requires_ack   boolean not null default true,
  ack_deadline   timestamptz,
  task_instruction text,
  task_requires_proof boolean not null default false,
  issued_at      timestamptz not null default now()
);

create table directive_ack (
  directive_id  uuid not null references directive(id) on delete cascade,
  ward_id       text not null references ward(id) on delete restrict,
  person_id     uuid not null references person(id) on delete cascade,
  role_title    text not null,
  acked_at      timestamptz not null default now(),
  primary key (directive_id, ward_id)
);

create table directive_completion (
  id            uuid primary key default gen_random_uuid(),
  directive_id  uuid not null references directive(id) on delete cascade,
  ward_id       text not null references ward(id) on delete restrict,
  person_id     uuid not null references person(id) on delete cascade,
  caption       text,
  -- Geotagged proof. Captured client-side and preserved verbatim through a late sync.
  lat           double precision,
  lng           double precision,
  accuracy_m    integer,
  captured_at   timestamptz,
  storage_path  text,
  submitted_at  timestamptz not null default now(),
  synced_late   boolean not null default false,
  constraint completion_proof_is_complete check (
    (lat is null and lng is null and captured_at is null and storage_path is null)
    or (lat is not null and lng is not null and captured_at is not null and storage_path is not null)
  )
);

-- ---------------------------------------------------------------------------
-- Election day
-- ---------------------------------------------------------------------------

create type agent_status as enum (
  'nominated','accredited','deployed','checked_in','unreachable','stood_down'
);

create table polling_agent (
  id                 uuid primary key default gen_random_uuid(),
  person_id          uuid not null references person(id) on delete cascade,
  polling_unit_id    text not null references polling_unit(id) on delete restrict,
  ward_id            text not null references ward(id) on delete restrict,
  status             agent_status not null default 'nominated',
  accreditation_ref  text unique,
  checked_in_at      timestamptz,
  unique (polling_unit_id, person_id)
);

create table result_submission (
  id                uuid primary key default gen_random_uuid(),
  polling_unit_id   text not null references polling_unit(id) on delete restrict,
  ward_id           text not null references ward(id) on delete restrict,
  agent_id          uuid not null references polling_agent(id) on delete restrict,
  -- Accreditation is copied in at insert so the constraint below can enforce tier one without a
  -- subquery, and so the record stays valid if the agent row later changes.
  accreditation_ref text not null,
  votes             jsonb not null,
  registered_voters integer not null check (registered_voters >= 0),
  accredited_voters integer not null check (accredited_voters >= 0),
  rejected_ballots  integer not null check (rejected_ballots >= 0),
  storage_path      text not null,
  lat               double precision not null,
  lng               double precision not null,
  accuracy_m        integer not null,
  captured_at       timestamptz not null,
  submitted_at      timestamptz not null default now(),
  synced_late       boolean not null default false,
  constraint accredited_not_above_registered check (accredited_voters <= registered_voters),
  constraint rejected_not_above_accredited   check (rejected_ballots <= accredited_voters),
  -- Tier one requires accreditation. A blank reference cannot enter the tally.
  constraint result_requires_accreditation   check (length(trim(accreditation_ref)) > 0)
);

-- A polling unit may legitimately receive a second, independent submission; disagreements are
-- published rather than resolved silently, so this is not a unique constraint.
create index result_pu_idx on result_submission(polling_unit_id);

create table citizen_report (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null,
  ward_id         text not null references ward(id) on delete restrict,
  polling_unit_id text references polling_unit(id) on delete restrict,
  note            text not null,
  corroborations  integer not null default 1 check (corroborations >= 1),
  submitted_at    timestamptz not null default now()
);

create type incident_status as enum ('open','acknowledged','actioned','resolved','unfounded');

create table incident (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,
  severity        text not null check (severity in ('low','medium','high','critical')),
  tier            text not null check (tier in ('agent','citizen')),
  ward_id         text not null references ward(id) on delete restrict,
  polling_unit_id text references polling_unit(id) on delete restrict,
  reported_by     uuid references person(id) on delete set null,
  description     text not null,
  desk            text not null check (desk in ('legal','security_liaison','media','operations')),
  status          incident_status not null default 'open',
  reported_at     timestamptz not null default now()
);

create table incident_log (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incident(id) on delete cascade,
  by_desk     text not null,
  note        text not null,
  status      incident_status not null,
  occurred_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Commitments
-- ---------------------------------------------------------------------------

create type commitment_phase  as enum ('campaign','government');
create type commitment_status as enum (
  'proposed','committed','not_started','in_progress','delivered','delayed','revised','abandoned'
);

create table commitment (
  -- Permanent identifier, e.g. 'KW-EDU-014'. Never reissued, never reused, survives the
  -- transition from campaign to government. This is the mechanism the platform exists for.
  id                 text primary key check (id ~ '^KW-[A-Z]{3}-[0-9]{3}$'),
  title              text not null,
  category           text not null,
  rationale          text not null,
  estimated_cost_ngn bigint not null check (estimated_cost_ngn >= 0),
  target_year        integer not null,
  phase              commitment_phase not null default 'campaign',
  status             commitment_status not null default 'proposed',
  revision_note      text,
  published          boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table commitment_ward (
  commitment_id text not null references commitment(id) on delete cascade,
  ward_id       text not null references ward(id) on delete restrict,
  primary key (commitment_id, ward_id)
);

create table commitment_milestone (
  id            uuid primary key default gen_random_uuid(),
  commitment_id text not null references commitment(id) on delete cascade,
  label         text not null,
  due_by        date not null,
  completed_at  timestamptz,
  proof_caption text,
  proof_lat     double precision,
  proof_lng     double precision,
  proof_path    text,
  proof_captured_at timestamptz
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table stakeholder          enable row level security;
alter table stakeholder_ward     enable row level security;
alter table stakeholder_contact  enable row level security;
alter table directive            enable row level security;
alter table directive_ack        enable row level security;
alter table directive_completion enable row level security;
alter table polling_agent        enable row level security;
alter table result_submission    enable row level security;
alter table citizen_report       enable row level security;
alter table incident             enable row level security;
alter table incident_log         enable row level security;
alter table commitment           enable row level security;
alter table commitment_ward      enable row level security;
alter table commitment_milestone enable row level security;

-- Reconciliation is the most sensitive data in the system: it records named people's grievances
-- and what they asked for. State officers only, never ward level.
create policy stakeholder_state_only on stakeholder         for all using (is_state_officer()) with check (is_state_officer());
create policy stakeholder_ward_state on stakeholder_ward    for all using (is_state_officer()) with check (is_state_officer());
create policy stakeholder_contact_state on stakeholder_contact for all using (is_state_officer()) with check (is_state_officer());

-- Directives are readable by anyone signed in; acknowledgement is scoped to your own wards.
create policy directive_read on directive for select using (auth.uid() is not null);
create policy directive_write on directive for all using (is_state_officer()) with check (is_state_officer());

create policy ack_read on directive_ack for select using (is_state_officer() or can_see_ward(ward_id));
create policy ack_write on directive_ack for insert with check (
  can_see_ward(ward_id) and person_id = current_person_id()
);

create policy completion_read on directive_completion for select using (
  is_state_officer() or can_see_ward(ward_id)
);
create policy completion_write on directive_completion for insert with check (
  can_see_ward(ward_id) and person_id = current_person_id()
);

create policy agent_read on polling_agent for select using (is_state_officer() or can_see_ward(ward_id));
create policy agent_write on polling_agent for all using (is_state_officer()) with check (is_state_officer());

-- Results are readable within scope, and writable only by the accredited agent assigned to that
-- polling unit.
create policy result_read on result_submission for select using (
  is_state_officer() or can_see_ward(ward_id)
);
create policy result_write on result_submission for insert with check (
  exists (
    select 1 from polling_agent pa
    join person p on p.id = pa.person_id
    where pa.id = agent_id
      and p.auth_user_id = auth.uid()
      and pa.polling_unit_id = result_submission.polling_unit_id
      and pa.accreditation_ref is not null
  )
);

create policy citizen_report_read on citizen_report for select using (auth.uid() is not null);
create policy citizen_report_write on citizen_report for insert with check (auth.uid() is not null);

create policy incident_read on incident for select using (is_state_officer() or can_see_ward(ward_id));
create policy incident_write on incident for insert with check (auth.uid() is not null);
create policy incident_update on incident for update using (is_state_officer()) with check (is_state_officer());
create policy incident_log_read on incident_log for select using (
  exists (select 1 from incident i where i.id = incident_id and (is_state_officer() or can_see_ward(i.ward_id)))
);

-- Commitments are the public surface. Anyone may read a published commitment, including
-- unauthenticated visitors to the ledger; only state officers may write or publish.
create policy commitment_public_read on commitment for select using (published or is_state_officer());
create policy commitment_write on commitment for all using (is_state_officer()) with check (is_state_officer());
create policy commitment_ward_read on commitment_ward for select using (
  exists (select 1 from commitment c where c.id = commitment_id and (c.published or is_state_officer()))
);
create policy milestone_read on commitment_milestone for select using (
  exists (select 1 from commitment c where c.id = commitment_id and (c.published or is_state_officer()))
);
create policy milestone_write on commitment_milestone for all using (is_state_officer()) with check (is_state_officer());
