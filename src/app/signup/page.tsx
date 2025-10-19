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
import { useRouter } from 'next/navigation';
import { User, Mail, CheckCircle2 } from 'lucide-react';

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
    language: 'fr', // Default to French
    phoneCountryCode: 'FR',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Le prénom est requis';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Le nom est requis';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
    } else if (step === 2) {
      if (!formData.country) {
        newErrors.country = 'Le pays est requis';
      }
      if (!formData.gender) {
        newErrors.gender = 'Le genre est requis';
      }
      if (!formData.language) {
        newErrors.language = 'La langue est requise';
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Le numéro de téléphone est requis';
      }
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
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Save additional user data to Firestore
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        country: formData.country,
        gender: formData.gender,
        language: formData.language,
        phoneCountryCode: formData.phoneCountryCode,
        phoneNumber: formData.phoneNumber,
        createdAt: new Date()
      });

      router.push('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Informations personnelles</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Préférences</span>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
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
          
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
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
                        className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.firstName && (
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
                        className={`pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.lastName && (
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
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
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
                      error={errors.password}
                      placeholder="Créer un mot de passe sécurisé"
                    />
                  </div>
                </div>

                {/* Next Button */}
                <Button 
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
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
                      onChange={(value) => handleChange('country', value)}
                      error={errors.country}
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
                    onValueChange={(value) => handleChange('gender', value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="flex items-center gap-2 text-sm">
                          ♂ Homme
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="flex items-center gap-2 text-sm">
                          ♀ Femme
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {errors.gender && (
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
                      onChange={(value) => handleChange('language', value)}
                      error={errors.language}
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
                      onPhoneChange={(value) => handleChange('phoneNumber', value)}
                      error={errors.phoneNumber}
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
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    disabled={isLoading}
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
            <button
              onClick={() => router.push('/login')}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
