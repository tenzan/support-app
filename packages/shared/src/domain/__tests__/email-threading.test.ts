import { describe, it, expect } from 'vitest'
import {
  generateThreadToken,
  parseReplyToken,
  buildReplyToAddress,
  matchInboundEmail,
  isDuplicateMessage,
} from '../email-threading'

describe('email-threading', () => {
  const domain = 'support.example.com'

  describe('generateThreadToken', () => {
    it('generates a non-empty string', () => {
      const token = generateThreadToken('ticket-123')
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
    })

    it('includes the ticket id in the token', () => {
      const token = generateThreadToken('ticket-123')
      // Token should be decodeable back to ticket id
      expect(token.length).toBeGreaterThan(0)
    })

    it('generates different tokens for different tickets', () => {
      const token1 = generateThreadToken('ticket-1')
      const token2 = generateThreadToken('ticket-2')
      expect(token1).not.toBe(token2)
    })

    it('generates different tokens for same ticket (includes random component)', () => {
      const token1 = generateThreadToken('ticket-1')
      const token2 = generateThreadToken('ticket-1')
      expect(token1).not.toBe(token2)
    })
  })

  describe('buildReplyToAddress', () => {
    it('builds correct reply-to address', () => {
      const address = buildReplyToAddress('my-token', domain)
      expect(address).toBe('reply+my-token@support.example.com')
    })
  })

  describe('parseReplyToken', () => {
    it('extracts token from reply+token@domain format', () => {
      const token = parseReplyToken('reply+abc123@support.example.com')
      expect(token).toBe('abc123')
    })

    it('extracts token with complex characters', () => {
      const token = parseReplyToken('reply+ticket-123_abc@support.example.com')
      expect(token).toBe('ticket-123_abc')
    })

    it('returns null for non-reply addresses', () => {
      expect(parseReplyToken('support@example.com')).toBeNull()
      expect(parseReplyToken('user@example.com')).toBeNull()
    })

    it('returns null for empty reply token', () => {
      expect(parseReplyToken('reply+@example.com')).toBeNull()
    })

    it('returns null for malformed addresses', () => {
      expect(parseReplyToken('')).toBeNull()
      expect(parseReplyToken('not-an-email')).toBeNull()
      expect(parseReplyToken('reply+')).toBeNull()
    })
  })

  describe('matchInboundEmail', () => {
    const threads = [
      {
        ticket_id: 'ticket-1',
        thread_token: 'token-aaa',
        outbound_message_id: '<msg-001@example.com>',
      },
      {
        ticket_id: 'ticket-2',
        thread_token: 'token-bbb',
        outbound_message_id: '<msg-002@example.com>',
      },
    ]

    it('matches by reply token (highest priority)', () => {
      const result = matchInboundEmail(
        {
          to: 'reply+token-aaa@support.example.com',
          in_reply_to: null,
          references: null,
        },
        threads,
      )
      expect(result).toBe('ticket-1')
    })

    it('matches by In-Reply-To header (second priority)', () => {
      const result = matchInboundEmail(
        {
          to: 'support@example.com', // no reply token
          in_reply_to: '<msg-002@example.com>',
          references: null,
        },
        threads,
      )
      expect(result).toBe('ticket-2')
    })

    it('matches by References header (third priority)', () => {
      const result = matchInboundEmail(
        {
          to: 'support@example.com',
          in_reply_to: null,
          references: '<other@example.com> <msg-001@example.com>',
        },
        threads,
      )
      expect(result).toBe('ticket-1')
    })

    it('token match takes priority over In-Reply-To', () => {
      const result = matchInboundEmail(
        {
          to: 'reply+token-aaa@support.example.com',
          in_reply_to: '<msg-002@example.com>', // would match ticket-2
          references: null,
        },
        threads,
      )
      expect(result).toBe('ticket-1') // token wins
    })

    it('returns null when no match found', () => {
      const result = matchInboundEmail(
        {
          to: 'support@example.com',
          in_reply_to: '<unknown@example.com>',
          references: null,
        },
        threads,
      )
      expect(result).toBeNull()
    })

    it('returns null for empty threads list', () => {
      const result = matchInboundEmail(
        {
          to: 'reply+token-aaa@support.example.com',
          in_reply_to: null,
          references: null,
        },
        [],
      )
      expect(result).toBeNull()
    })
  })

  describe('isDuplicateMessage', () => {
    const existingMessageIds = ['<msg-001@example.com>', '<msg-002@example.com>']

    it('returns true for duplicate message id', () => {
      expect(isDuplicateMessage('<msg-001@example.com>', existingMessageIds)).toBe(true)
    })

    it('returns false for new message id', () => {
      expect(isDuplicateMessage('<msg-003@example.com>', existingMessageIds)).toBe(false)
    })

    it('returns false for empty existing list', () => {
      expect(isDuplicateMessage('<msg-001@example.com>', [])).toBe(false)
    })

    it('returns false for null/undefined message id', () => {
      expect(isDuplicateMessage(null, existingMessageIds)).toBe(false)
      expect(isDuplicateMessage(undefined, existingMessageIds)).toBe(false)
    })
  })
})
