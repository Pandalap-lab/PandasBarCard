-- Public reads are limited to the explicitly published snapshot.
create table public.bar_published (
 id int primary key check(id=1), document jsonb not null,
 revision bigint not null default 1, published_at timestamptz not null default now()
);
alter table public.bar_published enable row level security;
revoke all on public.bar_published from public,anon,authenticated,service_role;
grant select on public.bar_published to anon,authenticated,service_role;
grant insert,update on public.bar_published to service_role;
create policy published_read on public.bar_published for select to anon,authenticated using(id=1);

create function public.bar_publish(p_actor uuid,p_version int,p_document jsonb) returns bigint
language plpgsql security definer set search_path='' as $$
declare d public.bar_draft; r bigint;
begin
 if not exists(select 1 from public.bar_members where user_id=p_actor and enabled and role='admin') then raise exception 'Administrator erforderlich'; end if;
 select * into d from public.bar_draft where id=1 for update;
 if d.version<>p_version or d.document is null or d.publish_lock is not null then raise exception 'Entwurf inzwischen geändert'; end if;
 insert into public.bar_published(id,document) values(1,p_document)
 on conflict(id) do update set document=excluded.document,revision=public.bar_published.revision+1,published_at=now()
 returning revision into r;
 update public.bar_draft set document=jsonb_set(document,'{revision}',p_document->'revision'),version=version+1,updated_by=p_actor,updated_at=now() where id=1;
 insert into public.bar_audit(actor,event,details) values(p_actor,'publish.committed',jsonb_build_object('revision',r,'draft_version',p_version));
 return r;
end $$;
revoke all on function public.bar_publish(uuid,int,jsonb) from public,anon,authenticated;
grant execute on function public.bar_publish(uuid,int,jsonb) to service_role;

-- No client write policies: all uploads pass role/MFA checks in the Edge Function.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('bar-drafts','bar-drafts',false,2000000,array['image/webp','image/png','image/jpeg']),
 ('bar-published','bar-published',true,2000000,array['image/webp','image/png','image/jpeg']);
