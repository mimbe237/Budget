'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, initiateEmailSignUp, setDocumentNonBlocking } from '@/firebase';
import { useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { Logo } from '@/components/logo';
import type { UserProfile } from '@/lib/types';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const userProfile: Partial<UserProfile> = {
        firstName,
        lastName,
        email: user.email,
        id: user.uid,
        displayCurrency: 'USD',
        locale: 'en-US'
      };
      setDocumentNonBlocking(userRef, userProfile, { merge: true });
      router.push('/');
    }
  }, [user, isUserLoading, router, firestore, firstName, lastName]);

  const handleSignUp = () => {
    initiateEmailSignUp(auth, email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
           <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input 
                id="first-name" 
                placeholder="Max"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input 
                id="last-name" 
                placeholder="Robinson"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col'>
          <Button type="submit" className="w-full" onClick={handleSignUp}>
            Create an account
          </Button>
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
