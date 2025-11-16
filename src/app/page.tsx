"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { initializeFirebase } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CloudCog,
  Coins,
  FileBarChart,
  Layers,
  Shield,
  Sparkles,
  Users2,
  Star,
  Zap,
  Menu,
  X,
  Landmark,
} from "lucide-react";
import { ContactDialog } from "@/components/contact-dialog";

// CONFIG: URLs dynamiques et redirection automatique
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
const SIGNUP_URL = process.env.NEXT_PUBLIC_SIGNUP_URL || "/signup";
const AUTO_REDIRECT_TO_LOGIN = true; // Active la redirection automatique vers /login

type ButtonVariant = "ghost" | "secondary" | "default" | "outline";

type HomeContent = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  heroImage?: string;
  bannerImage?: string;
};

type CallToAction =
  | {
      label: string;
      href: string;
      variant: ButtonVariant;
    }
  | {
      label: string;
      dataAttr: "login" | "signup";
      variant: ButtonVariant;
    };

// === DONNÉES ENRICHIES ===
const HERO_PERKS = [
  { label: "30 jours d&apos;essai gratuit", icon: CheckCircle2 },
  { label: "Suivi des dettes &amp; échéances sécurisé", icon: Landmark },
  { label: "Installation en moins de 2 minutes", icon: Zap },
] as const;

const HERO_FALLBACK = "/illustrations/hero-diagram.svg";
const ALTERNATING_ILLUSTRATIONS = [
  "/illustrations/automation-flow.svg",
  "/illustrations/goal-tracking.svg",
  "/illustrations/export-ledger.svg",
] as const;

const SUITE_ILLUSTRATION = "/illustrations/suite-grid.svg";
const STEPS_ILLUSTRATION = "/illustrations/steps-path.svg";
const PRICING_ILLUSTRATION = "/illustrations/pricing-rings.svg";
const TESTIMONIALS_ILLUSTRATION = "/illustrations/testimonials-wave.svg";
const FAQ_ILLUSTRATION = "/illustrations/faq-orbits.svg";
const CTA_ILLUSTRATION = "/illustrations/cta-ribbon.svg";

const CORE_FEATURES = [
  {
    title: "Catégories intelligentes",
    description:
      "Classement automatique par IA avec apprentissage continu. Vos transactions reflètent votre réalité terrain, pas un modèle générique.",
    icon: Layers,
  },
  {
    title: "Gestion des dettes &amp; remboursements",
    description:
      "Centralisez vos prêts, visualisez le reste à payer et recevez des alertes avant chaque échéance pour garder vos engagements sous contrôle.",
    icon: Coins,
  },
  {
    title: "Objectifs d&apos;épargne dynamiques",
    description:
      "Fixez des cibles, suivez la progression en temps réel et recevez des alertes intelligentes avant dérapage.",
    icon: Sparkles,
  },
  {
    title: "Analytics décisionnels",
    description:
      "Tableaux de bord clairs, exports comptables instantanés, rapports prêts pour vos comités.",
    icon: BarChart3,
  },
  {
    title: "Synchronisation multi-appareils",
    description:
      "Accédez à vos données partout, tout le temps. Synchronisation en temps réel, même hors ligne.",
    icon: CloudCog,
  },
] as const;

const ALTERNATING_SECTIONS = [
  {
    title: "Un tableau de bord qui anticipe vos dettes et votre trésorerie",
    description:
      "Notre IA analyse vos flux en temps réel, détecte les anomalies et suit vos échéances de dettes pour vous alerter avant qu’un remboursement ne pèse sur votre trésorerie.",
    icon: Sparkles,
    highlight: "Alertes dettes & cashflow automatisées",
    action: { label: "Explorer la gestion des dettes", href: "/debts", variant: "secondary" as ButtonVariant },
    mediaTone: "azure" as const,
  },
  {
    title: "Pilotez vos objectifs comme un pro",
    description:
      "Budgets dynamiques, simulations d&apos;impact, suivi visuel des écarts. Transformez vos ambitions en résultats mesurables.",
    icon: FileBarChart,
    highlight: "Stratégie financière visuelle",
    action: { label: "Voir un exemple", href: "#how", variant: "ghost" as ButtonVariant },
    mediaTone: "lilac" as const,
  },
  {
    title: "Exports comptables prêts à l&apos;emploi",
    description:
      "Clôturez vos mois en un clic. Formats compatibles avec votre expert-comptable, ERP ou logiciel de paie.",
    icon: Coins,
    highlight: "Intégration native avec vos outils",
    action: { label: "Tester l&apos;export gratuit", dataAttr: "signup" as const, variant: "default" as ButtonVariant },
    mediaTone: "slate" as const,
  },
];

const STEPS = [
  {
    step: "1",
    title: "Créez votre compte en 60 secondes",
    description: "Aucune carte requise. Importez vos données en un clic.",
    action: { label: "Démarrer gratuitement", dataAttr: "signup" as const, variant: "default" as ButtonVariant },
    icon: Sparkles,
  },
  {
    step: "2",
    title: "Personnalisez votre cockpit",
    description:
      "Définissez vos catégories, objectifs et règles. Budget Pro s&apos;adapte à votre modèle, pas l&apos;inverse.",
    action: { label: "Voir les modules", href: "#features", variant: "secondary" as ButtonVariant },
    icon: CloudCog,
  },
  {
    step: "3",
    title: "Pilotez avec confiance",
    description:
      "Insights quotidiens, alertes proactives et suivi des dettes. Vos réunions deviennent stratégiques et orientées résultats.",
    action: { label: "Accéder au tableau de bord", dataAttr: "login" as const, variant: "ghost" as ButtonVariant },
    icon: BarChart3,
  },
];

const PLANS = [
  {
    badge: "Flexibilité",
    title: "Mensuel",
    price: "2 000 F / mois",
    saving: null,
    description: "Résiliation à tout moment. Support prioritaire inclus.",
    features: ["Tout illimité", "Support 24/7", "Export comptable", "IA avancée"],
    action: { label: "Choisir mensuel", dataAttr: "signup" as const, variant: "secondary" as ButtonVariant },
  },
  {
    badge: "Recommandé",
    title: "Annuel",
    price: "20 000 F / an",
    saving: "Économisez 4 000 F",
    description:
      "Accès prioritaire aux nouveautés, reporting avancé et support dédié.",
    features: ["Tout du mensuel", "Rapports personnalisés", "API incluse", "Formation incluse"],
    action: { label: "Économiser 20%", dataAttr: "signup" as const, variant: "default" as ButtonVariant },
  },
];

