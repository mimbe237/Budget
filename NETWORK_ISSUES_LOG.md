# 🌐 Log des Problèmes Réseau - Budget App

## 📅 Session du 3 novembre 2025

### 🚨 Problèmes Rencontrés

#### 1. Firebase Hosting Deploy - ÉCHEC
**Timestamp** : 3 nov 2025, 22:45 - 23:45  
**Commande** : `firebase deploy --only hosting`  
**Erreur** :
```
Error: Failed to make request to https://firebasehosting.googleapis.com/v1beta1/projects/studio-3821270625-cd276/sites?pageToken=&pageSize=10
```

**Tests effectués** :
- ✅ `curl -I https://firebasehosting.googleapis.com` → HTTP/2 404 (connexion OK)
- ✅ `firebase login:list` → contact@budgetpro.net (auth OK)
- ✅ `firebase projects:list` → 4 projets listés (API OK)
- ❌ `firebase deploy --only hosting` → échec à la lecture des sites

**Tentatives** :
1. Deploy direct → échec
2. Réauthentification Firebase CLI → échec
3. Deploy non-interactif `--non-interactive` → échec
4. Build Next.js local puis deploy → échec

**Impact** :
- Privacy policy pas accessible à `https://budget-app.web.app/privacy.html`
- Digital Asset Links pas accessible à `https://budget-app.web.app/.well-known/assetlinks.json`
- Bloque soumission Play Store (URL privacy requise)

---

#### 2. Android SDK Download - ÉCHEC
**Timestamp** : 3 nov 2025, 13:00 - 15:00  
**Commande** : `npx @bubblewrap/cli init --manifest twa-manifest.json`  
**Erreur** :
```
ENOTFOUND dl.google.com
```

**Détails** :
- SDK nécessaire : ~500MB (commandlinetools, platform-tools, build-tools)
- Timeout après 2-3 minutes
- 4 tentatives échouées

**Tests effectués** :
- ❌ `curl https://dl.google.com/android/repository/` → Connection reset
- ❌ Téléchargement via Bubblewrap → timeout

**Impact** :
- Impossible de générer AAB Android
- Bloque soumission Play Store (fichier .aab requis)

---

#### 3. Playwright Chromium Download - ÉCHEC
**Timestamp** : 3 nov 2025, 16:30  
**Commande** : `npm run screenshots` (via Playwright)  
**Erreur** :
```
dyld: Symbol not found: _OBJC_CLASS_$_CATapDescription
```

**Détails** :
- Chromium binary incomplet (~170MB)
- Téléchargement interrompu mi-parcours
- Erreur macOS dyld au lancement

**Tests effectués** :
- ❌ Exécution script screenshots → dyld crash
- Pas de retry tentée (priorité sur AAB)

**Impact** :
- Pas de screenshots réels (5 placeholders générés en remplacement)
- Faible priorité : placeholders acceptables pour v1

---

### 🔍 Analyse Technique

#### Pattern Commun
Tous les échecs impliquent :
- Téléchargements volumineux (>100MB)
- Connexions HTTPS vers CDN/API Google
- Timeouts ou connection reset après 1-3 minutes

#### Hypothèses
1. **Réseau instable** : Connexion WiFi avec pertes de paquets
2. **Firewall/Proxy** : Possiblement blocage ports ou domaines Google
3. **ISP throttling** : Limitation débit sur gros téléchargements
4. **DNS issues** : Résolution intermittente domaines Google

#### Tests Diagnostic Effectués
```bash
# Connectivité générale
ping -c 3 google.com          # ✅ OK (3 packets received)
curl -I https://firebase.google.com  # ✅ OK (HTTP/2 200)

# APIs spécifiques
curl -I https://firebasehosting.googleapis.com  # ✅ OK (HTTP/2 404 normal)
curl -I https://dl.google.com  # ❌ FAIL (Connection reset)

# DNS
nslookup dl.google.com        # Pas testé
dig dl.google.com             # Pas testé
```

---

### ✅ Solutions de Contournement

#### Succès : Tâches Complétées Malgré Réseau
1. **Emails support** → Édition locale, pas de téléchargement requis ✅
2. **Feature graphics** → Sharp génération locale (pas de CDN) ✅
3. **Placeholder screenshots** → Sharp génération locale ✅
4. **Build Next.js** → Dependencies déjà en cache npm ✅
5. **Git commits/push** → GitHub connexion stable ✅

#### Alternatives Identifiées

**Pour Firebase Hosting** :
```bash
# Option A : Réseau différent
# - Mobile hotspot iPhone/Android
# - WiFi public (café, bibliothèque)
# - VPN commercial (NordVPN, ExpressVPN)

# Option B : Autre machine
# - Demander à collègue avec connexion stable
# - Cloud IDE (GitHub Codespaces, Replit)

# Option C : Manuel (dernier recours)
# - Upload via Firebase Console UI
# - Moins fiable, non recommandé
```

