create table document_extractions (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references source_documents(id) on delete restrict,
  submitted_by_actor_ref text not null check (char_length(trim(submitted_by_actor_ref)) > 0),
  created_at timestamptz not null default now()
);

create index document_extractions_source_document_idx
  on document_extractions (source_document_id, created_at desc);

create table document_extraction_facts (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references document_extractions(id) on delete restrict,
  field text not null check (char_length(trim(field)) > 0),
  information_state text not null check (information_state in (
    'SOURCE_BACKED', 'CONFIRMED', 'INFERRED', 'UNKNOWN', 'CONFLICTING', 'NOT_APPLICABLE'
  )),
  asserted_value jsonb,
  confidence_percent integer check (confidence_percent between 0 and 100),
  conflict_explanation text,
  evidence_locators jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_locators) = 'array'),
  created_at timestamptz not null default now(),
  unique (extraction_id, field),
  check (
    (information_state in ('SOURCE_BACKED', 'CONFIRMED', 'INFERRED') and asserted_value is not null and conflict_explanation is null)
    or (information_state in ('UNKNOWN', 'NOT_APPLICABLE') and asserted_value is null and conflict_explanation is null)
    or (information_state = 'CONFLICTING' and asserted_value is null and char_length(trim(conflict_explanation)) > 0)
  )
);

create index document_extraction_facts_extraction_idx
  on document_extraction_facts (extraction_id, created_at);

create table document_extraction_fact_reviews (
  id uuid primary key default gen_random_uuid(),
  extraction_fact_id uuid not null references document_extraction_facts(id) on delete restrict,
  kind text not null check (kind in ('CONFIRM', 'CORRECT')),
  resulting_state text not null check (resulting_state in (
    'SOURCE_BACKED', 'CONFIRMED', 'INFERRED', 'UNKNOWN', 'CONFLICTING', 'NOT_APPLICABLE'
  )),
  resulting_value jsonb,
  conflict_explanation text,
  reason text not null check (char_length(trim(reason)) > 0),
  evidence_locators jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_locators) = 'array'),
  reviewed_by_actor_ref text not null check (char_length(trim(reviewed_by_actor_ref)) > 0),
  created_at timestamptz not null default now(),
  check (
    (resulting_state in ('SOURCE_BACKED', 'CONFIRMED', 'INFERRED') and resulting_value is not null and conflict_explanation is null)
    or (resulting_state in ('UNKNOWN', 'NOT_APPLICABLE') and resulting_value is null and conflict_explanation is null)
    or (resulting_state = 'CONFLICTING' and resulting_value is null and char_length(trim(conflict_explanation)) > 0)
  ),
  check (kind <> 'CONFIRM' or resulting_state = 'CONFIRMED')
);

create index document_extraction_fact_reviews_fact_idx
  on document_extraction_fact_reviews (extraction_fact_id, created_at);
