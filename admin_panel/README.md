## BudgetPro Admin Panel

Next.js (App Router) + Firebase powered administration interface for the BudgetPro application. It provides role‑based access (Firestore + optional custom claims), KPI dashboards, charts, user management, exports and a theming system.

### Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/admin/login`.

### Environment Variables
Create a `.env.local` with your Firebase web config and (optionally) service account credentials for custom claims.

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...

# Service account (for /api/admin/claims route)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLINE1\nLINE2\n...\n-----END PRIVATE KEY-----\n"
```

### Design System
Central tokens in `src/lib/theme.ts` are injected as CSS variables. Use Tailwind plus `var(--color-brand)` style references for consistency.

Components:
- `KPICard` – Displays metric, delta direction and optional chart slot.
- `Badge` – Status/role indicator (solid and subtle variants).

### Dashboard
Aggregates:
- Total Utilisateurs
- Utilisateurs Actifs (30 derniers jours)
- Transactions (count)
- Solde Plateforme (somme des soldes)

Charts use Recharts to plot monthly transactions and new users (basic aggregation). Extend aggregation logic in `dashboard/page.tsx` as data model evolves.

### User Management
`/admin/users` lists Firestore `users` documents. Actions menu allows:
- Suspendre / Activer (updates `status` field)
- Rendre Admin (sets `role` and `isAdmin` in Firestore)
- Rôle Claims (POST to `/api/admin/claims` to set custom claims; requires service account env vars)

Creating a user writes a minimal document (no auth account creation). To fully onboard, create Auth user separately then align document ID with UID.

### Exports
`/admin/export` allows CSV & XLSX export of user data using `papaparse` and `xlsx` libraries.

### Custom Claims API
Endpoint: `POST /api/admin/claims`
Body: `{ "uid": "<firebase-auth-uid>", "makeAdmin": true }`
Requires service account env vars. On success sets `admin: true` custom claim.

### Refresh Stats
Dashboard has a `Rafraîchir` button that re-runs Firestore queries and monthly aggregation.

### Security Notes
- Firestore rules must enforce admin access (see root project rules file).
- Custom claims should be set server-side only.
- Avoid exposing private key; never commit `.env.local`.

### Extending
Ideas:
- Add real-time listeners (`onSnapshot`) for live updating KPIs.
- Add audit logging collection for admin actions.
- Implement pagination & advanced filtering for users.
- Replace placeholder Recent Activity with real transaction feed.

### Deployment
Recommended: Vercel with environment variables configured in dashboard.

### License
Internal project – no public license specified.
