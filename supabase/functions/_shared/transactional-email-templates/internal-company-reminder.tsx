import * as React from 'npm:react@18.3.1'
import { Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, styles, GREY_LIGHT, GREY_PANEL, MUTED } from './_brand.tsx'

interface Props {
  companyName?: string
  companyNumber?: string
  reminderType?: string
  dueDate?: string
  daysRemaining?: number
  registeredAddress?: string
  status?: string
}

const labels: Record<string, string> = {
  confirmation_statement: 'Confirmation Statement filing',
  annual_accounts: 'Annual Accounts filing',
  address_expiry: 'Registered Address renewal',
}

const InternalCompanyReminder = ({
  companyName, companyNumber, reminderType, dueDate, daysRemaining, registeredAddress, status,
}: Props) => {
  const label = labels[reminderType || ''] || reminderType || 'compliance deadline'
  const urgent = (daysRemaining ?? 99) <= 3
  return (
    <BrandEmail
      preview={`Internal: ${companyName} — ${label} in ${daysRemaining} day(s)`}
      heading={`Internal Reminder — ${label}`}
    >
      <Text style={styles.text}>
        This is an <strong>internal admin reminder</strong> for the DigiFormation managed company inventory.
        It has not been sent to any customer.
      </Text>

      <Section style={box(urgent)}>
        <Text style={summaryHead}>{companyName}</Text>
        {companyNumber && <Text style={summarySub}>Company Number: {companyNumber}</Text>}
        {status && <Text style={summarySub}>Status: {status}</Text>}
        <Text style={summaryRow}><strong>{label}</strong> due in <strong>{daysRemaining}</strong> day{daysRemaining === 1 ? '' : 's'}</Text>
        <Text style={summarySub}>Due date: {dueDate}</Text>
        {registeredAddress && <Text style={summarySub}>Registered address: {registeredAddress}</Text>}
      </Section>

      <Text style={styles.muted}>
        Open the admin portal → Managed Companies to take action or mark the company as sold out to stop future reminders.
      </Text>
    </BrandEmail>
  )
}

export const template = {
  component: InternalCompanyReminder,
  subject: (d: Record<string, any>) =>
    `[Internal] ${d.companyName || 'Company'} — ${(labels[d.reminderType] || 'compliance')} due in ${d.daysRemaining}d`,
  displayName: 'Internal company reminder (admin only)',
  to: 'digiformationltd@gmail.com',
  previewData: {
    companyName: 'Example Trading Ltd',
    companyNumber: '12345678',
    reminderType: 'confirmation_statement',
    dueDate: '2026-04-30',
    daysRemaining: 14,
    registeredAddress: '1 Example St, London, EC1A 1AA',
    status: 'available',
  },
} satisfies TemplateEntry

const box = (urgent: boolean) => ({
  background: urgent ? '#fef2f2' : GREY_PANEL,
  borderLeft: `4px solid ${urgent ? '#ef4444' : '#3b82f6'}`,
  padding: '14px 18px',
  borderRadius: '6px',
  margin: '12px 0 20px',
})
const summaryHead = { fontSize: '16px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 4px' }
const summaryRow = { fontSize: '14px', color: '#111827', margin: '8px 0 4px' }
const summarySub = { fontSize: '12px', color: MUTED, margin: '2px 0' }
