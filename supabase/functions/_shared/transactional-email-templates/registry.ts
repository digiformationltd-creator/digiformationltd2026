/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderConfirmation } from './order-confirmation.tsx'
import { template as orderNotification } from './order-notification.tsx'
import { template as welcome } from './welcome.tsx'
import { template as orderCompleted } from './order-completed.tsx'
import { template as orderInProgress } from './order-in-progress.tsx'
import { template as invoiceIssued } from './invoice-issued.tsx'
import { template as invoicePaid } from './invoice-paid.tsx'
import { template as documentUploaded } from './document-uploaded.tsx'
import { template as ticketReceived } from './ticket-received.tsx'
import { template as addressRenewalReminder } from './address-renewal-reminder.tsx'
import { template as confirmationStatementReminder } from './confirmation-statement-reminder.tsx'
import { template as annualAccountsReminder } from './annual-accounts-reminder.tsx'
import { template as affiliateApplicationReceived } from './affiliate-application-received.tsx'
import { template as affiliateApplicationNotification } from './affiliate-application-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-confirmation': orderConfirmation,
  'order-notification': orderNotification,
  'welcome': welcome,
  'order-completed': orderCompleted,
  'order-in-progress': orderInProgress,
  'invoice-issued': invoiceIssued,
  'invoice-paid': invoicePaid,
  'document-uploaded': documentUploaded,
  'ticket-received': ticketReceived,
  'address-renewal-reminder': addressRenewalReminder,
  'confirmation-statement-reminder': confirmationStatementReminder,
  'annual-accounts-reminder': annualAccountsReminder,
  'affiliate-application-received': affiliateApplicationReceived,
  'affiliate-application-notification': affiliateApplicationNotification,
}
