# 📱 Guide de Build Android - Budget Pro TWA

## ✅ État Actuel

### Complété
- ✅ **Keystore Android** : `android-keys/budget-app.keystore` (SHA256 extrait)
- ✅ **Digital Asset Links** : Déployé sur https://studio-3821270625-cd276.web.app/.well-known/assetlinks.json
- ✅ **Privacy Policy** : Accessible sur https://studio-3821270625-cd276.web.app/privacy.html
- ✅ **TWA Manifest** : `twa-manifest.json` configuré avec :
  - Package ID : `com.touchpointinsights.budget`
  - Host : `studio-3821270625-cd276.web.app`
  - Keystore : `android-keys/budget-app.keystore` (alias: `budget-release`)

### Problème Bubblewrap CLI
- ❌ `npx @bubblewrap/cli init` échoue avec "Invalid URL"
- ❌ `npx @bubblewrap/cli build` échoue avec JAVA_HOME double path

---

## 🛠️ Solution Recommandée : PWABuilder

**PWABuilder** est plus stable que Bubblewrap CLI et génère des AAB prêts pour le Play Store.

### Étapes

#### 1. Générer l'APK/AAB en ligne

Visitez : **https://www.pwabuilder.com/**

1. **Entrer l'URL** : `https://studio-3821270625-cd276.web.app/`
2. Cliquer sur **"Start"**
3. PWABuilder analyse le manifest et génère un rapport
4. Aller dans l'onglet **"Publish"** → **Android**
5. **Options** :
   - Package Name : `com.touchpointinsights.budget`
   - App name : `Budget Pro`
   - Launcher name : `Budget Pro`
   - Version : `1` (version code) et `1.0.0` (version name)
   - Host : `studio-3821270625-cd276.web.app`
   - Start URL : `/`

6. **Download Options** :
   - **Option A** : Télécharger le projet source (`.zip`)
   - **Option B** : Télécharger l'APK signé directement (si PWABuilder signe)

#### 2. Si téléchargement du projet source

Extraire le `.zip` téléchargé dans un dossier `android/` :

```bash
cd /Users/macbook/Touch-Point-Insights/Finance/Budget
unzip ~/Downloads/budget-pro-android.zip -d android/
cd android
```

#### 3. Signer avec notre keystore

Éditer `android/app/build.gradle` pour ajouter la signature :

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../android-keys/budget-app.keystore')
            storePassword 'votre-mot-de-passe-keystore'
            keyAlias 'budget-release'
            keyPassword 'votre-mot-de-passe-key'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Builder l'AAB

```bash
cd android
./gradlew bundleRelease
```

L'AAB signé sera dans : `android/app/build/outputs/bundle/release/app-release.aab`

#### 5. Copier l'AAB dans playstore-assets

```bash
cp app/build/outputs/bundle/release/app-release.aab ../playstore-assets/budget-pro-v1.0.0.aab
```

---

## 🔧 Alternative : Android Studio (méthode manuelle)

### Prérequis
- Android Studio installé (https://developer.android.com/studio)
- Android SDK 33+ installé via SDK Manager

### Étapes

1. **Créer un nouveau projet TWA** :
   - Ouvrir Android Studio
   - File → New → Project → Empty Activity
   - Name : `Budget Pro`
   - Package : `com.touchpointinsights.budget`
   - Language : Kotlin
   - Minimum SDK : API 23

2. **Configurer TWA** :

Ajouter dans `app/build.gradle` :

```gradle
dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
```

Modifier `AndroidManifest.xml` :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.touchpointinsights.budget">
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Budget Pro"
        android:theme="@style/Theme.AppCompat.NoActionBar">
        
        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://studio-3821270625-cd276.web.app/" />
                
            <meta-data
                android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR"
                android:resource="@color/navigationColor" />
                
            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/statusBarColor" />
                
            <meta-data
                android:name="android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY"
                android:value="com.touchpointinsights.budget.fileprovider" />
        </activity>
        
    </application>
    
</manifest>
```

3. **Ajouter assetlinks.json** :

Créer `app/src/main/res/values/colors.xml` :

```xml
<resources>
    <color name="navigationColor">#1F2937</color>
    <color name="statusBarColor">#4F46E5</color>
</resources>
```

4. **Build AAB** :
   - Build → Generate Signed Bundle / APK
   - Sélectionner Android App Bundle
   - Choisir keystore : `android-keys/budget-app.keystore`
   - Alias : `budget-release`
   - Build

---

## 📋 Vérifications Avant Soumission Play Store

### 1. Tester l'APK localement

```bash
# Installer sur device via USB
adb install playstore-assets/budget-pro-v1.0.0.apk

# Vérifier les logs
adb logcat | grep BudgetPro
```

### 2. Valider Digital Asset Links

Ouvrir l'app sur device Android → Si elle charge `studio-3821270625-cd276.web.app` sans barre d'adresse = ✅ TWA fonctionne

### 3. Vérifier la signature

```bash
keytool -printcert -jarfile playstore-assets/budget-pro-v1.0.0.aab
# Doit afficher SHA256 : 2E:69:AD:A9:AC:09:56:83:E0:99:8F:6D:92:49:93:92:63:E9:75:9F:12:FC:25:95:3D:BC:17:E8:32:B1:91:99
```

---

## 🎯 Prochaines Étapes (après AAB généré)

1. **Upload Play Console** : https://play.google.com/console
2. **Ajouter assets** :
   - Feature graphic : `playstore-assets/feature-graphic-dark-1024x500.png`
   - Screenshots : 5 placeholders `playstore-assets/*.png`
   - Copier-coller listing : `docs/PLAYSTORE_LISTING_FR.md`
3. **Configurer Data Safety** : Déclarer les données Firebase collectées
4. **Soumettre pour review** : 1-3 jours d'attente

---

## 📞 Support

- **Keystore password** : Disponible dans vos notes sécurisées
- **SHA256 fingerprint** : `2E:69:AD:A9:AC:09:56:83:E0:99:8F:6D:92:49:93:92:63:E9:75:9F:12:FC:25:95:3D:BC:17:E8:32:B1:91:99`
- **Email support** : contact@budgetpro.net
- **Privacy Policy** : https://studio-3821270625-cd276.web.app/privacy.html

---

**Note** : PWABuilder est recommandé car il génère automatiquement toute la configuration TWA sans les problèmes de Bubblewrap CLI.
