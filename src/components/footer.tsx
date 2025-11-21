'use client';

import { useState } from "react";
import { useUser } from "@/firebase";
import { ContactDialog } from "./contact-dialog";
import "./footer.css";

export function Footer() {
  const { userProfile } = useUser();
  const currentYear = new Date().getFullYear();
  const isFrench = (userProfile?.locale as string)?.startsWith("fr");
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span>{isFrench ? "Propulsé par" : "Powered by"}</span>
            <a
              href="https://www.beonweb.cm"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link footer-brand"
            >
              BEONWEB
            </a>
            <span className="footer-dot">•</span>
            <span>© {currentYear}</span>
          </div>

          <div className="footer-right">
            <a href="/" className="footer-link">
              {isFrench ? "Présentation" : "About"}
            </a>
            <span className="footer-dot">•</span>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="footer-link"
            >
              {isFrench ? "Contactez-nous" : "Contact us"}
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
