import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding data...')

  // 1. Создаем барберов
  const barberAlexander = await prisma.barbers.create({
    data: {
      name: 'Александр',
      experience_years: 5,
      is_active: true,
      sort_order: 1,
      photo_url: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=500&auto=format&fit=crop'
    }
  })

  const barberMikhail = await prisma.barbers.create({
    data: {
      name: 'Михаил',
      experience_years: 3,
      is_active: true,
      sort_order: 2,
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=format&fit=crop'
    }
  })

  // 2. Создаем услуги
  const serviceHaircut = await prisma.services.create({
    data: {
      name: 'Мужская стрижка',
      description: 'Классическая или модельная стрижка',
      duration_min: 60,
      price: 2500.0,
      sort_order: 1
    }
  })

  const serviceBeard = await prisma.services.create({
    data: {
      name: 'Стрижка бороды',
      description: 'Оформление бороды',
      duration_min: 45,
      price: 1500.0,
      sort_order: 2
    }
  })

  // 3. Привязываем услуги к барберам
  await prisma.barber_services.createMany({
    data: [
      { barber_id: barberAlexander.id, service_id: serviceHaircut.id },
      { barber_id: barberAlexander.id, service_id: serviceBeard.id },
      { barber_id: barberMikhail.id, service_id: serviceHaircut.id }
    ]
  })

  // 4. Создаем график работы (Александр работает Пн-Пт с 10:00 до 20:00)
  const weekdays = [1, 2, 3, 4, 5] // Пн-Пт
  for (const day of weekdays) {
    await prisma.working_hours.create({
      data: {
        barber_id: barberAlexander.id,
        weekday: day,
        start_time: new Date('1970-01-01T10:00:00Z'),
        end_time: new Date('1970-01-01T20:00:00Z'),
      }
    })
  }

  // 5. Создаем настройки (напр. timezone, cancel_cutoff_min)
  await prisma.settings.createMany({
    data: [
      { key: 'timezone', value: 'Asia/Tashkent' },
      { key: 'cancel_cutoff_min', value: '30' },
      { key: 'slot_step_min', value: '15' }
    ]
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
