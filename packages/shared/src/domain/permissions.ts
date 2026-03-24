import { UserRole } from '../constants'

const STAFF_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT]
const ADMIN_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN]

function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role)
}

function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function canViewTicket(role: UserRole, userId: string, requesterId: string): boolean {
  if (isStaff(role)) return true
  return userId === requesterId
}

export function canUpdateTicket(role: UserRole): boolean {
  return isStaff(role)
}

export function canAddInternalNote(role: UserRole): boolean {
  return isStaff(role)
}

export function canViewInternalNotes(role: UserRole): boolean {
  return isStaff(role)
}

export function canAssignTicket(role: UserRole): boolean {
  return isAdmin(role)
}

export function canManageDepartments(role: UserRole): boolean {
  return isAdmin(role)
}

export function canManageCategories(role: UserRole): boolean {
  return isAdmin(role)
}

export function canManageScheduling(role: UserRole): boolean {
  return isAdmin(role)
}

export function canManageUsers(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN
}

export function canDeleteTicket(role: UserRole): boolean {
  return isAdmin(role)
}

export function canChangeTicketStatus(role: UserRole): boolean {
  return isStaff(role)
}

export function canManageAvailabilityTemplates(role: UserRole): boolean {
  return isAdmin(role)
}
