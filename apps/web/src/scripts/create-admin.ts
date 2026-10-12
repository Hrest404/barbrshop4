// Скрипт для создания первого администратора.
// Запуск: npx tsx apps/web/src/scripts/create-admin.ts

import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env') })

import argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const LOGIN = process.argv[2] ?? process.env.ADMIN_LOGIN ?? 'admin'
const PASSWORD = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? 'admin123'

async function main() {
  const hash = await argon2.hash(PASSWORD, { type: argon2.argon2id })

  const admin = await prisma.admin_users.upsert({
    where: { login: LOGIN },
    update: { password_hash: hash },
    create: { login: LOGIN, password_hash: hash },
  })

  console.log(`✅ Admin created/updated:`)
  console.log(`   Login:    ${LOGIN}`)
  console.log(`   Password: ${PASSWORD}`)
  console.log(`   ID:       ${admin.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
