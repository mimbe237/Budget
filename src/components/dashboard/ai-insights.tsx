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

function renderFormattedText(content: string) {
  if (!content?.trim()) {
    return <p className="text-muted-foreground">—</p>;
  }

  const blocks = content
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-muted-foreground leading-relaxed">
      {blocks.map((block, index) => {
        const lines = block
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);

        const isOrdered = lines.every(line => /^[0-9]+[.)]\s+/.test(line));
        const isUnordered = lines.every(line => /^[-–•]\s+/.test(line));

        if ((isOrdered || isUnordered) && lines.length > 1) {
          const listItems = lines.map(line =>
            line.replace(/^[0-9]+[.)]\s+|^[-–•]\s+/, '').trim()
          );
          if (isOrdered) {
            return (
              <ol key={index} className="ml-4 list-decimal space-y-1">
                {listItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={index} className="ml-4 list-disc space-y-1">
              {listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index}>
            {lines.join(' ').replace(/\s{2,}/g, ' ')}
          </p>
        );
      })}
    </div>
  );
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
      <CardContent className="space-y-6 text-sm">
        <section className="space-y-2">
          <h4 className="font-semibold tracking-tight">Insights</h4>
          {renderFormattedText(insights)}
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold tracking-tight">Recommendations</h4>
          {renderFormattedText(recommendations)}
        </section>
      </CardContent>
    </Card>
  );
}
