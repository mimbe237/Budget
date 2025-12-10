# Configuration Sécurité Android - À Compléter

## ⚠️ IMPORTANT: Cette clé de signature est TRÈS sensible!

## Étapes pour générer votre keystore:

### 1. Générer la clé
```bash
keytool -genkey -v -keystore ~/budget_pro_release.keystore \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -alias budget_pro_key
```

### 2. Utiliser les valeurs suivantes:
- **First and last name:** BudgetPro Team
- **Organizational unit:** Development  
- **Organization:** BeoNWeb
- **City or Locality:** Yaoundé
- **State or Province:** Centre
- **Country code:** CM
- **Keystore password:** [Créez un mot de passe fort]
- **Key password:** [Même mot de passe]

### 3. Le fichier sera créé à: `~/budget_pro_release.keystore`

### 4. Ajouter à .gitignore
```
# NE JAMAIS commiter la clé privée!
android/key.properties
~/budget_pro_release.keystore
*.keystore
*.jks
```

### 5. Créer android/key.properties avec:
```properties
storePassword=MOT_DE_PASSE_ICI
keyPassword=MOT_DE_PASSE_ICI
keyAlias=budget_pro_key
storeFile=/Users/macbook/budget_pro_release.keystore
```

### 6. Sauvegarder le keystore
- Localisation: `~/budget_pro_release.keystore`
- Backup: Faire une copie sécurisée
- Password: Stocker dans un gestionnaire de secrets

## Vérifier le certificat:
```bash
keytool -list -v -keystore ~/budget_pro_release.keystore
```

## ⚠️ SÉCURITÉ CRITIQUE:
- Ne partagez JAMAIS le keystore
- Ne le committez PAS sur Git  
- Stockez le mot de passe de manière sécurisée
- Une seule clé par app (sinon Play Store refusera les mises à jour)
