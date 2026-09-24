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
