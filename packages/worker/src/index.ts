import { Hono } from 'hono'
import { cors } from 'hono/cors'

export type Env = {
  DB: D1Database
  ATTACHMENTS: R2Bucket
  RESEND_API_KEY: string
  RESEND_WEBHOOK_SECRET: string
  SESSION_SECRET: string
  SUPPORT_FROM_EMAIL: string
  REPLY_TO_DOMAIN: string
  APP_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default app
