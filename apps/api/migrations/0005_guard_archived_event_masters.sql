create or replace function validate_event_master_references() returns trigger as $$
declare organizer_archived timestamptz; venue_archived timestamptz;
begin
  select archived_at into organizer_archived from event_organizers where id = new.event_organizer_id;
  if organizer_archived is not null and (tg_op = 'INSERT' or new.event_organizer_id is distinct from old.event_organizer_id)
    then raise exception 'ARCHIVED_EVENT_ORGANIZER'; end if;
  select archived_at into venue_archived from venues where id = new.venue_id;
  if venue_archived is not null and (tg_op = 'INSERT' or new.venue_id is distinct from old.venue_id)
    then raise exception 'ARCHIVED_VENUE'; end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_master_reference_guard on events;
create trigger events_master_reference_guard before insert or update of event_organizer_id, venue_id on events
for each row execute function validate_event_master_references();
