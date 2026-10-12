# BARBERSHOP PROJECT — КОНТЕКСТ СЕССИИ

> Этот файл создан для сохранения контекста между сессиями. Обновляй его по мере продвижения по задачам.

---

## 🗂 СТРУКТУРА ПРОЕКТА

```
d:\хрестьян\barbershop\            ← КОРЕНЬ монорепо
├── package.json                   ← npm workspaces (apps/*, packages/*)
├── .env                           ← БД и ключи (НЕ КОММИТИТЬ, создать из .env.example)
├── .env.example                   ← Шаблон переменных окружения
├── context/
│   └── PROJECT_CONTEXT.md        ← Этот файл
├── prisma/
│   ├── schema.prisma              ← Полная схема PostgreSQL (Prisma ORM)
│   └── seed.ts                    ← Сид-данные (барберы, услуги, расписание)
├── apps/
│   └── web/                       ← Next.js 16 приложение (главный фронтенд)
│       ├── package.json
│       ├── next.config.ts
│       ├── public/
│       │   └── Fire Barber Shop Promo - ATLMDERON.mp4  ← Видео для hero
│       └── src/
│           ├── app/
│           │   ├── layout.tsx     ← Корневой layout (Outfit font, SmoothScroll)
│           │   ├── page.tsx       ← Главная страница (Hero + Services + Barbers)
│           │   ├── globals.css    ← TailwindCSS v4 tokens (цвета, шрифт)
│           │   └── book/
│           │       └── page.tsx   ← Мультишаговый мастер записи
│           └── components/
│               └── SmoothScroll.tsx  ← Lenis + GSAP ticker провайдер
└── .agents/
    └── skills/
        ├── frontend-atlas/        ← GOATED-UI-SKILL (Awwwards cookbook)
        └── frontend-design/       ← Design direction & aesthetic guidance
```

---

## ⚙️ ТЕХНИЧЕСКИЙ СТЕК

| Слой | Технология | Версия |
|------|-----------|--------|
| Framework | Next.js (App Router) | 16.3.8 |
| Язык | TypeScript | ^5 |
| Стили | TailwindCSS | v4 |
| Шрифт | Outfit (Google Fonts) | — |
| Анимации | GSAP + @gsap/react | 3.x |
| Скролл | Lenis | 1.x |
| ORM | Prisma | ^8.0.0-rc.19 |
| БД | PostgreSQL (Supabase) | — |
| Сид-раннер | tsx | ^4 |
| Монорепо | npm workspaces | — |

---

## 🎨 ДИЗАЙН-СИСТЕМА (tokens из globals.css)

```css
--color-brand:        #D4AF37   /* Золото — основной акцент */
--color-brand-hover:  #F3E5AB   /* Светлое золото — hover */
--color-dark-bg:      #0A0A0B   /* Фон — почти чёрный */
--color-dark-surface: #141416   /* Поверхность карточек */
--color-dark-border:  #2A2A2D   /* Граница элементов */
--color-dark-text:    #E5E5E5   /* Основной текст */
--color-dark-muted:   #9CA3AF   /* Приглушённый текст */
```

**Шрифт:** Outfit (Google Fonts), переменная `--font-outfit`

**Aesthetic direction:** Brutal Elegance — строгий тёмный дизайн, ЧБ фотографии с золотыми акцентами. Никаких шаблонных AI-паттернов (бежевые тона, терракот, SaaS-карточки с тенями).

---

## 🚀 КАК ЗАПУСКАТЬ

```bash
# Из корня проекта (d:\хрестьян\barbershop)

npm run dev          # Запуск dev-сервера (делегируется в apps/web)
# Сервер доступен на http://localhost:3000
```

> **ВАЖНО:** `npm run dev` запускать ТОЛЬКО из корня `d:\хрестьян\barbershop`.
> Turbopack определяет корень по ближайшему `.git`. Git должен быть в корне, а не в `apps/web`.

---

## 🗃️ БАЗА ДАННЫХ (Prisma + Supabase)

