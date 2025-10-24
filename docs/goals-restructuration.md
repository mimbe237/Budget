# Restructuration du Système d'Objectifs avec Pièces Jointes

## 🎯 Objectifs de la refonte

1. **Supprimer le champ "Collaborators"** qui n'avait pas de sens dans le contexte actuel
2. **Ajouter les pièces jointes** pour les contributions aux objectifs, dépenses et revenus
3. **Améliorer la cohérence** entre la page d'accueil et la page Goals dédiée
4. **Simplifier le modèle de données** pour une meilleure expérience utilisateur

## 📝 Changements implémentés

### 1. Modification du modèle de données

#### Type `Goal` (simplifié)
```typescript
export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmountInCents: number;
  currentAmountInCents: number;
  currency: Currency;
  targetDate: string;
  description?: string;  // Nouveau
  icon?: string;
  color?: string;
  archived?: boolean;
  archiveStatus?: 'completed' | 'abandoned';
  archivedAt?: string;
  createdAt: string;
  updatedAt?: string;
};
```

**Supprimé:**
- ❌ `collaborators` (plus utilisé)
- ❌ `type` (GoalType - redondant)
- ❌ `priority` (géré par l'ordre)
- ❌ `status` ('actif'/'pause' - géré par archived)
- ❌ `history` (maintenant dans collection séparée)

**Ajouté:**
- ✅ `description` - Description optionnelle de l'objectif
- ✅ Structure cohérente avec `targetAmountInCents` et `currentAmountInCents`

#### Type `GoalTransaction` (avec pièces jointes)
```typescript
export type GoalTransaction = {
  id: string;
  goalId: string;
  userId: string;
  amountInCents: number;
  createdAt: string;
  updatedAt?: string;
  note?: string;
  attachmentUrl?: string;      // Nouveau
  attachmentName?: string;     // Nouveau
  attachmentType?: string;     // Nouveau
};
```

#### Type `Transaction` (avec pièces jointes)
```typescript
export type Transaction = {
  id: string;
  date: string;
  description: string;
  amountInCents: number;
  type: 'income' | 'expense';
  currency: Currency;
  category: string;
  userId: string;
  categoryId?: string;
  attachmentUrl?: string;      // Nouveau
  attachmentName?: string;     // Nouveau
  attachmentType?: string;     // Nouveau
};
```

### 2. Nouveaux composants créés

#### `FileAttachment` Component
**Fichier:** `src/components/ui/file-attachment.tsx`

**Fonctionnalités:**
- ✅ Upload de fichiers (images, PDF, documents)
- ✅ Validation de taille (max 5 MB par défaut)
- ✅ Prévisualisation avec icône selon le type
- ✅ Téléchargement du fichier
- ✅ Suppression du fichier
- ✅ Conversion en base64 pour stockage
- ✅ Messages d'erreur localisés
- ✅ Support drag & drop (futur)

**Usage:**
```tsx
<FileAttachment
  value={attachment}
  onChange={setAttachment}
  isFrench={true}
  disabled={false}
  accept="image/*,.pdf,.doc,.docx"
  maxSize={5}
/>
```

#### `ContributionDialog` (mis à jour)
**Fichier:** `src/components/goals/ContributionDialog.tsx`

**Nouvelles fonctionnalités:**
- ✅ Champ pièce jointe optionnel
- ✅ Aperçu du montant après contribution
- ✅ Alerte si dépassement de l'objectif
- ✅ Validation en temps réel

#### `ContributionHistoryDialog`
**Fichier:** `src/components/goals/ContributionHistoryDialog.tsx`

**Fonctionnalités:**
- ✅ Historique complet des contributions avec pagination
- ✅ Modification du montant et de la note
- ✅ Suppression d'une contribution (avec mise à jour de l'objectif)
- ✅ Affichage des pièces jointes avec téléchargement
- ✅ Total des contributions affiché
- ✅ Statistiques visuelles

#### `GoalsOverview` (nouveau - pour dashboard)
**Fichier:** `src/components/dashboard/goals-overview-new.tsx`

