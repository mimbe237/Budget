"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { initializeFirebase } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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
  Globe,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

// CONFIG: URLs dynamiques
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:9002/login";
const SIGNUP_URL = process.env.NEXT_PUBLIC_SIGNUP_URL || "http://localhost:9002/signup";

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
  { label: "30 jours d'essai gratuit", icon: CheckCircle2 },
  { label: "Données chiffrées de bout en bout", icon: Shield },
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
      "Classement automatique de vos transactions avec apprentissage continu pour refléter vos réalités terrain.",
    icon: Layers,
  },
  {
    title: "Objectifs d’épargne",
    description:
      "Planifiez vos objectifs, visualisez la progression et laissez les alertes proactives vous guider.",
    icon: Sparkles,
  },
  {
    title: "Analytics clairs",
    description:
      "Des tableaux de bord précis, des exports instantanés et un reporting qui facilite vos décisions.",
    icon: BarChart3,
  },
  {
    title: "Multi-devises & taxes",
    description:
      "Gestion native des devises, taux de change et spécificités fiscales pour rester conforme partout.",
    icon: Coins,
  },
  {
    title: "Mobilité & synchro",
    description:
      "Un accès fluidifié sur tous vos appareils avec synchronisation en temps réel de vos données critiques.",
    icon: CloudCog,
  },
  {
    title: "Sécurité d'entreprise",
    description:
      "Contrôle des accès, audit trail et chiffrement bout en bout pour répondre aux standards internes.",
    icon: Shield,
  },
] as const;

const ALTERNATING_SECTIONS: Array<{
  title: string;
  description: string;
  icon: ComponentType<any>;
  highlight: string;
  action: CallToAction;
  mediaTone: "azure" | "lilac" | "slate";
}> = [
  {
    title: "Un tableau de bord qui pense pour vous",
    description:
      "Notre moteur d’IA classe vos transactions en temps réel et détecte les anomalies avant qu’elles n’impactent votre trésorerie. Fini les tableaux croisés, vous analysez — nous préparons.",
    icon: Sparkles,
    highlight: "Automatisation intelligente en continu",
    action: { label: "Explorer la catégorisation", href: "#pricing", variant: "secondary" },
    mediaTone: "azure",
  },
  {
    title: "Planifiez, pilotez, atteignez vos objectifs",
    description:
      "Construisez des budgets dynamiques, simulez l’impact de nouveaux projets et suivez les écarts sur une timeline visuelle. Les alertes proactives vous gardent sur la trajectoire idéale.",
    icon: FileBarChart,
    highlight: "Vision long terme sur un seul écran",
    action: { label: "Voir le guide de démarrage", href: "#how", variant: "ghost" },
    mediaTone: "lilac",
  },
  {
    title: "Exports comptables en un clic",
    description:
      "Clôturez vos périodes sans stress. Vos données sont formatées pour votre cabinet ou votre ERP, avec la granularité et les étiquettes nécessaires pour respecter vos normes.",
    icon: Coins,
    highlight: "Compatibilité immédiate avec vos outils",
    action: { label: "Tester l’export", dataAttr: "signup", variant: "ghost" },
    mediaTone: "slate",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Créez votre compte",
    description: "On-boarding guidé, imports accélérés et activation de votre équipe en moins de 2 minutes.",
    action: { label: "Créer un compte", dataAttr: "signup", variant: "ghost" } as CallToAction,
    icon: Sparkles,
  },
  {
    step: "2",
    title: "Personnalisez",
    description:
      "Définissez vos catégories, objectifs et règles métiers. Budget Pro s’aligne sur votre modèle financier, pas l’inverse.",
    action: { label: "Explorer les modules", href: "#features", variant: "secondary" } as CallToAction,
    icon: CloudCog,
  },
  {
    step: "3",
    title: "Suivez & progressez",
    description:
      "Recevez des insights continus, ajustez vos budgets et transformez vos réunions en moments de pilotage éclairés.",
    action: { label: "Accéder au tableau de bord", dataAttr: "login", variant: "ghost" } as CallToAction,
    icon: BarChart3,
  },
] as const;

