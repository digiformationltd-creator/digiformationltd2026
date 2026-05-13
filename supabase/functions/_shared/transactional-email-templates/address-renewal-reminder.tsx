import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props {
  customerName?: string
  address?: string
  expireDate?: string
  daysRemaining?: number | string
}

const AddressRenewalReminderEmail = ({ customerName, address, expireDate, daysRemaining }: Props) => (
  <BrandEmail
    preview={`Your registered office address is expiring soon`}
    greeting={customerName || 'Customer'}
    heading={`Reminder: Your Registered Office Address is Expiring Soon`}
  >
    <Text style={styles.text}>
      This is a friendly reminder that your registered office address subscription with Digiformation Ltd
      is approaching its expiry date. To avoid any disruption to your statutory mail handling and to
      keep your company records compliant with Companies House, please renew your address service before it lapses.
    </Text>
    <SectionTitle>Address Details:</SectionTitle>
    <Card>
      <CardLine label="Registered Address" value={address} />
      <CardLine label="Expiry Date" value={expireDate} />
      {daysRemaining !== undefined && <CardLine label="Days Remaining" value={String(daysRemaining)} />}
      <CardLine label="Status" value="Active — Renewal Due" />
    </Card>
    <Text style={styles.text}>
      To renew, simply log in to your client portal and click the <strong>Renew Address</strong> button,
      or reply to this email and our team will assist you. Renewing on time ensures your company continues
      to receive all official correspondence at a professional London address without interruption.
    </Text>
    <Text style={styles.muted}>
      If your address expires without renewal, the service will be marked as inactive and any mail received
      thereafter will not be forwarded.
    </Text>
  </BrandEmail>
)

export const template = {
  component: AddressRenewalReminderEmail,
  subject: 'Reminder: Your Registered Office Address is Expiring Soon',
  displayName: 'Address renewal reminder',
  previewData: {
    customerName: 'Sanaullah Malik',
    address: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    expireDate: '2026-06-30',
    daysRemaining: 30,
  },
} satisfies TemplateEntry
