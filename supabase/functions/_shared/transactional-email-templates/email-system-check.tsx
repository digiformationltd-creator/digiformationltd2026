import * as React from 'npm:react@18.3.1'
import { Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandEmail, SITE_NAME, styles, INK, GREY_LIGHT, GREY_PANEL, MUTED } from './_brand.tsx'

interface CheckItem {
  name: string
  label?: string
  ok: boolean
  error?: string
}

interface Props {
  checks?: CheckItem[]
  runAt?: string
  totalOk?: number
  totalFail?: number
}

const EmailSystemCheckEmail = ({ checks = [], runAt, totalOk = 0, totalFail = 0 }: Props) => {
  const allOk = totalFail === 0 && totalOk > 0
  return (
    <BrandEmail
      preview={allOk ? `All ${totalOk} email templates working` : `${totalFail} email template(s) need attention`}
      heading={allOk ? 'Email System: All Checks Passed' : 'Email System: Issues Detected'}
    >
      <Text style={styles.text}>
        This is an automated verification report from the {SITE_NAME} admin panel. We tested every transactional
        email template configured in the system.
      </Text>

      <Section style={summaryBox(allOk)}>
        <Text style={summaryText}>
          {allOk
            ? `✓ All ${totalOk} email templates are configured correctly and were successfully queued.`
            : `${totalOk} passed · ${totalFail} failed — review the failed items below.`}
        </Text>
        {runAt && <Text style={summarySub}>Run at: {runAt}</Text>}
      </Section>

      <Text style={styles.label}>Template Check Results</Text>
      <Section style={listWrap}>
        {checks.map((c, i) => (
          <Section key={i} style={row(i === checks.length - 1)}>
            <Text style={mark(c.ok)}>{c.ok ? '✓' : '✗'}</Text>
            <Text style={rowName}>{c.label || c.name}</Text>
            <Text style={rowCode}>{c.name}</Text>
            {!c.ok && c.error && <Text style={errText}>{c.error}</Text>}
          </Section>
        ))}
        {checks.length === 0 && <Text style={styles.text}>No templates were tested.</Text>}
      </Section>

      <Text style={styles.muted}>
        If any item shows ✗, open the admin panel → Test Email to re-run the check after fixing the issue.
      </Text>
    </BrandEmail>
  )
}

export const template = {
  component: EmailSystemCheckEmail,
  subject: (data: Record<string, any>) =>
    (data?.totalFail ?? 0) === 0
      ? `✓ Email System Check Passed (${data?.totalOk ?? 0} templates)`
      : `⚠ Email System Check: ${data?.totalFail ?? 0} issue(s) found`,
  displayName: 'Email System Check (diagnostic)',
  previewData: {
    runAt: new Date().toISOString(),
    totalOk: 2,
    totalFail: 1,
    checks: [
      { name: 'welcome', label: 'Welcome (signup)', ok: true },
      { name: 'order-confirmation', label: 'Order confirmation', ok: true },
      { name: 'invoice-issued', label: 'Invoice issued', ok: false, error: 'Template not registered' },
    ],
  },
} satisfies TemplateEntry

const summaryBox = (ok: boolean) => ({
  background: ok ? '#ecfdf5' : '#fef2f2',
  borderLeft: `4px solid ${ok ? '#10b981' : '#ef4444'}`,
  padding: '14px 18px',
  borderRadius: '6px',
  margin: '12px 0 22px',
})
const summaryText = { fontSize: '14px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 4px' }
const summarySub = { fontSize: '12px', color: MUTED, margin: 0 }

const listWrap = { border: `1px solid ${GREY_LIGHT}`, borderRadius: '6px', overflow: 'hidden' as const, margin: '4px 0 18px' }
const row = (last: boolean) => ({
  padding: '12px 16px',
  borderBottom: last ? 'none' : `1px solid ${GREY_LIGHT}`,
  background: '#ffffff',
})
const mark = (ok: boolean) => ({
  display: 'inline-block',
  width: '22px',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: ok ? '#059669' : '#dc2626',
  margin: 0,
})
const rowName = { display: 'inline-block', fontSize: '14px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 0 6px' }
const rowCode = { fontSize: '11px', color: MUTED, margin: '2px 0 0 28px', fontFamily: 'Menlo, Consolas, monospace' }
const errText = { fontSize: '12px', color: '#b91c1c', margin: '4px 0 0 28px', background: GREY_PANEL, padding: '6px 8px', borderRadius: '4px' }
