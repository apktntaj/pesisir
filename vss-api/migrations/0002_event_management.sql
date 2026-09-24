alter table event_organizers
  add column if not exists npwp text,
  add column if not exists address text,
  add column if not exists website text,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by_actor_ref text,
  add column if not exists archive_reason text;

alter table venues
  add column if not exists npwp text,
  add column if not exists website text,
  add column if not exists loading_access_notes text,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by_actor_ref text,
  add column if not exists archive_reason text;

alter table contacts rename column contact to legacy_contact;
alter table contacts
  alter column legacy_contact drop not null,
  add column if not exists role text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists archived_at timestamptz;
alter table contacts add constraint contacts_channel_check
  check (legacy_contact is not null or email is not null or phone is not null) not valid;

alter table event_organizer_contacts add column if not exists is_primary boolean not null default false;
alter table venue_contacts add column if not exists is_primary boolean not null default false;
create unique index if not exists event_organizer_primary_contact_idx on event_organizer_contacts (event_organizer_id) where is_primary;
create unique index if not exists venue_primary_contact_idx on venue_contacts (venue_id) where is_primary;

alter table events
  add column if not exists alias text,
  add column if not exists notes text,
  add column if not exists status text not null default 'ACTIVE';
alter table events add constraint events_status_check check (status in ('ACTIVE', 'CANCELLED')) not valid;

create table if not exists exhibitors (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(trim(legal_name)) > 0),
  alias text,
  kind text not null check (kind in ('LOCAL', 'INTERNATIONAL')),
  npwp text,
  country_code text,
  address text,
  website text,
  archived_at timestamptz,
  archived_by_actor_ref text,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exhibitors_country_code_check check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint exhibitors_kind_country_check check ((kind = 'LOCAL' and country_code = 'ID') or (kind = 'INTERNATIONAL' and (country_code is null or country_code <> 'ID'))),
  constraint exhibitors_npwp_check check (kind = 'LOCAL' or npwp is null)
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  country_code text,
  address text,
  website text,
  archived_at timestamptz,
  archived_by_actor_ref text,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agents_country_code_check check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create table if not exists exhibitor_contacts (
  exhibitor_id uuid not null references exhibitors(id) on delete restrict,
  contact_id uuid not null references contacts(id) on delete restrict,
  is_primary boolean not null default false,
  primary key (exhibitor_id, contact_id)
);
create unique index if not exists exhibitor_primary_contact_idx on exhibitor_contacts (exhibitor_id) where is_primary;

create table if not exists agent_contacts (
  agent_id uuid not null references agents(id) on delete restrict,
  contact_id uuid not null references contacts(id) on delete restrict,
  is_primary boolean not null default false,
  primary key (agent_id, contact_id)
);
create unique index if not exists agent_primary_contact_idx on agent_contacts (agent_id) where is_primary;

create table if not exists event_exhibitors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete restrict,
  exhibitor_id uuid not null references exhibitors(id) on delete restrict,
  agent_id uuid references agents(id) on delete restrict,
  primary_contact_id uuid references contacts(id) on delete restrict,
  hall text,
  booth text,
  notes text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'WITHDRAWN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, exhibitor_id)
);
create index if not exists event_exhibitors_event_idx on event_exhibitors(event_id);
create index if not exists event_exhibitors_exhibitor_idx on event_exhibitors(exhibitor_id);
create index if not exists event_exhibitors_agent_idx on event_exhibitors(agent_id);

create table if not exists event_lifecycle_events (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id) on delete restrict,
  from_status text not null, to_status text not null, reason text not null check (char_length(trim(reason)) > 0),
  actor_ref text not null, source_message_id text, occurred_at timestamptz not null default now()
);
create table if not exists event_exhibitor_lifecycle_events (
  id uuid primary key default gen_random_uuid(), event_exhibitor_id uuid not null references event_exhibitors(id) on delete restrict,
  from_status text not null, to_status text not null, reason text not null check (char_length(trim(reason)) > 0),
  actor_ref text not null, source_message_id text, occurred_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, action text not null,
  before_data jsonb, after_data jsonb, actor_ref text not null, source_message_id text,
  idempotency_key text not null, occurred_at timestamptz not null default now()
);
create index if not exists audit_events_entity_idx on audit_events(entity_type, entity_id, occurred_at desc);

create table if not exists idempotency_records (
  key text primary key, method text not null, path text not null, request_hash text not null,
  response_status integer not null, response_body jsonb not null, created_at timestamptz not null default now()
);

create or replace function validate_event_exhibitor_assignment() returns trigger as $$
declare exhibitor_kind text; exhibitor_archived timestamptz; agent_archived timestamptz; event_status text;
begin
  select kind, archived_at into exhibitor_kind, exhibitor_archived from exhibitors where id = new.exhibitor_id;
  if exhibitor_archived is not null and (tg_op = 'INSERT' or new.exhibitor_id is distinct from old.exhibitor_id) then raise exception 'ARCHIVED_EXHIBITOR'; end if;
  if exhibitor_kind = 'LOCAL' and new.agent_id is not null then raise exception 'LOCAL_EXHIBITOR_AGENT_FORBIDDEN'; end if;
  if new.agent_id is not null then
    select archived_at into agent_archived from agents where id = new.agent_id;
    if agent_archived is not null and (tg_op = 'INSERT' or new.agent_id is distinct from old.agent_id) then raise exception 'ARCHIVED_AGENT'; end if;
  end if;
  select status into event_status from events where id = new.event_id;
  if event_status = 'CANCELLED' then raise exception 'CANCELLED_EVENT'; end if;
  if new.primary_contact_id is not null and not exists (
    select 1 from exhibitor_contacts where exhibitor_id = new.exhibitor_id and contact_id = new.primary_contact_id
  ) then raise exception 'CONTACT_NOT_OWNED_BY_EXHIBITOR'; end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists event_exhibitors_assignment_guard on event_exhibitors;
create trigger event_exhibitors_assignment_guard before insert or update on event_exhibitors for each row execute function validate_event_exhibitor_assignment();

create or replace function validate_exhibitor_kind_change() returns trigger as $$
begin
  if new.kind = 'LOCAL' and exists (select 1 from event_exhibitors where exhibitor_id = new.id and agent_id is not null)
    then raise exception 'LOCAL_EXHIBITOR_AGENT_FORBIDDEN'; end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists exhibitors_kind_guard on exhibitors;
create trigger exhibitors_kind_guard before update of kind on exhibitors for each row execute function validate_exhibitor_kind_change();

insert into audit_events (entity_type, entity_id, action, after_data, actor_ref, idempotency_key)
select 'event_organizer', id, 'MIGRATED', to_jsonb(event_organizers), 'migration:vss-api-0002', 'migration:vss-api-0002:event-organizer:' || id from event_organizers;
insert into audit_events (entity_type, entity_id, action, after_data, actor_ref, idempotency_key)
select 'venue', id, 'MIGRATED', to_jsonb(venues), 'migration:vss-api-0002', 'migration:vss-api-0002:venue:' || id from venues;
insert into audit_events (entity_type, entity_id, action, after_data, actor_ref, idempotency_key)
select 'contact', id, 'MIGRATED', to_jsonb(contacts), 'migration:vss-api-0002', 'migration:vss-api-0002:contact:' || id from contacts;
insert into audit_events (entity_type, entity_id, action, after_data, actor_ref, idempotency_key)
select 'event', id, 'MIGRATED', to_jsonb(events), 'migration:vss-api-0002', 'migration:vss-api-0002:event:' || id from events;
