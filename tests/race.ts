import 'dotenv/config'

const API_URL = 'http://localhost:4000/api/v1/bookings'

async function runRaceTest() {
  console.log('Fetching barbers and services...')
  
  const barbersRes = await fetch('http://localhost:4000/api/v1/barbers')
  const barbers = await barbersRes.json()
  const barberId = barbers[0]?.id
  
  const servicesRes = await fetch('http://localhost:4000/api/v1/services')
  const services = await servicesRes.json()
  const serviceId = services[0]?.id

  if (!barberId || !serviceId) {
    console.error('No barbers or services found in the database. Run seed first.')
    process.exit(1)
  }

  // Find a date slightly in the future
  const targetDate = new Date()
  targetDate.setUTCDate(targetDate.getUTCDate() + 3)
  const dateStr = targetDate.toISOString().split('T')[0]
  const timeStr = '12:00'

  console.log(`Simulating 10 concurrent users trying to book barber ${barberId} on ${dateStr} at ${timeStr}...`)

  const requests = Array.from({ length: 10 }).map((_, i) => {
    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceIds: [serviceId],
        barberId: barberId,
        date: dateStr,
        time: timeStr,
        clientName: `Race Tester ${i}`,
        clientPhone: `+9989000000${i.toString().padStart(2, '0')}`
      })
    }).then(res => res.json().then(data => ({ status: res.status, data })))
  })

  const results = await Promise.all(requests)

  const successCount = results.filter(r => r.status === 200).length
  const conflictCount = results.filter(r => r.status === 409).length
  const errorCount = results.filter(r => r.status !== 200 && r.status !== 409).length

  console.log('\n--- Race Test Results ---')
  console.log(`Success (200): ${successCount}`)
  console.log(`Conflict (409): ${conflictCount}`)
  console.log(`Other Errors: ${errorCount}`)

  if (successCount === 1 && conflictCount === 9) {
    console.log('\n✅ TEST PASSED: Exactly 1 booking succeeded, the rest were prevented by btree_gist overlap constraint.')
  } else {
    console.log('\n❌ TEST FAILED: Overlap constraint did not behave as expected.')
    console.log(results)
  }
}

runRaceTest().catch(console.error)
