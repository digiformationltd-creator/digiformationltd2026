import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props { customerName?: string; invoiceNumber?: string; amount?: string; service?: string }

const InvoicePaidEmail = ({ customerName, invoiceNumber, amount, service }: Props) => (
  <BrandEmail
    preview={`Payment received for invoice ${invoiceNumber || ''}`}
    greeting={customerName || 'Customer'}
    heading={`Payment Received — Thank You!`}
  >
    <Text style={styles.text}>
      We have received your payment. Your invoice has been marked as paid.
    </Text>
    <SectionTitle>Payment Details:</SectionTitle>
    <Card>
      <CardLine label="Invoice #" value={invoiceNumber} />
      <CardLine label="Service" value={service} />
      <CardLine label="Amount Paid" value={amount} />
      <CardLine label="Status" value="Paid" />
    </Card>
  </BrandEmail>
)

export const template = {
  component: InvoicePaidEmail,
  subject: (d: Record<string, any>) => `Payment Received — ${d.invoiceNumber || 'Invoice'}`,
  displayName: 'Invoice paid',
  previewData: { customerName: 'Jane', invoiceNumber: 'INV-12345', amount: '£140', service: 'UK LTD Formation' },
} satisfies TemplateEntry
