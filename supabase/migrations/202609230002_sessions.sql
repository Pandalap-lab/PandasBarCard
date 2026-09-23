create function public.bar_session_valid(p_session uuid,p_user uuid) returns boolean
language sql security definer set search_path='' as $$
 select exists(select 1 from auth.sessions where id=p_session and user_id=p_user
 and (not_after is null or not_after>now()));
$$;
revoke all on function public.bar_session_valid(uuid,uuid) from public,anon,authenticated;
grant execute on function public.bar_session_valid(uuid,uuid) to service_role;

-- Provider login/security events copied without tokens or arbitrary metadata.
create function public.bar_auth_event() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.bar_audit(event,details) values('auth.'||coalesce(new.payload->>'action','event'),
 jsonb_build_object('actor_id',new.payload->>'actor_id'));
 return new;
end $$;
create trigger bar_auth_event after insert on auth.audit_log_entries
for each row execute function public.bar_auth_event();
