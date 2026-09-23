-- Signed, UV-verified passkey assertions are approved only by the Edge Function.
create table public.bar_passkey_sessions (
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 check (expires_at <= created_at + interval '8 hours 1 minute')
);
alter table public.bar_passkey_sessions enable row level security;
revoke all on public.bar_passkey_sessions from public,anon,authenticated;
grant select,insert,delete on public.bar_passkey_sessions to service_role;

create function public.bar_passkey_session_valid(p_session uuid,p_user uuid) returns boolean
language sql security definer set search_path='' as $$
 select exists(select 1 from public.bar_passkey_sessions p
 join auth.sessions s on s.id=p.session_id and s.user_id=p.user_id
 where p.session_id=p_session and p.user_id=p_user and p.expires_at>now()
 and (s.not_after is null or s.not_after>now()));
$$;
revoke all on function public.bar_passkey_session_valid(uuid,uuid) from public,anon,authenticated;
grant execute on function public.bar_passkey_session_valid(uuid,uuid) to service_role;
