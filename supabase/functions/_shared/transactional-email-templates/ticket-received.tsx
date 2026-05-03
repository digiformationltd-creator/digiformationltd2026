import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props { customerName?: string; ticketRef?: string; subject?: string; message?: string }

const TicketReceivedEmail = ({ customerName, ticketRef, subject, message }: Props) => (
  <BrandEmail
    preview={`Support ticket ${ticketRef || ''} received`}
    greeting={customerName || 'Customer'}
    heading={`Your Support Ticket has been Received`}
  >
    <Text style={styles.text}>
      Thank you for contacting us. Our team will review your ticket and respond within 24 hours.
    </Text>
    <SectionTitle>Ticket Details:</SectionTitle>
    <Card>
      <CardLine label="Ticket #" value={ticketRef} />
      <CardLine label="Subject" value={subject} />
      <CardLine label="Status" value="Open" />
    </Card>
    {message && (
      <>
        <SectionTitle>Your Message:</SectionTitle>
        <Text style={styles.text}>{message}</Text>
      </>
    )}
  </BrandEmail>
)

export const template = {
  component: TicketReceivedEmail,
  subject: (d: Record<string, any>) => `Ticket Received${d.ticketRef ? ` — ${d.ticketRef}` : ''}`,
  displayName: 'Ticket received',
  previewData: { customerName: 'Jane', ticketRef: 'TKT-123456', subject: 'Address forwarding query', message: 'Hi, I have a question about...' },
} satisfies TemplateEntry
