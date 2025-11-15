'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format d\'email invalide';
    return '';
  };

  const emailError = touched ? validateEmail(email) : '';
  const isValid = !validateEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched(true);
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { auth } = initializeFirebase();
      
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setSuccess(true);
      setEmail('');
      setTouched(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Messages d'erreur personnalisés
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Aucun compte n\'est associé à cet email.');
          break;
        case 'auth/invalid-email':
          setError('L\'adresse email est invalide.');
          break;
        case 'auth/too-many-requests':
          setError('Trop de tentatives. Veuillez réessayer plus tard.');
          break;
        default:
          setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Back to Login Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Réinitialiser le mot de passe
            </CardTitle>
            <CardDescription className="text-gray-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 ml-2">
                  <strong className="font-semibold">Email envoyé !</strong>
                  <p className="mt-2 text-sm">
                    Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
                  </p>
                  <p className="mt-2 text-sm text-green-700">
                    Pensez à vérifier vos spams si vous ne voyez pas l'email.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Adresse email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      autoComplete="email"
                      autoFocus
                      className={`pl-10 pr-10 ${
                        touched && emailError ? 'border-red-500' :
                        touched && isValid ? 'border-green-500' : ''
                      }`}
                      disabled={isLoading}
                    />
                    {touched && isValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {touched && emailError && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {touched && emailError && (
                    <p className="mt-1 text-xs text-red-600">{emailError}</p>
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2 text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !isValid}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi en cours...
                    </div>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </Button>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong className="font-semibold">Note :</strong> Le lien de réinitialisation expirera après 1 heure pour des raisons de sécurité.
                  </p>
                </div>
              </form>
            )}

            {/* Footer Links */}
            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Autres options
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 text-center text-sm">
                <Link 
                  href="/login" 
                  className="flex-1 text-blue-600 hover:text-blue-500 font-medium"
                >
                  Se connecter
                </Link>
                <span className="hidden sm:inline text-gray-300">|</span>
                <Link 
                  href="/signup" 
                  className="flex-1 text-blue-600 hover:text-blue-500 font-medium"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide ?{' '}
            <a 
              href="mailto:support@budgetpro.cm" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
