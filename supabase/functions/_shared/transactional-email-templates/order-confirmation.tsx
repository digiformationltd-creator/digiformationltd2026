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

      {invoiceUrl && (
        <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
          <Button href={invoiceUrl} style={styles.button}>Download Invoice (PDF)</Button>
          <Text style={styles.muted}>Link valid for 7 days. You can also view it anytime in your dashboard.</Text>
        </Section>
      )}

      {(() => {
        const waMsg = encodeURIComponent(
          `Hello ${SITE_NAME}, I have just placed an order${orderRef ? ` (Ref: ${orderRef})` : ''}${serviceLine ? ` for ${serviceLine}` : ''}. Please confirm and guide me on the next steps.`
        )
        const waHref = `https://wa.me/923164467464?text=${waMsg}`
        return (
          <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
            <Button href={waHref} style={{ ...styles.button, backgroundColor: '#25D366' }}>
              Chat with us on WhatsApp
            </Button>
            <Text style={styles.muted}>
              Click the button to message our team on WhatsApp — your order reference will be pre-filled. Our team will respond as soon as possible.
            </Text>
          </Section>
        )
      })()}

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
