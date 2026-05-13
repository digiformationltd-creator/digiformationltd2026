import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props {
  customerName?: string
  companyName?: string
  companyNumber?: string
  dueDate?: string
  daysRemaining?: number | string
}

const ConfirmationStatementReminderEmail = ({ customerName, companyName, companyNumber, dueDate, daysRemaining }: Props) => (
  <BrandEmail
    preview={`Your Confirmation Statement is due soon`}
    greeting={customerName || 'Director'}
    heading={`Reminder: Your Confirmation Statement is Due Soon`}
  >
    <Text style={styles.text}>
      This is a courtesy reminder from Digiformation Ltd that your company's annual <strong>Confirmation Statement (CS01)</strong>{' '}
      is approaching its filing deadline with Companies House. Filing on time keeps your company in good standing
      and avoids late filing penalties or the risk of being struck off the register.
    </Text>
    <SectionTitle>Filing Details:</SectionTitle>
    <Card>
      <CardLine label="Company Name" value={companyName} />
      <CardLine label="Company Number" value={companyNumber} />
      <CardLine label="Confirmation Statement Due" value={dueDate} />
      {daysRemaining !== undefined && <CardLine label="Days Remaining" value={String(daysRemaining)} />}
    </Card>
    <Text style={styles.text}>
      Our team can prepare and submit your Confirmation Statement on your behalf. Simply log in to your
      client portal and request the service, or reply to this email and we will take care of the entire process —
      including the £34 Companies House fee, verification of officers and shareholders, and confirmation of your SIC codes.
    </Text>
    <Text style={styles.muted}>
      Please act before the due date. Failure to file the Confirmation Statement is a criminal offence and
      may lead to your company being struck off.
    </Text>
  </BrandEmail>
)

export const template = {
  component: ConfirmationStatementReminderEmail,
  subject: 'Reminder: Confirmation Statement Filing Due Soon',
  displayName: 'Confirmation statement reminder',
  previewData: {
    customerName: 'Sanaullah Malik',
    companyName: 'Acme Trading Ltd',
    companyNumber: '12345678',
    dueDate: '2026-06-15',
    daysRemaining: 21,
  },
} satisfies TemplateEntry
