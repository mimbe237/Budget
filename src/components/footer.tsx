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
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground/70 sm:text-sm">
              {isFrench ? "Propulsé par" : "Powered by"}{" "}
              <a
                href="https://www.beonweb.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-muted-foreground/90 transition-colors hover:text-primary hover:underline"
              >
                BEONWEB
              </a>{" "}
              © {currentYear}
            </p>
            <span className="text-muted-foreground/50">•</span>
            <a
              href="/"
              className="text-xs text-muted-foreground/70 transition-colors hover:text-primary hover:underline sm:text-sm"
            >
              {isFrench ? "Présentation" : "About"}
            </a>
            <span className="text-muted-foreground/50">•</span>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="text-xs text-muted-foreground/70 transition-colors hover:text-primary hover:underline sm:text-sm"
            >
              {isFrench ? "Contactez-nous" : "Contact us"}
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
