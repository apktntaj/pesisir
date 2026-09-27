create table customs_jobs (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references shipments(id) on delete restrict,
 document_type text not null check (document_type in ('BC_2_3','BC_2_5','BC_3_0')),
 status text not null check (status in ('DRAFT','PREPARING','SUBMITTED','REGISTERED','RELEASED','COMPLETED','ON_HOLD','CANCELLED')) default 'DRAFT',
 notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table customs_job_allocations (id uuid primary key default gen_random_uuid(), customs_job_id uuid not null references customs_jobs(id) on delete restrict, shipment_allocation_id uuid not null references shipment_allocations(id) on delete restrict, quantity double precision not null check (quantity > 0), unit text not null, unique(customs_job_id, shipment_allocation_id));
create table customs_job_transitions (id uuid primary key default gen_random_uuid(), customs_job_id uuid not null references customs_jobs(id) on delete restrict, from_status text not null, to_status text not null, reason text, evidence_source_document_id uuid references source_documents(id) on delete restrict, actor_ref text not null, occurred_at timestamptz not null default now());
