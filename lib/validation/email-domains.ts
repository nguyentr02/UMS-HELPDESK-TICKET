/**
 * Institutional email domains accepted when an Admin creates a user. Mirrors
 * the BE allowlist in `feat-helpdesk-api/src/lib/email-domains.ts` (which also
 * gates Google SSO). Keep the two in lockstep — a personal email (gmail etc.)
 * must be rejected on both ends.
 */
export const ALLOWED_EMAIL_DOMAINS = ['ums.edu.vn', 'dau.edu.vn'] as const;

export function isAllowedEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

export const ALLOWED_EMAIL_DOMAINS_LABEL = ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(' hoặc ');
export const EMAIL_DOMAIN_ERROR = `Email phải thuộc miền ${ALLOWED_EMAIL_DOMAINS_LABEL}`;
