import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'
import { urgencyFor, subjectPrefix, headingFor, urgencyIntro } from './_urgency.ts'

interface Props {
  customerName?: string
  companyName?: string
  companyNumber?: string
  dueDate?: string
  daysRemaining?: number | string
}

const AnnualAccountsReminderEmail = ({ customerName, companyName, companyNumber, dueDate, daysRemaining }: Props) => {
  const level = urgencyFor(daysRemaining)
  const intro = urgencyIntro(level, daysRemaining)
  return (
    <BrandEmail
      preview={`Your Annual Accounts are due soon`}
      greeting={customerName || 'Director'}
      heading={headingFor(level, 'Your Annual Accounts Filing is Due Soon')}
    >
      {intro && <Text style={{ ...styles.text, fontWeight: 'bold' }}>{intro}</Text>}
      <Text style={styles.text}>
        This is an important reminder from Digiformation Ltd that your company's <strong>Annual Accounts</strong>{' '}
        are approaching the filing deadline with Companies House. Submitting your accounts on time protects your
        company from late filing penalties (which start at £150 and rise to £1,500) and from the risk of being
        struck off the Companies House register.
      </Text>
      <SectionTitle>Filing Details:</SectionTitle>
      <Card>
        <CardLine label="Company Name" value={companyName} />
        <CardLine label="Company Number" value={companyNumber} />
        <CardLine label="Accounts Filing Due" value={dueDate} />
        {daysRemaining !== undefined && <CardLine label="Days Remaining" value={String(daysRemaining)} />}
      </Card>
      <Text style={styles.text}>
        Our experienced accountants can prepare and file your Annual Accounts (and your Corporation Tax return with HMRC)
        on your behalf — quickly, accurately, and fully compliant — starting from just <strong>£120</strong>. Simply log in
        to your client portal to request the service, or reply to this email and our team will guide you through the next steps.
      </Text>
      <Text style={styles.muted}>
        Please do not leave it until the last minute. Acting early gives us time to gather records, prepare statutory
        financial statements, and protect your company from penalties or strike-off action.
      </Text>
    </BrandEmail>
  )
}

export const template = {
  component: AnnualAccountsReminderEmail,
  subject: (d: Record<string, any>) => `${subjectPrefix(urgencyFor(d.daysRemaining))}Annual Accounts Filing Due`,
  displayName: 'Annual accounts reminder',
  previewData: {
    customerName: 'Sanaullah Malik',
    companyName: 'Acme Trading Ltd',
    companyNumber: '12345678',
    dueDate: '2026-09-30',
    daysRemaining: 45,
  },
} satisfies TemplateEntry
