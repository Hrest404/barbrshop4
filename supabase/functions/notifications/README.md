# Supabase Edge Function: notifications

Автоматические напоминания и уведомления через Telegram.

## Что делает

| Задача | Условие | Поле |
|--------|---------|------|
| Напоминание за день | `starts_at` через 20–26 ч, `reminder_day_sent_at IS NULL` | `reminder_day_sent_at` |
| Напоминание за 30 мин | `starts_at` через 25–35 мин, `reminder_30m_sent_at IS NULL` | `reminder_30m_sent_at` |
| Авто-завершение | `ends_at < now()`, status=confirmed | `auto_completed_at`, status=completed |
| Запрос отзыва | `ends_at < now() - 2h`, status=completed, `review_requested_at IS NULL` | `review_requested_at` |

## Деплой

### 1. Установить Supabase CLI

```bash
npm install -g supabase
```

### 2. Войти в аккаунт

```bash
supabase login
```

### 3. Привязать проект

```bash
supabase link --project-ref mszxtvjnruyybfdqzqni
```

### 4. Задать секреты функции

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=8988311458:AAGrOBrSmDjHwiazelE8EnqPvGE_sMwateY
supabase secrets set APP_URL=https://ваш-домен.vercel.app
```

> `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` подставляются автоматически внутри Edge Functions.

### 5. Задеплоить функцию

```bash
supabase functions deploy notifications --no-verify-jwt
```

### 6. Настроить Cron

Откройте **Supabase Dashboard → SQL Editor** и выполните [`supabase/cron.sql`](../cron.sql).

Или через Dashboard → **Database → Cron Jobs → New Cron Job**:
- Name: `notifications-every-minute`
- Schedule: `* * * * *`
- Command: `select public.run_notifications_net()`

### 7. Проверить

```bash
# Вызвать вручную
curl -X POST https://mszxtvjnruyybfdqzqni.supabase.co/functions/v1/notifications \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```

## Идемпотентность

Каждый тип уведомления защищён двойной проверкой:
1. `WHERE reminder_*_sent_at IS NULL` в SELECT
2. `.is('reminder_*_sent_at', null)` в UPDATE

Даже если функция вызвана дважды одновременно — второй UPDATE обновит 0 строк.
