import type { Context } from 'hono'
import type { ApiResponse, ApiError } from '@support-app/shared'
import { AppError } from './errors'

export function success<T>(c: Context, data: T, status: number = 200) {
  const body: ApiResponse<T> = { success: true, data }
  return c.json(body, status as any)
}

export function error(c: Context, err: AppError) {
  const body: ApiError = {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      details: err.details,
    },
  }
  return c.json(body, err.statusCode as any)
}
