const rawAdminEmails = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ADMIN_EMAILS || '' : '';
const ADMIN_EMAIL_SET = new Set(
  rawAdminEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(email.toLowerCase());
}

export function getAdminEmails() {
  return Array.from(ADMIN_EMAIL_SET);
}
