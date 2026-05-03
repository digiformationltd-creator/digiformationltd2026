import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Digiformation Ltd'
// Business inbox that receives every new order placed on the site.
const BUSINESS_EMAIL = 'info@digiformation.uk'

interface Props {
  customerName?: string
  customerEmail?: string
  whatsapp?: string
  country?: string
  service?: string
  packageName?: string
  price?: string
  orderRef?: string
  pagePath?: string
  notes?: string
}

const OrderNotificationEmail = ({
  customerName,
  customerEmail,
  whatsapp,
  country,
  service,
  packageName,
  price,
  orderRef,
  pagePath,
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New order: {service || 'Digiformation'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛒 New order received</Heading>
        <Text style={text}>
          A new order has just been placed on {SITE_NAME}.
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>Order</Text>
          {service && <Text style={cardLine}><strong>Service:</strong> {service}</Text>}
          {packageName && <Text style={cardLine}><strong>Package:</strong> {packageName}</Text>}
          {price && <Text style={cardLine}><strong>Price:</strong> {price}</Text>}
          {orderRef && <Text style={cardLine}><strong>Reference:</strong> {orderRef}</Text>}
          {pagePath && <Text style={cardLine}><strong>Page:</strong> {pagePath}</Text>}
        </Section>

        <Section style={card}>
          <Text style={cardLabel}>Customer</Text>
          {customerName && <Text style={cardLine}><strong>Name:</strong> {customerName}</Text>}
          {customerEmail && <Text style={cardLine}><strong>Email:</strong> {customerEmail}</Text>}
          {whatsapp && <Text style={cardLine}><strong>WhatsApp:</strong> {whatsapp}</Text>}
          {country && <Text style={cardLine}><strong>Country:</strong> {country}</Text>}
        </Section>

        {notes && (
          <>
            <Text style={cardLabel}>Notes</Text>
            <Text style={text}>{notes}</Text>
          </>
        )}

        <Hr style={hr} />
        <Text style={footer}>Sent automatically by {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderNotificationEmail,
  to: BUSINESS_EMAIL,
  subject: (d: Record<string, any>) =>
    `New order — ${d.service || 'Digiformation'}${d.packageName ? ` (${d.packageName})` : ''}`,
  displayName: 'Order notification (business)',
  previewData: {
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    whatsapp: '+44 7000 000000',
    country: 'United Kingdom',
    service: 'UK LTD Formation — England & Wales',
    packageName: 'Silver',
    price: '£170',
    orderRef: 'ORD-12345',
    pagePath: '/uk-services/uk-ltd-formation/checkout',
    notes: 'Please contact me on WhatsApp.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 12px' }
const card = { background: '#f4f4f5', borderRadius: '12px', padding: '16px 20px', margin: '12px 0' }
const cardLabel = { fontSize: '12px', color: '#71717a', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 8px' }
const cardLine = { fontSize: '14px', color: '#18181b', margin: '4px 0' }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#71717a', margin: '8px 0 0' }
