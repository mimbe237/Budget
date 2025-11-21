'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminKPIs } from '@/lib/adminTypes';
import { formatMoneyFromCents } from '@/lib/format';
import { Users, Globe, Users2, MessageSquare, CreditCard, TrendingUp } from 'lucide-react';
import { Suspense } from 'react';

// Import dynamique pour éviter d'alourdir le bundle
const PieChart = ({ data, dataKey, nameKey, className }: any) => {
  const Recharts = require('recharts');
  const { PieChart: RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = Recharts;
  
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
  
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey={dataKey}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

const BarChart = ({ data, xKey, yKey, className }: any) => {
  const Recharts = require('recharts');
  const { BarChart: RechartsBarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } = Recharts;
  
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yKey} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

interface KpiCardsProps {
  kpis: AdminKPIs;
  isLoading?: boolean;
}

export function KpiCards({ kpis, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return <KpiCardsSkeleton />;
  }

  // Transformer les données pour les graphiques
  const countryData = Object.entries(kpis.usersByCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6) // Top 6 pays
    .map(([name, value]) => ({ name, value }));

  const genderData = Object.entries(kpis.usersByGender)
    .map(([name, value]) => ({ 
      name: name === 'male' ? 'Homme' : name === 'female' ? 'Femme' : name, 
      value 
    }));

  const languageData = Object.entries(kpis.usersByLanguage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Top 5 langues
    .map(([name, value]) => ({ name: name.toUpperCase(), value }));

  return (
    <div className="space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Utilisateurs
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-gray-900">
              {kpis.totalUsers.toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                +{kpis.newUsersThisMonth} ce mois
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-gray-900">
              {kpis.totalTransactions.toLocaleString('fr-FR')}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Toutes plateformes confondues
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde Global Platform
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-gray-900">
              {formatMoneyFromCents(kpis.totalPlatformBalanceInCents)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Somme des soldes utilisateurs
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Utilisateurs Actifs
            </CardTitle>
            <Users2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-gray-900">
              {kpis.activeUsersThisMonth.toLocaleString('fr-FR')}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Connectés ce mois
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users2 className="h-5 w-5 text-blue-600" />
              Répartition par Sexe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Suspense fallback={<div className="h-full bg-gray-100 rounded animate-pulse" />}>
                <PieChart 
                  data={genderData} 
                  dataKey="value" 
                  nameKey="name"
                  className="h-full"
                />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-green-600" />
              Top Pays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Suspense fallback={<div className="h-full bg-gray-100 rounded animate-pulse" />}>
                <PieChart 
                  data={countryData} 
                  dataKey="value" 
                  nameKey="name"
                  className="h-full"
                />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Langues Préférées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Suspense fallback={<div className="h-full bg-gray-100 rounded animate-pulse" />}>
                <BarChart 
                  data={languageData} 
                  xKey="name" 
                  yKey="value"
                  className="h-full"
                />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCardsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-sm">
            <CardHeader>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}