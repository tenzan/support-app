import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler'
import { auth } from './routes/auth'
import { departmentsRouter } from './routes/departments'
import { categoriesRouter } from './routes/categories'
import { ticketsRouter } from './routes/tickets'
import { attachmentsRouter } from './routes/attachments'
import { webhooksRouter } from './routes/webhooks'
import { availabilityTemplatesRouter } from './routes/availability-templates'
import { availabilityRouter } from './routes/availability'
import { bookingsRouter } from './routes/bookings'

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

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use('*', errorHandler)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/api/auth', auth)
app.route('/api/departments', departmentsRouter)
app.route('/api/categories', categoriesRouter)
app.route('/api/tickets', ticketsRouter)
app.route('/api/attachments', attachmentsRouter)
app.route('/api/webhooks', webhooksRouter)
app.route('/api/availability-templates', availabilityTemplatesRouter)
app.route('/api/availability', availabilityRouter)
app.route('/api/bookings', bookingsRouter)

// Dev-only seed route
app.post('/api/dev/seed', async (c) => {
  const { seed } = await import('./db/seed')
  const result = await seed(c.env.DB)
  return c.json(result)
})

export default app
