'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/Badge';

export default function UnauthorizedPage() {
  return (
    <div className="relative min-h-screen px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,115,111,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,176,67,0.14),transparent_34%)]" />
      </div>

      <div className="mx-auto max-w-2xl rounded-3xl border border-white/70 bg-white/85 p-10 text-center shadow-2xl backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/80">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner shadow-rose-200 dark:bg-rose-900/20 dark:text-rose-200">
          <ShieldX className="h-7 w-7" />
        </div>
        <div className="mb-4 flex justify-center">
          <Logo variant="icon" size="md" className="drop-shadow" />
        </div>
        <Badge variant="danger" subtle className="justify-center">Accès restreint</Badge>

        <div className="mt-5 space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Accès refusé</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Vous n&apos;avez pas les permissions nécessaires pour cette zone. Merci de vous reconnecter
            avec un compte administrateur ou de contacter le support.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/admin/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(62,99,221,0.2)] transition hover:brightness-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Chaque action est journalisée pour garantir la conformité.
          </p>
        </div>
      </div>
    </div>
  );
}
