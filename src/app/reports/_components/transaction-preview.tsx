'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amountInCents: number;
  type: 'income' | 'expense';
  category: string;
}

interface TransactionPreviewProps {
  transactions: Transaction[];
  formatMoney: (amount: number) => string;
  isFrench: boolean;
}

export function TransactionPreview({ transactions, formatMoney, isFrench }: TransactionPreviewProps) {
  const searchParams = useSearchParams();
  const locale = isFrench ? fr : undefined;
  
  const translations = {
    title: isFrench ? 'Transactions récentes' : 'Recent Transactions',
    date: isFrench ? 'Date' : 'Date',
    description: isFrench ? 'Description' : 'Description',
    category: isFrench ? 'Catégorie' : 'Category',
    amount: isFrench ? 'Montant' : 'Amount',
    exportAll: isFrench ? 'Exporter toutes les transactions' : 'Export all transactions',
    viewAll: isFrench ? 'Voir tout' : 'View all',
    noTransactions: isFrench ? 'Aucune transaction pour cette période' : 'No transactions for this period',
    income: isFrench ? 'Revenu' : 'Income',
    expense: isFrench ? 'Dépense' : 'Expense',
  };

  const handleExportAll = () => {
    const params = new URLSearchParams(searchParams ?? undefined);
    params.set('export', 'transactions');
    window.location.href = `/api/reports/export-transactions?${params.toString()}`;
  };

  const handleViewAll = () => {
    window.location.href = '/transactions';
  };

  // Limiter à 10 transactions max et trier par montant (plus importantes d'abord)
  const displayTransactions = transactions
    .sort((a, b) => Math.abs(b.amountInCents) - Math.abs(a.amountInCents))
    .slice(0, 10);

  if (transactions.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            {translations.noTransactions}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {translations.title}
        </CardTitle>
        <div className="flex gap-2 print:hidden">
          <Button
            onClick={handleExportAll}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-3 w-3" />
            {translations.exportAll}
          </Button>
          <Button
            onClick={handleViewAll}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            {translations.viewAll}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                  {translations.date}
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                  {translations.description}
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                  {translations.category}
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                  {translations.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((transaction, index) => (
                <tr 
                  key={transaction.id} 
                  className={`border-b border-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {format(new Date(transaction.date), 'd MMM', { locale })}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900 font-medium">
                    <div className="max-w-[200px] truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`py-3 px-2 text-sm text-right font-semibold ${
                    transaction.type === 'income' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatMoney(Math.abs(transaction.amountInCents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {transactions.length > 10 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                {isFrench ? `Affichage de 10 sur ${transactions.length} transactions` : `Showing 10 of ${transactions.length} transactions`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}