**Approche:**
- ✅ **Aperçu simplifié** - Affiche les 3 objectifs les plus récents
- ✅ **Vue résumée** - Nom, progression, date cible
- ✅ **Barre de progression visuelle**
- ✅ **Badge "Objectif atteint"** si >= 100%
- ✅ **Bouton "Voir tous les objectifs"** vers `/goals`
- ✅ **Design épuré** optimisé pour la vue d'ensemble

**Différence avec la page Goals complète:**

| Fonctionnalité | Dashboard (Aperçu) | Page Goals (Complète) |
|----------------|-------------------|----------------------|
| **Nombre d'objectifs** | 3 les plus récents | Tous (avec pagination) |
| **Actions** | Aucune (lecture seule) | Ajouter contribution, Modifier, Supprimer |
| **Historique** | Non affiché | Accessible via dialogue |
| **Détails** | Résumé simple | Complet avec toutes les actions |
| **Objectif** | Vue d'ensemble rapide | Gestion complète |

### 3. Modifications des composants existants

#### `GoalForm.tsx`
**Changements:**
- ❌ Supprimé champ `collaborators`
- ✅ Ajouté champ `description` (optionnel)
- ✅ Simplifié la structure des données
- ✅ Meilleure validation
- ✅ Auto-sauvegarde des brouillons

#### `GoalCard.tsx` 
**Changements:**
- ❌ Supprimé affichage `collaborators`
- ✅ Utilise le nouveau système de contributions
- ✅ Intégration avec `ContributionDialog`

### 4. Architecture des pièces jointes

#### Stockage
**Actuel:** Base64 dans Firestore
```typescript
{
  attachmentUrl: "data:image/png;base64,iVBORw0KG...",
  attachmentName: "facture.pdf",
  attachmentType: "application/pdf"
}
```

**Future migration (recommandé):**
- Firebase Storage pour fichiers > 1 MB
- URL publique ou signée
- Meilleure performance

#### Types de fichiers acceptés
- ✅ Images: `.jpg`, `.png`, `.gif`, `.webp`
- ✅ Documents: `.pdf`, `.doc`, `.docx`
- ✅ Tableurs: `.xls`, `.xlsx` (optionnel)
- ✅ Limite: 5 MB par fichier

#### Sécurité
- ✅ Validation côté client (taille, type)
- ✅ Stockage sécurisé dans Firestore (règles)
- 🔜 Scan antivirus (recommandé en production)
- 🔜 Firebase Storage Rules

## 🎨 Expérience utilisateur

### Page d'accueil (Dashboard)

**Objectif:** Vue d'ensemble rapide

```
┌─────────────────────────────────────┐
│ 🎯 Objectifs d'épargne             │
│ Suivez vos objectifs financiers    │
│                                      │
│ ┌──────────────────────────────┐   │
│ │ Vacances d'été               │   │
│ │ 📅 Juin 2026                 │   │
│ │ ███████████░░░ 75%          │   │
│ │ 1,500 € / 2,000 €           │   │
│ │ Reste: 500 €                 │   │
│ └──────────────────────────────┘   │
│                                      │
│ [Voir tous les objectifs]           │
└─────────────────────────────────────┘
```

### Page Goals dédiée

**Objectif:** Gestion complète

```
┌─────────────────────────────────────┐
│ Objectifs financiers          [+]   │
│                                      │
│ Nom          | Progression | Actions│
│──────────────────────────────────────│
│ Vacances     | ████ 75%   | [Menu] │
│              | 1,500/2,000€|  [+]   │
│              |  Juin 2026  |        │
│──────────────────────────────────────│
│                                      │
│ Menu déroulant:                     │
│  • Modifier                         │
│  • Ajouter contribution  ←─────────┐│
│  • Voir historique                ││
│  • Marquer comme atteint          ││
│  • Supprimer                      ││
└───────────────────────────────────┘│
                                     ││
  ┌──────────────────────────────────┘│
  │ Dialog: Ajouter contribution      │
  ├───────────────────────────────────┤
  │ Montant: [_____] €               │
  │ Note: [________________]         │
  │ Pièce jointe: [Choisir fichier]  │
  │                                   │
  │ Aperçu:                          │
  │ • Actuel: 1,500 €                │
  │ • Après:  1,750 € ✅             │
  │ • Reste:    250 €                │
  │                                   │
  │ [Annuler]        [Ajouter]       │
  └───────────────────────────────────┘
```