const PLANS = [
  {
    badge: "Flexibilité",
    title: "Mensuel",
    price: "2 000 F / mois",
    description:
      "Résiliation libre, support prioritaire et toutes les fonctionnalités pour structurer vos finances.",
    action: { label: "Commencer en mensuel", dataAttr: "signup", variant: "secondary" } as CallToAction,
  },
  {
    badge: "Meilleure valeur",
    title: "Annuel",
    price: "20 000 F / an",
    description:
      "Deux mois offerts, nouveautés déployées en priorité et reporting avancé inclus pour vos comités.",
    action: { label: "Choisir l’abonnement annuel", dataAttr: "signup", variant: "default" } as CallToAction,
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Budget Pro a transformé notre suivi de trésorerie. Nous identifions les économies en un clin d’œil.",
    author: "Sarah — Directrice financière",
  },
  {
    quote: "Les exports comptables automatiques nous font gagner des heures chaque semaine. Interface impeccable.",
    author: "Hervé — Comptable senior",
  },
  {
    quote: "Nous suivons nos objectifs d’épargne et nos budgets projets sans stress. Support client impeccable.",
    author: "Amina — Responsable budgétaire",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui, vous pouvez basculer entre les plans mensuel et annuel en quelques clics depuis votre interface.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Vos données sont chiffrées, hébergées sur une infrastructure certifiée et accessibles uniquement par vos équipes autorisées.",
  },
  {
    question: "Comment démarrer l’essai gratuit ?",
    answer:
      "Créez un compte (aucune carte de paiement requise), explorez toutes les fonctionnalités pendant 30 jours puis choisissez l’offre adaptée.",
  },
  {
    question: "Est-ce que la page gère la devise locale ?",
    answer:
      "Oui, la tarification est convertie automatiquement dans votre devise locale lors du paiement.",
  },
] as const;

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

function Globe(props: { className?: string; "aria-hidden"?: true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a16 16 0 0 1 4 9 16 16 0 0 1-4 9 16 16 0 0 1-4-9 16 16 0 0 1 4-9z" />
    </svg>
  );
}

