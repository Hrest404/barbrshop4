-- Supabase Cron Jobs для автоматических напоминаний
-- Выполнить в Supabase SQL Editor: Dashboard → SQL Editor

-- ─── Включаем расширение pg_cron (уже включено в Supabase) ─────────────────
-- create extension if not exists pg_cron;

-- ─── Функция-обёртка для вызова Edge Function ───────────────────────────────
-- Вызывается pg_cron'ом. Использует встроенный http extension.

create or replace function public.run_notifications()
returns void
language plpgsql
security definer
as $$
declare
  v_url text;
  v_key text;
  v_response int;
begin
  v_url := current_setting('app.supabase_url') || '/functions/v1/notifications';
  v_key  := current_setting('app.service_role_key');

  select status into v_response
  from http_post(
    v_url,
    '',
    'application/json',
    array[http_header('Authorization', 'Bearer ' || v_key)]
  );

  raise log 'notifications function returned %', v_response;
end;
$$;

-- ─── Альтернатива (рекомендуется): встроенный pg_net ────────────────────────
-- pg_net доступен в Supabase и не требует http extension.

create or replace function public.run_notifications_net()
returns void
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- ─── Задаём переменные приложения ───────────────────────────────────────────
-- Вставьте реальные значения:
alter database postgres
  set app.supabase_url       = 'https://mszxtvjnruyybfdqzqni.supabase.co';
alter database postgres
  set app.service_role_key   = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

-- ─── Cron каждую минуту ─────────────────────────────────────────────────────
select cron.schedule(
  'notifications-every-minute',   -- имя задачи
  '* * * * *',                    -- каждую минуту
  $$ select public.run_notifications_net() $$
);

-- ─── Проверить активные задачи ──────────────────────────────────────────────
-- select * from cron.job;

-- ─── Удалить задачу (если нужно) ────────────────────────────────────────────
-- select cron.unschedule('notifications-every-minute');
