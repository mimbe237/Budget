# Backfill: Mirror /debts to /users/{uid}/debts

This one-off script copies every document from the root `debts` collection into the per-user subcollection `users/{uid}/debts` so that client-side lists can query user-scoped data as required by Firestore rules.

## Why

- Security rules restrict listing from the root `debts` collection.
- The app now queries `users/{uid}/debts` for lists.
- A Cloud Function trigger keeps new/updated docs mirrored automatically, but existing docs need a one-time backfill.

## Prerequisites

- Node 18+ (or 20+)
- Firebase Admin credentials:
  - EITHER run against local emulators (recommended):
    - Start emulators: `firebase emulators:start`
    - Use `.env.local` with `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=1`
  - OR set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json` to run against your project.

## Run (dry-run first)

```bash
# From repository root
npm run backfill:debts:dry
```

Output shows processed/copies without writing.

## Apply changes

```bash
npm run backfill:debts
```

## Optional: skip already mirrored docs

```bash
npm run backfill:debts:skip-existing
```

## Notes

- The script only mirrors the `debts` documents (not schedules/payments).
- New changes are kept in sync by the Cloud Function trigger `onDebtWrite`.
- If you need to backfill related collections as well, we can extend the script similarly.
