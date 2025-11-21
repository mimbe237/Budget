'use client';

import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AIInsightsProps {
  insights: string;
  recommendations: string;
  status?: 'ok' | 'empty' | 'error';
  mode?: 'full' | 'preview';
  onViewMoreHref?: string;
  lastUpdatedLabel?: string | null;
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

function truncateContent(content: string, limit = 320) {
  if (!content) return '';
  if (content.length <= limit) return content;
  const truncated = content.slice(0, limit);
  const lastSentence = truncated.lastIndexOf('.');
  if (lastSentence > limit * 0.6) {
    return truncated.slice(0, lastSentence + 1).trim();
  }
  return `${truncated.trim()}…`;
}

export function AIInsights({
  insights,
  recommendations,
  status = 'ok',
  mode = 'full',
  onViewMoreHref,
  lastUpdatedLabel,
}: AIInsightsProps) {
  const isPreview = mode === 'preview';
  const hasData = status === 'ok';

  const insightsContent = isPreview ? truncateContent(insights) : insights;
  const recommendationsContent = isPreview ? truncateContent(recommendations) : recommendations;

  const description = isPreview
    ? "Aperçu généré automatiquement. Consultez la page dédiée pour l'analyse complète."
    : "Analyse détaillée générée à partir de vos transactions, budgets et tendances récentes.";

  const fallbackMessage =
    status === 'empty'
      ? "Ajoutez davantage de transactions et définissez vos budgets pour débloquer des recommandations personnalisées."
      : "L'analyse IA est momentanément indisponible. Vérifiez votre connexion ou réessayez plus tard.";

  return (
    <Card className="bg-accent/20 border-accent/60 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline text-lg">
              <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
              {isPreview ? 'Aperçu IA' : 'Analyse IA complète'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary">
            IA
          </Badge>
        </div>
        {lastUpdatedLabel ? (
          <p className="text-xs text-muted-foreground">
            Dernière mise à jour : {lastUpdatedLabel}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 text-sm leading-relaxed">
        {hasData ? (
          <>
            <section className="space-y-2">
              <h4 className="font-semibold tracking-tight text-foreground">Insights</h4>
              {renderFormattedText(insightsContent)}
            </section>
            <section className="space-y-2">
              <h4 className="font-semibold tracking-tight text-foreground">Recommandations</h4>
              {renderFormattedText(recommendationsContent)}
            </section>
          </>
        ) : (
          <p className="text-muted-foreground">{fallbackMessage}</p>
        )}
      </CardContent>
      {isPreview && onViewMoreHref ? (
        <CardFooter className="pt-0">
          <Button asChild variant="secondary" className="ml-auto">
            <Link href={onViewMoreHref}>Voir l’analyse complète</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
