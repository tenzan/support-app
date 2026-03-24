import { describe, it, expect } from 'vitest'
import {
  canViewTicket,
  canUpdateTicket,
  canAddInternalNote,
  canViewInternalNotes,
  canAssignTicket,
  canManageDepartments,
  canManageCategories,
  canManageScheduling,
  canManageUsers,
  canDeleteTicket,
  canChangeTicketStatus,
  canManageAvailabilityTemplates,
} from '../permissions'
import { UserRole } from '../../constants'

describe('permissions', () => {
  describe('canViewTicket', () => {
    it('super_admin can view any ticket', () => {
      expect(canViewTicket(UserRole.SUPER_ADMIN, 'user-1', 'other-user')).toBe(true)
    })

    it('admin can view any ticket', () => {
      expect(canViewTicket(UserRole.ADMIN, 'user-1', 'other-user')).toBe(true)
    })

    it('agent can view any ticket', () => {
      expect(canViewTicket(UserRole.AGENT, 'user-1', 'other-user')).toBe(true)
    })

    it('customer can only view own tickets', () => {
      expect(canViewTicket(UserRole.CUSTOMER, 'user-1', 'user-1')).toBe(true)
      expect(canViewTicket(UserRole.CUSTOMER, 'user-1', 'other-user')).toBe(false)
    })
  })

  describe('canUpdateTicket', () => {
    it('super_admin can update any ticket', () => {
      expect(canUpdateTicket(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can update any ticket', () => {
      expect(canUpdateTicket(UserRole.ADMIN)).toBe(true)
    })

    it('agent can update tickets', () => {
      expect(canUpdateTicket(UserRole.AGENT)).toBe(true)
    })

    it('customer cannot update tickets', () => {
      expect(canUpdateTicket(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canAddInternalNote', () => {
    it('super_admin can add internal notes', () => {
      expect(canAddInternalNote(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can add internal notes', () => {
      expect(canAddInternalNote(UserRole.ADMIN)).toBe(true)
    })

    it('agent can add internal notes', () => {
      expect(canAddInternalNote(UserRole.AGENT)).toBe(true)
    })

    it('customer cannot add internal notes', () => {
      expect(canAddInternalNote(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canViewInternalNotes', () => {
    it('super_admin can view internal notes', () => {
      expect(canViewInternalNotes(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can view internal notes', () => {
      expect(canViewInternalNotes(UserRole.ADMIN)).toBe(true)
    })

    it('agent can view internal notes', () => {
      expect(canViewInternalNotes(UserRole.AGENT)).toBe(true)
    })

    it('customer cannot view internal notes', () => {
      expect(canViewInternalNotes(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canAssignTicket', () => {
    it('super_admin can assign tickets', () => {
      expect(canAssignTicket(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can assign tickets', () => {
      expect(canAssignTicket(UserRole.ADMIN)).toBe(true)
    })

    it('agent cannot assign tickets', () => {
      expect(canAssignTicket(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot assign tickets', () => {
      expect(canAssignTicket(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canManageDepartments', () => {
    it('super_admin can manage departments', () => {
      expect(canManageDepartments(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can manage departments', () => {
      expect(canManageDepartments(UserRole.ADMIN)).toBe(true)
    })

    it('agent cannot manage departments', () => {
      expect(canManageDepartments(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot manage departments', () => {
      expect(canManageDepartments(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canManageCategories', () => {
    it('super_admin can manage categories', () => {
      expect(canManageCategories(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can manage categories', () => {
      expect(canManageCategories(UserRole.ADMIN)).toBe(true)
    })

    it('agent cannot manage categories', () => {
      expect(canManageCategories(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot manage categories', () => {
      expect(canManageCategories(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canManageScheduling', () => {
    it('super_admin can manage scheduling', () => {
      expect(canManageScheduling(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can manage scheduling', () => {
      expect(canManageScheduling(UserRole.ADMIN)).toBe(true)
    })

    it('agent cannot manage scheduling', () => {
      expect(canManageScheduling(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot manage scheduling', () => {
      expect(canManageScheduling(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canManageUsers', () => {
    it('super_admin can manage users', () => {
      expect(canManageUsers(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin cannot manage users', () => {
      expect(canManageUsers(UserRole.ADMIN)).toBe(false)
    })

    it('agent cannot manage users', () => {
      expect(canManageUsers(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot manage users', () => {
      expect(canManageUsers(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canDeleteTicket', () => {
    it('super_admin can delete tickets', () => {
      expect(canDeleteTicket(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can delete tickets', () => {
      expect(canDeleteTicket(UserRole.ADMIN)).toBe(true)
    })

    it('agent cannot delete tickets', () => {
      expect(canDeleteTicket(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot delete tickets', () => {
      expect(canDeleteTicket(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canChangeTicketStatus', () => {
    it('super_admin can change any status', () => {
      expect(canChangeTicketStatus(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can change any status', () => {
      expect(canChangeTicketStatus(UserRole.ADMIN)).toBe(true)
    })

    it('agent can change status', () => {
      expect(canChangeTicketStatus(UserRole.AGENT)).toBe(true)
    })

    it('customer cannot change status', () => {
      expect(canChangeTicketStatus(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('canManageAvailabilityTemplates', () => {
    it('super_admin can manage templates', () => {
      expect(canManageAvailabilityTemplates(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('admin can manage templates', () => {
      expect(canManageAvailabilityTemplates(UserRole.ADMIN)).toBe(true)
    })

    it('agent cannot manage templates', () => {
      expect(canManageAvailabilityTemplates(UserRole.AGENT)).toBe(false)
    })

    it('customer cannot manage templates', () => {
      expect(canManageAvailabilityTemplates(UserRole.CUSTOMER)).toBe(false)
    })
  })
})
