'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertCircle } from 'lucide-react';
import { FileAttachment } from '@/components/ui/file-attachment';
import type { Currency } from '@/lib/types';

interface ContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amountInCents: number, note?: string, attachment?: { url: string; name: string; type: string }) => Promise<void>;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  currency: Currency;
  locale: string;
  isFrench: boolean;
}

export function ContributionDialog({
  isOpen,
  onClose,
  onSave,
  goalName,
  currentAmount,
  targetAmount,
  currency,
  locale,
  isFrench,
}: ContributionDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const translations = {
    title: isFrench ? 'Ajouter une contribution' : 'Add Contribution',
    description: isFrench ? `Contribuer à l'objectif "${goalName}"` : `Contribute to goal "${goalName}"`,
    amountLabel: isFrench ? 'Montant' : 'Amount',
    amountPlaceholder: isFrench ? 'Entrez le montant' : 'Enter amount',
    noteLabel: isFrench ? 'Note (optionnelle)' : 'Note (optional)',
    notePlaceholder: isFrench ? 'Ajoutez une note...' : 'Add a note...',
    currentProgress: isFrench ? 'Progression actuelle' : 'Current Progress',
    afterContribution: isFrench ? 'Après contribution' : 'After Contribution',
    remaining: isFrench ? 'Reste à atteindre' : 'Remaining',
    willExceed: isFrench ? 'Cette contribution dépassera l\'objectif' : 'This contribution will exceed the target',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    save: isFrench ? 'Ajouter' : 'Add',
    errorInvalid: isFrench ? 'Veuillez entrer un montant valide' : 'Please enter a valid amount',
    errorZero: isFrench ? 'Le montant doit être supérieur à 0' : 'Amount must be greater than 0',
  };

  const formatMoney = (amountInCents: number) => {
    const value = (amountInCents || 0) / 100;
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const amountInCents = Math.round(parsedAmount * 100);
  const newAmount = currentAmount + amountInCents;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const willExceed = newAmount > targetAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || isNaN(parsedAmount)) {
      setError(translations.errorInvalid);
      return;
    }

    if (parsedAmount <= 0) {
      setError(translations.errorZero);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(amountInCents, note.trim() || undefined, attachment || undefined);
      setAmount('');
      setNote('');
      setAttachment(null);
      onClose();
    } catch (err) {
      setError(isFrench ? 'Erreur lors de l\'ajout de la contribution' : 'Error adding contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setNote('');
      setAttachment(null);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {translations.title}
            </DialogTitle>
            <DialogDescription>{translations.description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Montant */}
            <div className="grid gap-2">
              <Label htmlFor="amount">{translations.amountLabel}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={translations.amountPlaceholder}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">{translations.noteLabel}</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={translations.notePlaceholder}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Pièce jointe */}
            <FileAttachment
              value={attachment}
              onChange={setAttachment}
              isFrench={isFrench}
              disabled={isSubmitting}
              accept="image/*,.pdf,.doc,.docx"
              maxSize={5}
            />

            {/* Aperçu */}
            {parsedAmount > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{translations.currentProgress}</span>
                  <span className="font-medium">{formatMoney(currentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{translations.afterContribution}</span>
                  <span className="font-bold text-green-600">{formatMoney(newAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">{translations.remaining}</span>
                  <span className="font-medium">
                    {willExceed ? (
                      <span className="text-orange-600">+{formatMoney(newAmount - targetAmount)}</span>
                    ) : (
                      formatMoney(remaining - amountInCents)
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Warning si dépassement */}
            {willExceed && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {translations.willExceed}
                </AlertDescription>
              </Alert>
            )}

            {/* Erreur */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              {translations.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount || parsedAmount <= 0}>
              {isSubmitting ? (isFrench ? 'Ajout...' : 'Adding...') : translations.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
