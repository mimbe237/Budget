"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function FooterGuard() {
  const pathname = usePathname() ?? "";
  
  // Pages où le footer ne doit PAS s'afficher
  const hideFooterRoutes = [
    "/",
    "/home",
    "/dashboard",
    "/transactions",
    "/categories",
    "/goals",
    "/debts",
    "/ai-insights",
    "/reports",
    "/settings",
    "/admin",
    "/affiliates",
  ];

  // Vérifier si la route actuelle correspond à une des routes où cacher le footer
  const shouldHideFooter = hideFooterRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}
