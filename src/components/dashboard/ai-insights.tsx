'use client';

import { Lightbulb } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

interface AIInsightsProps {
    insights: string;
    recommendations: string;
}

export function AIInsights({ insights, recommendations }: AIInsightsProps) {
  return (
    <Card className="bg-accent/20 border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights IA
        </CardTitle>
        <CardDescription>Analyses et recommandations personnalisées</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div>
          <h4 className="font-semibold mb-1">Insights:</h4>
          <p className="text-muted-foreground">{insights}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Recommendations:</h4>
          <p className="text-muted-foreground">{recommendations}</p>
        </div>
      </CardContent>
    </Card>
  );
}

