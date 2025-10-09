import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SummaryCardProps = {
  title: string;
  amount: number;
  icon: React.ReactNode;
};

export function SummaryCard({ title, amount, icon }: SummaryCardProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

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
