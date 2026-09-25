create table source_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('WHATSAPP')),
  external_message_id text not null check (char_length(trim(external_message_id)) > 0),
  conversation_ref text not null check (char_length(trim(conversation_ref)) > 0),
  sender_ref text not null check (char_length(trim(sender_ref)) > 0),
  occurred_at timestamptz not null,
  body_text text,
  created_at timestamptz not null default now(),
  unique (channel, external_message_id)
);

create index source_messages_conversation_occurred_idx
  on source_messages (conversation_ref, occurred_at desc);

create table source_documents (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (source_kind in ('WHATSAPP_ATTACHMENT', 'MANUAL_UPLOAD')),
  source_message_id uuid references source_messages(id) on delete restrict,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png'
  )),
  byte_size integer not null check (byte_size > 0 and byte_size <= 20971520),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  content bytea not null,
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (octet_length(content) = byte_size),
  check (
    (source_kind = 'WHATSAPP_ATTACHMENT' and source_message_id is not null)
    or (source_kind = 'MANUAL_UPLOAD' and source_message_id is null)
  )
);

create index source_documents_message_idx on source_documents (source_message_id);
create index source_documents_sha256_idx on source_documents (sha256);
create index source_documents_received_idx on source_documents (received_at desc);
