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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedAmount}</div>
      </CardContent>
    </Card>
  );
}
