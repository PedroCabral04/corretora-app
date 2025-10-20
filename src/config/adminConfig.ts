const rawOwnerEmails = (import.meta.env.VITE_OWNER_EMAILS ?? import.meta.env.VITE_OWNER_EMAIL ?? "") as string;

const parsedOwnerEmails = rawOwnerEmails
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export const OWNER_EMAILS = parsedOwnerEmails;

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
};
