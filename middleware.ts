import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/reset-password',
  '/pending-approval',
  '/offline',
];

// Routes qui nécessitent seulement l'authentification (pas de vérification de statut)
const AUTH_ONLY_ROUTES = [
  '/pending-approval',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permettre l'accès aux assets statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // fichiers avec extension
  ) {
    return NextResponse.next();
  }

  // Permettre l'accès aux routes publiques
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes, rediriger vers login si pas authentifié
  // Note: La vérification du statut utilisateur se fera côté client via Firebase Auth
  // car le middleware Next.js n'a pas accès direct à Firebase Auth
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
