'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, Plus, Eye, Edit, Trash2, Paperclip } from 'lucide-react';
import { formatMoneyFromCents } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { FileAttachment } from '@/components/ui/file-attachment';

export type TransactionItem = {
  id: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amountInCents: number;
  date: any; // Firestore Timestamp ou Date
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
};

export type TransactionsFetchParams = {
  search?: string;
  from?: string;
  to?: string;
  category?: string;
  type?: 'income' | 'expense' | '';
  page: number;
  pageSize: number;
  sortField?: 'date' | 'amountInCents';
  sortDir?: 'asc' | 'desc';
};

export type TransactionsFetchResult = {
  items: TransactionItem[];
  total: number;
  summary: { totalIncomeInCents: number; totalExpensesInCents: number; balanceInCents: number };
  categoriesBreakdown: Array<{ category: string; valueInCents: number }>;
  monthlyTrend: Array<{ month: string; incomeInCents: number; expenseInCents: number; netInCents: number }>;
};

export function TransactionsView({
  title = 'Transactions',
  subtitle = 'Visualisez vos revenus et dépenses selon la période sélectionnée.',
  categoryOptions = [],
  defaultPageSize = 10,
  onFetch,
  onAdd,
  onEdit,
  onDelete,
  loadCategories,
  onSave,
  onRemove,
}: {
  title?: string;
  subtitle?: string;
  categoryOptions?: string[];
  defaultPageSize?: number;
  onFetch: (params: TransactionsFetchParams) => Promise<TransactionsFetchResult>;
  onAdd?: () => void;
  onEdit?: (t: TransactionItem) => void;
  onDelete?: (t: TransactionItem) => void;
  loadCategories?: (type: 'income'|'expense'|'all') => Promise<{ income: string[]; expense: string[]; all: string[] } | null>;
  onSave?: (payload: { description:string; category:string; type:'income'|'expense'; amountInCents:number; date:string; notes?:string; attachmentUrl?:string; attachmentName?:string; attachmentType?:string }, mode: 'create'|'edit', current: TransactionItem|null) => Promise<void>;
  onRemove?: (t: TransactionItem) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income'|'expense'|''>('');
  const [catsIncome, setCatsIncome] = useState<string[]>([]);
  const [catsExpense, setCatsExpense] = useState<string[]>([]);
  const [catsAll, setCatsAll] = useState<string[]>(categoryOptions);

  useEffect(()=>{
    (async()=>{
      if (!loadCategories) return;
      try {
        const res = await loadCategories('all');
        if (res) { setCatsIncome(res.income||[]); setCatsExpense(res.expense||[]); setCatsAll(res.all||[]); }
      } catch {}
    })();
  },[loadCategories]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState<'date'|'amountInCents'>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TransactionsFetchResult | null>(null);
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create'|'edit'>('create');
  const [formData, setFormData] = useState<{description:string;category:string;type:'income'|'expense';amount:number;date:string;notes:string}>({description:'',category:'',type:'expense',amount:0,date:'',notes:''});
  const [formAttachment, setFormAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await onFetch({ search, from: from||undefined, to: to||undefined, category: category||undefined, type: type||undefined, page, pageSize, sortField, sortDir });
      setData(res);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les transactions', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, from, to, category, type, page, pageSize, sortField, sortDir]);

  const resetFilters = () => {
    setSearch(''); setFrom(''); setTo(''); setCategory(''); setType(''); setPage(1); setSortField('date'); setSortDir('desc');
  };

  const openCreate = () => {
    setFormMode('create');
    setFormData({ description:'', category:'', type:'expense', amount:0, date:'', notes:'' });
    setFormAttachment(null);
    setFormOpen(true);
  };
  const openEdit = (t: TransactionItem) => {
    setFormMode('edit');
    setSelected(t);
    setFormData({ description:t.description, category:t.category, type:t.type, amount: Math.round((t.amountInCents||0)/100), date: (t.date?.toDate? t.date.toDate(): new Date(t.date)).toISOString().slice(0,10), notes: t.notes||'' });
    setFormAttachment(t.attachmentUrl ? { url: t.attachmentUrl, name: t.attachmentName || 'piece-jointe', type: t.attachmentType || 'application/octet-stream' } : null);
    setFormOpen(true);
  };
  const submitForm = async () => {
    try {
      const payload = {
        description: formData.description,
        category: formData.category,
        type: formData.type,
        amountInCents: Math.max(0, Math.round(formData.amount)) * 100,
        date: formData.date,
        notes: formData.notes,
        attachmentUrl: formAttachment?.url,
        attachmentName: formAttachment?.name,
        attachmentType: formAttachment?.type,
      };
      await onSave?.(payload, formMode, selected||null);
      setFormOpen(false);
      await load();
      toast({ title: 'Succès', description: formMode==='create' ? 'Transaction ajoutée.' : 'Transaction mise à jour.' });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Sauvegarde impossible', variant: 'destructive' });
    }
  };

  const exportCSV = async () => {
    try {
      const res = await onFetch({ search, from: from||undefined, to: to||undefined, category: category||undefined, type: type||undefined, page: 1, pageSize: 5000, sortField, sortDir });
      const headers = ['Description','Catégorie','Type','Date','Montant','Notes'];
      const rows = res.items.map(t => [
        t.description,
        t.category,
        t.type,
        (t.date?.toDate ? t.date.toDate() : new Date(t.date)).toLocaleDateString('fr-FR'),
        (t.type==='income'?'+':'-') + formatMoneyFromCents(Math.abs(t.amountInCents || 0)),
        t.notes || ''
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(v => typeof v==='string' && (v.includes(',')||v.includes('"')||v.includes('\n')) ? `"${v.replace(/"/g,'""')}"` : v).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'transactions.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Erreur', description: 'Export CSV impossible', variant: 'destructive' });
    }
  };

  const bg = 'bg-[#F9FAFB]';
  const primary = 'text-[#1A237E]';
  const secondary = 'text-[#8BC34A]';

  return (
    <div className={`space-y-6 ${bg}`}>
      {/* En-tête */}
      <div className="space-y-1">
        <h2 className={`text-2xl font-semibold ${primary}`}>{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {/* Cards résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="text-xs text-gray-500">Total Income</div>
            <div className="text-2xl font-bold text-green-700">{formatMoneyFromCents(data?.summary.totalIncomeInCents||0)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="text-xs text-gray-500">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">{formatMoneyFromCents(data?.summary.totalExpensesInCents||0)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="text-xs text-gray-500">Balance</div>
            <div className={`text-2xl font-bold ${((data?.summary.balanceInCents||0)>=0)?'text-blue-700':'text-red-700'}`}>{formatMoneyFromCents(data?.summary.balanceInCents||0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="Recherche description" value={search} onChange={(e)=>{setSearch(e.target.value); setPage(1);}} className="w-56" />
            <Input type="date" value={from} onChange={(e)=>{setFrom(e.target.value); setPage(1);}} />
            <Input type="date" value={to} onChange={(e)=>{setTo(e.target.value); setPage(1);}} />
            <Select value={category} onValueChange={(v)=>{setCategory(v); setPage(1);}}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes catégories</SelectItem>
                {(type==='' || type==='income') && catsIncome.map((c)=> (<SelectItem key={`inc-${c}`} value={c}>🟢 {c}</SelectItem>))}
                {(type==='' || type==='expense') && catsExpense.map((c)=> (<SelectItem key={`exp-${c}`} value={c}>🔴 {c}</SelectItem>))}
                {(!loadCategories && categoryOptions.length>0) && categoryOptions.map((c)=> (<SelectItem key={`static-${c}`} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v)=>{setType(v as any); setPage(1);}}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2"/>Exporter CSV</Button>
              <Button onClick={onAdd || openCreate}><Plus className="h-4 w-4 mr-2"/>Ajouter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Liste des transactions</CardTitle>
            <div className="text-sm text-gray-500">{data?.total || 0} éléments</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-500"><Loader2 className="inline h-5 w-5 animate-spin mr-2"/>Chargement…</div>
            ) : (data && data.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Pièce jointe</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((t) => {
                    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                    return (
                      <TableRow key={t.id} className="hover:bg-[#F7F8FA] cursor-pointer" onClick={()=>{setSelected(t); setDrawerOpen(true);}}>
                        <TableCell className="py-3">
                          <div className="font-medium text-gray-900">{t.description}</div>
                          {t.notes && <div className="text-xs text-gray-500">{t.notes}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.type==='income'?'default':'secondary'} className={t.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>
                            {t.category || 'Autres'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {d.toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${t.type==='income'?'text-green-600':'text-red-600'}`} title={t.type==='income'?'Revenu':'Dépense'}>
                          {t.type==='income' ? '+' : '-'}{formatMoneyFromCents(Math.abs(t.amountInCents||0))}
                        </TableCell>
                        <TableCell>
                          {t.attachmentUrl && (
                            t.attachmentType?.startsWith('image/') ? (
                              <img
                                src={t.attachmentUrl}
                                alt={t.attachmentName || 'pièce jointe'}
                                className="h-8 w-8 object-cover rounded cursor-pointer"
                                onClick={(e)=>{ e.stopPropagation(); window.open(t.attachmentUrl!, '_blank'); }}
                                title="Cliquer pour agrandir"
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e)=>{ e.stopPropagation(); const a=document.createElement('a'); a.href=t.attachmentUrl!; a.download=t.attachmentName || 'piece-jointe'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                                title={t.attachmentName || 'Télécharger'}
                              >
                                <Paperclip className="h-4 w-4 mr-1"/>
                                <Download className="h-3 w-3"/>
                              </Button>
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e)=>e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={()=>{setSelected(t); setDrawerOpen(true);}}><Eye className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="sm" onClick={()=>onEdit ? onEdit(t) : openEdit(t)}><Edit className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="sm" onClick={()=>onDelete ? onDelete(t) : (async()=>{ try{ await onRemove?.(t); await load(); toast({ title:'Supprimé'});}catch{toast({title:'Erreur', description:'Suppression impossible', variant:'destructive'})}})()} className="text-red-600"><Trash2 className="h-4 w-4"/></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center text-gray-500">Aucune transaction trouvée pour cette période.</div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-gray-600">Page {page} • {data.total} éléments</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Précédent</Button>
                <Select value={String(pageSize)} onValueChange={(v)=>{setPageSize(parseInt(v)); setPage(1);}}>
                  <SelectTrigger className="w-20"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={()=>setPage(p=>p+1)} disabled={page*pageSize >= data.total}>Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer analytique */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="py-3"><CardTitle className="text-base">Dépenses par catégorie</CardTitle></CardHeader>
            <CardContent>
              {data.categoriesBreakdown.length === 0 ? (
                <div className="text-sm text-gray-500">Aucune dépense</div>
              ) : (
                <div className="space-y-2">
                  {data.categoriesBreakdown.slice(0,6).map((c)=>{
                    const total = data.categoriesBreakdown.reduce((s,x)=>s+x.valueInCents,0)||1;
                    const pct = (c.valueInCents/total)*100;
                    return (
                      <div key={c.category} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600"><span>{c.category}</span><span>{pct.toFixed(0)}%</span></div>
                        <div className="w-full h-2 bg-gray-200 rounded-full"><div className="h-2 bg-red-400 rounded-full" style={{width:`${pct}%`}}/></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="py-3"><CardTitle className="text-base">Évolution mensuelle</CardTitle></CardHeader>
            <CardContent>
              <div className="h-32 w-full">
                {(() => {
                  const vals = data.monthlyTrend.map(m=>m.netInCents);
                  if (!vals.length) return <div className="text-sm text-gray-500">Aucune donnée</div>;
                  const min = Math.min(...vals, 0); const max = Math.max(...vals, 0)||1; const width=400, height=120, pad=10;
                  const points = vals.map((v,i)=>{
                    const x = pad + (i*(width-2*pad))/Math.max(1,vals.length-1);
                    const y = height - pad - ((v-min)/(max-min||1))*(height-2*pad);
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                      <polyline fill="none" stroke="#1A237E" strokeWidth="2" points={points} />
                      <line x1="0" x2={width} y1={height/2} y2={height/2} stroke="#e5e7eb" strokeDasharray="4 4" />
                    </svg>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drawer détail */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détail transaction</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {selected && (
              <>
                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="font-medium">{selected.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Catégorie</div>
                    <Badge variant={selected.type==='income'?'default':'secondary'} className={selected.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>
                      {selected.category || 'Autres'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Montant</div>
                    <div className={`font-semibold ${selected.type==='income'?'text-green-600':'text-red-600'}`}>
                      {selected.type==='income'?'+':'-'}{formatMoneyFromCents(Math.abs(selected.amountInCents||0))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Date</div>
                    <div className="text-sm text-gray-700">{(selected.date?.toDate? selected.date.toDate(): new Date(selected.date)).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-sm text-gray-700">{selected.type==='income'?'Revenu':'Dépense'}</div>
                  </div>
                </div>
                {selected.notes && (
                  <div>
                    <div className="text-xs text-gray-500">Notes</div>
                    <div className="text-sm text-gray-700">{selected.notes}</div>
                  </div>
                )}
                {selected.attachmentUrl && (
                  <div>
                    <div className="text-xs text-gray-500">Pièce jointe</div>
                    {selected.attachmentType?.startsWith('image/') ? (
                      <div className="mt-1">
                        <img
                          src={selected.attachmentUrl}
                          alt={selected.attachmentName || 'pièce jointe'}
                          className="h-32 w-32 object-cover rounded cursor-pointer"
                          onClick={()=>window.open(selected.attachmentUrl!, '_blank')}
                          title="Cliquer pour agrandir"
                        />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={()=>{ const a=document.createElement('a'); a.href=selected.attachmentUrl!; a.download=selected.attachmentName || 'piece-jointe'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                      >
                        <Paperclip className="h-4 w-4 mr-2"/>
                        {selected.attachmentName || 'Télécharger'}
                      </Button>
                    )}
                  </div>
                )}
                <Separator/>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={()=>onEdit ? onEdit(selected!) : openEdit(selected!)}><Edit className="h-4 w-4 mr-2"/>Modifier</Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={()=>setDrawerOpen(false)}>Fermer</Button>
                    <Button variant="destructive" disabled={!onDelete} onClick={()=>onDelete?.(selected)}><Trash2 className="h-4 w-4 mr-2"/>Supprimer</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Bouton flottant ajouter (optionnel) */}
      {
        <Button onClick={onAdd || openCreate} className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg" title="Ajouter une transaction">
          <Plus className="h-5 w-5"/>
        </Button>
      }

      {/* Formulaire ajout/édition */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{formMode==='create'?'Ajouter':'Modifier'} une transaction</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs text-gray-500">Description</div>
              <Input value={formData.description} onChange={(e)=>setFormData(v=>({...v, description:e.target.value}))} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Catégorie</div>
              <Select value={formData.category} onValueChange={(v)=>setFormData(f=>({...f, category:v}))}>
                <SelectTrigger><SelectValue placeholder="Catégorie"/></SelectTrigger>
                <SelectContent>
                  {(formData.type==='income'?catsIncome:catsExpense).map(c => (<SelectItem key={`f-${c}`} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Type</div>
                <Select value={formData.type} onValueChange={(v)=>setFormData(f=>({...f, type: v as any}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Revenu</SelectItem>
                    <SelectItem value="expense">Dépense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-gray-500">Montant (EUR)</div>
                <Input type="number" value={formData.amount} onChange={(e)=>setFormData(v=>({...v, amount: Number(e.target.value||0)}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <Input type="date" value={formData.date} onChange={(e)=>setFormData(v=>({...v, date:e.target.value}))} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Notes</div>
                <Input value={formData.notes} onChange={(e)=>setFormData(v=>({...v, notes:e.target.value}))} />
              </div>
            </div>
            {/* Pièce jointe */}
            <div>
              <div className="text-xs text-gray-500">Pièce jointe</div>
              <FileAttachment
                value={formAttachment}
                onChange={setFormAttachment}
                isFrench={true}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                maxSize={5}
              />
              {formAttachment?.url && formAttachment.type?.startsWith('image/') && (
                <div className="mt-2">
                  <img src={formAttachment.url} alt="Aperçu" className="h-24 w-24 object-cover rounded" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setFormOpen(false)}>Annuler</Button>
              <Button onClick={submitForm}>{formMode==='create'?'Ajouter':'Enregistrer'}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
