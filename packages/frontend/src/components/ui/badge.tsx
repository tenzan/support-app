import { clsx } from 'clsx'

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  open: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  waiting_on_customer: 'bg-orange-100 text-orange-800',
  scheduled: 'bg-purple-100 text-purple-800',
  resolved: 'bg-gray-100 text-gray-800',
  closed: 'bg-gray-200 text-gray-600',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'status' | 'priority' | 'default'
  value?: string
  className?: string
}

export function Badge({ children, variant = 'default', value, className }: BadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700'

  if (variant === 'status' && value) {
    colorClass = statusColors[value] || colorClass
  } else if (variant === 'priority' && value) {
    colorClass = priorityColors[value] || colorClass
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {children}
    </span>
  )
}
