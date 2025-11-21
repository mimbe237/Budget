'use client';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser, useFirestore } from '@/firebase';
import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  updatePassword, 
  updateEmail, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  sendEmailVerification,
  getAuth,
  signOut
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Lock, 
  Mail, 
  Globe, 
  Bell, 
  Trash2, 
  Download, 
  Shield,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Currency } from '@/lib/types';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Preferences state
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  const [locale, setLocale] = useState('en-US');
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  
  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletionPassword, setDeletionPassword] = useState('');

  const isFrench = userProfile?.locale === 'fr-CM';
  const deleteKeyword = isFrench ? 'SUPPRIMER' : 'DELETE';

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setDisplayCurrency(userProfile.displayCurrency || 'USD');
      setLocale(userProfile.locale || 'en-US');
    }
  }, [userProfile]);

  const translations = {
    title: isFrench ? 'Paramètres' : 'Settings',
    tabs: {
      profile: isFrench ? 'Profil' : 'Profile',
      security: isFrench ? 'Sécurité' : 'Security',
      preferences: isFrench ? 'Préférences' : 'Preferences',
      notifications: isFrench ? 'Notifications' : 'Notifications',
      account: isFrench ? 'Compte' : 'Account',
    },
    saveButton: isFrench ? 'Enregistrer' : 'Save Changes',
    cancelButton: isFrench ? 'Annuler' : 'Cancel',
  };

  const handleSaveProfile = async () => {
    if (!user || !firestore) return;

    setIsSavingProfile(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        phoneNumber,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: isFrench ? 'Profil mis à jour' : 'Profile Updated',
        description: isFrench ? 'Vos informations ont été enregistrées.' : 'Your information has been saved.',
      });
    } catch (error: any) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user || !firestore) return;

    setIsSavingPreferences(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        displayCurrency,
        locale,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: isFrench ? 'Préférences enregistrées' : 'Preferences Saved',
        description: isFrench ? 'Vos préférences ont été mises à jour.' : 'Your preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: isFrench ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: isFrench ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast({
        title: isFrench ? 'Mot de passe modifié' : 'Password Changed',
        description: isFrench ? 'Votre mot de passe a été mis à jour.' : 'Your password has been updated.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/wrong-password') {
        errorMessage = isFrench ? 'Mot de passe actuel incorrect.' : 'Current password is incorrect.';
      }

      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user) return;

    setIsChangingEmail(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, emailPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      await sendEmailVerification(user);

      if (firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          email: newEmail,
          emailVerified: false,
          updatedAt: new Date().toISOString(),
        });
      }

      toast({
        title: isFrench ? 'Email modifié' : 'Email Changed',
        description: isFrench ? 'Vérifiez votre nouvelle adresse email.' : 'Please verify your new email address.',
      });

      setNewEmail('');
      setEmailPassword('');
    } catch (error: any) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user) return;

    try {
      await sendEmailVerification(user);
      toast({
        title: isFrench ? 'Email envoyé' : 'Email Sent',
        description: isFrench ? 'Vérifiez votre boîte de réception.' : 'Check your inbox.',
      });
    } catch (error: any) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    toast({
      title: isFrench ? 'Export en cours' : 'Exporting',
      description: isFrench ? 'Vos données seront envoyées par email.' : 'Your data will be emailed to you.',
    });
  };

  const canConfirmDeletion = () => {
    if (!user) return false;
    const normalized = deleteConfirmation.trim();
    return (
      normalized.toUpperCase() === deleteKeyword ||
      (user.email && normalized.toLowerCase() === user.email.toLowerCase())
    );
  };

  const handleDeleteAccount = () => {
    setDeleteError(null);
    setDeleteConfirmation('');
    setDeletionPassword('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user) return;
    if (!canConfirmDeletion()) {
      setDeleteError(
        isFrench
          ? 'Veuillez saisir votre email ou le mot-clé pour confirmer.'
          : 'Please type your email or the keyword to confirm.'
      );
      return;
    }

    if (!deletionPassword) {
      setDeleteError(
        isFrench ? 'Le mot de passe est requis pour valider.' : 'Password is required to confirm.'
      );
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const credential = EmailAuthProvider.credential(user.email!, deletionPassword);
      await reauthenticateWithCredential(user, credential);

      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/user/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 202) {
        toast({
          title: isFrench ? 'Suppression planifiée' : 'Deletion scheduled',
          description:
            payload?.message ||
            (isFrench
              ? 'Votre compte sera supprimé dans 30 jours.'
              : 'Your account is scheduled for deletion in 30 days.'),
        });
        setIsDeletingAccount(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to delete account.');
      }

      await signOut(getAuth());
      toast({
        title: isFrench ? 'Compte supprimé' : 'Account deleted',
        description: isFrench
          ? 'Votre compte et vos données ont été effacés. À bientôt !'
          : 'Your account and personal data have been removed.',
      });
      router.push('/login?accountDeleted=1');
    } catch (error: any) {
      setDeleteError(error.message ?? 'Unable to delete account.');
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
          <p className="text-muted-foreground">
            {isFrench 
              ? 'Gérez votre compte et vos préférences' 
              : 'Manage your account settings and preferences'}
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex w-full flex-nowrap gap-2 overflow-x-auto rounded-2xl border border-muted px-1 py-1 text-xs font-medium">
            {[["profile", User], ["security", Lock], ["preferences", Globe], ["notifications", Bell], ["account", Shield]].map(([value, Icon]) => (
              <TabsTrigger
                key={value}
                value={value as string}
                className="flex min-w-[110px] items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold uppercase text-slate-600 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Icon className="h-4 w-4" />
                <span>{translations.tabs[value as keyof typeof translations.tabs]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{isFrench ? 'Informations personnelles' : 'Personal Information'}</CardTitle>
                <CardDescription>{isFrench ? 'Mettez à jour vos informations' : 'Update your information'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isFrench ? 'Prénom' : 'First Name'}</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label>{isFrench ? 'Nom' : 'Last Name'}</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>{isFrench ? 'Téléphone' : 'Phone'}</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (isFrench ? 'Enregistrement...' : 'Saving...') : translations.saveButton}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {user && !user.emailVerified && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {isFrench ? 'Email non vérifié' : 'Email not verified'}
                  <Button variant="link" onClick={handleSendVerificationEmail}>
                    {isFrench ? 'Renvoyer' : 'Resend'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{isFrench ? 'Changer le mot de passe' : 'Change Password'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isFrench ? 'Mot de passe actuel' : 'Current Password'}</Label>
                  <div className="relative">
                    <Input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>{isFrench ? 'Nouveau mot de passe' : 'New Password'}</Label>
                  <div className="relative">
                    <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>{isFrench ? 'Confirmer' : 'Confirm'}</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? (isFrench ? 'Modification...' : 'Changing...') : (isFrench ? 'Changer' : 'Change')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isFrench ? 'Changer l\'email' : 'Change Email'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isFrench ? 'Nouvel email' : 'New Email'}</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div>
                  <Label>{isFrench ? 'Mot de passe' : 'Password'}</Label>
                  <Input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
                </div>
                <Button onClick={handleChangeEmail} disabled={isChangingEmail}>
                  {isChangingEmail ? (isFrench ? 'Modification...' : 'Changing...') : (isFrench ? 'Changer' : 'Change')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>{isFrench ? 'Préférences' : 'Preferences'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isFrench ? 'Devise' : 'Currency'}</Label>
                  <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="XOF">XOF (CFA)</SelectItem>
                      <SelectItem value="XAF">XAF (CFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isFrench ? 'Langue' : 'Language'}</Label>
                  <Select value={locale} onValueChange={setLocale}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="fr-CM">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSavePreferences} disabled={isSavingPreferences}>
                  {isSavingPreferences ? (isFrench ? 'Enregistrement...' : 'Saving...') : translations.saveButton}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isFrench ? 'Exporter' : 'Export'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportData} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {isFrench ? 'Exporter mes données' : 'Export My Data'}
                </Button>
              </CardContent>
            </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{isFrench ? 'Zone de danger' : 'Danger Zone'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {isFrench
                  ? 'La suppression est irréversible. Toutes vos données personnelles seront effacées.'
                  : 'Deletion is permanent. All your personal data will be removed.'}
                {' '}
                <Link href="/data-deletion" className="font-semibold underline">
                  {isFrench ? 'En savoir plus' : 'Learn more'}
                </Link>
              </p>
              <Button onClick={handleDeleteAccount} disabled={isDeletingAccount} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeletingAccount ? (isFrench ? 'Suppression...' : 'Deleting...') : (isFrench ? 'Supprimer' : 'Delete')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isFrench ? 'Confirmez la suppression' : 'Confirm account deletion'}
                </DialogTitle>
                <DialogDescription>
                  {isFrench
                    ? 'Tapez votre email ou le mot "SUPPRIMER" pour valider la suppression.'
                    : 'Type your email or the word "DELETE" to confirm.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Input
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder={isFrench ? 'Email ou mot-clé' : 'Email or keyword'}
                  aria-label={isFrench ? 'Champ de confirmation' : 'Confirmation input'}
                />
                <Input
                  type="password"
                  value={deletionPassword}
                  onChange={(event) => setDeletionPassword(event.target.value)}
                  placeholder={isFrench ? 'Mot de passe' : 'Password'}
                  aria-label={isFrench ? 'Mot de passe' : 'Password'}
                />
                {deleteError && (
                  <p className="text-sm text-destructive">{deleteError}</p>
                )}
              </div>
              <DialogFooter className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                  {isFrench ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount
                    ? (isFrench ? 'Suppression...' : 'Deleting...')
                    : (isFrench ? 'Confirmer' : 'Confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Tabs>
      </div>
    </AppLayout>
  );
}
