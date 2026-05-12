import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'Digiformation Ltd'
export const SITE_URL = 'www.digiformation.uk'
export const LOGO_URL = 'https://formflow-digital-hub.lovable.app/digiformation-logo.png'

// Invoice palette (matches generated PDF invoices)
export const INK = '#141414'
export const MUTED = '#646464'
export const GREY_LIGHT = '#e8e8e8'
export const GREY_PANEL = '#f4f4f4'

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
        <Section style={logoBar}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="170" style={logoImg} />
        </Section>
        <Section style={accentBar} />
        <Section style={contentWrap}>
          {greeting && <Text style={greetingStyle}>Dear {greeting},</Text>}
          <Heading style={h1}>{heading}</Heading>
          {children}
          <Hr style={hr} />
          <Text style={text}>Thank you for choosing {SITE_NAME} as your business partner.</Text>
          <Text style={footer}>
            Regards,<br />
            <strong>{SITE_NAME}</strong><br />
            <Link href={`https://${SITE_URL}`} style={linkStyle}>{SITE_URL}</Link>
          </Text>
        </Section>
        <Section style={footerBand}>
          <Text style={footerBandText}>THANK YOU FOR YOUR BUSINESS</Text>
        </Section>
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
  <Text style={sectionTitle}>{children}</Text>
)

export const styles = {
  text: { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' },
  link: { color: INK, textDecoration: 'underline' },
  button: { backgroundColor: INK, color: '#ffffff', padding: '12px 26px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
  card: { background: GREY_PANEL, borderRadius: '6px', padding: '16px 20px', margin: '8px 0 20px', borderLeft: `3px solid ${INK}` },
  cardLine: { fontSize: '14px', color: '#18181b', margin: '6px 0' },
  muted: { fontSize: '12px', color: MUTED, margin: '12px 0 0' },
  label: { fontSize: '11px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: '20px 0 6px', fontWeight: 'bold' as const },
}

const main = { backgroundColor: '#f4f4f5', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0' }
const container = { padding: '0', maxWidth: '600px', backgroundColor: '#ffffff', border: `1px solid ${GREY_LIGHT}` }
const logoBar = { padding: '28px 32px 16px', backgroundColor: '#ffffff', textAlign: 'left' as const }
const logoImg = { display: 'block', height: 'auto' }
const accentBar = { height: '3px', backgroundColor: INK, lineHeight: '3px', fontSize: 0 }
const contentWrap = { padding: '24px 32px 8px' }
const greetingStyle = { fontSize: '15px', color: INK, margin: '0 0 14px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: INK, margin: '0 0 18px', lineHeight: '1.35' }
const sectionTitle = { fontSize: '13px', fontWeight: 'bold' as const, color: INK, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '16px 0 8px' }
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }
const card = { background: GREY_PANEL, borderRadius: '6px', padding: '16px 20px', margin: '8px 0 20px', borderLeft: `3px solid ${INK}` }
const cardLine = { fontSize: '14px', color: '#18181b', margin: '6px 0' }
const hr = { borderColor: GREY_LIGHT, margin: '24px 0' }
const footer = { fontSize: '13px', color: '#3f3f46', lineHeight: '1.6', margin: '8px 0 24px' }
const linkStyle = { color: INK, textDecoration: 'underline' }
const footerBand = { backgroundColor: GREY_PANEL, padding: '14px 32px', borderTop: `1px solid ${GREY_LIGHT}` }
const footerBandText = { fontSize: '11px', fontWeight: 'bold' as const, color: INK, letterSpacing: '0.18em', textAlign: 'center' as const, margin: 0 }
