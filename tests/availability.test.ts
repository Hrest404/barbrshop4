import test from 'node:test'
import assert from 'node:assert'
import { getAvailableSlots } from '../apps/api/src/availability'
import { prisma } from '../apps/api/src/prisma'

test('availability engine tests', async (t) => {
  // Get a barber and service for the test
  const barber = await prisma.barbers.findFirst({ where: { is_active: true } })
  const service = await prisma.services.findFirst({ where: { is_active: true } })
  
  if (!barber || !service) {
    assert.fail('Database not seeded')
  }

  // Find a day in the future to test
  const testDate = new Date()
  testDate.setUTCDate(testDate.getUTCDate() + 10)
  // Ensure it's a weekday that the barber works. For simplicity, we just query until we find a working day,
  // or we can just mock the database. But since we are connected to a real DB, let's just query available days.
  
  await t.test('returns slots for a valid day', async () => {
    // Find a valid day by querying getAvailableSlots for next 10 days
    let validDateStr = ''
    let slots = []
    
    for (let i = 1; i <= 14; i++) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      
      slots = await getAvailableSlots({
        date: dateStr,
        barberId: barber.id,
        serviceIds: [service.id]
      })
      
      if (slots.length > 0) {
        validDateStr = dateStr
        break
      }
    }
    
    assert.ok(slots.length > 0, 'Should return available slots for a working day')
    assert.strictEqual(slots[0].barberId, barber.id, 'Slot should belong to the requested barber')
  })
  
  await t.test('respects min_notice_min', async () => {
    // Try to get slots for today
    const dateStr = new Date().toISOString().split('T')[0]
    const slots = await getAvailableSlots({
      date: dateStr,
      barberId: barber.id,
      serviceIds: [service.id]
    })
    
    // Any returned slot must be AT LEAST min_notice_min (default 30m) in the future
    const now = new Date()
    for (const slot of slots) {
      const slotTime = new Date(`${dateStr}T${slot.time}:00Z`)
      const diffMin = (slotTime.getTime() - now.getTime()) / 60000
      assert.ok(diffMin >= 30, `Slot at ${slot.time} is too soon (${diffMin} min from now)`)
    }
  })
})
