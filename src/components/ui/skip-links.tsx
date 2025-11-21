"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SkipLinkProps {
  isFrench?: boolean;
}

export function SkipLinks({ isFrench = false }: SkipLinkProps) {
  const pathname = usePathname();
  
  // Ne pas afficher sur les pages de login/signup
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <>
      <Link
        href="#main-content"
        className="sr-only-focusable fixed top-2 left-2 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {isFrench ? "Aller au contenu principal" : "Skip to main content"}
      </Link>
      <Link
        href="#main-navigation"
        className="sr-only-focusable fixed top-2 left-40 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {isFrench ? "Aller à la navigation" : "Skip to navigation"}
      </Link>
    </>
  );
}
