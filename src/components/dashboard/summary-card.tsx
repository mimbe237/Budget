import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Currency } from '@/lib/types';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

type SummaryCardProps = {
  title: string;
  amountInCents: number;
  icon: React.ReactNode;
};

function formatMoney(amountInCents: number, currency: Currency = 'USD', locale: string = 'en-US') {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function SummaryCard({ title, amountInCents, icon }: SummaryCardProps) {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);
    
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    
    const displayCurrency = userProfile?.displayCurrency || 'USD';
    const displayLocale = userProfile?.locale || 'en-US';

    const formattedAmount = formatMoney(amountInCents, displayCurrency, displayLocale);

  return (
    <Card className="bg-gradient-to-br from-white/60 via-blue-50/80 to-indigo-100/60 backdrop-blur-xl shadow-xl border-0 rounded-2xl transition-transform duration-200 hover:scale-[1.03]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-gray-800 drop-shadow-sm">{title}</CardTitle>
        <div className="text-blue-500 text-xl">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm animate-fadein">
          {formattedAmount}
        </div>
      </CardContent>
    </Card>
  );
}

    