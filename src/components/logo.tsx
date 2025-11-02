import { Wallet } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-primary">
      <Wallet className="h-6 w-6" />
      <span className="font-headline text-xl font-semibold">Budget Pro</span>
    </Link>
  );
}
