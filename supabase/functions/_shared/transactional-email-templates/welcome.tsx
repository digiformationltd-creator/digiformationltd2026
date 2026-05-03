import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, SITE_NAME, SITE_URL, styles } from './_brand.tsx'

interface Props { customerName?: string; loginUrl?: string }

const WelcomeEmail = ({ customerName, loginUrl }: Props) => (
  <BrandEmail
    preview={`Welcome to ${SITE_NAME}`}
    greeting={customerName || 'Customer'}
    heading={`Welcome to ${SITE_NAME}`}
  >
    <Text style={styles.text}>
      Your account has been successfully created. You can now log in to your client area
      to place orders, manage your company, view invoices and access documents.
    </Text>
    {loginUrl && (
      <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
        <Button href={loginUrl} style={styles.button}>Login to Client Area</Button>
      </Section>
    )}
    <Text style={styles.text}>
      If you need help at any time, simply reply to this email or open a support ticket from your dashboard.
    </Text>
  </BrandEmail>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welcome to ${SITE_NAME}`,
  displayName: 'Welcome (signup)',
  previewData: { customerName: 'Jane', loginUrl: `https://${SITE_URL}/auth` },
} satisfies TemplateEntry
