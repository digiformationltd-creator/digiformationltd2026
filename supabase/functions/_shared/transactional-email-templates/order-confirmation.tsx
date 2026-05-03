import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Digiformation Ltd'
const SITE_URL = 'www.digiformation.uk'

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
  invoiceNumber,
  invoiceUrl,
  notes,
}: Props) => {
  const serviceLine = packageName && service
    ? `${service} — ${packageName} x 1${price ? ` ${price}` : ''}`
    : service || ''
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} order has been received</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={greeting}><em>Dear {customerName || 'Customer'},</em></Text>

          <Heading style={h1}>
            <em>Your Order has been Received & Transferred to the Relevant Team</em>
          </Heading>

          <Text style={sectionTitle}><em>Your Order Details:</em></Text>

          <Section style={card}>
            {orderRef && <Text style={cardLine}><strong>Order #:</strong> {orderRef}</Text>}
            {price && <Text style={cardLine}><strong>Total Amount:</strong> {price}</Text>}
            {serviceLine && <Text style={cardLine}><strong>Services:</strong> {serviceLine}</Text>}
            {invoiceNumber && <Text style={cardLine}><strong>Invoice:</strong> {invoiceNumber}</Text>}
            <Text style={cardLine}><strong>Order Status:</strong> Pending payment</Text>
          </Section>

          {invoiceUrl && (
            <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
              <Button href={invoiceUrl} style={button}>Download Invoice (PDF)</Button>
              <Text style={muted}>Link valid for 7 days. You can also view it anytime in your dashboard.</Text>
            </Section>
          )}

          {notes && (
            <>
              <Text style={label}>Your notes</Text>
              <Text style={text}>{notes}</Text>
            </>
          )}

          <Hr style={hr} />

          <Text style={text}>
            <em>Thank you for choosing {SITE_NAME} as your Business Partner.</em>
          </Text>

          <Text style={footer}>
            <em>Regards,</em><br />
            <strong>{SITE_NAME}</strong><br />
            <Link href={`https://${SITE_URL}`} style={linkStyle}>{SITE_URL}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (d: Record<string, any>) =>
    `Order Received${d.orderRef ? ` — ${d.orderRef}` : ''} | ${SITE_NAME}`,
  displayName: 'Order confirmation (customer)',
  previewData: {
    customerName: 'Hamid Nasir',
    service: 'UK LTD Formation',
    packageName: 'Silver',
    price: '£140',
    orderRef: 'GB102589APR26',
    invoiceNumber: 'INV-12345',
    invoiceUrl: 'https://example.com/invoice.pdf',
    notes: '',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const greeting = { fontSize: '16px', color: '#0a0a0a', margin: '0 0 16px' }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 20px', lineHeight: '1.4' }
const sectionTitle = { fontSize: '15px', fontWeight: 'bold', color: '#0a0a0a', margin: '16px 0 8px' }
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }
const label = { fontSize: '12px', color: '#71717a', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '24px 0 8px' }
const card = { background: '#f4f4f5', borderRadius: '12px', padding: '16px 20px', margin: '8px 0 20px' }
const cardLine = { fontSize: '14px', color: '#18181b', margin: '6px 0' }
const button = { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }
const muted = { fontSize: '12px', color: '#71717a', margin: '12px 0 0' }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#3f3f46', lineHeight: '1.6', margin: '8px 0 0' }
const linkStyle = { color: '#10b981', textDecoration: 'none' }
