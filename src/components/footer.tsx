'use client';

import { useState } from "react";
import { useUser } from "@/firebase";
import { ContactDialog } from "./contact-dialog";

export function Footer() {
  const { userProfile } = useUser();
  const currentYear = new Date().getFullYear();
  const isFrench = (userProfile?.locale as string)?.startsWith("fr");
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <footer className="w-full border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-1 text-center text-xs text-muted-foreground/70 sm:text-sm">
            <span>{isFrench ? "Propulsé par" : "Powered by"}</span>
            <a
              href="https://www.beonweb.cm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted-foreground/90 transition-colors hover:text-primary hover:underline"
            >
              BEONWEB
            </a>
            <span>© {currentYear}</span>
            <span className="mx-1 text-muted-foreground/50">•</span>
            <a
              href="/"
              className="transition-colors hover:text-primary hover:underline"
            >
              {isFrench ? "Présentation" : "About"}
            </a>
            <span className="mx-1 text-muted-foreground/50">•</span>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="transition-colors hover:text-primary hover:underline"
            >
              {isFrench ? "Contactez-nous" : "Contact us"}
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
