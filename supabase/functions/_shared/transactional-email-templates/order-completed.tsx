import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, styles } from './_brand.tsx'

interface Props { customerName?: string; orderRef?: string; service?: string }

const OrderCompletedEmail = ({ customerName, orderRef, service }: Props) => (
  <BrandEmail
    preview={`Your order ${orderRef || ''} has been completed`}
    greeting={customerName || 'Customer'}
    heading={`Your Order${orderRef ? ` # ${orderRef}` : ''} has been Completed.`}
  >
    {service && <Text style={styles.text}><strong>Service:</strong> {service}</Text>}
    <Text style={styles.text}>
      For more details please check your email inbox or login into your client area to see the details.
    </Text>
  </BrandEmail>
)

export const template = {
  component: OrderCompletedEmail,
  subject: (d: Record<string, any>) => `Order Completed${d.orderRef ? ` — ${d.orderRef}` : ''}`,
  displayName: 'Order completed',
  previewData: { customerName: 'Sanaullah Malik', orderRef: 'GB102512APR26', service: 'UK LTD Formation' },
} satisfies TemplateEntry
