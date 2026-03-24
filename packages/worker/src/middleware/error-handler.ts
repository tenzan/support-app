import { createMiddleware } from 'hono/factory'
import { AppError } from '../lib/errors'
import { error } from '../lib/response'

export const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next()
  } catch (err) {
    if (err instanceof AppError) {
      return error(c, err)
    }
    console.error('Unhandled error:', err)
    return error(c, new AppError('INTERNAL_ERROR', 'Internal server error', 500))
  }
})