function renderAction(action: CallToAction) {
  const className = getBtnClass(action.variant);
  if ("href" in action) {
    return (
      <a className={className} href={action.href}>
        {action.label}
      </a>
    );
  }
  const dataAttr =
    action.dataAttr === "login"
      ? { "data-login": "" }
      : {
          "data-signup": "",
        };
  return (
    <a className={className} href="#" {...dataAttr}>
      {action.label}
    </a>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { firestore } = initializeFirebase();
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);

  useEffect(() => {
    document.body.classList.add("landing-body");
    return () => document.body.classList.remove("landing-body");
  }, []);

  useEffect(() => {
    const syncLinks = (selector: string, url: string) => {
      document.querySelectorAll<HTMLAnchorElement>(selector).forEach((anchor) => {
        anchor.href = url;
      });
    };
    syncLinks("[data-login]", LOGIN_URL);
    syncLinks("[data-signup]", SIGNUP_URL);

    const yearSpan = document.getElementById("landing-year");
    if (yearSpan) {
      yearSpan.textContent = String(new Date().getFullYear());
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960 && isMenuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  useEffect(() => {
    const ref = doc(firestore, "adminConfig", "homepage");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setHomeContent(snap.data() as HomeContent);
        }
      },
      () => {
        // ignore errors, keep static content
      }
    );
    return () => unsub();
  }, [firestore]);

  const heroHeadline = homeContent?.title ?? (
    <>
      Pilotez vos finances.
      <span className="landing__hero-highlight"> Maîtrisez votre croissance.</span>
    </>
  );

  const heroSubtitle =
    homeContent?.subtitle ??
    "Budget Pro centralise vos flux, automatise vos catégories et vous offre les insights nécessaires pour passer de la gestion réactive à la stratégie proactive.";

  const primaryCtaLabel = homeContent?.ctaLabel ?? "Démarrer l’essai gratuit";
  const primaryCtaHref = homeContent?.ctaHref;

  const heroHasCustomMedia = Boolean(homeContent?.heroImage);

  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__container">
          <div className="landing__nav-bar">
            <Link className="landing__logo" href="/" aria-label="Budget Pro - Accueil">
              <span className="landing__logo-mark animate-fadein" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="url(#landingLogoGradient)" />
                  <defs>
                    <linearGradient id="landingLogoGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#2563eb" />
                      <stop offset="1" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <text x="16" y="21" textAnchor="middle" fontSize="16" fill="#ffffff" fontWeight="bold">
                    BP
                  </text>
                </svg>
              </span>
              <span className="landing__logo-wordmark">Budget Pro</span>
            </Link>

            <button
              className="landing__mobile-toggle"
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="landing-nav-mobile"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="sr-only">{isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
              <svg width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="1.6" aria-hidden="true">
                <rect x="4" y="7" width="16" height="2" rx="1" />
                <rect x="4" y="15" width="16" height="2" rx="1" />
              </svg>
              Menu
            </button>

            <nav className="landing__nav" aria-label="Navigation principale">
              <ul>
                <li>
                  <a href="#features">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#how">Comment ça marche</a>
                </li>
                <li>
                  <a href="#pricing">Tarifs</a>
                </li>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
              </ul>
            </nav>

            <div className="landing__actions">
              <a className="landing__btn landing__btn--ghost animate-shine" data-login href="#">
                Se connecter
              </a>
              <a className="landing__btn landing__btn--secondary animate-shine" data-signup href="#">
                Créer un compte
              </a>
            </div>
          </div>

          <div className={classNames("landing__mobile-nav", isMenuOpen && "is-open")} id="landing-nav-mobile">
            <a href="#features">Fonctionnalités</a>
            <a href="#how">Comment ça marche</a>
            <a href="#pricing">Tarifs</a>
            <a href="#faq">FAQ</a>
            <a className="landing__btn landing__btn--ghost animate-shine" data-login href="#">
              Se connecter
            </a>
            <a className="landing__btn landing__btn--secondary animate-shine" data-signup href="#">
              Créer un compte
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="landing__section landing__hero">
          <div className="landing__container landing__hero-grid">
            <div className="landing__hero-content animate-fadein">
              <span className="landing__kicker">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="8" fill="url(#landingKickerGradient)" />
                  <defs>
                    <linearGradient id="landingKickerGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#2563eb" />
                      <stop offset="1" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <path d="M11 6L7 10L5 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Gestion de Budget Intelligente
              </span>
              <h1 className="landing__hero-title">{heroHeadline}</h1>
              <p className="landing__hero-subtitle">{heroSubtitle}</p>

              <div className="landing__hero-actions">
                {primaryCtaHref ? (
                  <a className="landing__btn landing__btn--primary landing__btn--shine" href={primaryCtaHref}>
                    <span>{primaryCtaLabel}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <a className="landing__btn landing__btn--primary landing__btn--shine" data-signup href="#">
                    <span>{primaryCtaLabel}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                <a className="landing__btn landing__btn--ghost" data-login href="#">
                  <Users2 className="h-4 w-4" aria-hidden="true" />
                  Se connecter
                </a>
              </div>

              <div className="landing__hero-trust">
                <div className="landing__hero-avatars" aria-hidden="true">
                  {["S", "A", "M", "H"].map((initial) => (
                    <span key={initial} className="landing__avatar">
                      {initial}
                    </span>
                  ))}
                  <span className="landing__avatar-count">+1.5k</span>
                </div>
                <p className="landing__hero-trust-text">
                  Rejoignez <strong>1 500+ utilisateurs</strong> qui pilotent leurs finances avec Budget Pro.
                </p>
              </div>

              <div className="landing__hero-features" aria-label="Avantages clés">
                {HERO_PERKS.map(({ label, icon: Icon }) => (
                  <span key={label} className="landing__hero-feature">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="landing__dash animate-fadein">
              <div className="landing__dash-media" aria-hidden="true">
                {heroHasCustomMedia ? (
                  <div
                    className="landing__dash-media-remote"
                    style={{ backgroundImage: `url(${homeContent?.heroImage})` }}
                  />
                ) : (
                  <Image
                    src={HERO_FALLBACK}
                    alt="Aperçu du tableau de bord Budget Pro"
                    fill
                    sizes="(min-width: 1024px) 360px, 90vw"
                    priority
                  />
                )}
              </div>
              <div className="landing__dash-content">
                <h3 className="landing__dash-title">
                  <Shield className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  Tableau de bord en temps réel
                </h3>
                <div className="landing__dash-stats">
                  <div className="landing__dash-stat">
                    <span className="landing__dash-stat-label">Budget mensuel</span>
                    <span className="landing__dash-stat-value">2 450 €</span>
                    <span className="landing__dash-stat-change positive">+12,5 %</span>
                  </div>
                  <div className="landing__dash-stat">
                    <span className="landing__dash-stat-label">Objectifs atteints</span>
                    <span className="landing__dash-stat-value">68 %</span>
                    <div className="landing__progress" aria-hidden="true">
                      <span style={{ width: "68%" }} />
                    </div>
                  </div>
                </div>
                <div className="landing__chips">
                  <span className="landing__chip landing__chip--success">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Revenus +12 %
                  </span>
                  <span className="landing__chip landing__chip--info">Export prêt</span>
                  <span className="landing__chip landing__chip--warning">Multi-devises</span>
                </div>
                <div className="landing__chips">
                  <span className="landing__chip landing__chip--primary">Catégories intelligentes</span>
                  <span className="landing__chip landing__chip--secondary">Alertes IA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing__section landing__section--band">
          <div className="landing__container">
            <h2>Visualisez. Anticipez. Agissez.</h2>
            <p className="landing__section-lead">
              Budget Pro n’est pas qu’un simple tracker de dépenses : c’est votre copilote financier pour décider vite et
              bien.
            </p>

            {ALTERNATING_SECTIONS.map((section, index) => {
              const SectionIcon = section.icon;
              const mediaClass = classNames(
                "landing__alternating-media",
                `landing__alternating-media--${section.mediaTone}`
              );
              const hasCustomBanner = index === 0 && Boolean(homeContent?.bannerImage);
              const fallbackIllustration = ALTERNATING_ILLUSTRATIONS[index] ?? HERO_FALLBACK;
              const mediaIllustration = hasCustomBanner ? homeContent?.bannerImage : fallbackIllustration;

              return (
                <article
                  key={section.title}
                  className={classNames("landing__alternating-grid", index % 2 === 1 && "is-reversed")}
                >
                  <div className="landing__alternating-content">
                    <span className="landing__section-pill">
                      <SectionIcon className="h-4 w-4" aria-hidden={true} />
                      {section.highlight}
                    </span>
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>
                    {renderAction(section.action)}
                  </div>
                  <div className={mediaClass} aria-hidden="true">
                    {hasCustomBanner ? (
                      <div className="landing__alternating-remote" style={{ backgroundImage: `url(${mediaIllustration})` }} />
                    ) : (
                      <Image
                        src={mediaIllustration ?? ALTERNATING_ILLUSTRATIONS[index % ALTERNATING_ILLUSTRATIONS.length]}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 420px, 85vw"
                        priority={index === 0}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing__section landing__section--suite">
          <div className="landing__container">
            <h2>Une suite d’outils complète</h2>
            <p className="landing__section-lead">Tout ce qu’il faut pour maîtriser vos finances sans friction inutile.</p>
            <div className="landing__section-visual">
              <Image src={SUITE_ILLUSTRATION} alt="Modules clés Budget Pro" width={520} height={320} priority />
            </div>
            <div className="landing__grid landing__grid--features">
              {CORE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="landing__card landing__card--feature">
                    <div className="landing__feature-icon">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how" className="landing__section landing__section--band">
          <div className="landing__container">
            <h2>Comment ça marche ?</h2>
            <p className="landing__section-lead">
              Un parcours simple et guidé pour lancer votre gestion budgétaire nouvelle génération.
            </p>
            <div className="landing__grid landing__grid--steps">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="landing__card landing__card--step">
                    <span className="landing__step-number">{step.step}</span>
                    <h3>
                      <Icon className="h-4 w-4 text-blue-500" aria-hidden="true" /> {step.title}
                    </h3>
                    <p>{step.description}</p>
                    {renderAction(step.action)}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="landing__section landing__section--pricing">
          <div className="landing__container">
            <h2>Tarifs transparents</h2>
            <p className="landing__section-lead">Choisissez la formule adaptée, sans surprise cachée.</p>
            <div className="landing__grid landing__grid--plans">
              {PLANS.map((plan) => (
                <article key={plan.title} className="landing__card landing__card--plan">
                  <span className="landing__badge">{plan.badge}</span>
                  <h3>{plan.title}</h3>
                  <p className="landing__price">{plan.price}</p>
                  <p>{plan.description}</p>
                  {renderAction(plan.action)}
                </article>
              ))}
            </div>
            <p className="landing__section-lead landing__pricing-note">
              * Les prix sont convertis dans votre devise locale lors du paiement. Essai gratuit de 30 jours inclus.
            </p>
          </div>
        </section>

        <section className="landing__section landing__section--band">
          <div className="landing__container">
            <h2>Témoignages</h2>
            <p className="landing__section-lead">
              Ils ont adopté Budget Pro pour libérer leur potentiel financier et accélérer leurs projets.
            </p>
            <div className="landing__grid landing__grid--quotes">
              {TESTIMONIALS.map((testimonial) => (
                <article key={testimonial.author} className="landing__card landing__card--quote">
                  <p>« {testimonial.quote} »</p>
                  <cite>{testimonial.author}</cite>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="landing__section landing__section--faq">
          <div className="landing__container">
            <h2>FAQ</h2>
            <p className="landing__section-lead">Toutes les réponses pour bien démarrer sur Budget Pro.</p>
            <div className="landing__section-visual">
              <Image src={FAQ_ILLUSTRATION} alt="Orbit FAQ Budget Pro" width={520} height={320} />
            </div>
            <div className="landing__faq">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing__section landing__section--cta">
          <div className="landing__container">
            <div className="landing__card landing__card--cta">
              <h3>Prêt à prendre le contrôle de votre budget ?</h3>
              <p>Rejoignez Budget Pro et gérez vos finances avec sérénité.</p>
              <div className="landing__cta-actions">
                <a className="landing__btn landing__btn--primary landing__btn--shine" data-signup href="#">
                  Commencer l’essai de 30 jours
                </a>
                <a className="landing__btn landing__btn--ghost" data-login href="#">
                  Se connecter
                </a>
              </div>
              <div className="landing__section-visual landing__section-visual--cta">
                <Image src={CTA_ILLUSTRATION} alt="Rejoindre Budget Pro" width={520} height={320} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__container">
          <div className="landing__footer-inner">
            <div className="landing__footer-brand">
              <span className="landing__footer-logo">Budget Pro</span>
              <p>
                La solution moderne pour piloter vos finances d&apos;entreprise et personnelles avec précision. Automatisez
                vos contrôles, visualisez vos données et concentrez-vous sur la croissance.
              </p>
            </div>
            <div className="landing__footer-columns">
              <div className="landing__footer-column">
                <span className="landing__footer-heading">Navigation</span>
                <ul>
                  <li><a href="#features">Fonctionnalités</a></li>
                  <li><a href="#how">Comment ça marche</a></li>
                  <li><a href="#pricing">Tarifs</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
              <div className="landing__footer-column">
                <span className="landing__footer-heading">Accès rapide</span>
                <ul>
                  <li><a data-login href="#">Se connecter</a></li>
                  <li><a data-signup href="#">Créer un compte</a></li>
                  <li><a href="#pricing">Documentation</a></li>
                  <li><a href="#faq">Support technique</a></li>
                </ul>
              </div>
              <div className="landing__footer-column">
                <span className="landing__footer-heading">Contact</span>
                <ul>
                  <li><a href="mailto:support@budgetpro.com">support@budgetpro.com</a></li>
                  <li><a href="tel:+237123456789">+237 123 456 789</a></li>
                  <li><a href="#faq">Centre d&apos;aide</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="landing__footer-meta">
            <span>© <span id="landing-year" /> Budget Pro. Tous droits réservés.</span>
            <div className="landing__footer-meta-links">
              <a href="/legal/terms">Conditions d’utilisation</a>
              <a href="/legal/privacy">Politique de confidentialité</a>
              <a href="/legal/cookies">Gestion des cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @media (max-width: 900px) {
          .landing__container {
            width: 98vw;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          .landing__footer-inner {
            flex-direction: column;
            gap: 2.5rem;
          }
          .landing__footer-columns {
            width: 100%;
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
        }

        .landing {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-primary);
          font-family: var(--font-body);
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

        .landing__section--cta {
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(14, 165, 233, 0.08) 40%, rgba(37, 99, 235, 0.1) 100%);
          padding: calc(var(--section-spacing) * 0.8) 0;
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

        .landing__footer-inner {
          display: flex;
          flex-wrap: wrap;
          gap: 3.5rem;
          align-items: flex-start;
          justify-content: space-between;
        }

        .landing__footer-brand {
          max-width: 360px;
        }

        .landing__footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-heading);
          font-size: clamp(1.3rem, 2vw, 1.45rem);
          font-weight: 700;
          color: var(--neutral-dark);
          margin-bottom: 1.15rem;
        }

        .landing__footer-brand p {
          margin: 0;
          color: var(--text-secondary);
          font-size: clamp(0.96rem, 1.5vw, 1.02rem);
          line-height: 1.75;
        }

        .landing__footer-columns {
          display: grid;
          gap: 2rem;
          flex: 1;
          min-width: 280px;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }

        .landing__footer-heading {
          display: block;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: clamp(1rem, 1.6vw, 1.08rem);
          color: var(--text-primary);
          margin-bottom: 1.15rem;
          letter-spacing: -0.01em;
        }

        .landing__footer-column ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.75rem;
        }

        .landing__footer-column a {
          color: var(--text-secondary);
          font-size: clamp(0.92rem, 1.4vw, 0.98rem);
          padding: 0.3rem 0.45rem;
          border-radius: 7px;
          transition: all 0.25s ease;
          display: inline-block;
        }

        .landing__footer-column a:hover {
          color: var(--brand-primary);
          background: rgba(37, 99, 235, 0.1);
          padding-left: 0.75rem;
          transform: translateX(4px);
        }

        .landing__footer-column a:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
        }

        .landing__footer-meta {
          margin-top: 3rem;
          padding-top: 1.75rem;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: space-between;
          align-items: center;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .landing__footer-meta-links {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
        }

        .landing__footer-meta-links a {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .landing__footer-meta-links a:hover,
        .landing__footer-meta-links a:focus-visible {
          color: var(--brand);
          text-decoration: underline;
        }

        .landing__footer-meta-links a:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }

        @media (max-width: 768px) {
          .landing__footer-inner {
            gap: 2.5rem;
          }
          .landing__footer-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .landing__footer-meta-links {
            gap: 0.85rem;
          }
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

          .landing__footer-inner {
            gap: 2rem;
          }

          .landing__section-lead {
            font-size: clamp(0.98rem, 4vw, 1.1rem);
          }
        }
      `}</style>
    </div>
  );
}
