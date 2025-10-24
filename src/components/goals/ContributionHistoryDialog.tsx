'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { History, Pencil, Trash2, AlertCircle, TrendingUp } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import type { Goal, Currency, GoalTransaction } from '@/lib/types';
import type { Firestore } from 'firebase/firestore';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface ContributionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  userId: string | undefined;
  firestore: Firestore | null;
  currency: Currency;
  locale: string;
  isFrench: boolean;
  onUpdate: () => void;
}

export function ContributionHistoryDialog({
  isOpen,
  onClose,
  goal,
  userId,
  firestore,
  currency,
  locale,
  isFrench,
  onUpdate,
}: ContributionHistoryDialogProps) {
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<GoalTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [deletingTransaction, setDeletingTransaction] = useState<GoalTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  const translations = {
    title: isFrench ? 'Historique des contributions' : 'Contribution History',
    description: isFrench ? `Toutes les contributions pour "${goal?.name}"` : `All contributions for "${goal?.name}"`,
    date: isFrench ? 'Date' : 'Date',
    amount: isFrench ? 'Montant' : 'Amount',
    note: isFrench ? 'Note' : 'Note',
    actions: isFrench ? 'Actions' : 'Actions',
    noContributions: isFrench ? 'Aucune contribution pour le moment' : 'No contributions yet',
    totalContributions: isFrench ? 'Total des contributions' : 'Total Contributions',
    edit: isFrench ? 'Modifier' : 'Edit',
    delete: isFrench ? 'Supprimer' : 'Delete',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    save: isFrench ? 'Enregistrer' : 'Save',
    confirmDelete: isFrench ? 'Confirmer la suppression' : 'Confirm Deletion',
    confirmDeleteDesc: isFrench ? 'Cette action est irréversible. Le montant sera déduit de l\'objectif.' : 'This action cannot be undone. The amount will be deducted from the goal.',
    editTitle: isFrench ? 'Modifier la contribution' : 'Edit Contribution',
    close: isFrench ? 'Fermer' : 'Close',
  };

  const formatMoney = (amountInCents: number) => {
    const value = (amountInCents || 0) / 100;
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (isOpen && goal && userId && firestore) {
      loadTransactions();
    }
  }, [isOpen, goal, userId, firestore]);

  const loadTransactions = async () => {
    if (!firestore || !userId || !goal) return;

    setIsLoading(true);
    try {
      const transactionsRef = collection(firestore, `users/${userId}/budgetGoals/${goal.id}/transactions`);
      const q = query(transactionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const loadedTransactions: GoalTransaction[] = [];
      snapshot.forEach((doc) => {
        loadedTransactions.push({ id: doc.id, ...doc.data() } as GoalTransaction);
      });

      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: GoalTransaction) => {
    setEditingTransaction(transaction);
    setEditAmount(((transaction.amountInCents || 0) / 100).toString());
    setEditNote(transaction.note || '');
  };

  const handleSaveEdit = async () => {
    if (!firestore || !userId || !goal || !editingTransaction) return;

    const parsedAmount = parseFloat(editAmount) || 0;
    if (parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const newAmountInCents = Math.round(parsedAmount * 100);
      const oldAmountInCents = editingTransaction.amountInCents || 0;
      const difference = newAmountInCents - oldAmountInCents;

      // Mettre à jour la transaction
      const transactionRef = doc(
        firestore,
        `users/${userId}/budgetGoals/${goal.id}/transactions`,
        editingTransaction.id
      );
      await updateDoc(transactionRef, {
        amountInCents: newAmountInCents,
        note: editNote.trim() || null,
        updatedAt: new Date().toISOString(),
      });

      // Mettre à jour le montant total de l'objectif
      const goalRef = doc(firestore, `users/${userId}/budgetGoals`, goal.id);
      const newTotalAmount = (goal.currentAmountInCents || 0) + difference;
      await updateDoc(goalRef, {
        currentAmountInCents: newTotalAmount,
      });

      await loadTransactions();
      setEditingTransaction(null);
      setEditAmount('');
      setEditNote('');
      onUpdate();
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !userId || !goal || !deletingTransaction) return;

    setIsSubmitting(true);
    try {
      // Supprimer la transaction
      const transactionRef = doc(
        firestore,
        `users/${userId}/budgetGoals/${goal.id}/transactions`,
        deletingTransaction.id
      );
      await deleteDoc(transactionRef);

      // Déduire le montant de l'objectif
      const goalRef = doc(firestore, `users/${userId}/budgetGoals`, goal.id);
      const newTotalAmount = (goal.currentAmountInCents || 0) - (deletingTransaction.amountInCents || 0);
      await updateDoc(goalRef, {
        currentAmountInCents: Math.max(0, newTotalAmount),
      });

      await loadTransactions();
      setDeletingTransaction(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amountInCents || 0), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              {translations.title}
            </DialogTitle>
            <DialogDescription>{translations.description}</DialogDescription>
          </DialogHeader>

          {/* Statistiques */}
          {!isLoading && transactions.length > 0 && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{translations.totalContributions}</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {formatMoney(totalAmount)}
              </span>
            </div>
          )}

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.date}</TableHead>
                  <TableHead>{translations.amount}</TableHead>
                  <TableHead>{translations.note}</TableHead>
                  <TableHead className="text-right">{translations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {translations.noContributions}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {formatMoney(transaction.amountInCents || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {transaction.note || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTransaction(transaction)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {translations.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.editTitle}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{translations.amount}</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{translations.note}</label>
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingTransaction(null)}
              disabled={isSubmitting}
            >
              {translations.cancel}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting || !editAmount}>
              {isSubmitting ? (isFrench ? 'Enregistrement...' : 'Saving...') : translations.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {translations.confirmDelete}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translations.confirmDeleteDesc}
              <div className="mt-2 p-2 rounded bg-muted">
                <span className="font-medium">
                  {deletingTransaction && formatMoney(deletingTransaction.amountInCents || 0)}
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {translations.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (isFrench ? 'Suppression...' : 'Deleting...') : translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