const TESTIMONIALS = [
  {
    quote: "Budget Pro a littéralement sauvé notre trésorerie. On visualise nos dettes à venir et on voit les problèmes avant qu&apos;ils n&apos;arrivent.",
    author: "Sarah Koffi — Directrice financière, TechStart",
    rating: 5,
  },
  {
    quote: "L&apos;export comptable automatique nous fait gagner 8h par semaine. Interface fluide, support réactif.",
    author: "Hervé Dubois — Expert-comptable senior",
    rating: 5,
  },
  {
    quote: "Objectifs clairs, alertes utiles, résultats concrets. Notre épargne projet a doublé en 6 mois.",
    author: "Amina Traoré — Responsable budgétaire, ONG Espoir",
    rating: 5,
  },
];

export const FAQ_ITEMS = [
  {
    question: "Puis-je essayer Budget Pro gratuitement ?",
    answer:
      "Oui ! Vous bénéficiez de 30 jours d’essai gratuit, sans carte bancaire. L’accès est complet à toutes les fonctionnalités : suivi des dépenses, objectifs, dettes, IA et rapports. À la fin de l’essai, vous décidez si vous continuez ou non.",
  },
  {
    question: "Mes données financières sont-elles vraiment sécurisées ?",
    answer:
      "Absolument. Budget Pro utilise le chiffrement **AES-256** pour les données et **TLS 1.3** pour les connexions. L’hébergement est certifié **ISO 27001** et **GDPR-compliant**. Seul vous avez accès à vos données ; rien n’est partagé sans votre consentement.",
  },
  {
    question: "Puis-je gérer plusieurs devises ?",
    answer:
      "Oui. Budget Pro prend en charge **XAF, XOF, EUR et USD**, avec formatage automatique selon votre langue. Vous pouvez définir votre devise principale dès l’onboarding et suivre vos opérations multidevises sans conversion manuelle.",
  },
  {
    question: "Comment suivre mes dettes et prêts ?",
    answer:
      "Le module **Dettes** permet d’ajouter vos emprunts ou prêts personnels, de suivre les remboursements, les échéances et le capital restant dû. Vous recevez des **alertes automatiques** avant chaque échéance et un résumé clair sur votre tableau de bord.",
  },
  {
    question: "L’application fonctionne-t-elle sans connexion ?",
    answer:
      "Oui ! Grâce au mode **PWA offline-first**, Budget Pro continue de fonctionner sans internet. Vos transactions, objectifs et contributions sont enregistrés hors-ligne et se synchronisent automatiquement à la reconnexion.",
  },
  {
    question: "Quelles analyses ou recommandations propose l’IA ?",
    answer:
      "L’IA intégrée analyse vos dépenses, budgets et objectifs pour vous donner des **insights personnalisés** : tendances, alertes budgétaires, suggestions d’optimisation et conseils d’épargne. Tout est localisé selon votre profil et vos habitudes réelles.",
  },
  {
    question: "Puis-je importer ou exporter mes données ?",
    answer:
      "Oui. Vous pouvez **importer** vos transactions depuis un fichier **CSV ou Excel**, et **exporter** vos rapports financiers complets (revenus, dépenses, budgets, dettes, objectifs) au format **Excel ou PDF**. Compatible avec les logiciels comptables.",
  },
  {
    question: "Budget Pro fonctionne-t-il sur mobile ?",
    answer:
      "Oui, totalement ! C’est une **application web progressive (PWA)** installable sur **Android, iPhone et Desktop**. Interface mobile optimisée, navigation fluide, mode sombre, notifications push et ajout rapide de transactions.",
  },
  {
    question: "Y a-t-il une assistance en français ?",
    answer:
      "Oui. Notre équipe de support répond en **français et en anglais**, du lundi au samedi, par **chat intégré**, **email** et **téléphone**. Une base de connaissances est également disponible pour les questions fréquentes.",
  },
  {
    question: "Que se passe-t-il si je dépasse mon budget ?",
    answer:
      "Budget Pro affiche une **alerte visuelle** et vous notifie en push si une catégorie ou votre budget mensuel est dépassé. Vous pouvez ensuite ajuster vos montants, revoir vos priorités ou consulter les recommandations IA pour retrouver l’équilibre.",
  },
  {
    question: "Puis-je partager ou synchroniser mes comptes avec un partenaire ?",
    answer:
      "Oui, vous pouvez **inviter un second utilisateur** (partenaire, conjoint, collaborateur) en lecture ou en co-gestion. Chaque profil conserve ses droits d’accès et ses paramètres de confidentialité.",
  },
  {
    question: "Quelles sont les prochaines évolutions prévues ?",
    answer:
      "Prochainement : **import automatique bancaire (Open Banking)**, **badges de progression et gamification**, **mode sombre complet**, **synchronisation mobile native** et API publique pour intégrations externes.",
  },
];

// === UTILITAIRES ===
function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function getBtnClass(variant: ButtonVariant) {
  const base = "landing__btn inline-flex items-center gap-2 font-medium transition-all duration-200";
  switch (variant) {
    case "ghost":
      return `${base} landing__btn--ghost hover:text-blue-600`;
    case "secondary":
      return `${base} landing__btn--secondary hover:shadow-md`;
    case "outline":
      return `${base} border border-blue-600 text-blue-600 hover:bg-blue-50`;
    case "default":
    default:
      return `${base} landing__btn--primary landing__btn--shine text-white hover:shadow-lg`;
  }
}

function renderAction(action: CallToAction) {
  const className = getBtnClass(action.variant);
  if ("href" in action) {
    return (
      <a href={action.href} className={className}>
        {action.label}
        {action.variant === "default" && <ArrowRight className="h-4 w-4" />}
      </a>
    );
  }
  const url = action.dataAttr === "login" ? LOGIN_URL : SIGNUP_URL;
  const dataAttr = action.dataAttr === "login" ? { "data-login": "" } : { "data-signup": "" };
  return (
    <a href={url} className={className} {...dataAttr}>
      {action.label}
      {action.variant === "default" && <ArrowRight className="h-4 w-4" />}
    </a>
  );
}

