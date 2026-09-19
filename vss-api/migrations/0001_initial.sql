create extension if not exists pgcrypto;

create table if not exists event_organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  address text not null check (char_length(trim(address)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  contact text not null check (char_length(trim(contact)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_organizer_contacts (
  event_organizer_id uuid not null references event_organizers(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  primary key (event_organizer_id, contact_id)
);

create table if not exists venue_contacts (
  venue_id uuid not null references venues(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  primary key (venue_id, contact_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  start_on date not null,
  end_on date not null check (end_on >= start_on),
  event_organizer_id uuid not null references event_organizers(id) on delete restrict,
  venue_id uuid not null references venues(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_event_organizer_id_idx on events(event_organizer_id);
create index if not exists events_venue_id_idx on events(venue_id);
create index if not exists events_start_on_idx on events(start_on);
