create table cipls (
  id uuid primary key default gen_random_uuid(),
  event_exhibitor_id uuid not null unique references event_exhibitors(id) on delete restrict,
  reference_number text,
  status text not null check (status in ('AWAITING_DOCUMENT', 'RECEIVED', 'UNDER_REVIEW', 'READY', 'ON_HOLD', 'CANCELLED')) default 'RECEIVED',
  active_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cipl_versions (
  id uuid primary key default gen_random_uuid(),
  cipl_id uuid not null references cipls(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  status text not null check (status in ('DRAFT', 'READY')) default 'DRAFT',
  source_document_id uuid not null references source_documents(id) on delete restrict,
  received_at timestamptz not null,
  received_by_actor_ref text not null check (char_length(trim(received_by_actor_ref)) > 0),
  revision_note text,
  created_at timestamptz not null default now(),
  unique (cipl_id, version_number)
);

alter table cipls add constraint cipls_active_version_fk
  foreign key (active_version_id) references cipl_versions(id) on delete restrict;

create table cipl_items (
  id uuid primary key default gen_random_uuid(),
  cipl_version_id uuid not null references cipl_versions(id) on delete restrict,
  line_number integer not null check (line_number > 0),
  description text not null check (char_length(trim(description)) > 0),
  quantity double precision not null check (quantity > 0),
  unit text not null check (char_length(trim(unit)) > 0),
  unit_value double precision,
  currency text,
  gross_weight_kg double precision,
  net_weight_kg double precision,
  country_of_origin text,
  identifiers jsonb not null default '[]'::jsonb check (jsonb_typeof(identifiers) = 'array'),
  intended_use text,
  intended_disposal text,
  created_at timestamptz not null default now(),
  unique (cipl_version_id, line_number)
);

create index cipl_versions_cipl_idx on cipl_versions (cipl_id, version_number);
create index cipl_items_version_idx on cipl_items (cipl_version_id, line_number);
