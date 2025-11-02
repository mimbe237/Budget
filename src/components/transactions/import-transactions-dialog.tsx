'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

type ImportTransactionsDialogProps = {
  isFrench?: boolean;
};

export function ImportTransactionsDialog({ isFrench }: ImportTransactionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    toast({
      title: isFrench ? 'Prétraitement en cours' : 'Pre-processing',
      description: isFrench
        ? 'Nous analyserons le fichier lors de la prochaine itération.'
        : 'We will parse the file in an upcoming iteration.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Upload className="h-4 w-4" />
          {isFrench ? 'Importer' : 'Import'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isFrench ? 'Importer des transactions' : 'Import transactions'}</DialogTitle>
          <DialogDescription>
            {isFrench
              ? 'Importez un fichier CSV ou Excel. La catégorisation automatique analysera vos libellés.'
              : 'Upload a CSV or Excel file. Automatic categorisation will process your labels.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div>
            <p className="font-medium text-slate-900">
              {isFrench ? 'Étapes recommandées' : 'Recommended steps'}
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>{isFrench ? 'Téléchargez vos transactions depuis votre banque (CSV/Excel).' : 'Download your bank statement in CSV/Excel.'}</li>
              <li>{isFrench ? 'Vérifiez les colonnes: date, description, montant, type.' : 'Ensure columns are date, description, amount, type.'}</li>
              <li>{isFrench ? 'Importez ici et ajustez les correspondances si besoin.' : 'Upload here and adjust mappings if needed.'}</li>
            </ol>
          </div>
          <Separator />
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-900">
              {isFrench ? 'Fichier CSV ou Excel' : 'CSV or Excel file'}
            </span>
            <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
            {fileName ? (
              <span className="text-xs text-muted-foreground">
                {isFrench ? 'Fichier sélectionné :' : 'Selected file:'} {fileName}
              </span>
            ) : null}
          </label>
          <p className="text-xs text-muted-foreground">
            {isFrench
              ? 'L’assistant IA détectera automatiquement les catégories et comptes lors du prochain traitement.'
              : 'Our AI assistant will detect categories and accounts during the next processing step.'}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {isFrench ? 'Fermer' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
