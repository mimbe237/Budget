'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminUserData } from '@/lib/adminTypes';
import { Transaction, Goal } from '@/lib/types';
import { formatMoneyFromCents, formatDate } from '@/lib/format';
import {
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { getUserDetails } from '@/lib/analyticsAdmin';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/provider';
import { TransactionsView, TransactionsFetchParams, TransactionsFetchResult } from '@/components/transactions/TransactionsView';

interface UserDrawerProps {
  user: AdminUserData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: AdminUserData) => void;
  onToggleStatus: (user: AdminUserData) => void;
  onDelete: (user: AdminUserData) => void;
}

export function UserDrawer({
  user,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserDrawerProps) {
  const [userDetails, setUserDetails] = useState<{
    user: AdminUserData;
    recentTransactions: Transaction[];
    goals: Goal[];
    totalIncomeInCents: number;
    totalExpensesInCents: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useUser();

  // Tabs & période
  const [activeTab, setActiveTab] = useState('overview' as 'overview'|'budgets'|'categories'|'transactions'|'goals'|'reports'|'insights');
  const [period, setPeriod] = useState('month' as 'month'|'quarter'|'year'|'custom');
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();

  // Aperçu (kpis/graphs/budgets)
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewData, setOverviewData] = useState<any | null>(null);

  // Charger les détails quand l'utilisateur change
  useEffect(() => {
    if (user && isOpen) {
      loadUserDetails(user.id);
      loadOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOpen]);

  // Recharger l'aperçu quand la période change
  useEffect(() => {
    if (user && isOpen) loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customFrom, customTo]);

  const loadUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      const details = await getUserDetails(userId);
      setUserDetails(details);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'utilisateur.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authHeader = async (): Promise<HeadersInit> => {
    try {
      const token = await authUser?.getIdToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const loadOverview = async () => {
    if (!user) return;
    setOverviewLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (period === 'custom' && customFrom && customTo) {
        params.set('from', customFrom);
        params.set('to', customTo);
      }
      const headers = await authHeader();
      const res = await fetch(`/api/admin/users/${user.id}/overview?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to load overview');
      const data = await res.json();
      setOverviewData(data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger l\'aperçu.', variant: 'destructive' });
    } finally {
      setOverviewLoading(false);
    }
  };

  // Autosave budget par catégorie
  const onChangeBudget = async (categoryId: string, value: number) => {
    if (!user) return;
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(await authHeader()),
      };
      await fetch(`/api/admin/users/${user.id}/budgets/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ categoryId, budgetedAmount: value }),
      });
      // Soft refresh pour mettre à jour l'aperçu
      loadOverview();
    } catch (e) {
      toast({ title: 'Erreur', description: 'Échec de la sauvegarde du budget.', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      await onToggleStatus(user);
      toast({
        title: 'Statut modifié',
        description: `L'utilisateur a été ${user.status === 'active' ? 'suspendu' : 'activé'}.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!user || deleteConfirmEmail !== user.email) {
      toast({
        title: 'Erreur',
        description: 'L\'email de confirmation ne correspond pas.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(user);
      toast({
        title: 'Utilisateur supprimé',
        description: 'L\'utilisateur et toutes ses données ont été supprimés.',
      });
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'utilisateur.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  const getUserInitials = (user: AdminUserData) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'France': '🇫🇷',
      'Belgique': '🇧🇪',
      'Cameroun': '🇨🇲',
      'Canada': '🇨🇦',
      'Suisse': '🇨🇭',
      'Allemagne': '🇩🇪',
    };
    return flags[country] || '🌍';
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </SheetTitle>
                <SheetDescription className="text-base">
                  {user.email}
                </SheetDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={user.status === 'active' ? 'default' : 'destructive'}
                  >
                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                  </Badge>
                  <Badge variant="outline">
                    {user.transactionCount} transaction{user.transactionCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => onEdit(user)} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant={user.status === 'active' ? 'destructive' : 'default'}
                onClick={handleToggleStatus}
              >
                {user.status === 'active' ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Suspendre
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activer
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <Separator className="my-6" />

          <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-7 sticky top-0 bg-white z-10">
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="goals">Objectifs</TabsTrigger>
              <TabsTrigger value="reports">Rapports</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Aperçu */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Période */}
              <div className="flex flex-wrap items-center gap-2">
                {(['month','quarter','year'] as const).map(p => (
                  <Button key={p} size="sm" variant={period===p?'default':'outline'} onClick={()=>setPeriod(p)}>
                    {p==='month'?'Mois':p==='quarter'?'Trimestre':'Année'}
                  </Button>
                ))}
                <Button size="sm" variant={period==='custom'?'default':'outline'} onClick={()=>setPeriod('custom')}>Perso</Button>
                {period==='custom' && (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={customFrom||''} onChange={e=>setCustomFrom(e.target.value)} />
                    <span className="text-sm text-gray-500">→</span>
                    <Input type="date" value={customTo||''} onChange={e=>setCustomTo(e.target.value)} />
                    <Button size="sm" onClick={loadOverview}>Appliquer</Button>
                  </div>
                )}
              </div>

              {overviewLoading && (
                <div className="py-8 text-center text-gray-500">Chargement de l'aperçu…</div>
              )}

              {overviewData && (
                <>
                  {/* Résumé Budget */}
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Résumé Budget (période)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Prévu</div>
                          <div className="text-xl font-semibold">{formatMoneyFromCents(overviewData.kpis?.totalPlannedInCents||0)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Réel</div>
                          <div className="text-xl font-semibold">{formatMoneyFromCents(overviewData.kpis?.totalExpensesInCents||0)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Différence</div>
                          <div className="text-xl font-semibold">{formatMoneyFromCents((overviewData.kpis?.totalPlannedInCents||0)-(overviewData.kpis?.totalExpensesInCents||0))}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">% Respect</div>
                          <div className="text-xl font-semibold">
                            {(() => {
                              const p = overviewData.kpis?.totalPlannedInCents||0;
                              const e = overviewData.kpis?.totalExpensesInCents||0;
                              if (!p) return '—';
                              const v = Math.max(0, Math.min(100, ((p-e)/p)*100));
                              return `${v.toFixed(0)}%`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Répartition & Cashflow (simplifiée) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader><CardTitle className="text-base">Dépenses par catégorie</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {overviewData.spendingByCategory?.slice(0,8).map((row: any) => {
                          const planned = row.budgetedAmount||0; const actual = row.value||0;
                          const pct = planned? Math.min(100, (actual/planned)*100) : 0;
                          const barColor = pct<70?'bg-green-500':pct<=100?'bg-amber-500':'bg-red-500';
                          return (
                            <div key={row.categoryId||row.name} className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{row.name}</span>
                                <span>{formatMoneyFromCents(actual)}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className={`h-2 ${barColor} rounded-full`} style={{ width: `${pct.toFixed(0)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader><CardTitle className="text-base">Cashflow</CardTitle></CardHeader>
                      <CardContent>
                        {/* Sparkline simple */}
                        <div className="h-32 w-full">
                          {(() => {
                            const data = (overviewData.cashflow||[]) as Array<{date:string, incomeInCents:number, expensesInCents:number, netInCents:number}>;
                            if (!data.length) return <div className="text-sm text-gray-500">Aucune donnée</div>;
                            const values = data.map(d=>d.netInCents);
                            const min = Math.min(...values, 0);
                            const max = Math.max(...values, 0) || 1;
                            const width = 400, height = 120, pad = 10;
                            const points = values.map((v,i)=>{
                              const x = pad + (i*(width-2*pad))/(values.length-1||1);
                              const y = height - pad - ((v-min)/(max-min||1))*(height-2*pad);
                              return `${x},${y}`;
                            }).join(' ');
                            return (
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                                <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points} />
                                <line x1="0" x2={width} y1={height/2} y2={height/2} stroke="#e5e7eb" strokeDasharray="4 4" />
                              </svg>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alertes */}
                  {overviewData.alerts?.length>0 && (
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader><CardTitle className="text-base">Alertes budget</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        {overviewData.alerts.map((a: any, i: number) => (
                          <div key={i} className={`p-3 rounded-lg ${a.level==='danger'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700'}`}>
                            {a.level==='danger'?'⚠️ ':'ℹ️ '}{a.category}: {a.percent?.toFixed?.(0) ?? a.percent}% du budget utilisé
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Détails / Infos existantes */}
                  <Card className="rounded-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-5 w-5 text-blue-600" />
                        Informations personnelles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Email</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Téléphone</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {user.phoneCountryCode && user.phoneNumber
                                ? `${user.phoneCountryCode} ${user.phoneNumber}`
                                : 'Non renseigné'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Pays</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg">{getCountryFlag(user.country)}</span>
                            <span className="text-sm">{user.country}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Langue</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{user.language}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Inscription</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {isLoading ? (
                    <Card className="rounded-xl">
                      <CardHeader>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {userDetails && (
                        <Card className="rounded-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <CreditCard className="h-5 w-5 text-green-600" />
                              Statistiques financières
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-green-700">
                                  {formatMoneyFromCents(userDetails.totalIncomeInCents)}
                                </div>
                                <div className="text-sm text-green-600">Revenus totaux</div>
                              </div>
                              <div className="text-center p-4 bg-red-50 rounded-lg">
                                <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-red-700">
                                  {formatMoneyFromCents(userDetails.totalExpensesInCents)}
                                </div>
                                <div className="text-sm text-red-600">Dépenses totales</div>
                              </div>
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <div className={`text-2xl font-bold ${user.balanceInCents >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                  {formatMoneyFromCents(user.balanceInCents)}
                                </div>
                                <div className="text-sm text-blue-600">Solde actuel</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Transactions récentes */}
                      {userDetails && userDetails.recentTransactions.length > 0 && (
                        <Card className="rounded-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <CreditCard className="h-5 w-5 text-purple-600" />
                              5 dernières transactions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {userDetails.recentTransactions.map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium text-sm">{transaction.description}</div>
                                    <div className="text-xs text-gray-500">{transaction.category} • {transaction.date}</div>
                                  </div>
                                  <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.type === 'income' ? '+' : '-'}
                                    {formatMoneyFromCents(transaction.amountInCents || 0)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Objectifs */}
                      {userDetails && userDetails.goals.length > 0 && (
                        <Card className="rounded-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Target className="h-5 w-5 text-orange-600" />
                              Objectifs actifs
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {userDetails.goals.map((goal) => {
                                const progress = (goal.currentAmountInCents / goal.targetAmountInCents) * 100;
                                return (
                                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium text-sm">{goal.name}</div>
                                      <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                                    </div>
                                    <div className="text-xs text-gray-600">{formatMoneyFromCents(goal.currentAmountInCents)} / {formatMoneyFromCents(goal.targetAmountInCents)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Budgets */}
            <TabsContent value="budgets" className="mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="text-base">Budgets par catégorie</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  {!overviewData ? (
                    <div className="py-8 text-center text-gray-500">Chargement…</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-left text-gray-500">
                          <th className="py-2">Catégorie</th>
                          <th className="py-2">Prévu</th>
                          <th className="py-2">Réel</th>
                          <th className="py-2">Différence</th>
                          <th className="py-2">% utilisé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.spendingByCategory.map((row: any) => {
                          const planned = row.budgetedAmount||0;
                          const actual = row.value||0;
                          const diff = planned - actual;
                          const pct = planned ? (actual / planned) * 100 : 0;
                          const barColor = pct<70?'bg-green-500':pct<=100?'bg-amber-500':'bg-red-500';
                          return (
                            <tr key={row.categoryId||row.name} className="border-t">
                              <td className="py-2 font-medium">{row.name}</td>
                              <td className="py-2">
                                <Input
                                  type="number"
                                  defaultValue={Math.round(planned/100)}
                                  onBlur={(e) => {
                                    const val = Math.max(0, Math.round(Number(e.target.value||0))) * 100;
                                    if (val !== planned && row.categoryId) onChangeBudget(row.categoryId, val);
                                  }}
                                />
                              </td>
                              <td className="py-2">{formatMoneyFromCents(actual)}</td>
                              <td className="py-2">{formatMoneyFromCents(diff)}</td>
                              <td className="py-2 w-52">
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                  <div className={`h-2 ${barColor} rounded-full`} style={{ width: `${Math.min(100, pct).toFixed(0)}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Catégories */}
            <TabsContent value="categories" className="mt-6">
              <div className="text-sm text-gray-500">CRUD catégories à intégrer (icône, nom, ordre, règles).</div>
            </TabsContent>

            {/* Transactions */}
            <TabsContent value="transactions" className="mt-6">
              {user && (
                <TransactionsView
                  categoryOptions={overviewData?.categories?.map((c:any)=>c.name) || []}
                  onFetch={async (p: TransactionsFetchParams): Promise<TransactionsFetchResult> => {
                    const params = new URLSearchParams();
                    if (p.search) params.set('search', p.search);
                    if (p.from) params.set('from', p.from);
                    if (p.to) params.set('to', p.to);
                    if (p.category) params.set('category', p.category);
                    if (p.type) params.set('type', p.type);
                    params.set('page', String(p.page));
                    params.set('pageSize', String(p.pageSize));
                    params.set('sortField', p.sortField||'date');
                    params.set('sortDir', p.sortDir||'desc');
                    const headers = await authHeader();
                    const res = await fetch(`/api/admin/users/${user.id}/transactions?${params.toString()}`, { headers });
                    if (!res.ok) throw new Error('Failed to load transactions');
                    const data = await res.json();
                    return data as TransactionsFetchResult;
                  }}
                  loadCategories={async (t)=>{
                    const headers = await authHeader();
                    const res = await fetch(`/api/admin/categories?type=${t}`, { headers });
                    if (!res.ok) return null;
                    const data = await res.json();
                    return {
                      income: (data.income||[]).map((x:any)=>x.name),
                      expense: (data.expense||[]).map((x:any)=>x.name),
                      all: (data.all||[]).map((x:any)=>x.name),
                    };
                  }}
                  onSave={async (payload, mode, current) => {
                    if (!user) return;
                    const headers: HeadersInit = { 'Content-Type': 'application/json', ...(await authHeader()) };
                    if (mode === 'create') {
                      await fetch(`/api/admin/users/${user.id}/transactions`, { method: 'POST', headers, body: JSON.stringify(payload) });
                    } else if (current) {
                      await fetch(`/api/admin/users/${user.id}/transactions/${current.id}`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
                    }
                  }}
                  onRemove={async (t) => {
                    if (!user) return; const headers = await authHeader();
                    await fetch(`/api/admin/users/${user.id}/transactions/${t.id}`, { method: 'DELETE', headers });
                  }}
                />
              )}
            </TabsContent>

            {/* Objectifs */}
            <TabsContent value="goals" className="mt-6">
              <div className="text-sm text-gray-500">CRUD objectifs d'épargne, progression et ETA.</div>
            </TabsContent>

            {/* Rapports */}
            <TabsContent value="reports" className="mt-6">
              <div className="text-sm text-gray-500">Rapports PDF/Excel prêt à imprimer avec comparaisons.</div>
            </TabsContent>

            {/* Insights */}
            <TabsContent value="insights" className="mt-6">
              <div className="text-sm text-gray-500">Résumé mensuel, prévisions et notifications IA.</div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Supprimer l'utilisateur
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Cette action est <strong>irréversible</strong>. Toutes les données de cet 
                utilisateur seront définitivement supprimées :
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Profil utilisateur</li>
                <li>• Toutes les transactions</li>
                <li>• Tous les objectifs</li>
                <li>• Toutes les catégories personnalisées</li>
              </ul>
              <div className="pt-2">
                <Label className="text-sm font-medium">
                  Tapez l'email de l'utilisateur pour confirmer :
                </Label>
                <Input
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={user.email}
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfirmEmail !== user.email || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}