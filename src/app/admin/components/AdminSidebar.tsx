import Link from 'next/link';
import { Users, UserCheck, Layers, CreditCard, FileBarChart2, Settings, LogOut, Edit, Landmark, Sparkles } from 'lucide-react';

const menu = [
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  // Affiliation (nouvelle navigation conforme au système actuel)
  { href: '/admin/affiliates', label: 'Affiliés', icon: Layers },
  { href: '/admin/affiliates/payouts', label: 'Payouts affiliés', icon: Sparkles },
  { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
  { href: '/debts', label: 'Dettes', icon: Landmark },
  { href: '/admin/reports', label: 'Rapports', icon: FileBarChart2 },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="h-full w-64 bg-white border-r flex flex-col shadow-sm">
      <div className="flex items-center justify-center h-20 border-b">
        <span className="font-headline text-xl text-primary">Admin Console</span>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        {menu.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary font-medium transition"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
          onClick={() => { window.location.href = '/login'; }}
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
