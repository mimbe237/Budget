// Suggestions d'objectifs courants et modèles IA
export const COMMON_GOAL_SUGGESTIONS = [
  {
    name: 'Épargne d’urgence',
    name_en: 'Emergency Fund',
    defaultAmount: 200000,
    defaultMonths: 6,
    icon: 'shield',
  },
  {
    name: 'Achat d’une voiture',
    name_en: 'Buy a Car',
    defaultAmount: 3000000,
    defaultMonths: 24,
    icon: 'car',
  },
  {
    name: 'Voyage',
    name_en: 'Travel',
    defaultAmount: 1000000,
    defaultMonths: 12,
    icon: 'plane',
  },
  {
    name: 'Mariage',
    name_en: 'Wedding',
    defaultAmount: 2500000,
    defaultMonths: 18,
    icon: 'heart',
  },
  {
    name: 'Cadeau',
    name_en: 'Gift',
    defaultAmount: 200000,
    defaultMonths: 3,
    icon: 'gift',
  },
  {
    name: 'Projet personnel',
    name_en: 'Personal Project',
    defaultAmount: 500000,
    defaultMonths: 9,
    icon: 'star',
  },
];

// Utilisé pour l’IA : prompt de suggestion
export const GOAL_AI_PROMPT = `Propose un objectif financier personnalisé pour l’utilisateur selon son âge, ses revenus, ses dépenses et ses habitudes. Donne un nom, un montant cible et une date d’échéance réalistes.`;