### Модели в схеме (`prisma/schema.prisma`)
- `barbers` — барберы (имя, фото, стаж, telegram)
- `services` — услуги (название, описание, длительность, цена)
- `barber_services` — связь барбер↔услуга (с перекрытием цены/длительности)
- `working_hours` — расписание (барбер, день недели, время)
- `breaks` — перерывы в рабочем расписании
- `time_off` — выходные/отпуска
- `clients` — клиенты (имя, телефон, Telegram ID)
- `bookings` — записи (статусы: confirmed/completed/cancelled/no_show)
- `booking_services` — снэпшот услуг на момент записи (snapshot!)
- `reviews` — отзывы (рейтинг, комментарий)
- `settings` — key-value настройки (timezone, cancel_cutoff_min, slot_step_min)
- `admin_users` — администраторы (логин, хэш пароля)

### Команды для работы с БД
```bash
# Из корня проекта:
npx prisma db push          # Применить схему к БД (без миграций)
npx prisma migrate dev      # Создать и применить миграцию
npx prisma db seed          # Залить тестовые данные (seed.ts)
npx prisma studio           # Открыть GUI для просмотра данных
```

### .env файл (создать вручную из .env.example)
```env
DATABASE_URL="postgresql://..."   # Transaction строка из Supabase
DIRECT_URL="postgresql://..."     # Session строка (порт 5432) из Supabase
NEXTAUTH_SECRET="..."             # Генерируется: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
TELEGRAM_BOT_TOKEN="..."          # Из @BotFather в Telegram
```

---

## 📄 СТРАНИЦЫ

### `/` — Главная (`apps/web/src/app/page.tsx`)
**Секции:**
1. **Header** — фиксированный, стеклянный `backdrop-blur`, кнопка "Book Now"
2. **Hero** — pinned секция с видео-фоном (`/Fire Barber Shop Promo - ATLMDERON.mp4`). GSAP ScrollTrigger: при скролле `clipPath` раскрывается на весь экран, `scale` увеличивается. Заголовок "Brutal Elegance." — line-mask reveal через компонент `SplitLines`.
3. **Services** — 4 полноэкранных секции (100vh каждая), одна за другой без перекрытия. Каждая — своя фоновая фотография с параллаксом (GSAP scrub 0.8), градиент снизу, контент влетает при скролле.
4. **The Masters** — сетка 3 барберов, ЧБ фото → цветное при hover + scale.
5. **Footer** — гигантский wordmark `Barbershop.`, ссылки навигации.

**Анимации (GSAP):**
- `SmoothScroll.tsx` — Lenis подключён к `gsap.ticker` (один RAF loop, `lagSmoothing(0)`)
- Hero: `ScrollTrigger.pin + scrub 0.5` на `clipPath + scale`
- Services: `fromTo opacity/y + scrollTrigger start "top 65%"` + `yPercent` parallax на фото
- Headline: `stagger 0.1` по строкам (line-mask reveal)

### `/book` — Запись (`apps/web/src/app/book/page.tsx`)
Мультишаговый мастер (5 шагов):
1. Выбор услуги
2. Выбор барбера
3. Выбор даты и времени
4. Контактные данные
5. Подтверждение + Success экран

Пока работает на моковых данных. После подключения БД нужно добавить API вызовы.

---

## 🐛 ИСПРАВЛЕННЫЕ БАГИ

| # | Проблема | Решение |
|---|---------|---------|
| 1 | `npm run dev` — "Missing script" | Добавлен `"dev": "npm run dev --workspace=web"` в корневой `package.json` |
| 2 | Internal Server Error на localhost:3000 | `.git` был в `apps/web` (создан `create-next-app`). Удалён, `git init` в корне |
| 3 | `images.unsplash.com` не грузились | `next.config.ts` → `images.remotePatterns` с доменом unsplash |
| 4 | Карточки услуг накладывались друг на друга | Stacked cards → fullscreen sections (100vh) без pin/pinSpacing:false |

---

