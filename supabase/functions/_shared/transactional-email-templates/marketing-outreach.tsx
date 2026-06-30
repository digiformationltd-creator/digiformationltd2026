import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, styles } from './_brand.tsx'

interface Props {
  greeting?: string
  heading: string
  preview?: string
  // AI-generated body: array of paragraph strings.
  paragraphs?: string[]
  // Optional plain-text fallback (single string with \n\n separating paragraphs)
  body_text?: string
}

const MarketingOutreachEmail = ({ greeting, heading, preview, paragraphs, body_text }: Props) => {
  const paras: string[] =
    Array.isArray(paragraphs) && paragraphs.length > 0
      ? paragraphs
      : (body_text ?? '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
  return (
    <BrandEmail
      preview={preview || heading}
      greeting={greeting || 'there'}
      heading={heading}
    >
      {paras.map((p, i) => (
        <Text key={i} style={styles.text}>{p}</Text>
      ))}
    </BrandEmail>
  )
}

export const template = {
  component: MarketingOutreachEmail,
  subject: (d: Record<string, any>) => d.subject || 'A quick note from Digiformation',
  displayName: 'Marketing Outreach (AI-personalised)',
  previewData: {
    greeting: 'Sarah',
    heading: 'Helping UK founders launch faster',
    preview: 'A quick note about UK formation',
    paragraphs: [
      'Hi Sarah, I noticed Acme Ltd has been growing and wanted to reach out.',
      'We help UK founders complete identity verification (ACSP) and formation in under 48 hours — happy to share details if useful.',
      'Worth a quick chat?',
    ],
  },
} satisfies TemplateEntry
