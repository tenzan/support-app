import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { users, sessions } from '../db/schema'
import { generateId } from '../lib/id'
import { UnauthorizedError, NotFoundError } from '../lib/errors'
import type { UserRole } from '@support-app/shared'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hashArray = new Uint8Array(derivedBits)
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHashHex] = stored.split(':')
  if (!saltHex || !storedHashHex) return false

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex === storedHashHex
}

export class AuthService {
  private db

  constructor(d1: D1Database) {
    this.db = drizzle(d1)
  }

  async login(email: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Create session
    const token = generateId() + '-' + generateId()
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

    await this.db.insert(sessions).values({
      id: sessionId,
      user_id: user.id,
      token,
      expires_at: expiresAt,
    })

    return {
      token,
      expires_at: expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
      },
    }
  }

  async validateSession(token: string) {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1)

    if (!session) {
      throw new UnauthorizedError('Invalid session')
    }

    if (new Date(session.expires_at) < new Date()) {
      await this.db.delete(sessions).where(eq(sessions.id, session.id))
      throw new UnauthorizedError('Session expired')
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, session.user_id))
      .limit(1)

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    }
  }

  async logout(token: string) {
    await this.db.delete(sessions).where(eq(sessions.token, token))
  }

  async createUser(input: {
    email: string
    name: string
    password: string
    role: UserRole
  }) {
    const passwordHash = await hashPassword(input.password)
    const id = generateId()

    await this.db.insert(users).values({
      id,
      email: input.email,
      name: input.name,
      password_hash: passwordHash,
      role: input.role,
    })

    return { id, email: input.email, name: input.name, role: input.role }
  }
}