## ✅ СТАТУС ЗАДАЧ (по tasks-final.md)

### Stage 1 — Frontend ✅ DONE
- Главная страница (hero, секции, навигация)
- TailwindCSS v4 + дизайн-система
- Google Fonts (Outfit)

### Stage 2 — Booking UX ✅ DONE
- Мультишаговый флоу `/book`
- Выбор услуги, барбера, даты/времени, контактов
- Экран подтверждения и success

### Stage 3 — Database 🔄 IN PROGRESS
- [x] `prisma/schema.prisma` — полная схема всех таблиц
- [x] `.env.example` — шаблон переменных
- [x] `prisma/seed.ts` — сид-данные
- [ ] Создать `.env` с реальными ключами Supabase ← **НУЖНО ОТ ПОЛЬЗОВАТЕЛЯ**
- [ ] `npx prisma db push` — накатить схему
- [ ] `npx prisma db seed` — залить моковые данные
- [ ] Prisma Client в `apps/web/src/lib/db.ts`
- [ ] API Routes для загрузки барберов/услуг/слотов

### Stage 4 — Backend/API ⏳ NOT STARTED
- Route Handlers (`/api/bookings`, `/api/barbers`, `/api/slots`)
- Валидация (zod)
- Транзакции записи

### Stage 5 — Auth ⏳ NOT STARTED
- NextAuth или кастомная JWT авторизация для `/admin`

### Stage 6 — Telegram Bot ⏳ NOT STARTED
- Webhook для уведомлений о записях
- Напоминания за день и за 30 минут

### Stage 7 — Admin Panel ⏳ NOT STARTED
- Просмотр/управление записями
- Управление расписанием барберов

---

## 📦 УСТАНОВЛЕННЫЕ ПАКЕТЫ

### В корне:
```json
{
  "devDependencies": {
    "@prisma/client": "^7.10.0",
    "prisma": "^8.0.0-rc.19",
    "tsx": "^4.23.15"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### В `apps/web`:
```json
{
  "dependencies": {
    "next": "16.3.8",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "gsap": "^3.x",
    "@gsap/react": "^2.x",
    "lenis": "^1.x"
  }
}
```

---

## 🔑 КЛЮЧЕВЫЕ АРХИТЕКТУРНЫЕ РЕШЕНИЯ

1. **Git в корне** — обязательно. Turbopack определяет workspace root по `.git`.
2. **Один RAF loop** — Lenis синхронизирован с `gsap.ticker`. Никогда не создавать отдельные `requestAnimationFrame`.
3. **CLS = 0 для pin** — первый pin (Hero) стоит первым на странице, поэтому сдвига нет. Для остальных секций использовать `position: sticky` если нужен pin.
4. **SSR-safe GSAP** — весь GSAP код внутри `useGSAP` хука, никакого `window` на уровне модуля.
5. **Доступность split text** — `aria-label` на родителе + `aria-hidden` на отдельных строках.
6. **Видео в hero** — `autoPlay muted loop playsInline` — обязательны для автовоспроизведения.
7. **Snapshot в bookings** — `booking_services` хранит name/price/duration на момент записи (защита от изменения прайса).

---

## 🛠️ БЫСТРАЯ НАВИГАЦИЯ ПО ФАЙЛАМ

| Нужно | Файл |
|-------|------|
| Изменить цвета/шрифт | `apps/web/src/app/globals.css` |
| Изменить hero / секции главной | `apps/web/src/app/page.tsx` |
| Изменить мастер записи | `apps/web/src/app/book/page.tsx` |
| Изменить layout/шрифт | `apps/web/src/app/layout.tsx` |
| Изменить скролл | `apps/web/src/components/SmoothScroll.tsx` |
| Изменить схему БД | `prisma/schema.prisma` |
| Изменить сидовые данные | `prisma/seed.ts` |
| Изменить домены картинок | `apps/web/next.config.ts` |
| Добавить env-переменную | `.env` (локально) + `.env.example` (в репо) |

---

*Последнее обновление: 2026-10-02*