// === COMPOSANT PRINCIPAL ===
export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isContactOpen, setContactOpen] = useState(false);
  const { firestore } = initializeFirebase();
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Redirection automatique vers /login pour les utilisateurs non connectés (mobile app)
  useEffect(() => {
    const auth = getAuth();
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsCheckingAuth(false);
      setUser(currentUser);
      // Si c'est une PWA/app mobile et l'utilisateur n'est pas connecté, rediriger vers /login
      if (isPWA && !currentUser) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Effets
  useEffect(() => {
    document.body.classList.add("landing-body");
    return () => document.body.classList.remove("landing-body");
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const yearSpan = document.getElementById("landing-year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();
  }, []);

  useEffect(() => {
    if (window.innerWidth > 960 && isMenuOpen) setMenuOpen(false);
  }, [isMenuOpen]);

  useEffect(() => {
    const ref = doc(firestore, "adminConfig", "homepage");
    const unsub = onSnapshot(ref, (snap) => snap.exists() && setHomeContent(snap.data() as HomeContent));
    return unsub;
  }, [firestore]);

  // Contenu dynamique
  const heroHeadline = homeContent?.title ?? (
    <>
      Pilotez vos finances.
      <span className="landing__hero-highlight"> Maîtrisez votre croissance.</span>
    </>
  );

  const heroSubtitle =
    homeContent?.subtitle ??
    "Budget Pro centralise vos flux, automatise vos catégories et vous livre des insights actionnables pour transformer votre gestion en avantage compétitif.";

  const primaryCtaLabel = homeContent?.ctaLabel ?? "Démarrer l'essai gratuit";
  const primaryCtaHref = homeContent?.ctaHref;

  const heroHasCustomMedia = Boolean(homeContent?.heroImage);
  const heroPrimaryHref = primaryCtaHref ?? SIGNUP_URL;
  const heroPrimaryDataAttr = primaryCtaHref ? {} : { "data-signup": "" };

  return (
    <div className="landing">
      {/* HEADER */}
      <header className={classNames("landing__header", scrolled && "is-scrolled")}>
        <div className="landing__container">
          <div className="landing__nav-bar">
            <Link href="/" className="landing__logo" aria-label="Budget Pro - Accueil">
              <span className="landing__logo-mark" aria-hidden="true">
                <Image 
                  src="/icons/icon-192.png" 
                  alt="Budget Pro" 
                  width={36} 
                  height={36}
                  className="rounded-lg"
                />
              </span>
              <span className="landing__logo-wordmark">Budget Pro</span>
            </Link>

            <button
              className="landing__mobile-toggle"
              onClick={() => setMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Menu</span>
            </button>

            <nav className="landing__nav" aria-label="Navigation principale">
              <ul>
                <li><a href="#features">Fonctionnalités</a></li>
                <li><a href="#how">Comment ça marche</a></li>
                <li><a href="#pricing">Tarifs</a></li>
                <li><Link href="/affiliates">Affiliation</Link></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </nav>

            <div className="landing__actions">
              {user ? (
                <Link href="/dashboard" className="landing__btn landing__btn--primary landing__btn--dashboard">
                  <BarChart3 className="h-4 w-4" />
                  Tableau de bord
                </Link>
              ) : (
                <>
                  <a className="landing__btn landing__btn--ghost" data-login href={LOGIN_URL}>Se connecter</a>
                  <a className="landing__btn landing__btn--secondary" data-signup href={SIGNUP_URL}>Créer un compte</a>
                </>
              )}
            </div>
          </div>

          <div
            className={classNames("landing__mobile-nav", isMenuOpen && "is-open")}
            id="mobile-nav"
            role="menu"
            aria-label="Navigation mobile"
          >
            <a href="#features" role="menuitem" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
            <a href="#how" role="menuitem" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
            <a href="#pricing" role="menuitem" onClick={() => setMenuOpen(false)}>Tarifs</a>
            <Link href="/affiliates" role="menuitem" onClick={() => setMenuOpen(false)}>Affiliation</Link>
            <a href="#faq" role="menuitem" onClick={() => setMenuOpen(false)}>FAQ</a>
            {user ? (
              <Link href="/dashboard" className="landing__btn landing__btn--primary landing__btn--dashboard" onClick={() => setMenuOpen(false)}>
                <BarChart3 className="h-4 w-4" />
                Tableau de bord
              </Link>
            ) : (
              <>
                <a className="landing__btn landing__btn--ghost" data-login href={LOGIN_URL}>Se connecter</a>
                <a className="landing__btn landing__btn--secondary" data-signup href={SIGNUP_URL}>Créer un compte</a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="landing__content" role="main" id="main-content">
        {/* HERO */}
        <section className="landing__section landing__section--hero">
        <div className="landing__container landing__hero-grid">
          <div className="landing__hero-content">
            <div className="landing__kicker">
              <Sparkles className="h-4 w-4" />
              Gestion financière intelligente
            </div>
            <h1 className="landing__hero-title">{heroHeadline}</h1>
            <p className="landing__hero-subtitle">{heroSubtitle}</p>

            <div className="landing__hero-actions">
              <a
                href={heroPrimaryHref}
                className="landing__btn landing__btn--primary landing__btn--shine"
                {...heroPrimaryDataAttr}
              >
                {primaryCtaLabel} <ArrowRight className="h-5 w-5" />
              </a>
              <a data-login href={LOGIN_URL} className="landing__btn landing__btn--ghost">
                <Users2 className="h-5 w-5" /> Démo live
              </a>
            </div>

            <div className="landing__hero-trust">
              <div className="landing__hero-avatars">
                {["S", "A", "M", "H", "L"].map((i) => (
                  <span key={i} className="landing__avatar">{i}</span>
                ))}
                <span className="landing__avatar-count">+1.8k</span>
              </div>
              <p className="landing__hero-trust-text">
                Rejoignez <strong>1 800+ entreprises</strong> qui optimisent leur trésorerie avec Budget Pro.
              </p>
            </div>

            <div className="landing__hero-features">
              {HERO_PERKS.map(({ label, icon: Icon }) => (
                <div key={label} className="landing__hero-feature">
                  <Icon className="h-5 w-5 text-green-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="landing__dash">
            <div className="landing__dash-media">
              {heroHasCustomMedia ? (
                <div className="landing__dash-media-remote" style={{ backgroundImage: `url(${homeContent?.heroImage})` }} />
              ) : (
                <Image src={HERO_FALLBACK} alt="Tableau de bord Budget Pro" fill priority sizes="(min-width: 1024px) 500px, 90vw" />
              )}
            </div>
            <div className="landing__dash-content">
              <h3 className="landing__dash-title"><Shield className="h-5 w-5 text-blue-600" /> Tableau de bord en direct</h3>
              <div className="landing__dash-stats">
                <div className="landing__dash-stat">
                  <span className="landing__dash-stat-label">Budget</span>
                  <strong className="landing__dash-stat-value">2.45M F</strong>
                  <span className="landing__dash-stat-change positive">+12.5%</span>
                </div>
                <div className="landing__dash-stat">
                  <span className="landing__dash-stat-label">Objectifs</span>
                  <strong className="landing__dash-stat-value">68%</strong>
                  <div className="landing__progress"><span style={{ width: "68%" }} /></div>
                </div>
              </div>
              <div className="landing__chips">
                <span className="landing__chip landing__chip--success">Revenus +12%</span>
                <span className="landing__chip landing__chip--info">Export prêt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALTERNATING SECTIONS */}
      <section id="features" className="landing__section landing__section--band">
        <div className="landing__container">
          <h2 className="text-center">De la donnée brute à l&apos;action éclairée</h2>
          <p className="landing__section-lead text-center max-w-3xl mx-auto">
            Budget Pro ne se contente pas de suivre vos dépenses : il vous donne le pouvoir de décider en toute confiance.
          </p>

          {ALTERNATING_SECTIONS.map((section, i) => {
            const Icon = section.icon;
            const mediaClass = `landing__alternating-media landing__alternating-media--${section.mediaTone}`;
            const imgSrc = i === 0 && homeContent?.bannerImage ? homeContent.bannerImage : ALTERNATING_ILLUSTRATIONS[i % ALTERNATING_ILLUSTRATIONS.length];

            return (
              <article key={section.title} className={classNames("landing__alternating-grid", i % 2 === 1 && "is-reversed")}>
                <div className="landing__alternating-content">
                  <span className="landing__section-pill">
                    <Icon className="h-4 w-4" />
                    {section.highlight}
                  </span>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                  {renderAction(section.action)}
                </div>
                <div className={mediaClass}>
                  {i === 0 && homeContent?.bannerImage ? (
                    <div className="landing__alternating-remote" style={{ backgroundImage: `url(${imgSrc})` }} />
                  ) : (
                    <Image src={imgSrc} alt="" fill sizes="(min-width: 1024px) 480px, 90vw" />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="landing__section landing__section--suite" id="suite">
        <div className="landing__container" style={{ position: "relative", zIndex: 2 }}>
          <h2 className="text-center">Une suite d&apos;outils complète</h2>
          <p className="landing__section-lead text-center">
            Tout ce dont vous avez besoin pour piloter vos finances avec confiance.
          </p>
          <div className="landing__grid landing__grid--features">
            {CORE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="landing__card">
                  <div className="landing__feature-icon">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
        <img
          src={SUITE_ILLUSTRATION}
          alt=""
          className="landing__bg-illustration"
          aria-hidden="true"
          loading="lazy"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />
      </section>

      {/* STEPS */}
      <section id="how" className="landing__section">
        <div className="landing__container">
          <h2 className="text-center">Prêt en 3 étapes</h2>
          <p className="landing__section-lead text-center">De l&apos;inscription au pilotage stratégique en moins de 5 minutes.</p>
          <div className="landing__steps-grid">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="landing__step-card">
                  <div className="landing__step-number">{step.step}</div>
                  <Icon className="h-8 w-8 text-blue-600" />
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {renderAction(step.action)}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="landing__section landing__section--accent landing__section--pricing" style={{ position: "relative" }}>
        <div className="landing__container" style={{ position: "relative", zIndex: 2 }}>
          <h2 className="text-center">Tarification transparente</h2>
          <p className="landing__section-lead text-center">Un seul prix, toutes les fonctionnalités incluses.</p>
          <div className="landing__pricing-grid">
            {PLANS.map((plan) => (
              <div key={plan.title} className={classNames("landing__plan-card", plan.badge === "Recommandé" && "is-featured")}>
                {plan.badge && <span className="landing__plan-badge">{plan.badge}</span>}
                {plan.saving && <span className="landing__plan-saving">{plan.saving}</span>}
                <h3>{plan.title}</h3>
                <div className="landing__plan-price">{plan.price}</div>
                <p>{plan.description}</p>
                <ul className="landing__plan-features">
                  {plan.features.map((f) => (
                    <li key={f}><CheckCircle2 className="h-4 w-4 text-green-500" /> {f}</li>
                  ))}
                </ul>
                {renderAction(plan.action)}
              </div>
            ))}
          </div>
        </div>
        <img
          src={PRICING_ILLUSTRATION}
          alt=""
          className="landing__bg-illustration"
          aria-hidden="true"
          loading="lazy"
          style={{ top: "50%", right: "0", transform: "translateY(-50%)" }}
        />
      </section>

      {/* TESTIMONIALS */}
      <section className="landing__section" id="testimonials" style={{ position: "relative" }}>
        <div className="landing__container" style={{ position: "relative", zIndex: 2 }}>
          <h2 className="text-center">Ils pilotent avec Budget Pro</h2>
          <div className="landing__testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <figure key={t.author} className="landing__testimonial-card">
                <div className="landing__stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption>— {t.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <img
          src={TESTIMONIALS_ILLUSTRATION}
          alt=""
          className="landing__bg-illustration"
          aria-hidden="true"
          loading="lazy"
          style={{ bottom: "0", left: "50%", transform: "translateX(-50%)" }}
        />
      </section>

      {/* FAQ */}
      <section id="faq" className="landing__section landing__section--light" style={{ position: "relative" }}>
        <div className="landing__container" style={{ position: "relative", zIndex: 2 }}>
          <h2 className="text-center">Questions fréquentes</h2>
          <div className="landing__faq-grid" role="list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="landing__faq-item" role="listitem">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <img
          src={FAQ_ILLUSTRATION}
          alt=""
          className="landing__bg-illustration"
          aria-hidden="true"
          loading="lazy"
          style={{ top: "20%", right: "10%" }}
        />
      </section>

      {/* FINAL CTA */}
      <section className="landing__section landing__section--cta" style={{ position: "relative" }}>
        <div className="landing__container" style={{ position: "relative", zIndex: 2 }}>
          <div className="landing__cta-card text-center">
            <h2>Prêt à reprendre le contrôle de vos finances&nbsp;?</h2>
            <p className="landing__section-lead landing__cta-sub">30&nbsp;jours gratuits. Aucune carte requise. Annulation en un clic.</p>

            <div className="landing__hero-actions" style={{ justifyContent: "center" }}>
              <a data-signup href={SIGNUP_URL} className="landing__btn landing__btn--primary landing__btn--shine px-8 py-4">
                Démarrer l&apos;essai gratuit <ArrowRight className="h-5 w-5 ml-2" />
              </a>
              <a data-login href={LOGIN_URL} className="landing__btn landing__btn--outline px-8 py-4">
                Voir la démo
              </a>
            </div>

            <p className="landing__cta-meta">Rejoignez <strong>1 800+ équipes financières</strong> et commencez en moins de 2&nbsp;minutes.</p>
          </div>
        </div>
        <img
          src={CTA_ILLUSTRATION}
          alt=""
          className="landing__bg-illustration"
          aria-hidden="true"
          loading="lazy"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />
      </section>

      </main>

      {/* FOOTER */}
      <footer className="landing__footer" style={{ position: "relative" }}>
        <div className="landing__container" style={{ position: "relative", zIndex: 2 }}>
          <div className="landing__footer-grid">
            <div>
              <Link href="/" className="landing__logo">
                <span className="landing__logo-mark">
                  <Image 
                    src="/icons/icon-192.png?v=2" 
                    alt="Budget Pro" 
                    width={32} 
                    height={32}
                    className="rounded-lg"
                    priority
                  />
                </span>
                Budget Pro
              </Link>
              <p className="mt-2 text-sm opacity-80">Votre copilote financier intelligent. Maîtrisez vos dépenses, atteignez vos objectifs.</p>
            </div>
            <nav>
              <strong>Produit</strong>
              <a href="/">Présentation</a>
              <a href="#features">Fonctionnalités</a>
              <a href="#pricing">Tarifs</a>
              <a href="#faq">FAQ</a>
            </nav>
            <nav>
              <strong>Entreprise</strong>
              <a href="/about">À propos</a>
              <a href="/blog">Blog</a>
              <a href="/contact">Contact</a>
            </nav>
            <nav>
              <strong>Légal</strong>
              <a href="/legal/privacy">Confidentialité</a>
              <a href="/legal/terms">Conditions de service</a>
              <a href="/legal/data-deletion">Suppression des données</a>
              <a href="/legal/security">Sécurité</a>
            </nav>
          </div>
          <div className="landing__footer-bottom">
            <p>© <span id="landing-year"></span> Budget Pro. Tous droits réservés.</p>
            <p>Fait avec <span className="text-red-500">♥</span> en Afrique</p>
            <p>
              Powered by{' '}
              <a
                href="https://www.beonweb.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline transition-all"
              >
                BEONWEB
              </a>
            </p>
            <p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="hover:text-blue-600 hover:underline transition-all"
              >
                contact@budgetpro.net
              </button>
            </p>
          </div>
        </div>
      </footer>

      <ContactDialog open={isContactOpen} onOpenChange={setContactOpen} />

      {/* STYLES CSS COMPLETS */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .landing__container {
            width: 98vw;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          .landing__section {
            padding: 2.5rem 0;
          }
          .landing__hero {
            padding: 3rem 0 2rem;
          }
          .landing__grid {
            grid-template-columns: 1fr;
            gap: 1.2rem;
          }
          .landing__grid--features,
          .landing__grid--steps,
          .landing__grid--plans,
          .landing__grid--quotes {
            grid-template-columns: 1fr;
          }
        }
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        :root {
          /* 🎨 Palette principale : 2 tons brand + 2 neutres */
          --brand-primary: #2563eb;
          --brand-accent: #0ea5e9;
          --neutral-dark: #0f172a;
          --neutral-light: #f8fafc;
          
          /* Couleurs dérivées */
          --text-primary: #111827;
          --text-secondary: #475467;
          --text-muted: #667085;
          --border-light: rgba(15, 23, 42, 0.08);
          --border-medium: rgba(15, 23, 42, 0.12);
          
          /* Backgrounds */
          --bg: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 55%, #f0fdfa 100%);
          --ink: #101828;
          --muted: #475467;
          --brand: #2563eb;
          --brand-2: #0ea5e9;
          --accent: #e2e8f0;
          --card: rgba(255, 255, 255, 0.92);
          --shine: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          --focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.35);
          
          /* Espacement systématique */
          --section-spacing: clamp(72px, 6vw, 112px);
          --section-spacing-large: clamp(96px, 8vw, 144px);
          --card-radius: 24px;
          --btn-radius: 999px;
          
          /* Typographie : Poppins (titres) + Inter (texte) */
          --font-heading: 'Poppins', system-ui, -apple-system, sans-serif;
          --font-body: 'Inter', system-ui, -apple-system, sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        * {
          box-sizing: border-box;
        }

        .landing-body {
          margin: 0;
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font-body);
          color: var(--text-primary);
          line-height: 1.6;
          overflow-x: hidden;
        }

        .landing {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-primary);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .landing__content {
          display: flex;
          flex-direction: column;
          gap: clamp(2.5rem, 4vw, 4rem);
        }

        a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        /* Typographie avec hiérarchie claire */
        .landing h1,
        .landing h2,
        .landing h3 {
          text-wrap: balance;
          font-family: var(--font-heading);
          font-weight: 700;
          line-height: 1.15;
        }

        .landing h1 {
          margin: 0.75rem 0;
          font-size: clamp(2.5rem, 4.5vw, 3.8rem);
          color: var(--neutral-dark);
          letter-spacing: -0.02em;
        }

        .landing h2 {
          margin-bottom: 1rem;
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          text-align: center;
          color: var(--neutral-dark);
          letter-spacing: -0.01em;
        }

        .landing h3 {
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          color: var(--text-primary);
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        /* Paragraphes courts et lisibles (max 4 lignes) */
        .landing p {
          margin: 0;
          font-family: var(--font-body);
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 65ch;
          font-size: clamp(0.95rem, 1.5vw, 1.05rem);
        }

        /* Section lead : sous-titres de section */
        .landing__section-lead {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 680px;
          margin: 0 auto 3rem;
          text-align: center;
        }

        /* Hero description */
        .landing__hero-description {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-top: 1rem;
          max-width: 600px;
        }

        /* Header sticky avec fond doux */
        .landing__header {
          position: sticky;
          top: 0;
          z-index: 60;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px) saturate(1.15);
          border-bottom: 1px solid var(--border-light);
          box-shadow: 0 4px 24px rgba(37, 99, 235, 0.06);
          transition: box-shadow 0.3s ease;
        }

        .landing__header:hover {
          box-shadow: 0 8px 32px rgba(37, 99, 235, 0.1);
        }

        .landing__container {
          width: min(1120px, 92vw);
          margin: 0 auto;
          padding-left: clamp(1rem, 3vw, 2.2rem);
          padding-right: clamp(1rem, 3vw, 2.2rem);
        }

        .landing__nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 0;
        }

        .landing__logo {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 8px;
        }

        .landing__logo:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .landing__logo-wordmark {
          background: linear-gradient(120deg, #1d4ed8 0%, #6366f1 50%, #0ea5e9 100%);
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .landing__logo-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: var(--shine);
          color: #fff;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
        }

        .landing__nav ul {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .landing__nav a {
          font-weight: 500;
          color: var(--muted);
          transition: color 0.2s ease;
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          margin: 0 -0.5rem;
        }

        .landing__nav a:hover,
        .landing__nav a:focus-visible {
          color: var(--brand);
        }

        .landing__nav a:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }

        .landing__actions {
          display: flex;
          gap: 0.75rem;
        }

        /* Boutons avec hover states professionnels */
        .landing__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 1.8rem;
          border-radius: var(--btn-radius);
          border: 1.5px solid transparent;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .landing__btn--primary {
          background: var(--shine);
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
          border-color: transparent;
        }

        .landing__btn--primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
          box-shadow: 0 8px 28px rgba(37, 99, 235, 0.35);
          transform: translateY(-2px);
        }

        .landing__btn--primary:active {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
        }

        .landing__btn--dashboard {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 600;
        }

        .landing__btn--secondary {
          background: #ffffff;
          color: var(--brand-primary);
          border-color: rgba(37, 99, 235, 0.3);
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
        }

        .landing__btn--secondary:hover {
          border-color: var(--brand-primary);
          background: rgba(37, 99, 235, 0.06);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.2);
          transform: translateY(-2px);
        }

        .landing__btn--ghost {
          background: rgba(255, 255, 255, 0.8);
          color: var(--text-primary);
          border-color: var(--border-light);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .landing__btn--ghost:hover {
          background: #ffffff;
          border-color: var(--border-medium);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
          transform: translateY(-1px);
          color: var(--brand-primary);
        }

        .landing__btn:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .landing__btn--shine {
          position: relative;
          overflow: hidden;
        }

        .landing__btn--shine::after,
        .animate-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%);
          transform: translateX(-100%);
          animation: shine 3s ease-in-out infinite;
        }

        .animate-shine {
          position: relative;
          overflow: hidden;
        }

        .landing__mobile-toggle {
          display: none;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 1rem;
          border-radius: 12px;
          border: 1px solid rgba(37, 99, 235, 0.28);
          background: rgba(37, 99, 235, 0.12);
          color: var(--brand);
          font-weight: 600;
        }

        .landing__mobile-toggle:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .landing__mobile-nav {
          display: none;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem 0 1.5rem;
        }

        .landing__mobile-nav a {
          padding: 0.5rem 0.25rem;
          font-weight: 500;
          color: var(--muted);
          border-radius: 8px;
        }

        .landing__mobile-nav a:hover,
        .landing__mobile-nav a:focus-visible {
          color: var(--brand);
          background: rgba(37, 99, 235, 0.08);
        }

        .landing__mobile-nav a:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .landing__mobile-nav .landing__btn {
          justify-content: center;
        }

        .landing__mobile-nav.is-open {
          display: flex;
        }

        /* Sections avec espacement respirant : 80-120px */
        .landing__section {
          position: relative;
          padding: var(--section-spacing) 0;
          overflow: hidden;
        }

        .landing__section--band {
          background: linear-gradient(140deg, rgba(227, 233, 246, 0.55) 0%, rgba(240, 249, 255, 0.55) 60%, rgba(247, 250, 255, 0.65) 100%);
        }

        .landing__section--suite {
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.16) 0%, transparent 55%),
            radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16) 0%, transparent 58%),
            linear-gradient(120deg, rgba(247, 250, 255, 0.88), rgba(240, 249, 255, 0.9));
        }

        .landing__section--pricing {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%);
          color: var(--text-primary);
        }

        .landing__section--accent {
          background:
            radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 55%),
            radial-gradient(circle at 90% 5%, rgba(14, 165, 233, 0.18) 0%, transparent 55%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
          color: var(--text-primary);
        }

        .landing__section--light {
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88));
        }

        .landing__section--cta {
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(14, 165, 233, 0.08) 40%, rgba(37, 99, 235, 0.1) 100%);
          padding: calc(var(--section-spacing) * 0.7) 0;
        }

        /* CTA card for better focus and readable widths */
        .landing__cta-card {
          max-width: 980px;
          margin: 0 auto;
          padding: clamp(1.75rem, 4vw, 2.5rem) clamp(1.25rem, 3.5vw, 2rem);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-light);
          box-shadow: 0 24px 48px rgba(37, 99, 235, 0.12);
        }

        .landing__section--cta h2 {
          font-size: clamp(1.8rem, 2.6vw, 2.2rem);
          margin-bottom: 0.75rem;
        }

        .landing__cta-sub {
          margin-bottom: 1.25rem;
          color: var(--text-secondary);
        }

        .landing__cta-meta {
          margin-top: 1.1rem;
          color: #384454;
          font-size: 0.95rem;
        }

        /* Outline button for secondary action */
        .landing__btn--outline {
          background: transparent;
          color: var(--brand-primary);
          border: 1px solid rgba(37, 99, 235, 0.35);
        }

        .landing__btn--outline:hover {
          background: rgba(37, 99, 235, 0.06);
          border-color: var(--brand-primary);
        }

        .landing__section--faq {
          background:
            radial-gradient(circle at 15% 20%, rgba(226, 232, 240, 0.45) 0%, transparent 50%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(237, 242, 255, 0.65) 100%);
        }

        .landing__hero {
          padding: calc(var(--section-spacing-large) + 2rem) 0 var(--section-spacing);
        }

        .landing__hero-grid {
          display: grid;
          gap: 2.5rem;
          align-items: center;
        }

        .landing__hero-content {
          max-width: 640px;
        }

        .landing__kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.12);
          color: var(--brand);
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .landing__hero-highlight {
          display: inline-block;
          background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .landing__hero-subtitle {
          margin-top: 1.25rem;
          color: var(--text-secondary);
          font-size: clamp(1.1rem, 2.4vw, 1.25rem);
          line-height: 1.7;
          max-width: 640px;
          font-weight: 400;
        }

        .landing__hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 1.75rem 0;
        }

        .landing__hero-trust {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0 1.5rem;
          padding: 0.9rem 1.1rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
        }

        .landing__hero-avatars {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing__avatar {
          display: inline-flex;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dbeafe;
          color: #1e40af;
          font-weight: 600;
          font-size: 0.95rem;
          border: 2px solid #fff;
        }

        .landing__avatar:not(:first-child) {
          margin-left: -12px;
        }

        .landing__avatar-count {
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.1);
          color: var(--brand);
          font-weight: 600;
          font-size: 0.9rem;
          margin-left: 0.5rem;
        }

        .landing__hero-trust-text {
          margin: 0;
          color: #1d2939;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .landing__hero-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .landing__hero-feature {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: 999px;
          border: 1px solid rgba(16, 185, 129, 0.25);
          background: rgba(16, 185, 129, 0.12);
          color: #047857;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .landing__dash {
          position: relative;
          padding: 2.2rem;
          border-radius: 28px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 24px 45px rgba(15, 23, 42, 0.15);
          display: grid;
          gap: 1.6rem;
        }

        .landing__dash-media {
          position: relative;
          width: 100%;
          height: 220px;
          border-radius: 20px;
          border: 1px solid rgba(37, 99, 235, 0.18);
          overflow: hidden;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(14, 165, 233, 0.18));
        }

        .landing__dash-media-remote {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
        }

        .landing__dash-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0;
          font-size: 1.2rem;
          color: #0f172a;
        }

        .landing__dash-stats {
          display: grid;
          gap: 1.2rem;
        }

        .landing__dash-stat {
          display: grid;
          gap: 0.35rem;
        }

        .landing__dash-stat-label {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #475467;
        }

        .landing__dash-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .landing__dash-stat-change {
          font-size: 0.9rem;
          font-weight: 600;
          color: #dc2626;
        }

        .landing__dash-stat-change.positive {
          color: #16a34a;
        }

        .landing__progress {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.18);
          overflow: hidden;
        }

        .landing__progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--shine);
        }

        .landing__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .landing__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: #1e293b;
          background: rgba(241, 245, 249, 0.86);
        }

        .landing__chip--success {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.35);
          color: #047857;
        }

        .landing__chip--info {
          background: rgba(37, 99, 235, 0.15);
          border-color: rgba(37, 99, 235, 0.35);
          color: #1d4ed8;
        }

        .landing__chip--warning {
          background: rgba(251, 191, 36, 0.18);
          border-color: rgba(245, 158, 11, 0.4);
          color: #b45309;
        }

        .landing__chip--primary {
          background: rgba(79, 70, 229, 0.15);
          border-color: rgba(79, 70, 229, 0.35);
          color: #4338ca;
        }

        .landing__chip--secondary {
          background: rgba(14, 165, 233, 0.12);
          border-color: rgba(14, 165, 233, 0.32);
          color: #0ea5e9;
        }

        .landing__section-lead {
          max-width: 720px;
          margin: 0 auto 3rem;
          text-align: justify;
          text-align-last: center;
          color: #3f4c64;
          font-size: clamp(1.05rem, 1.8vw, 1.24rem);
          line-height: 1.7;
          hyphens: auto;
        }

        .landing__grid {
          display: grid;
          gap: 1.6rem;
        }

        .landing__alternating-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: center;
          margin-bottom: 4rem;
        }

        .landing__alternating-content h3 {
          font-size: 1.75rem;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 0.75rem;
        }

        .landing__alternating-content p {
          color: var(--muted);
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .landing__section-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.9rem;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.14);
          color: var(--brand);
          font-weight: 600;
          font-size: 0.85rem;
        }

        .landing__alternating-media {
          position: relative;
          width: 100%;
          height: 320px;
          border-radius: 24px;
          background: linear-gradient(135deg, #f0f9ff, #e0e7ff);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.14);
          overflow: hidden;
        }

        .landing__alternating-media--azure {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.2));
        }

        .landing__alternating-media--lilac {
          background: linear-gradient(135deg, rgba(129, 140, 248, 0.18), rgba(192, 132, 252, 0.18));
        }

        .landing__alternating-media--slate {
          background: linear-gradient(135deg, rgba(51, 65, 85, 0.25), rgba(148, 163, 184, 0.2));
        }

        .landing__alternating-remote {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
        }

        .landing__section-visual {
          display: flex;
          justify-content: center;
          margin: 2.25rem auto 3.25rem;
          width: min(520px, 92vw);
          position: relative;
        }

        .landing__section-visual img {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
          width: 100%;
          height: auto;
        }

        .landing__section-visual--cta img {
          box-shadow: none;
          border: none;
        }

        .landing__grid--features {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .landing__grid--steps {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .landing__grid--plans {
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .landing__grid--quotes {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .landing__card {
          padding: 2rem;
          border-radius: 24px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: var(--card);
          backdrop-filter: blur(8px) saturate(1.12);
          box-shadow: 0 20px 42px rgba(37, 99, 235, 0.14);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .landing__card:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 50px rgba(37, 99, 235, 0.22);
          border-color: rgba(37, 99, 235, 0.2);
        }

        .landing__card h3 {
          margin-top: 0;
          margin-bottom: 0.85rem;
          color: #111827;
          font-size: clamp(1.2rem, 2vw, 1.35rem);
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .landing__card p {
          margin: 0;
          color: #475467;
          line-height: 1.7;
          font-size: clamp(0.95rem, 1.5vw, 1.05rem);
        }

        .landing__feature-icon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          margin-bottom: 1.15rem;
          background: rgba(37, 99, 235, 0.14);
          color: var(--brand);
          transition: transform 0.25s ease, background 0.25s ease;
        }

        .landing__card:hover .landing__feature-icon {
          transform: scale(1.08);
          background: rgba(37, 99, 235, 0.2);
        }

        .landing__card--plan {
          display: grid;
          gap: 0.9rem;
        }

        .landing__badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.12);
          color: #1d4ed8;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .landing__price {
          margin: 0;
          font-size: clamp(2rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .landing__card--plan p {
          text-align: justify;
          text-align-last: center;
          hyphens: auto;
          line-height: 1.75;
          color: #5a667b;
        }

        .landing__card--quote {
          background: rgba(229, 231, 235, 0.5);
          border: 1px solid rgba(37, 99, 235, 0.16);
          display: grid;
          gap: 1.15rem;
          padding: 2.2rem;
        }

        .landing__card--quote p {
          font-style: italic;
          color: #334155;
          line-height: 1.75;
          font-size: clamp(0.95rem, 1.5vw, 1.05rem);
        }

        .landing__card--quote cite {
          font-style: normal;
          font-weight: 600;
          color: #111827;
          font-size: 0.95rem;
        }

        .landing__section--faq {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(226, 232, 240, 0.45));
        }

        /* FAQ bien structurée avec visuels clairs */
        .landing__faq {
          display: grid;
          gap: 1.2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .landing__faq details {
          border-radius: 20px;
          border: 1.5px solid var(--border-light);
          background: #ffffff;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .landing__faq details:hover {
          border-color: rgba(37, 99, 235, 0.2);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
          transform: translateY(-2px);
        }

        .landing__faq summary {
          cursor: pointer;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: clamp(1.05rem, 1.8vw, 1.15rem);
          color: var(--neutral-dark);
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .landing__faq summary::-webkit-details-marker {
          display: none;
        }

        .landing__faq summary::after {
          content: '+';
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--brand-primary);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .landing__faq details[open] summary::after {
          content: '−';
          transform: rotate(180deg);
        }

        .landing__faq summary:focus-visible {
          outline: none;
          color: var(--brand-primary);
        }

        .landing__faq details[open] {
          border-color: rgba(37, 99, 235, 0.4);
          background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(239, 246, 255, 0.6));
        }

        .landing__faq p {
          margin: 1rem 0 0;
          font-family: var(--font-body);
          color: var(--text-secondary);
          line-height: 1.7;
          padding-left: 0.5rem;
        }

        .landing__card--cta {
          text-align: center;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(14, 165, 233, 0.14));
          border: 1px solid rgba(37, 99, 235, 0.2);
          display: grid;
          gap: 1.25rem;
          padding: 3rem 2.5rem;
        }

        .landing__card--cta h3 {
          margin: 0;
          font-size: clamp(1.8rem, 3vw, 2.2rem);
          color: #0f172a;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .landing__card--cta p {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          line-height: 1.7;
          color: #475467;
        }

        .landing__cta-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }

        /* Footer structuré */
        .landing__footer {
          margin-top: var(--section-spacing);
          padding: 4.5rem 0 2.8rem;
          background: linear-gradient(135deg, rgba(224, 231, 255, 0.65) 0%, rgba(248, 250, 252, 0.98) 55%, rgba(240, 253, 250, 0.65) 100%);
          border-top: 1px solid var(--border-medium);
        }

        .landing__footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          margin-bottom: 2rem;
        }

        .landing__footer-grid nav {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .landing__footer-grid strong {
          display: block;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .landing__footer-grid a {
          color: var(--text-secondary);
          font-size: 0.95rem;
          transition: color 0.2s ease, padding-left 0.2s ease;
          padding: 0.25rem 0;
        }

        .landing__footer-grid a:hover {
          color: var(--brand-primary);
          padding-left: 0.5rem;
        }

        .landing__footer-bottom {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-light);
          text-align: center;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        .landing__footer-bottom p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
        }

        .landing__footer-bottom p::after {
          content: '•';
          margin: 0 0.5rem;
          color: var(--text-muted);
          opacity: 0.5;
        }

        .landing__footer-bottom p:last-child::after {
          content: '';
          margin: 0;
        }

        /* Footer optimisé sur mobile */
        @media (max-width: 768px) {
          .landing__footer-bottom {
            gap: 0.35rem;
            padding: 1.5rem 0.5rem 1rem;
          }
          
          .landing__footer-bottom p {
            font-size: 0.8rem;
          }
          
          .landing__footer-bottom p::after {
            margin: 0 0.35rem;
          }
        }

        /* Steps Grid */
        .landing__steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .landing__step-card {
          padding: 2rem;
          border-radius: 24px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: var(--card);
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .landing__step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(37, 99, 235, 0.18);
        }

        .landing__step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
        }

        /* Pricing Grid */
        .landing__pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }

        .landing__plan-card {
          position: relative;
          padding: 2.5rem;
          border-radius: 24px;
          border: 2px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 20px 42px rgba(37, 99, 235, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: all 0.3s ease;
        }

        .landing__plan-card.is-featured {
          border-color: var(--brand-primary);
          box-shadow: 0 24px 52px rgba(37, 99, 235, 0.25);
          transform: scale(1.05);
        }

        .landing__plan-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 56px rgba(37, 99, 235, 0.22);
        }

        .landing__plan-card.is-featured:hover {
          transform: scale(1.05) translateY(-6px);
        }

        .landing__plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.4rem 1.2rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .landing__plan-saving {
          display: inline-block;
          padding: 0.35rem 0.9rem;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.15);
          color: #047857;
          font-weight: 600;
          font-size: 0.85rem;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .landing__plan-price {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0.5rem 0;
        }

        .landing__plan-features {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .landing__plan-features li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        /* Testimonials Grid */
        .landing__testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .landing__testimonial-card {
          padding: 2rem;
          border-radius: 24px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .landing__testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px rgba(37, 99, 235, 0.15);
        }

        .landing__stars {
          display: flex;
          gap: 0.25rem;
          color: #fbbf24;
        }

        .landing__testimonial-card blockquote {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--text-primary);
          font-style: italic;
        }

        .landing__testimonial-card figcaption {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* FAQ Grid */
        .landing__faq-grid {
          display: grid;
          gap: 1.25rem;
          max-width: 900px;
          margin: 3rem auto 0;
        }

        .landing__faq-item {
          padding: 1.5rem;
          border-radius: 20px;
          border: 1.5px solid var(--border-light);
          background: white;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.08);
          transition: all 0.3s ease;
        }

        .landing__faq-item:hover {
          border-color: rgba(37, 99, 235, 0.25);
          box-shadow: 0 10px 28px rgba(37, 99, 235, 0.12);
        }

        .landing__faq-item[open] {
          border-color: var(--brand-primary);
          background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(239, 246, 255, 0.5));
        }

        .landing__faq-item summary {
          cursor: pointer;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--text-primary);
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .landing__faq-item summary::-webkit-details-marker {
          display: none;
        }

        .landing__faq-item summary::after {
          content: '+';
          font-size: 1.75rem;
          font-weight: 300;
          color: var(--brand-primary);
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .landing__faq-item[open] summary::after {
          content: '−';
          transform: rotate(180deg);
        }

        .landing__faq-item p {
          margin-top: 1rem;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        /* Background Illustrations */
        .landing__bg-illustration {
          position: absolute;
          width: min(600px, 80vw);
          height: auto;
          opacity: 0.18;
          z-index: 1;
          pointer-events: none;
        }

        /* Utility Classes */
        .text-center {
          text-align: center;
        }

        .max-w-3xl {
          max-width: 48rem;
        }

        .mx-auto {
          margin-left: auto;
          margin-right: auto;
        }

        .text-lg {
          font-size: 1.125rem;
        }

        .px-8 {
          padding-left: 2rem;
          padding-right: 2rem;
        }

        .py-4 {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .ml-2 {
          margin-left: 0.5rem;
        }

        .mt-6 {
          margin-top: 1.5rem;
        }

        .text-sm {
          font-size: 0.875rem;
        }

        .opacity-80 {
          opacity: 0.8;
        }

        .opacity-70 {
          opacity: 0.7;
        }

        .mt-2 {
          margin-top: 0.5rem;
        }

        .text-red-500 {
          color: #ef4444;
        }

        .text-green-500 {
          color: #10b981;
        }

        .text-yellow-400 {
          color: #fbbf24;
        }

        .fill-yellow-400 {
          fill: #fbbf24;
        }

        .text-blue-600 {
          color: #2563eb;
        }

        .h-4 {
          height: 1rem;
        }

        .w-4 {
          width: 1rem;
        }

        .h-5 {
          height: 1.25rem;
        }

        .w-5 {
          width: 1.25rem;
        }

        .h-6 {
          height: 1.5rem;
        }

        .w-6 {
          width: 1.5rem;
        }

        .h-8 {
          height: 2rem;
        }

        .w-8 {
          width: 2rem;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .animate-fadein {
          animation: fadein 1.05s ease;
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          60% {
            transform: translateX(130%);
          }
          100% {
            transform: translateX(130%);
          }
        }

        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @media (min-width: 900px) {
          .landing__hero-grid {
            grid-template-columns: 1.1fr 1fr;
          }

          .landing__alternating-grid {
            grid-template-columns: 1fr 1.1fr;
          }

          .landing__alternating-grid.is-reversed .landing__alternating-content {
            order: 2;
          }

          .landing__alternating-grid.is-reversed .landing__alternating-media {
            order: 1;
          }
        }

        @media (max-width: 960px) {
          .landing__nav ul,
          .landing__actions {
            display: none;
          }

          .landing__mobile-toggle {
            display: inline-flex;
          }
  
          .landing__plan-card.is-featured {
            transform: none;
          }
        }

        @media (max-width: 640px) {
          .landing__hero {
            padding-top: 4.5rem;
          }

          .landing h1 {
            font-size: clamp(2rem, 8vw, 2.6rem);
          }

          .landing h2 {
            font-size: clamp(1.6rem, 6vw, 2.2rem);
          }

          .landing__card {
            padding: 1.75rem;
          }

          .landing__card h3 {
            font-size: clamp(1.15rem, 4vw, 1.3rem);
          }

          .landing__hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .landing__hero-trust {
            flex-direction: column;
            align-items: flex-start;
            padding: 0.75rem 1rem;
          }

          .landing__section-lead {
            font-size: clamp(0.98rem, 4vw, 1.1rem);
          }
        }
      `}</style>
    </div>
  );
}
