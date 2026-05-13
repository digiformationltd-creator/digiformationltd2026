// Shared helpers to make reminder emails escalate as the deadline approaches.

export type UrgencyLevel = 'normal' | 'soon' | 'urgent' | 'final'

export function urgencyFor(days?: number | string): UrgencyLevel {
  const n = typeof days === 'string' ? Number(days) : days
  if (n === undefined || Number.isNaN(n as number)) return 'normal'
  const d = n as number
  if (d <= 1) return 'final'
  if (d <= 3) return 'urgent'
  if (d <= 14) return 'soon'
  return 'normal'
}

export function subjectPrefix(level: UrgencyLevel): string {
  switch (level) {
    case 'final': return 'FINAL NOTICE — '
    case 'urgent': return 'URGENT — '
    case 'soon': return 'Action Required — '
    default: return 'Reminder: '
  }
}

export function headingFor(level: UrgencyLevel, base: string): string {
  switch (level) {
    case 'final': return `FINAL NOTICE — ${base} (less than 24 hours left)`
    case 'urgent': return `URGENT — ${base} (only a few days remaining)`
    case 'soon': return `Action Required — ${base}`
    default: return base
  }
}

export function urgencyIntro(level: UrgencyLevel, days?: number | string): string | null {
  const n = typeof days === 'string' ? Number(days) : days
  switch (level) {
    case 'final':
      return `This is your FINAL reminder — less than 24 hours remain before the deadline. Please act today to avoid late filing penalties and the risk of your company being struck off.`
    case 'urgent':
      return `Only ${n ?? 'a few'} day(s) remain before the deadline. Please do not delay — file today or contact us immediately so we can act on your behalf.`
    case 'soon':
      return `The deadline is approaching fast. We strongly recommend acting this week to leave enough time for review and submission.`
    default:
      return null
  }
}
