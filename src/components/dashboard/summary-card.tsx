import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Currency } from '@/lib/types';

type SummaryCardProps = {
  title: string;
  amountInCents: number;
  currency: Currency;
  icon: React.ReactNode;
};

function formatMoney(amountInCents: number, currency: Currency = 'USD') {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', { // This can be adapted with user's locale later
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function SummaryCard({ title, amountInCents, currency, icon }: SummaryCardProps) {
  const formattedAmount = formatMoney(amountInCents, currency);

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
