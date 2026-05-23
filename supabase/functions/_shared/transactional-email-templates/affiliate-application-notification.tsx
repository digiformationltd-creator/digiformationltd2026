import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, Card, CardLine, SectionTitle, styles } from './_brand.tsx'

const BUSINESS_EMAIL = 'info@digiformation.uk'

interface Props {
  customerName?: string
  email?: string
  whatsapp?: string
  applicationId?: string
  employeeCode?: string
  joiningDate?: string
  education?: string
  experience?: string
  message?: string
  pagePath?: string
}

const AffiliateApplicationNotificationEmail = ({
  customerName, email, whatsapp, applicationId, employeeCode, joiningDate, education, experience, message, pagePath,
}: Props) => (
  <BrandEmail
    preview={`New affiliate application ${applicationId || ''}`}
    greeting="Team"
    heading={`New Affiliate Application Received`}
  >
    <Text style={styles.text}>A new partner application has been submitted on the website.</Text>
    <SectionTitle>Applicant:</SectionTitle>
    <Card>
      <CardLine label="Application #" value={applicationId} />
      <CardLine label="Name" value={customerName} />
      <CardLine label="Email" value={email} />
      <CardLine label="WhatsApp" value={whatsapp} />
      <CardLine label="Employee Code" value={employeeCode} />
      <CardLine label="Joining Date" value={joiningDate} />
      <CardLine label="Page" value={pagePath} />
    </Card>
    {(education || experience || message) && (
      <>
        <SectionTitle>Background:</SectionTitle>
        <Card>
          {education && <CardLine label="Education" value={education} />}
          {experience && <CardLine label="Experience" value={experience} />}
          {message && <CardLine label="Message" value={message} />}
        </Card>
      </>
    )}
    <Text style={styles.text}>
      Please review the application in the admin panel and contact the applicant.
    </Text>
  </BrandEmail>
)

export const template = {
  component: AffiliateApplicationNotificationEmail,
  to: BUSINESS_EMAIL,
  subject: (d: Record<string, any>) => `New Affiliate Application${d.applicationId ? ` — ${d.applicationId}` : ''}`,
  displayName: 'Affiliate application notification (business)',
  previewData: {
    customerName: 'Jane Doe',
    email: 'jane@example.com',
    whatsapp: '+44 7000 000000',
    applicationId: 'Application-0042',
    employeeCode: 'EMP-001',
    joiningDate: '2026-06-01',
    education: 'BSc Marketing',
    experience: '3 years digital affiliate marketing',
    message: 'Excited to partner with DigiFormation.',
    pagePath: '/affiliate',
  },
} satisfies TemplateEntry
