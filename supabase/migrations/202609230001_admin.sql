-- All application tables are inaccessible to anon/authenticated, including via REST.
create table public.bar_members (
 user_id uuid primary key references auth.users(id), email text not null,
 role text not null check(role in ('admin','editor','viewer')),
 enabled boolean not null default true, created_at timestamptz not null default now()
);
create table public.bar_draft (
 id int primary key check(id=1), version int not null default 0,
 document jsonb, base_sha text, updated_by uuid, updated_at timestamptz default now(),
 publish_lock uuid, lock_at timestamptz
);
insert into public.bar_draft(id) values(1);
create table public.bar_audit (
 id bigint generated always as identity primary key,
 at timestamptz not null default now(), actor uuid, event text not null,
 details jsonb not null default '{}'::jsonb
);
create table public.bar_rate (
 key text primary key, window_start timestamptz not null, hits int not null
);
alter table public.bar_members enable row level security;
alter table public.bar_draft enable row level security;
alter table public.bar_audit enable row level security;
alter table public.bar_rate enable row level security;
revoke all on public.bar_members, public.bar_draft, public.bar_audit, public.bar_rate from anon,authenticated;
grant select,insert,update,delete on public.bar_members,public.bar_draft,public.bar_rate to service_role;
grant select,insert on public.bar_audit to service_role;
grant usage,select on sequence public.bar_audit_id_seq to service_role;
create function public.bar_audit_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Audit is append-only'; end $$;
create trigger audit_immutable before update or delete on public.bar_audit for each row execute function public.bar_audit_immutable();

-- Public recovery, email OTP and email changes cannot send a reset credential.
-- Admin generateLink is server-only and delivery occurs in bar-admin via Resend.
create function public.block_public_auth_email(event jsonb) returns jsonb
language sql set search_path='' as $$
 select '{"error":{"http_code":403,"message":"Bitte Administrator kontaktieren."}}'::jsonb;
$$;
revoke all on function public.block_public_auth_email(jsonb) from public,anon,authenticated;
grant execute on function public.block_public_auth_email(jsonb) to supabase_auth_admin;

create function public.bar_limit(p_key text, p_max int) returns boolean
language plpgsql security definer set search_path='' as $$
declare n int;
begin
 insert into public.bar_rate(key,window_start,hits) values(p_key,now(),1)
 on conflict(key) do update set
 hits=case when public.bar_rate.window_start < now()-interval '1 minute' then 1 else public.bar_rate.hits+1 end,
 window_start=case when public.bar_rate.window_start < now()-interval '1 minute' then now() else public.bar_rate.window_start end
 returning hits into n;
 return n<=p_max;
end $$;

create function public.bar_save(p_actor uuid,p_version int,p_document jsonb,p_sha text) returns int
language plpgsql security definer set search_path='' as $$
declare v int;
begin
 update public.bar_draft set document=p_document,version=version+1,base_sha=p_sha,
 updated_by=p_actor,updated_at=now() where id=1 and version=p_version and publish_lock is null returning version into v;
 if v is null then raise exception 'Entwurf wurde inzwischen geändert oder Veröffentlichung läuft.'; end if;
 insert into public.bar_audit(actor,event,details) values(p_actor,'draft.saved',jsonb_build_object('version',v));
 return v;
end $$;

create function public.bar_member_update(p_actor uuid,p_target uuid,p_role text,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
declare old public.bar_members;
begin
 perform pg_advisory_xact_lock(741230);
 select * into old from public.bar_members where user_id=p_target for update;
 if old.user_id is null then raise exception 'Unbekannter Benutzer'; end if;
 if old.role='admin' and old.enabled and (p_role<>'admin' or not p_enabled)
 and (select count(*) from public.bar_members where role='admin' and enabled)<2 then
 raise exception 'Letzter Administrator kann nicht entfernt werden'; end if;
 update public.bar_members set role=p_role,enabled=p_enabled where user_id=p_target;
 insert into public.bar_audit(actor,event,details) values(p_actor,'member.updated',jsonb_build_object('target',p_target,'role',p_role,'enabled',p_enabled));
end $$;
revoke all on function public.bar_limit(text,int),public.bar_save(uuid,int,jsonb,text),public.bar_member_update(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.bar_limit(text,int),public.bar_save(uuid,int,jsonb,text),public.bar_member_update(uuid,uuid,text,boolean) to service_role;
