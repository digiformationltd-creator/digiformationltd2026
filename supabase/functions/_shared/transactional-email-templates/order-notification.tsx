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
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  service?: string
  packageName?: string
  price?: string
  orderRef?: string
  invoiceNumber?: string
  invoiceUrl?: string
  pagePath?: string
  notes?: string
  documents?: { label: string; url: string; filename: string }[]
}

const OrderNotificationEmail = ({
  customerName,
  customerEmail,
  whatsapp,
  country,
  addressLine1,
  addressLine2,
  city,
  state,
  postalCode,
  service,
  packageName,
  price,
  orderRef,
  invoiceNumber,
  invoiceUrl,
  pagePath,
  notes,
  documents,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New order from ${customerName || customerEmail || 'a customer'} — ${service || 'Digiformation'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛒 New order received</Heading>
        <Text style={text}>
          A new order has just been placed on {SITE_NAME}.
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>Order</Text>
          {service && <Text style={cardLine}><strong>Service:</strong> {service}</Text>}
          {packageName && packageName !== service && <Text style={cardLine}><strong>Package:</strong> {packageName}</Text>}
          {price && <Text style={cardLine}><strong>Price:</strong> {price}</Text>}
          {orderRef && <Text style={cardLine}><strong>Reference:</strong> {orderRef}</Text>}
          {invoiceNumber && <Text style={cardLine}><strong>Invoice #:</strong> {invoiceNumber}</Text>}
          {pagePath && <Text style={cardLine}><strong>Page:</strong> {pagePath}</Text>}
          {invoiceUrl && (
            <Text style={cardLine}>
              <a href={invoiceUrl} style={linkBtn}>⬇ Download invoice (PDF)</a>
            </Text>
          )}
        </Section>

        <Section style={card}>
          <Text style={cardLabel}>Customer</Text>
          {customerName && <Text style={cardLine}><strong>Name:</strong> {customerName}</Text>}
          {customerEmail && <Text style={cardLine}><strong>Email:</strong> {customerEmail}</Text>}
          {whatsapp && <Text style={cardLine}><strong>WhatsApp:</strong> {whatsapp}</Text>}
          {addressLine1 && <Text style={cardLine}><strong>Address line 1:</strong> {addressLine1}</Text>}
          {addressLine2 && <Text style={cardLine}><strong>Address line 2:</strong> {addressLine2}</Text>}
          {city && <Text style={cardLine}><strong>City:</strong> {city}</Text>}
          {state && <Text style={cardLine}><strong>State / County:</strong> {state}</Text>}
          {postalCode && <Text style={cardLine}><strong>Postal code:</strong> {postalCode}</Text>}
          {country && <Text style={cardLine}><strong>Country:</strong> {country}</Text>}
        </Section>

        {documents && documents.length > 0 && (
          <Section style={card}>
            <Text style={cardLabel}>Submitted documents</Text>
            {documents.map((d) => (
              <Text key={d.url} style={cardLine}>
                <strong>{d.label}:</strong>{' '}
                <a href={d.url} style={docLink}>⬇ {d.filename}</a>
              </Text>
            ))}
            <Text style={muted}>Links valid for 7 days.</Text>
          </Section>
        )}

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
  subject: (d: Record<string, any>) => {
    const who = (d.customerName && String(d.customerName).trim()) || d.customerEmail || 'New customer'
    const svc = d.service || 'Digiformation'
    const ref = d.orderRef ? ` [${d.orderRef}]` : ''
    return `New order from ${who} — ${svc}${d.packageName ? ` (${d.packageName})` : ''}${ref}`
  },
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
const linkBtn = { display: 'inline-block', background: '#0a0a0a', color: '#ffffff', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '13px' }
const docLink = { color: '#1a56db', textDecoration: 'underline' }
const muted = { fontSize: '12px', color: '#71717a', margin: '8px 0 0', fontStyle: 'italic' as const }
