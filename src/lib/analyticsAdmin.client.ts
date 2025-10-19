// Client-side placeholder to prevent bundling firebase-admin in the client.
// Any direct import of this file on the client should throw.
export const UNSUPPORTED_MESSAGE = 'analyticsAdmin is server-only. Use API routes or server actions.';
export function getAllUsersWithStats() { throw new Error(UNSUPPORTED_MESSAGE); }
export function getAdminKPIs() { throw new Error(UNSUPPORTED_MESSAGE); }
export function getUserDetails() { throw new Error(UNSUPPORTED_MESSAGE); }
