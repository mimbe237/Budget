import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Brain, FileBarChart2, Settings, ShieldCheck, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/adminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Espace Administration | Budget App',
  description: 'Accédez rapidement aux outils de supervision et aux rapports avancés.',
};

const quickLinks = [
  {
    href: '/admin/users',
    label: 'Gestion des utilisateurs',
    description: 'Suivez l’activité, ajustez les rôles et gérez les accès avancés.',
    icon: Users,
  },
  {
    href: '/admin/reports',
    label: 'Rapports et analyses',
    description: 'Consultez les tendances clés et exportez les données financières.',
    icon: FileBarChart2,
  },
];

export default async function AdminLandingPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Accès réservé aux administrateurs
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-headline font-bold text-gray-900">
              Console d’administration
            </h1>
            <p className="max-w-3xl text-base text-gray-600">
              Pilotez votre plateforme en toute confiance : suivez l’adoption, débloquez les insights
              IA et accédez aux rapports consolidés pour anticiper les besoins de vos utilisateurs.
            </p>
          </div>
        </header>

        <section aria-labelledby="admin-quick-actions" className="grid gap-6 md:grid-cols-2">
          {quickLinks.map(link => (
            <Card key={link.href} className="group relative overflow-hidden transition hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <link.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-xl">{link.label}</CardTitle>
                  <CardDescription className="mt-1 text-sm text-gray-600">
                    {link.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild variant="outline" className="group-hover:bg-primary group-hover:text-white">
                  <Link href={link.href} aria-label={`${link.label} - Ouvrir la section`}>
                    Explorer
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <CardTitle>IA & Gouvernance</CardTitle>
                  <CardDescription className="text-gray-600">
                    Centralisez les insights générés par l’IA et suivez les actions recommandées.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                Exploitez les analyses automatisées pour identifier les anomalies budgétaires et mettre en
                place des actions ciblées pour vos utilisateurs à forte valeur.
              </p>
              <p className="text-gray-500">
                Les flux IA sont exécutés côté serveur via Firebase Admin. Assurez-vous que les
                credentials sont correctement configurés avant de lancer des analyses en production.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <CardTitle>Checklist d’administration</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gardez un œil sur les tâches clés pour maintenir un environnement stable.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-gray-600">
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <p className="font-medium text-gray-800">Accès & rôles</p>
                <p className="text-gray-500">
                  Vérifiez régulièrement les comptes admin via <code className="rounded bg-gray-200 px-1 py-0.5">scripts/set-admin.js</code>
                  {' '}et révoquez les accès obsolètes.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <p className="font-medium text-gray-800">Sauvegardes</p>
                <p className="text-gray-500">
                  Automatisez l’export des données critiques en utilisant les fonctions d’export Excel disponibles dans les rapports.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <p className="font-medium text-gray-800">Suivi des incidents</p>
                <p className="text-gray-500">
                  Intégrez vos alertes Firebase à votre outil d’astreinte pour être notifié immédiatement des erreurs critiques.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
