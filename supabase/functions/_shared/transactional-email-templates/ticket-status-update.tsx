import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props {
  customerName?: string
  ticketRef?: string
  subject?: string
  status?: string
  note?: string
}

const STATUS_BLURB: Record<string, string> = {
  open: 'Your ticket is open and assigned to a member of our team.',
  pending: 'We are waiting on a response — please reply to this email when you can.',
  resolved: 'We have marked your ticket as resolved. If anything is still outstanding, just reply and we will reopen it.',
  closed: 'Your ticket is now closed. Reply anytime to start a new conversation.',
}

const TicketStatusUpdateEmail = ({ customerName, ticketRef, subject, status, note }: Props) => {
  const key = (status || '').toLowerCase()
  const blurb = STATUS_BLURB[key] || `Your ticket status has been updated to "${status}".`
  return (
    <BrandEmail
      preview={`Ticket ${ticketRef || ''} status: ${status || 'updated'}`}
      greeting={customerName || 'there'}
      heading={`Your support ticket has been updated`}
    >
      <Text style={styles.text}>{blurb}</Text>
      <SectionTitle>Ticket details</SectionTitle>
      <Card>
        <CardLine label="Ticket" value={ticketRef} />
        <CardLine label="Subject" value={subject} />
        <CardLine label="New status" value={status} />
      </Card>
      {note && (
        <>
          <SectionTitle>Note from our team</SectionTitle>
          <Text style={styles.text}>{note}</Text>
        </>
      )}
    </BrandEmail>
  )
}

export const template = {
  component: TicketStatusUpdateEmail,
  subject: (d: Record<string, any>) =>
    `Ticket ${d.ticketRef || ''} — ${d.status || 'updated'}`.trim(),
  displayName: 'Ticket status update',
  previewData: {
    customerName: 'Jane',
    ticketRef: 'TKT-123456',
    subject: 'Address forwarding query',
    status: 'Resolved',
    note: 'We have re-issued the forwarding setup confirmation.',
  },
} satisfies TemplateEntry
