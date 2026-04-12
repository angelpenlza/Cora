/**
 * Server action results for report interactions (votes, comments, flags).
 * Clients branch UI on these exact strings.
 */
export const SIGN_IN_REQUIRED = 'SIGN_IN_REQUIRED' as const;
export const VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED' as const;

export type ReportInteractiveError =
  | typeof SIGN_IN_REQUIRED
  | typeof VERIFICATION_REQUIRED;
