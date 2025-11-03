/**
 * Custom Firestore Logger
 * 
 * Filtre les messages de log Firestore pour éviter le spam de warnings réseau
 * tout en conservant les véritables erreurs critiques.
 */

// Messages Firestore à filtrer (logs informatifs, pas des erreurs)
const FILTERED_MESSAGES = [
  'Could not reach Cloud Firestore backend',
  'Backend didn\'t respond within',
  'The client will operate in offline mode',
  'Connection to Indexed',
  'First Firestore write detected',
];

// Liste des codes d'erreur à considérer comme non-critiques
const NON_CRITICAL_CODES = [
  'failed-precondition', // Multiple tabs
  'unimplemented',       // Browser sans support persistence
  'unavailable',         // Service temporairement indisponible
];

/**
 * Vérifie si un message doit être filtré (informatif, pas critique)
 */
function shouldFilterMessage(message: string): boolean {
  return FILTERED_MESSAGES.some(filter => message.includes(filter));
}

/**
 * Vérifie si une erreur est non-critique
 */
function isNonCriticalError(error: any): boolean {
  if (!error) return false;
  
  const code = error?.code || error?.message || '';
  return NON_CRITICAL_CODES.some(nonCritical => code.includes(nonCritical));
}

/**
 * Intercepte et filtre les logs console de Firestore
 * Doit être appelé avant l'initialisation de Firestore
 */
export function setupFirestoreLogger() {
  if (typeof window === 'undefined') return;

  // Sauvegarder les fonctions console originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Override console.error pour filtrer les messages Firestore
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    
    // Filtrer les messages Firestore informatifs
    if (message.includes('@firebase/firestore') || message.includes('Firestore')) {
      if (shouldFilterMessage(message)) {
        // Log en debug uniquement (pas visible par défaut)
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FIRESTORE) {
          console.debug('[Firestore Info]', ...args);
        }
        return;
      }
    }
    
    // Laisser passer les vraies erreurs
    originalConsoleError.apply(console, args);
  };

  // Override console.warn pour filtrer les warnings Firestore non-critiques
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    
    if (message.includes('@firebase/firestore') || message.includes('Firestore')) {
      if (shouldFilterMessage(message)) {
        return; // Filtrer complètement
      }
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // Log de démarrage (développement uniquement)
  if (process.env.NODE_ENV === 'development') {
    console.info('[Firestore] Logger configuré - Messages réseau filtrés');
  }
}

/**
 * Log une erreur Firestore de manière contextuelle
 */
export function logFirestoreError(context: string, error: any) {
  if (isNonCriticalError(error)) {
    // Erreur non-critique - log silencieux
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FIRESTORE) {
      console.debug(`[Firestore/${context}] Non-critical:`, error?.message || error);
    }
    return;
  }
  
  // Erreur critique - log avec contexte
  console.error(`[Firestore/${context}] Critical error:`, error);
}

/**
 * Log une information Firestore utile (mode développement uniquement)
 */
export function logFirestoreInfo(context: string, message: string, data?: any) {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FIRESTORE) {
    console.info(`[Firestore/${context}]`, message, data || '');
  }
}