### Historique des contributions

```
┌──────────────────────────────────────┐
│ 📜 Historique des contributions      │
│                                       │
│ Total des contributions: 1,500 €     │
│                                       │
│ Date        | Montant | Note | [...]│
│──────────────────────────────────────│
│ 15 Oct 2025 | 500 €   | Sal. | 📎   │
│ 01 Oct 2025 | 500 €   | -    | -    │
│ 15 Sep 2025 | 500 €   | Bon. | 📄   │
│──────────────────────────────────────│
│                                       │
│ Page 1 sur 3          [<] [>]        │
│                                       │
│ [Fermer]                             │
└──────────────────────────────────────┘
```

## 🔧 Intégration dans le code existant

### 1. Page Goals (`src/app/goals/page.tsx`)

**Modifications nécessaires:**

```typescript
// Mettre à jour la signature de handleAddContribution
const handleAddContribution = async (
  goal: Goal, 
  amountInCents: number,
  note?: string,
  attachment?: { url: string; name: string; type: string }
) => {
  if (!user || !firestore) return;
  
  try {
    // 1. Mettre à jour le montant de l'objectif
    const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, goal.id);
    const newAmount = (goal.currentAmountInCents || 0) + amountInCents;
    await updateDoc(goalRef, { 
      currentAmountInCents: newAmount,
      updatedAt: new Date().toISOString()
    });
    
    // 2. Créer la transaction avec pièce jointe
    const transactionsRef = collection(
      firestore, 
      `users/${user.uid}/budgetGoals/${goal.id}/transactions`
    );
    await addDoc(transactionsRef, {
      goalId: goal.id,
      userId: user.uid,
      amountInCents,
      note,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
      createdAt: new Date().toISOString(),
    });
    
    queryClient.invalidateQueries({ 
      queryKey: [`users/${user.uid}/budgetGoals`] 
    });
    
    success(
      isFrench ? 'Contribution ajoutée' : 'Contribution Added',
      formatMoney(amountInCents, displayCurrency, displayLocale)
    );
  } catch (err) {
    error(
      isFrench ? 'Erreur' : 'Error',
      isFrench ? 'Impossible d\'ajouter la contribution' : 'Failed to add contribution'
    );
  }
};
```

### 2. GoalCard (`src/components/goals/GoalCard.tsx`)

**Modifications:**

```typescript
// Supprimer l'affichage des collaborators
// Ligne à supprimer:
{goal.collaborators && goal.collaborators.length > 0 && (
  <div className="text-xs text-blue-600 mt-1">
    {translations.sharedWith}{goal.collaborators.join(', ')}
  </div>
)}
```

### 3. Ajout pièces jointes aux transactions

**Fichier:** `src/app/transactions/add/page.tsx`

```typescript
// Ajouter état pour l'attachement
const [attachment, setAttachment] = useState<{
  url: string;
  name: string;
  type: string;
} | null>(null);

// Dans le formulaire
<FileAttachment
  value={attachment}
  onChange={setAttachment}
  isFrench={isFrench}
  accept="image/*,.pdf,.doc,.docx"
  maxSize={5}
/>

// Lors de la sauvegarde
await addDoc(expensesCollection, {
  // ... autres champs
  attachmentUrl: attachment?.url,
  attachmentName: attachment?.name,
  attachmentType: attachment?.type,
});
```

## 📊 Migration des données existantes

### Script de migration (optionnel)

Si vous avez des objectifs existants avec l'ancien format:

