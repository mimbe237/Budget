'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { useGoalTransactions, updateGoalTransaction, deleteGoalTransaction } from '@/firebase/firestore/use-goal-transactions';
import type { Goal, GoalTransaction } from '@/lib/types';

interface GoalHistoryDialogProps {
  goal: Goal | null;
  userId?: string;
  firestore: any;
  isOpen: boolean;
  onClose: () => void;
  isFrench: boolean;
}

export function GoalHistoryDialog({
  goal,
  userId,
  firestore,
  isOpen,
  onClose,
  isFrench,
}: GoalHistoryDialogProps) {
  const { transactions, loading } = useGoalTransactions(userId, goal?.id);
  const [editTransaction, setEditTransaction] = useState<GoalTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const handleEdit = (tx: GoalTransaction) => {
    setEditTransaction(tx);
    setEditAmount(String(tx.amountInCents / 100));
    setEditNote(tx.note || '');
  };

  const handleSaveEdit = async () => {
    if (!firestore || !userId || !editTransaction || !goal) return;
    
    await updateGoalTransaction(firestore, userId, goal.id, editTransaction.id, {
      amountInCents: Math.round(parseFloat(editAmount) * 100),
      note: editNote,
    });
    
    setEditTransaction(null);
  };

  const handleDelete = async (tx: GoalTransaction) => {
    if (!firestore || !userId || !goal) return;
    await deleteGoalTransaction(firestore, userId, goal.id, tx.id);
  };

  const handleDownloadAttachment = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const translations = {
    title: isFrench ? 'Historique des apports' : 'Contribution History',
    date: isFrench ? 'Date' : 'Date',
    amount: isFrench ? 'Montant' : 'Amount',
    note: isFrench ? 'Note' : 'Note',
    attachment: isFrench ? 'Pièce jointe' : 'Attachment',
    actions: isFrench ? 'Actions' : 'Actions',
    edit: isFrench ? 'Modifier' : 'Edit',
    delete: isFrench ? 'Supprimer' : 'Delete',
    save: isFrench ? 'Enregistrer' : 'Save',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    noTransactions: isFrench ? 'Aucune transaction' : 'No transactions',
    notePlaceholder: isFrench ? 'Note (optionnel)' : 'Note (optional)',
    download: isFrench ? 'Télécharger' : 'Download',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription>{goal?.name}</DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.date}</TableHead>
                <TableHead>{translations.amount}</TableHead>
                <TableHead>{translations.note}</TableHead>
                <TableHead>{translations.attachment}</TableHead>
                <TableHead>{translations.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {translations.loading}
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {translations.noTransactions}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(tx => {
                  const FileIcon = getFileIcon(tx.attachmentType);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {(tx.amountInCents / 100).toLocaleString()} {goal?.currency}
                      </TableCell>
                      <TableCell>{tx.note}</TableCell>
                      <TableCell>
                        {tx.attachmentUrl && tx.attachmentName ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachment(tx.attachmentUrl!, tx.attachmentName!)}
                            className="h-8 px-2"
                          >
                            <FileIcon className="h-4 w-4 mr-1" />
                            <Download className="h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(tx)}
                          >
                            {translations.edit}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(tx)}
                          >
                            {translations.delete}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {editTransaction && (
          <div className="mt-4 border-t pt-4">
            <div className="flex gap-2 items-center">
              <Input 
                type="number" 
                value={editAmount} 
                onChange={e => setEditAmount(e.target.value)} 
                className="w-32" 
              />
              <Input 
                value={editNote} 
                onChange={e => setEditNote(e.target.value)} 
                className="flex-1" 
                placeholder={translations.notePlaceholder}
              />
              <Button size="sm" onClick={handleSaveEdit}>
                {translations.save}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditTransaction(null)}
              >
                {translations.cancel}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
