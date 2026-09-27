create table shipments (
  id uuid primary key default gen_random_uuid(),
  cipl_version_id uuid not null references cipl_versions(id) on delete restrict,
  source_document_id uuid not null references source_documents(id) on delete restrict,
  document_type text not null check (document_type in ('BL', 'AWB')),
  document_number text not null check (char_length(trim(document_number)) > 0),
  shipment_mode text check (shipment_mode in ('FCL', 'LCL')),
  direction text not null check (direction in ('IMPORT', 'EXPORT')),
  shipper text, consignee text, notify_party text, carrier text, eta_or_etd timestamptz,
  origin text, destination text, legacy_reference text,
  status text not null check (status in ('DRAFT', 'DOCUMENT_RECEIVED', 'UNDER_REVIEW', 'READY_FOR_CUSTOMS', 'ON_HOLD', 'CANCELLED')) default 'DOCUMENT_RECEIVED',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table shipment_allocations (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete restrict,
  cipl_item_id uuid not null references cipl_items(id) on delete restrict,
  quantity double precision not null check (quantity > 0),
  unit text not null check (char_length(trim(unit)) > 0),
  unique (shipment_id, cipl_item_id)
);
create index shipments_cipl_version_idx on shipments (cipl_version_id);
create index shipment_allocations_item_idx on shipment_allocations (cipl_item_id);
