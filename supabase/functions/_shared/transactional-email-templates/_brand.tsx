import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'Digiformation Ltd'
export const SITE_URL = 'www.digiformation.uk'

interface ShellProps {
  preview: string
  greeting?: string
  heading: string
  children: React.ReactNode
}

export const BrandEmail = ({ preview, greeting, heading, children }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {greeting && <Text style={greetingStyle}><em>Dear {greeting},</em></Text>}
        <Heading style={h1}><em>{heading}</em></Heading>
        {children}
        <Hr style={hr} />
        <Text style={text}><em>Thank you for choosing {SITE_NAME} as your Business Partner.</em></Text>
        <Text style={footer}>
          <em>Regards,</em><br />
          <strong>{SITE_NAME}</strong><br />
          <Link href={`https://${SITE_URL}`} style={linkStyle}>{SITE_URL}</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const Card = ({ children }: { children: React.ReactNode }) => (
  <Section style={card}>{children}</Section>
)
export const CardLine = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? <Text style={cardLine}><strong>{label}:</strong> {value}</Text> : null

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={sectionTitle}><em>{children}</em></Text>
)

export const styles = {
  text: { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' },
  link: { color: '#10b981', textDecoration: 'none' },
  button: { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' },
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const greetingStyle = { fontSize: '16px', color: '#0a0a0a', margin: '0 0 16px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 20px', lineHeight: '1.4' }
const sectionTitle = { fontSize: '15px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '16px 0 8px' }
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }
const card = { background: '#f4f4f5', borderRadius: '12px', padding: '16px 20px', margin: '8px 0 20px' }
const cardLine = { fontSize: '14px', color: '#18181b', margin: '6px 0' }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#3f3f46', lineHeight: '1.6', margin: '8px 0 0' }
const linkStyle = { color: '#10b981', textDecoration: 'none' }
