'use client';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  User as UserIcon,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface PendingUser {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  status: 'pending' | 'active' | 'rejected';
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export default function PendingUsersPage() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  const isFrench = userProfile?.locale === 'fr-CM';
  const isAdmin = userProfile?.role === 'admin' || userProfile?.admin === true;

  const translations = {
    title: isFrench ? 'Utilisateurs en attente' : 'Pending Users',
    description: isFrench ? 'Approuver ou rejeter les nouveaux comptes' : 'Approve or reject new accounts',
    noUsers: isFrench ? 'Aucun utilisateur en attente' : 'No pending users',
    approve: isFrench ? 'Approuver' : 'Approve',
    reject: isFrench ? 'Rejeter' : 'Reject',
    search: isFrench ? 'Rechercher par email...' : 'Search by email...',
    refresh: isFrench ? 'Actualiser' : 'Refresh',
    createdAt: isFrench ? 'Inscrit le' : 'Created',
    approveSuccess: isFrench ? 'Utilisateur approuvé' : 'User approved',
    rejectSuccess: isFrench ? 'Utilisateur rejeté' : 'User rejected',
    error: isFrench ? 'Erreur' : 'Error',
    unauthorized: isFrench ? 'Accès non autorisé' : 'Unauthorized access',
  };

  const loadPendingUsers = async () => {
    if (!isAdmin) {
      toast({
        title: translations.error,
        description: translations.unauthorized,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const getPendingUsersFunc = httpsCallable(functions, 'getPendingUsers');
      const result = await getPendingUsersFunc();
      const data = result.data as { users: PendingUser[] };
      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadPendingUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleApprove = async (userId: string, email: string) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      const functions = getFunctions();
      const approveUserFunc = httpsCallable(functions, 'approveUser');
      await approveUserFunc({ userId });

      toast({
        title: translations.approveSuccess,
        description: `${email} ${isFrench ? 'peut maintenant se connecter' : 'can now sign in'}`,
      });

      // Remove from list
      setUsers(users.filter(u => u.uid !== userId));
    } catch (error: any) {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleReject = async (userId: string, email: string) => {
    const reason = window.prompt(
      isFrench 
        ? 'Raison du rejet (optionnel) :' 
        : 'Reason for rejection (optional):'
    );

    if (reason === null) return; // User cancelled

    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      const functions = getFunctions();
      const rejectUserFunc = httpsCallable(functions, 'rejectUser');
      await rejectUserFunc({ userId, reason: reason || 'No reason provided' });

      toast({
        title: translations.rejectSuccess,
        description: `${email} ${isFrench ? 'a été rejeté' : 'has been rejected'}`,
      });

      // Remove from list
      setUsers(users.filter(u => u.uid !== userId));
    } catch (error: any) {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{translations.unauthorized}</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
            <p className="text-muted-foreground">{translations.description}</p>
          </div>
          <Button onClick={loadPendingUsers} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {translations.refresh}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            placeholder={translations.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Badge variant="secondary">
            {filteredUsers.length} {isFrench ? 'utilisateur(s)' : 'user(s)'}
          </Badge>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-2" />
              {isFrench ? 'Chargement...' : 'Loading...'}
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{translations.noUsers}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map(user => {
              const isProcessing = processingUsers.has(user.uid);
              const displayName = user.displayName || 
                                 (user.firstName && user.lastName 
                                   ? `${user.firstName} ${user.lastName}` 
                                   : user.email.split('@')[0]);

              return (
                <Card key={user.uid}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          {displayName}
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            {isFrench ? 'En attente' : 'Pending'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          {user.createdAt && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="h-3 w-3" />
                              {translations.createdAt} {new Date(user.createdAt).toLocaleString(isFrench ? 'fr-FR' : 'en-US')}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(user.uid, user.email)}
                          disabled={isProcessing}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {translations.approve}
                        </Button>
                        <Button
                          onClick={() => handleReject(user.uid, user.email)}
                          disabled={isProcessing}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {translations.reject}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
