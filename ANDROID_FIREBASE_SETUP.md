# Fix: Écran blanc APK Android - Firebase manquant

## Problème
L'APK s'ouvre mais affiche un écran blanc car Firebase n'est pas configuré correctement sur Android.

## Solution

### 1. Télécharger google-services.json depuis Firebase Console

1. Allez sur https://console.firebase.google.com/project/budget-pro-8e46f/settings/general
2. Scrollez vers "Vos applications" → Section Android
3. Si aucune app Android n'existe :
   - Cliquez "Ajouter une application" → Android
   - Package name: `com.example.budget` (doit correspondre à `applicationId` dans `android/app/build.gradle.kts`)
   - Nom de l'app: "Budget Pro"
   - Certificat SHA-1 (optionnel pour l'instant)
   - Cliquez "Enregistrer l'app"
4. Téléchargez le fichier `google-services.json`
5. Placez-le dans: `android/app/google-services.json`

### 2. Vérifier le plugin Google Services

Le fichier `android/build.gradle.kts` doit contenir :

```kotlin
plugins {
    id("com.google.gms.google-services") version "4.4.0" apply false
}
```

Le fichier `android/app/build.gradle.kts` doit contenir :

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")  // ← Ajoutez cette ligne
}
```

### 3. Permissions Internet (déjà présent normalement)

Vérifiez que `android/app/src/main/AndroidManifest.xml` contient :

```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

### 4. Rebuild l'APK

```bash
flutter clean
flutter build apk --release
```

### 5. Alternative : Mode sans Firebase (Mock)

Si vous voulez tester l'app sans Firebase immédiatement, modifiez `lib/main.dart` pour ignorer les erreurs Firebase :

```dart
try {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  print('✓ Firebase initialized successfully');
} catch (e) {
  print('⚠️ Firebase init failed: $e');
  // L'application continue avec MockDataService
}
```

Cette approche est déjà implémentée, mais assurez-vous que `MockDataService` est bien utilisé quand Firebase échoue.

## Test rapide

Installez l'APK avec :
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
adb logcat | grep -i flutter
```

Observez les logs pour voir l'erreur Firebase exacte.

## Note sur l'espace disque

Votre disque est à 98% plein (5.6 GB disponibles). Nettoyez :

```bash
# Nettoyer les caches Gradle
rm -rf ~/.gradle/caches/
rm -rf android/.gradle/

# Nettoyer les builds Flutter anciens
flutter clean

# Nettoyer les dépendances node_modules si non utilisées
rm -rf node_modules/
```
