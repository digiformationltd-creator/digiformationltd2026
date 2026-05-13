import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles, SITE_NAME } from './_brand.tsx'

interface Props {
  customerName?: string
  service?: string
  packageName?: string
  price?: string
  orderRef?: string
  invoiceNumber?: string
  invoiceUrl?: string
  notes?: string
  liveSelfieLink?: string
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
  liveSelfieLink,
}: Props) => {
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
    ? `${service} — ${packageName}`
    : service || ''
  return (
    <BrandEmail
      preview={`Your ${SITE_NAME} order has been received`}
      greeting={customerName || 'Customer'}
      heading="Your Order has been Received & Transferred to the Relevant Team"
    >
      <SectionTitle>Your order details</SectionTitle>
      <Card>
        <CardLine label="Order #" value={orderRef} />
        <CardLine label="Total Amount" value={price} />
        <CardLine label="Services" value={serviceLine} />
        <CardLine label="Invoice" value={invoiceNumber} />
        <CardLine label="Order Status" value="Pending payment" />
      </Card>

      <Text style={styles.text}>
        Thank you for placing your order with {SITE_NAME}. Your order has been received and transferred to the relevant team — we will start working on it as soon as possible and keep you updated at every step.
      </Text>

      {invoiceUrl && (
        <Section style={{ textAlign: 'center', margin: '16px 0 24px' }}>
          <Button href={invoiceUrl} style={styles.button}>Download Invoice (PDF)</Button>
          <Text style={styles.muted}>Your invoice is attached as a downloadable PDF. You can also view it anytime in your dashboard.</Text>
        </Section>
      )}

      {liveSelfieLink && (
        <>
          <SectionTitle>Action required: Live selfie verification</SectionTitle>
          <Text style={styles.text}>
            To complete your LTD formation we also need a quick live-selfie identity check.
            Please open the secure link below from your phone — it takes about 1 minute.
            After completing it, kindly send us a screenshot of the confirmation as well.
          </Text>
          <Section style={{ textAlign: 'center', margin: '16px 0 24px' }}>
            <Button href={liveSelfieLink} style={styles.button}>Complete Live Selfie Verification</Button>
            <Text style={styles.muted}>Or copy this link: {liveSelfieLink}</Text>
          </Section>
        </>
      )}

      {notes && (
        <>
          <Text style={styles.label}>Your notes</Text>
          <Text style={styles.text}>{notes}</Text>
        </>
      )}
    </BrandEmail>
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
    orderRef: '261205-GB-SIL-0001',
    invoiceNumber: 'INV-12345',
    invoiceUrl: 'https://example.com/invoice.pdf',
    notes: '',
  },
} satisfies TemplateEntry