```typescript
async function migrateGoals() {
  const goalsRef = collection(firestore, `users/${userId}/goals`);
  const snapshot = await getDocs(goalsRef);
  
  for (const docSnap of snapshot.docs) {
    const oldGoal = docSnap.data();
    
    // Créer dans la nouvelle collection
    const newGoalRef = doc(
      firestore, 
      `users/${userId}/budgetGoals`, 
      docSnap.id
    );
    
    await setDoc(newGoalRef, {
      id: docSnap.id,
      userId: oldGoal.userId,
      name: oldGoal.name,
      targetAmountInCents: oldGoal.targetAmount || 0,
      currentAmountInCents: oldGoal.acquiredAmount || 0,
      currency: oldGoal.currency || 'USD',
      targetDate: oldGoal.deadline || new Date().toISOString(),
      description: '',
      archived: oldGoal.status === 'atteint',
      createdAt: oldGoal.createdAt || new Date().toISOString(),
    });
    
    // Migrer l'historique vers transactions
    if (oldGoal.history && oldGoal.history.length > 0) {
      const transactionsRef = collection(
        firestore, 
        `users/${userId}/budgetGoals/${docSnap.id}/transactions`
      );
      
      for (const entry of oldGoal.history) {
        await addDoc(transactionsRef, {
          goalId: docSnap.id,
          userId: oldGoal.userId,
          amountInCents: entry.amount,
          note: `Migré de l'historique`,
          createdAt: entry.date,
        });
      }
    }
  }
}
```

## 🚀 Prochaines étapes

### Court terme
1. **Tester l'ajout de contributions** avec pièces jointes
2. **Vérifier la pagination** de l'historique
3. **Ajouter les pièces jointes** aux transactions (dépenses/revenus)
4. **Tester la modification/suppression** de contributions

### Moyen terme
1. **Migrer vers Firebase Storage** pour les fichiers > 1 MB
2. **Ajouter prévisualisation** des images dans les dialogues
3. **Implémenter drag & drop** pour les pièces jointes
4. **Ajouter filtres** dans l'historique (date, montant)

### Long terme
1. **Compression automatique** des images
2. **OCR sur les factures** pour extraction automatique des montants
3. **Catégorisation IA** des dépenses depuis les factures
4. **Export PDF** des objectifs avec historique

## 📝 Checklist de déploiement

- [ ] Tester ajout d'objectif sans collaborators
- [ ] Tester ajout de contribution avec pièce jointe
- [ ] Tester modification de contribution
- [ ] Tester suppression de contribution
- [ ] Tester historique avec pagination
- [ ] Vérifier affichage dashboard vs page Goals
- [ ] Tester sur mobile (responsive)
- [ ] Vérifier règles Firestore pour transactions
- [ ] Documenter limites de taille pour les utilisateurs
- [ ] Ajouter analytics sur l'usage des pièces jointes

## 🎓 Documentation utilisateur

### Comment ajouter une contribution avec facture

1. Aller sur la page **Objectifs**
2. Cliquer sur **"+"** à côté de l'objectif
3. Entrer le montant de la contribution
4. (Optionnel) Ajouter une note
5. (Optionnel) Cliquer sur **"Choisir un fichier"** pour joindre la facture
6. Cliquer sur **"Ajouter"**

### Types de fichiers acceptés

- **Images:** Photos de reçus, captures d'écran
- **PDF:** Factures numériques, relevés bancaires
- **Documents:** Contrats, justificatifs

**Limite:** 5 MB par fichier

### Consulter l'historique

1. Aller sur la page **Objectifs**
2. Cliquer sur **"Historique"** sous l'objectif
3. Voir toutes les contributions avec dates et montants
4. Télécharger les pièces jointes en cliquant sur l'icône 📎
5. Modifier ou supprimer une contribution si nécessaire

## 🐛 Problèmes connus

### Taille des fichiers
- ⚠️ Base64 augmente la taille de ~33%
- ⚠️ Limite Firestore: 1 MB par document
- ✅ Solution: Migrer vers Firebase Storage

### Performance
- ⚠️ Chargement lent avec beaucoup de pièces jointes
- ✅ Solution: Lazy loading des images

### Mobile
- ⚠️ Upload depuis appareil photo non testé
- ✅ À tester sur iOS/Android

## 📚 Ressources

- [Firebase Storage](https://firebase.google.com/docs/storage)
- [File Upload Best Practices](https://web.dev/file-upload/)
- [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)

---

**Auteur:** GitHub Copilot  
**Date:** 21 octobre 2025  
**Version:** 2.1.0
