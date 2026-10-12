import { prisma } from './prisma'

/** Время в минутах от начала дня (00:00) */
function toMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes()
}

export interface Slot {
  time: string // "HH:MM"
  barberId: string
}

export interface AvailabilityInput {
  date: string       // "YYYY-MM-DD"
  barberId?: string  // uuid или undefined = любой
  serviceIds: string[]
}

/**
 * Возвращает список свободных временных слотов для заданного дня.
 */
export async function getAvailableSlots(input: AvailabilityInput): Promise<Slot[]> {
  const { date, barberId, serviceIds } = input

  // 1. Настройки из таблицы settings
  const settingsRows = await prisma.settings.findMany({
    where: { key: { in: ['slot_step_min', 'min_notice_min', 'booking_horizon_days', 'timezone'] } }
  })
  const settings: Record<string, string> = {}
  for (const row of settingsRows) settings[row.key] = row.value

  const slotStep = parseInt(settings['slot_step_min'] ?? '15')
  const minNotice = parseInt(settings['min_notice_min'] ?? '30')
  const horizonDays = parseInt(settings['booking_horizon_days'] ?? '30')

  // 2. Определяем временной диапазон для запрошенного дня
  const targetDay = new Date(date + 'T00:00:00Z')
  const now = new Date()
  
  // Проверяем горизонт бронирования
  const maxDate = new Date(now)
  maxDate.setUTCDate(maxDate.getUTCDate() + horizonDays)
  if (targetDay > maxDate) return []

  // 3. Считаем суммарную длительность услуг
  const services = await prisma.services.findMany({
    where: { id: { in: serviceIds }, is_active: true }
  })
  if (services.length === 0) return []
  const totalDuration = services.reduce((sum, s) => sum + s.duration_min, 0)

  // 4. Определяем барберов для проверки
  const allBarbers = await prisma.barbers.findMany({
    where: {
      is_active: true,
      ...(barberId ? { id: barberId } : {})
    }
  })
  if (allBarbers.length === 0) return []

  const dayOfWeek = targetDay.getUTCDay() // 0=Sun, 6=Sat

  const slots: Slot[] = []

  for (const barber of allBarbers) {
    // 5. Рабочие часы барбера
    const wh = await prisma.working_hours.findUnique({
      where: { barber_id_weekday: { barber_id: barber.id, weekday: dayOfWeek } }
    })
    if (!wh) continue // Барбер не работает в этот день

    const workStart = toMinutes(wh.start_time)
    const workEnd = toMinutes(wh.end_time)

    // 6. Перерывы барбера
    const barberBreaks = await prisma.breaks.findMany({
      where: { barber_id: barber.id, weekday: dayOfWeek }
    })

    // 7. time_off (и для барбера, и для всего барбершопа)
    const dayStart = new Date(date + 'T00:00:00Z')
    const dayEnd = new Date(date + 'T23:59:59Z')
    const timeOffs = await prisma.time_off.findMany({
      where: {
        OR: [
          { barber_id: barber.id },
          { barber_id: null }
        ],
        starts_at: { lte: dayEnd },
        ends_at: { gte: dayStart }
      }
    })

    // 8. Существующие бронирования
    const existingBookings = await prisma.bookings.findMany({
      where: {
        barber_id: barber.id,
        status: { in: ['confirmed', 'completed'] },
        starts_at: { lt: dayEnd },
        ends_at: { gt: dayStart }
      }
    })

    // 9. Перебираем слоты с шагом slotStep
    for (let slotMin = workStart; slotMin + totalDuration <= workEnd; slotMin += slotStep) {
      const slotEndMin = slotMin + totalDuration

      // Проверяем min_notice_min
      const slotAbsoluteStart = new Date(targetDay)
      slotAbsoluteStart.setUTCMinutes(slotAbsoluteStart.getUTCMinutes() + slotMin)
      const minAllowedTime = new Date(now.getTime() + minNotice * 60 * 1000)
      if (slotAbsoluteStart < minAllowedTime) continue

      // Проверяем перерывы
      const blockedByBreak = barberBreaks.some(br => {
        const brStart = toMinutes(br.start_time)
        const brEnd = toMinutes(br.end_time)
        return slotMin < brEnd && slotEndMin > brStart
      })
      if (blockedByBreak) continue

      // Проверяем time_off
      const slotAbsoluteEnd = new Date(slotAbsoluteStart.getTime() + totalDuration * 60 * 1000)
      const blockedByTimeOff = timeOffs.some(to => {
        return slotAbsoluteStart < to.ends_at && slotAbsoluteEnd > to.starts_at
      })
      if (blockedByTimeOff) continue

      // Проверяем существующие записи
      const blockedByBooking = existingBookings.some(b => {
        return slotAbsoluteStart < b.ends_at && slotAbsoluteEnd > b.starts_at
      })
      if (blockedByBooking) continue

      // Слот свободен!
      const hh = String(Math.floor(slotMin / 60)).padStart(2, '0')
      const mm = String(slotMin % 60).padStart(2, '0')
      slots.push({ time: `${hh}:${mm}`, barberId: barber.id })
    }
  }

  // Убираем дубли времени (когда несколько барберов доступны в один слот — barberId=any)
  const unique = new Map<string, Slot>()
  for (const slot of slots) {
    if (!unique.has(slot.time)) unique.set(slot.time, slot)
  }

  return Array.from(unique.values()).sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * Возвращает список дат (YYYY-MM-DD) с хотя бы одним свободным слотом
 * на горизонте booking_horizon_days.
 */
export async function getAvailableDays(input: { barberId?: string; serviceIds: string[] }): Promise<string[]> {
  const settingsRows = await prisma.settings.findMany({
    where: { key: 'booking_horizon_days' }
  })
  const horizonDays = parseInt(settingsRows[0]?.value ?? '30')

  const result: string[] = []
  const today = new Date()

  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() + i)
    const dateStr = d.toISOString().split('T')[0]

    const available = await getAvailableSlots({
      date: dateStr,
      barberId: input.barberId,
      serviceIds: input.serviceIds,
    })

    if (available.length > 0) result.push(dateStr)
  }

  return result
}
