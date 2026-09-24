-- Aggregate counts only: no visitor IDs, IP addresses or interaction events.
create table public.bar_pageviews (
 day date primary key,
 views bigint not null default 0 check (views >= 0)
);
alter table public.bar_pageviews enable row level security;
revoke all on public.bar_pageviews from public, anon, authenticated;
grant select, insert, update on public.bar_pageviews to service_role;

create function public.bar_count_pageview() returns void
language sql security definer set search_path='' as $$
 insert into public.bar_pageviews(day, views)
 values ((now() at time zone 'Europe/Vienna')::date, 1)
 on conflict(day) do update set views=public.bar_pageviews.views+1;
$$;

create function public.bar_pageview_stats() returns jsonb
language sql security definer set search_path='' as $$
 with clock as (select (now() at time zone 'Europe/Vienna')::date as today)
 select jsonb_build_object(
  'today', coalesce(sum(views) filter(where day=clock.today),0),
  'last7', coalesce(sum(views) filter(where day between clock.today-6 and clock.today),0),
  'last30', coalesce(sum(views) filter(where day between clock.today-29 and clock.today),0),
  'total', coalesce(sum(views),0),
  'since', min(day), 'date', clock.today, 'timezone', 'Europe/Vienna'
 ) from clock left join public.bar_pageviews on true group by clock.today;
$$;
revoke all on function public.bar_count_pageview(), public.bar_pageview_stats() from public, anon, authenticated;
grant execute on function public.bar_count_pageview(), public.bar_pageview_stats() to service_role;
