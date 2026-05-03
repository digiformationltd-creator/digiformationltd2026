import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

interface Props { customerName?: string; documentName?: string; docDate?: string; loginUrl?: string }

const DocumentUploadedEmail = ({ customerName, documentName, docDate, loginUrl }: Props) => (
  <BrandEmail
    preview={`A new document is available in your client area`}
    greeting={customerName || 'Customer'}
    heading={`A New Document has been Uploaded to Your Account`}
  >
    <SectionTitle>Document Details:</SectionTitle>
    <Card>
      <CardLine label="Document" value={documentName} />
      <CardLine label="Date" value={docDate} />
    </Card>
    <Text style={styles.text}>
      Please log in to your client area to view and download the document.
    </Text>
    {loginUrl && (
      <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
        <Button href={loginUrl} style={styles.button}>Login & Download</Button>
      </Section>
    )}
  </BrandEmail>
)

export const template = {
  component: DocumentUploadedEmail,
  subject: (d: Record<string, any>) => `New Document — ${d.documentName || 'Available'}`,
  displayName: 'Document uploaded',
  previewData: { customerName: 'Jane', documentName: 'Certificate of Incorporation.pdf', docDate: '2026-05-03' },
} satisfies TemplateEntry
