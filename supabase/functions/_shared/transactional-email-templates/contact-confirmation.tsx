import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props {
  customerName?: string
  ticketRef?: string
  subject?: string
  message?: string
}

const ContactConfirmationEmail = ({ customerName, ticketRef, subject, message }: Props) => (
  <BrandEmail
    preview="We've received your message"
    greeting={customerName || 'there'}
    heading="Thanks — we've received your message"
  >
    <Text style={styles.text}>
      Thank you for getting in touch with Digiformation Ltd. Our team has received your
      enquiry and will reply by email within one working day.
    </Text>
    <SectionTitle>Your reference</SectionTitle>
    <Card>
      <CardLine label="Reference" value={ticketRef} />
      <CardLine label="Topic" value={subject} />
    </Card>
    {message && (
      <>
        <SectionTitle>Message you sent</SectionTitle>
        <Text style={styles.text}>{message}</Text>
      </>
    )}
    <Text style={styles.text}>
      If your matter is urgent, you can reach us on WhatsApp at +44 7438 632132.
    </Text>
  </BrandEmail>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: (d: Record<string, any>) =>
    `We've received your message${d.ticketRef ? ` — ${d.ticketRef}` : ''}`,
  displayName: 'Contact form acknowledgement',
  previewData: {
    customerName: 'Jane',
    ticketRef: 'GBQ2606123456',
    subject: 'UK LTD formation enquiry',
    message: 'Hi, I would like to know more about your Silver package.',
  },
} satisfies TemplateEntry
