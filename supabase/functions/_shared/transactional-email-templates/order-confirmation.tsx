import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Digiformation Ltd'

interface Props {
  customerName?: string
  service?: string
  packageName?: string
  price?: string
  orderRef?: string
  invoiceNumber?: string
  invoiceUrl?: string
  notes?: string
}

const OrderConfirmationEmail = ({
  customerName,
  service,
  packageName,
  price,
  orderRef,
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} order has been received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {customerName ? `Thank you, ${customerName}!` : 'Thank you for your order!'}
        </Heading>
        <Text style={text}>
          We've received your order and our team will reach out within 24 hours
          to confirm details and complete payment.
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>Order summary</Text>
          {service && <Text style={cardLine}><strong>Service:</strong> {service}</Text>}
          {packageName && <Text style={cardLine}><strong>Package:</strong> {packageName}</Text>}
          {price && <Text style={cardLine}><strong>Price:</strong> {price}</Text>}
          {orderRef && <Text style={cardLine}><strong>Reference:</strong> {orderRef}</Text>}
        </Section>

        {notes && (
          <>
            <Text style={label}>Your notes</Text>
            <Text style={text}>{notes}</Text>
          </>
        )}

        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderConfirmationEmail,
  subject: (d: Record<string, any>) =>
    `Order received — ${d.service || 'Digiformation Ltd'}`,
  displayName: 'Order confirmation (customer)',
  previewData: {
    customerName: 'Jane',
    service: 'UK LTD Formation — England & Wales',
    packageName: 'Silver',
    price: '£170',
    orderRef: 'ORD-12345',
    notes: 'Please contact me on WhatsApp.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }
const label = { fontSize: '12px', color: '#71717a', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '24px 0 8px' }
const card = { background: '#f4f4f5', borderRadius: '12px', padding: '16px 20px', margin: '12px 0 20px' }
const cardLabel = { fontSize: '12px', color: '#71717a', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 8px' }
const cardLine = { fontSize: '14px', color: '#18181b', margin: '4px 0' }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#71717a', margin: '8px 0 0' }
