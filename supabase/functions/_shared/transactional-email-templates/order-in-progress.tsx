import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, styles } from './_brand.tsx'

interface Props { customerName?: string; orderRef?: string; service?: string }

const OrderInProgressEmail = ({ customerName, orderRef, service }: Props) => (
  <BrandEmail
    preview={`Work has started on your order ${orderRef || ''}`}
    greeting={customerName || 'Customer'}
    heading={`Your Order${orderRef ? ` # ${orderRef}` : ''} is now In Progress.`}
  >
    {service && <Text style={styles.text}><strong>Service:</strong> {service}</Text>}
    <Text style={styles.text}>
      Good news — our team has started working on your order. We will notify you as soon as it is completed.
    </Text>
    <Text style={styles.text}>
      You can track the latest status anytime by logging into your client area.
    </Text>
  </BrandEmail>
)

export const template = {
  component: OrderInProgressEmail,
  subject: (d: Record<string, any>) => `Order In Progress${d.orderRef ? ` — ${d.orderRef}` : ''}`,
  displayName: 'Order in progress',
  previewData: { customerName: 'Sanaullah Malik', orderRef: 'GB102512APR26', service: 'UK LTD Formation' },
} satisfies TemplateEntry
