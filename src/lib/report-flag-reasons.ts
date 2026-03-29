/**
 * Reason codes for user-submitted flags on reports.
 * Must stay in sync with `report_user_flags.reason_code` CHECK in Supabase.
 */
export const REPORT_FLAG_REASON_CODES = [
  'misinformation',
  'malicious',
  'spam_scam',
  'illegal_dangerous',
  'privacy',
  'off_topic',
  'other',
] as const;

export type ReportFlagReasonCode = (typeof REPORT_FLAG_REASON_CODES)[number];

export const REPORT_FLAG_OTHER_MAX_LEN = 500;

/** Ordered list for radio UI: code + human-readable label */
export const REPORT_FLAG_REASONS: readonly {
  code: ReportFlagReasonCode;
  label: string;
}[] = [
  {
    code: 'misinformation',
    label: 'False or misleading information',
  },
  {
    code: 'malicious',
    label: 'Harassment, threats, or targeted harm',
  },
  {
    code: 'spam_scam',
    label: 'Spam, scam, or deceptive promotion',
  },
  {
    code: 'illegal_dangerous',
    label: 'Illegal activity or content that could cause harm',
  },
  {
    code: 'privacy',
    label: 'Doxxing or exposure of private information',
  },
  {
    code: 'off_topic',
    label: 'Not appropriate or relevant for this app',
  },
  {
    code: 'other',
    label: 'Other (briefly describe below)',
  },
] as const;

const allowed = new Set<string>(REPORT_FLAG_REASON_CODES);

export function isReportFlagReasonCode(value: string): value is ReportFlagReasonCode {
  return allowed.has(value);
}
