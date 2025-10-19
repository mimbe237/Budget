'use client';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDoc, useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { Currency, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = user ? doc(firestore, `users/${user.uid}`) : null;
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const [displayCurrency, setDisplayCurrency] = useState<Currency | undefined>(undefined);
  const [locale, setLocale] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (userProfile) {
      setDisplayCurrency(userProfile.displayCurrency || 'USD');
      setLocale(userProfile.locale || 'en-US');
    }
  }, [userProfile]);

  const handleSaveChanges = () => {
    if (!userProfileRef) return;

    updateDocumentNonBlocking(userProfileRef, {
        displayCurrency,
        locale
    });
    
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated.',
    });
  };

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="currency">Display Currency</Label>
                <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                  <SelectTrigger id="currency" className="w-[180px]">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="XOF">XOF (CFA)</SelectItem>
                    <SelectItem value="XAF">XAF (CFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locale">Language</Label>
                 <Select value={locale} onValueChange={(v) => setLocale(v as string)}>
                  <SelectTrigger id="locale" className="w-[180px]">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="fr-CM">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <Button onClick={handleSaveChanges} className="w-fit">Save Changes</Button>
            </>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
