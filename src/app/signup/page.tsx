"use client";

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PasswordInput } from '@/components/ui/password-input';
import { CountrySelect } from '@/components/ui/country-select';
import { LanguageSelect } from '@/components/ui/language-select';
import { PhoneInput } from '@/components/ui/phone-input';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { useRouter } from 'next/navigation';
import { User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { buildPhoneCompositeKey } from '@/lib/phone';

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: 'FR', // Default to France
    gender: '',
    language: (typeof window !== 'undefined' ? localStorage.getItem('preferredLocale') : null) || 'fr', // Pre-fill from LanguageSwitcher
    phoneCountryCode: 'FR',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const markAsTouched = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const getFieldStatus = (field: string): 'idle' | 'valid' | 'invalid' => {
    if (!touched[field] && !formData[field as keyof typeof formData]) return 'idle';
    if (errors[field]) return 'invalid';
    if (formData[field as keyof typeof formData]) return 'valid';
    return 'idle';
  };

  const isStep1Valid = () => {
    return formData.firstName.trim().length >= 2 &&
           formData.lastName.trim().length >= 2 &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
           formData.password.length >= 6;
  };

  const isStep2Valid = () => {
    return formData.country &&
           formData.gender &&
           formData.language &&
           formData.phoneNumber.trim() &&
           formData.phoneNumber.replace(/\D/g, '').length >= 6;
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'Le prénom est requis';
        if (value.trim().length < 2) return 'Le prénom doit contenir au moins 2 caractères';
        return '';
      
      case 'lastName':
        if (!value.trim()) return 'Le nom est requis';
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
        return '';
      
      case 'email':
        if (!value.trim()) return 'L\'email est requis';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format d\'email invalide';
        return '';
      
      case 'password':
        if (!value) return 'Le mot de passe est requis';
        if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
        if (value.length < 8) return 'Recommandé: au moins 8 caractères';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Recommandé: majuscules, minuscules et chiffres';
        }
        return '';
      
      case 'country':
        if (!value) return 'Le pays est requis';
        return '';
      
      case 'gender':
        if (!value) return 'Le genre est requis';
        return '';
      
      case 'language':
        if (!value) return 'La langue est requise';
        return '';
      
      case 'phoneNumber':
        if (!value.trim()) return 'Le numéro de téléphone est requis';
        const digits = value.replace(/\D/g, '');
        if (digits.length < 6) return 'Le numéro semble incomplet';
        if (digits.length > 15) return 'Le numéro est trop long';
        return '';
      
      default:
        return '';
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark field as touched
    markAsTouched(field);
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const firstNameError = validateField('firstName', formData.firstName);
      const lastNameError = validateField('lastName', formData.lastName);
      const emailError = validateField('email', formData.email);
      const passwordError = validateField('password', formData.password);
      
      if (firstNameError) newErrors.firstName = firstNameError;
      if (lastNameError) newErrors.lastName = lastNameError;
      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;
    } else if (step === 2) {
      const countryError = validateField('country', formData.country);
      const genderError = validateField('gender', formData.gender);
      const languageError = validateField('language', formData.language);
      const phoneError = validateField('phoneNumber', formData.phoneNumber);
      
      if (countryError) newErrors.country = countryError;
      if (genderError) newErrors.gender = genderError;
      if (languageError) newErrors.language = languageError;
      if (phoneError) newErrors.phoneNumber = phoneError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { auth, firestore } = initializeFirebase();
      const phoneCompositeKey = buildPhoneCompositeKey(
        formData.phoneCountryCode,
        formData.phoneNumber
      );

      // Vérifier l'unicité email / téléphone avant création
      if (typeof fetch !== 'undefined') {
        const response = await fetch('/api/auth/check-identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            phoneCountryCode: formData.phoneCountryCode,
            phoneNumber: formData.phoneNumber,
          }),
        });

        if (!response.ok) {
          throw new Error('identity-check-failed');
        }

        const payload = await response.json();
        if (payload.emailExists) {
          setError(
            formData.language.startsWith('fr')
              ? 'Cet email est déjà associé à un compte existant.'
              : 'This email is already linked to an existing account.'
          );
          return;
        }
        if (payload.phoneExists) {
          setError(
            formData.language.startsWith('fr')
              ? 'Ce numéro de téléphone est déjà utilisé par un autre compte.'
              : 'This phone number is already used by another account.'
          );
          return;
        }
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Save additional user data to Firestore
      // Map language to locale format (e.g., 'fr' -> 'fr-CM', 'en' -> 'en-US')
      const localeMap: Record<string, string> = {
        'fr': 'fr-CM',
        'en': 'en-US',
        'fr-CM': 'fr-CM',
        'en-US': 'en-US'
      };
      const userLocale = localeMap[formData.language] || formData.language;

      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        country: formData.country,
        gender: formData.gender,
        language: formData.language,
        locale: userLocale,
        phoneCountryCode: formData.phoneCountryCode,
        phoneNumber: formData.phoneNumber,
        phoneCompositeKey,
        displayCurrency: 'XAF', // Default currency for Cameroon
        monthlyExpenseBudget: 0, // Will be set in onboarding
        hasCompletedOnboarding: false,
        hasCompletedTour: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      router.push('/onboarding');
    } catch (error: any) {
      if (error?.message === 'identity-check-failed') {
        setError(
          formData.language.startsWith('fr')
            ? 'Impossible de vérifier les informations. Veuillez réessayer.'
            : 'We could not verify your information. Please try again.'
        );
      } else if (error?.code === 'auth/email-already-in-use') {
        setError(
          formData.language.startsWith('fr')
            ? 'Cet email est déjà associé à un compte existant.'
            : 'This email is already linked to an existing account.'
        );
      } else {
        setError(error?.message || 'Une erreur est survenue.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher compact />
        </div>
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-xs sm:text-sm font-medium">Informations personnelles</span>
            </div>
            <div className={`w-12 sm:w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2 text-xs sm:text-sm font-medium">Préférences</span>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6 px-4 sm:px-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Créer votre compte
            </CardTitle>
            <CardDescription className="text-gray-600">
              {currentStep === 1 
                ? "Commençons par vos informations de base" 
                : "Personnalisez votre expérience"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 p-4 sm:p-6">
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Authentification sociale */}
                <SocialAuthButtons mode="signup" />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou créer un compte avec email
                    </span>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Prénom *
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Votre prénom"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        onBlur={() => markAsTouched('firstName')}
                        autoComplete="given-name"
                        className={`pl-10 pr-10 ${
                          getFieldStatus('firstName') === 'invalid' ? 'border-red-500' :
                          getFieldStatus('firstName') === 'valid' ? 'border-green-500' : ''
                        }`}
                      />
                      {getFieldStatus('firstName') === 'valid' && (
                        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {getFieldStatus('firstName') === 'invalid' && (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.firstName && touched.firstName && (
                      <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Nom *
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Votre nom"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        onBlur={() => markAsTouched('lastName')}
                        autoComplete="family-name"
                        className={`pl-10 pr-10 ${
                          getFieldStatus('lastName') === 'invalid' ? 'border-red-500' :
                          getFieldStatus('lastName') === 'valid' ? 'border-green-500' : ''
                        }`}
                      />
                      {getFieldStatus('lastName') === 'valid' && (
                        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {getFieldStatus('lastName') === 'invalid' && (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.lastName && touched.lastName && (
                      <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Adresse email *
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => markAsTouched('email')}
                      autoComplete="email"
                      className={`pl-10 pr-10 ${
                        getFieldStatus('email') === 'invalid' ? 'border-red-500' :
                        getFieldStatus('email') === 'valid' ? 'border-green-500' : ''
                      }`}
                    />
                    {getFieldStatus('email') === 'valid' && (
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {getFieldStatus('email') === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mot de passe *
                  </Label>
                  <div className="mt-1">
                    <PasswordInput
                      value={formData.password}
                      onChange={(value) => handleChange('password', value)}
                      onBlur={() => markAsTouched('password')}
                      error={touched.password ? errors.password : undefined}
                      placeholder="Créer un mot de passe sécurisé"
                      autoComplete="new-password"
                      showValidation={touched.password}
                      isValid={getFieldStatus('password') === 'valid'}
                    />
                  </div>
                </div>

                {/* Next Button */}
                <Button 
                  type="button"
                  onClick={handleNext}
                  disabled={!isStep1Valid()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Country */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Pays de résidence *
                  </Label>
                  <div className="mt-1">
                    <CountrySelect
                      value={formData.country}
                      onChange={(value) => {
                        handleChange('country', value);
                        markAsTouched('country');
                      }}
                      error={touched.country ? errors.country : undefined}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Genre *
                  </Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => {
                      handleChange('gender', value);
                      markAsTouched('gender');
                    }}
                    className="mt-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="flex items-center gap-2 text-sm">
                          ♂ Homme
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="flex items-center gap-2 text-sm">
                          ♀ Femme
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {errors.gender && touched.gender && (
                    <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
                  )}
                </div>

                {/* Language */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Langue préférée *
                  </Label>
                  <div className="mt-1">
                    <LanguageSelect
                      value={formData.language}
                      onChange={(value) => {
                        handleChange('language', value);
                        markAsTouched('language');
                      }}
                      error={touched.language ? errors.language : undefined}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Numéro de téléphone *
                  </Label>
                  <div className="mt-1 relative">
                    <PhoneInput
                      countryCode={formData.phoneCountryCode}
                      phoneNumber={formData.phoneNumber}
                      onCountryChange={(value) => handleChange('phoneCountryCode', value)}
                      onPhoneChange={(value) => {
                        handleChange('phoneNumber', value);
                        markAsTouched('phoneNumber');
                      }}
                      error={touched.phoneNumber ? errors.phoneNumber : undefined}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-full sm:flex-1"
                  >
                    Retour
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !isStep2Valid()}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Création...
                      </div>
                    ) : (
                      'Créer le compte'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