**Pour Android SDK** :
```bash
# Option A : Téléchargement manuel
# 1. Aller sur https://developer.android.com/studio#command-tools
# 2. Télécharger commandlinetools-mac-*.zip (~100MB)
# 3. Extraire dans ~/.bubblewrap/android/
# 4. Configurer ~/.bubblewrap/config.json avec chemin

# Option B : Android Studio
# 1. Installer Android Studio (installer complet stable)
# 2. SDK Manager → installer build-tools 34.0.0
# 3. Pointer Bubblewrap vers SDK Android Studio

# Option C : Retry horaire off-peak
# - Essayer 2h-6h du matin (moins de congestion)
# - Weekends (moins de trafic pro)
```

**Pour Screenshots** :
```bash
# Option A : Playwright retry
npx playwright install chromium --force

# Option B : Capture manuelle
# - Installer app sur device Android (après AAB build)
# - Capturer écrans natifs (Power + Volume Down)
# - Transférer via USB : adb pull /sdcard/Screenshots/

# Option C : Garder placeholders v1
# - Acceptable pour première soumission
# - Remplacer dans update v1.1
```

---

### 📊 Recommandations Priorisées

#### 🔥 Urgent (bloquant publication)
1. **Firebase Hosting** : Retry depuis mobile hotspot (30 min)
2. **Android AAB** : Téléchargement manuel SDK OU Android Studio (2h)

#### 🟡 Important (qualité)
3. **Screenshots réels** : Capture manuelle device après AAB (1h)

#### 🟢 Optionnel (amélioration)
4. DNS optimization : Changer pour Google DNS (8.8.8.8)
5. Network monitoring : Installer Wireshark pour debug futur

---

### 🔧 Actions à Réessayer

#### Checklist Réseau Stable
Avant de réessayer, vérifier :
```bash
# 1. Vitesse réseau
speedtest-cli  # OU https://fast.com
# Minimum requis : 5 Mbps download, 1 Mbps upload

# 2. Latence
ping -c 10 dl.google.com
# Acceptable : <100ms moyenne, <5% packet loss

# 3. DNS
nslookup dl.google.com
nslookup firebasehosting.googleapis.com
# Doit résoudre sans timeout

# 4. Firewall
# Vérifier que ports 443 (HTTPS) et 80 (HTTP) ouverts
```

#### Commandes à Retry (dans l'ordre)
```bash
# 1. Firebase Hosting (priorité critique)
firebase deploy --only hosting
# Attendu : "Deploy complete!" + URL https://budget-app.web.app

# 2. Android SDK (priorité critique)
npx @bubblewrap/cli init --manifest twa-manifest.json --skipPwaValidation
# Attendu : "Project generated successfully"

# 3. Build AAB
cd android && ./gradlew bundleRelease
# Attendu : app-release.aab dans build/outputs/bundle/release/

# 4. Screenshots (optionnel)
npx playwright install chromium --force
npm run screenshots
# Attendu : 10 PNG dans playstore-assets/
```

---

### 📈 Métriques Session

**Durée totale** : 11 heures (13:00 - 24:00)  
**Tâches tentées** : 10  
**Tâches complétées** : 7 (70%)  
**Bloquées réseau** : 3 (30%)  

**Fichiers modifiés** : 4  
**Commits git** : 2 (36c003ed, 758b36f6)  
**Documentation créée** : 2 fichiers (NEXT_STEPS_PLAYSTORE.md, ce fichier)

**Temps perdu réseau** : ~4 heures (40% de la session)  
**Temps productif** : ~7 heures (emails, build, doc, features)

---

### 🎯 Plan Session Suivante

#### Si Réseau Stable
1. **Déployer Firebase** (30 min)
2. **Build AAB Android** (2h)
3. **Tester APK** (1h)
4. **Soumettre Play Console** (1h)
5. **Total** : ~4.5h → App en review

#### Si Réseau Instable
1. **Continuer dev features** :
   - Étendre offline queue aux transactions
   - Pagination budgets/goals
   - Plus de graphiques Reports
   - Guide utilisateur docs/
2. **Optimisations** :
   - Bundle analysis webpack-bundle-analyzer
   - Lighthouse audits (`npm run perf:mobile`)
3. **Tests** :
   - Couvrir plus de cas edge Vitest
   - E2E Playwright scenarios additionnels

---

### 📞 Support Escalation

Si problèmes persistent >24h :

**Firebase Support** :
- Console : https://console.firebase.google.com/project/studio-3821270625-cd276/support
- Stack Overflow : tag `firebase-hosting`

**Android/Bubblewrap Support** :
- GitHub Issues : https://github.com/GoogleChromeLabs/bubblewrap/issues
- Stack Overflow : tag `trusted-web-activity`

**ISP/Réseau** :
- Contacter fournisseur Internet
- Tester depuis connexion alternative (confirmation isolation problème)

---

**Dernière mise à jour** : 3 novembre 2025, 23:55  
**Status** : 🔴 Réseau instable - Attendre stabilité OU changer connexion  
**Prochaine révision** : 4 novembre 2025, 08:00
