import 'dotenv/config'
import { Bot, webhookCallback } from 'grammy'
import Fastify from 'fastify'
import bot from './bot'

const server = Fastify({ logger: true })

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

/**
 * Webhook-режим: используется в продакшне.
 * Telegram шлёт POST /telegram/webhook на наш сервер.
 */
server.post('/telegram/webhook', async (req, reply) => {
  // Проверяем секрет в заголовке (опционально, для безопасности)
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const handler = webhookCallback(bot, 'fastify')
  return handler(req, reply)
})

server.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  const port = Number(process.env.BOT_PORT ?? 4001)
  await server.listen({ port, host: '0.0.0.0' })
  console.log(`Webhook server listening on http://localhost:${port}`)
}

start()
