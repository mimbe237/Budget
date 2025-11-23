import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protéger toutes les routes /admin sauf /admin/login
  if (path.startsWith('/admin') && path !== '/admin/login') {
    // Vérifier si l'utilisateur est authentifié via cookie ou header
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      // Rediriger vers la page de login si pas authentifié
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
