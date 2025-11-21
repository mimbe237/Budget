'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, initializeFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail, LogOut } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, userProfile } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is already active
    if (userProfile?.status === 'active') {
      router.push('/dashboard');
    }
  }, [userProfile, router]);

  const handleLogout = async () => {
    if (user) {
      const { auth } = initializeFirebase();
      await signOut(auth);
      router.push('/login');
    }
  };

  const isFrench = userProfile?.locale === 'fr-CM';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl">
            {isFrench ? 'Compte en attente de validation' : 'Account Pending Approval'}
          </CardTitle>
          <CardDescription>
            {isFrench 
              ? 'Votre inscription a été enregistrée avec succès' 
              : 'Your registration has been submitted successfully'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              {isFrench 
                ? 'Un administrateur doit approuver votre compte avant que vous puissiez vous connecter. Vous recevrez un email une fois votre compte activé.' 
                : 'An administrator must approve your account before you can sign in. You will receive an email once your account is activated.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>{isFrench ? 'Email inscrit :' : 'Registered email:'}</strong> {user?.email}
            </p>
            <p>
              {isFrench 
                ? 'Ce processus peut prendre jusqu\'à 24-48 heures. Si vous n\'avez pas reçu de réponse après ce délai, veuillez contacter le support.' 
                : 'This process may take up to 24-48 hours. If you haven\'t received a response after this time, please contact support.'}
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">{isFrench ? 'Besoin d\'aide ?' : 'Need help?'}</p>
            <p>
              {isFrench ? 'Contact : ' : 'Contact: '}
              <a href="mailto:contact@beonweb.cm" className="text-primary hover:underline">
                contact@beonweb.cm
              </a>
            </p>
            <p>
              {isFrench ? 'ou : ' : 'or: '}
              <a href="mailto:businessclubleader7@gmail.com" className="text-primary hover:underline">
                businessclubleader7@gmail.com
              </a>
            </p>
          </div>

          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            {isFrench ? 'Se déconnecter' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
