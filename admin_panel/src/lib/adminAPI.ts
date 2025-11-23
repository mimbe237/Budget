import { auth } from '@/lib/firebase';

/**
 * Helper pour appeler les routes API admin avec authentification Bearer
 * @param endpoint - Le chemin de l'API (ex: '/api/admin/monthly-stats')
 * @param options - Options fetch supplémentaires (method, body, etc.)
 */
export async function fetchAdminAPI(endpoint: string, options: RequestInit = {}) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  // Récupérer le token Firebase ID
  const idToken = await currentUser.getIdToken();

  // Fusionner les headers
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${idToken}`);
  
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Effectuer la requête
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Parser la réponse JSON
  const data = await response.json();

  // Gérer les erreurs HTTP
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}
