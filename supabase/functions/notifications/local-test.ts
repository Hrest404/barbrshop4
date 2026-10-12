import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Этот файл — для локального тестирования Edge Function без деплоя в Supabase.
// Запуск: deno run --allow-net --allow-env supabase/functions/notifications/local-test.ts

// Загружаем переменные из .env (если есть)
import 'https://deno.land/x/dotenv@v3.2.2/load.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

console.log('Calling notifications function locally...')

const res = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: '{}',
})

const data = await res.json()
console.log('Response:', res.status, data)
