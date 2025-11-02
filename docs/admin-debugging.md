## Dépannage des accès admin

### Accès à `/admin`
Assurez-vous que le cookie `firebaseIdToken` est bien présent après connexion.
- Inspectez `Application > Cookies > http://localhost:9002` dans votre navigateur.
- S'il est absent, la connexion email/mot de passe a échoué ou le script social n'a pas persisté l'état.

### Promotion Admin
1. Via script:
   ```bash
   node scripts/set-admin.js set <user-uid>
   ```
   Ce script met à jour les custom claims ET Firestore (`role`, `isAdmin`).

2. Via console Firebase:
   - Ajoutez dans la colonne "Custom claims": `{ "admin": true, "role": "admin" }`.
   - Vérifiez que le document Firestore `users/{uid}` contient bien `role: "admin", isAdmin: true`.

### Configuration
- `ADMIN_EMAILS` ou `NEXT_PUBLIC_ADMIN_EMAILS` peuvent définir des emails autorisés.
- Assurez-vous que `GOOGLE_APPLICATION_CREDENTIALS` pointe vers un compte de service valide pour les features côté serveur.
