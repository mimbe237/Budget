# Local Firebase Emulators + Offline Mode

This project supports zero-config local development using the Firebase Emulator Suite or a full offline mode.

## 1) Quick start with Emulators (recommended)

1. Create a local env file from the example:

```bash
cp .env.local.example .env.local
```

2. Start the Next.js app (it will connect to local emulators):

```bash
npm run dev
```

3. In another terminal, start the emulators:

```bash
firebase emulators:start
```

- UI: http://localhost:4000
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Functions: http://localhost:5001

All data starts empty. Cloud Functions mirror docs from `/debts` to `users/{uid}/debts` automatically.

## 2) Offline-only UI (no network)

If you need to run without any network at all (no emulators), set:

```
NEXT_PUBLIC_FIREBASE_OFFLINE_ONLY=1
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=0
```

The UI will run, Firestore uses IndexedDB. Any network writes/calls to Functions will be disabled by the browser/network and may fail; use this only to verify UI flows and cached pages. For dynamic features (debts creation, schedules, etc.) prefer the emulators.

## Notes

- The app reduces Firestore logs by default. Set `NEXT_PUBLIC_DEBUG_FIREBASE=1` for more info.
- When switching between modes, restart `npm run dev`.
- Functions build is done automatically via `functions/package.json`. You can build manually with:

```bash
npm --prefix functions run build
```

