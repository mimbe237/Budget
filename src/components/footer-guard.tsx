"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function FooterGuard() {
  const pathname = usePathname() ?? "";
  if (pathname === "/" || pathname === "/home") {
    return null;
  }
  return <Footer />;
}
