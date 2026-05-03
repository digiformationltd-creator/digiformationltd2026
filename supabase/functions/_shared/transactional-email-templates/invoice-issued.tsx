import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props {
  customerName?: string
  invoiceNumber?: string
  service?: string
  amount?: string
  dueDate?: string
  invoiceUrl?: string
}

const InvoiceIssuedEmail = ({ customerName, invoiceNumber, service, amount, dueDate, invoiceUrl }: Props) => (
  <BrandEmail
    preview={`New invoice ${invoiceNumber || ''}`}
    greeting={customerName || 'Customer'}
    heading={`A New Invoice has been Issued to your Account`}
  >
    <SectionTitle>Invoice Details:</SectionTitle>
    <Card>
      <CardLine label="Invoice #" value={invoiceNumber} />
      <CardLine label="Service" value={service} />
      <CardLine label="Total Amount" value={amount} />
      <CardLine label="Due Date" value={dueDate} />
      <CardLine label="Status" value="Unpaid" />
    </Card>
    {invoiceUrl && (
      <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
        <Button href={invoiceUrl} style={styles.button}>Download Invoice (PDF)</Button>
      </Section>
    )}
    <Text style={styles.text}>
      Please proceed with payment at your earliest convenience. You can view all invoices
      anytime by logging in to your client area.
    </Text>
  </BrandEmail>
)

export const template = {
  component: InvoiceIssuedEmail,
  subject: (d: Record<string, any>) => `Invoice ${d.invoiceNumber || ''} Issued`.trim(),
  displayName: 'Invoice issued',
  previewData: { customerName: 'Jane', invoiceNumber: 'INV-12345', service: 'UK LTD Formation', amount: '£140', dueDate: '2026-05-30' },
} satisfies TemplateEntry
