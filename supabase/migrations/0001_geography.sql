-- Electoral geography: state → senatorial district → LGA → ward → polling unit.
--
-- Every row keeps its INEC code so a newer directory can be reconciled in without re-keying
-- anything downstream. Geography is reference data: readable by anyone, writable by nobody
-- except a service role running the importer.

create extension if not exists "pgcrypto";

create type senatorial_district as enum ('central', 'north', 'south');

create table lga (
  code                     text primary key check (code ~ '^[0-9]{2}$'),
  name                     text not null,
  inec_name                text not null,
  district                 senatorial_district not null,
  declared_ward_count      integer not null check (declared_ward_count > 0),
  declared_pu_count        integer not null check (declared_pu_count > 0)
);

create table ward (
  id                       text primary key,           -- '{lga_code}-{code}'
  lga_code                 text not null references lga(code) on delete restrict,
  code                     text not null check (code ~ '^[0-9]{2}$'),
  name                     text not null,
  inec_name                text not null,
  declared_pu_count        integer not null check (declared_pu_count >= 0),
  unique (lga_code, code)
);

create index ward_lga_idx on ward(lga_code);

create table polling_unit (
  id                       text primary key,           -- '{lga_code}-{ward_code}-{code}'
  ward_id                  text not null references ward(id) on delete restrict,
  lga_code                 text not null references lga(code) on delete restrict,
  code                     text not null check (code ~ '^[0-9]{3}$'),
  name                     text not null,
  inec_name                text not null,
  -- False for units created in the 2021 expansion whose ward allocation we do not yet hold.
  enumerated_in_directory  boolean not null default true
);

create index polling_unit_ward_idx on polling_unit(ward_id);
create index polling_unit_lga_idx on polling_unit(lga_code);

-- The authoritative roll, kept as a row rather than a constant so it can be corrected without a
-- deploy when INEC publishes a current directory.
create table polling_unit_roll (
  id                       boolean primary key default true check (id),
  current_total            integer not null,
  source_publisher         text not null,
  source_document          text not null,
  source_revision          text not null,
  source_url               text,
  note                     text,
  updated_at               timestamptz not null default now()
);

alter table lga               enable row level security;
alter table ward              enable row level security;
alter table polling_unit      enable row level security;
alter table polling_unit_roll enable row level security;

-- Reference data is public. There is nothing sensitive in INEC's published directory, and the
-- public ledger reads it unauthenticated.
create policy geography_public_read on lga               for select using (true);
create policy geography_public_read on ward              for select using (true);
create policy geography_public_read on polling_unit      for select using (true);
create policy geography_public_read on polling_unit_roll for select using (true);
