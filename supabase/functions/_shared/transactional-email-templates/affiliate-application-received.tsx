import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props {
  customerName?: string
  applicationId?: string
  email?: string
  whatsapp?: string
}

const AffiliateApplicationReceivedEmail = ({ customerName, applicationId, email, whatsapp }: Props) => (
  <BrandEmail
    preview={`Affiliate application ${applicationId || ''} received`}
    greeting={customerName || 'Partner'}
    heading={`Thank you — your Affiliate Application has been Received`}
  >
    <Text style={styles.text}>
      Thanks for applying to the DigiFormation Partner Program. Our team will review your
      application and get back to you within 24–48 hours.
    </Text>
    <SectionTitle>Application Details:</SectionTitle>
    <Card>
      <CardLine label="Application #" value={applicationId} />
      <CardLine label="Name" value={customerName} />
      <CardLine label="Email" value={email} />
      <CardLine label="WhatsApp" value={whatsapp} />
      <CardLine label="Status" value="Under Review" />
    </Card>
    <Text style={styles.text}>
      A copy of your application PDF has been downloaded to your device for your records.
    </Text>
  </BrandEmail>
)

export const template = {
  component: AffiliateApplicationReceivedEmail,
  subject: (d: Record<string, any>) => `Affiliate Application Received${d.applicationId ? ` — ${d.applicationId}` : ''}`,
  displayName: 'Affiliate application received',
  previewData: { customerName: 'Jane Doe', applicationId: 'Application-0042', email: 'jane@example.com', whatsapp: '+44 7000 000000' },
} satisfies TemplateEntry
