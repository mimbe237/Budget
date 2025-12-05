"use client";
import { useState, useEffect } from 'react';
import { Settings, Save, Phone, Globe, Mail, CheckCircle, XCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppSettings {
  whatsappNumber: string;
  supportEmail: string;
  websiteUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    whatsappNumber: '+237612345678',
    supportEmail: 'support@budgetpro.app',
    websiteUrl: 'https://www.beonweb.cm',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'appSettings', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      showMessage('error', 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateWhatsApp(settings.whatsappNumber)) {
      showMessage('error', 'Format WhatsApp invalide. Utilisez le format international : +XXX...');
      return;
    }

    if (!validateEmail(settings.supportEmail)) {
      showMessage('error', 'Email invalide');
      return;
    }

    if (!validateUrl(settings.websiteUrl)) {
      showMessage('error', 'URL invalide');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'appSettings', 'global');
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin', // Vous pouvez remplacer par l'email de l'admin connecté
      });
      
      showMessage('success', 'Paramètres enregistrés avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const validateWhatsApp = (number: string): boolean => {
    // Format international : +XXX suivi de 6 à 15 chiffres
    const regex = /^\+\d{1,3}\d{6,15}$/;
    return regex.test(number.replace(/\s/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatWhatsAppPreview = (number: string): string => {
    return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] p-3 shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres Globaux</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configuration des contacts et informations de l'application
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(62,99,221,0.25)] transition hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Message de feedback */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-6">
          {/* WhatsApp */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Contact WhatsApp</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Numéro au format international (ex: +237612345678)
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Numéro WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+237612345678"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {settings.whatsappNumber && validateWhatsApp(settings.whatsappNumber) && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <p className="mb-1 text-xs font-medium text-green-700 dark:text-green-300">
                    Aperçu du lien généré :
                  </p>
                  <code className="block break-all text-xs text-green-600 dark:text-green-400">
                    {formatWhatsAppPreview(settings.whatsappNumber)}
                  </code>
                </div>
              )}
              
              {settings.whatsappNumber && !validateWhatsApp(settings.whatsappNumber) && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ Format invalide. Le numéro doit commencer par + suivi du code pays et du numéro (sans espaces)
                </p>
              )}
            </div>
          </div>

          {/* Email Support */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Email Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adresse email pour le support utilisateur
                </p>
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="support@budgetpro.app"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Site Web */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Site Web</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  URL du site web de l'entreprise
                </p>
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL
              </label>
              <input
                type="url"
                value={settings.websiteUrl}
                onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                placeholder="https://www.beonweb.cm"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Info de dernière mise à jour */}
          {settings.updatedAt && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Dernière mise à jour : {new Date(settings.updatedAt).toLocaleString('fr-FR')}
                {settings.updatedBy && ` par ${settings.updatedBy}`}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="mb-3 font-semibold text-blue-900 dark:text-blue-300">
            📖 Instructions
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex gap-2">
              <span>•</span>
              <span>
                <strong>WhatsApp :</strong> Le numéro doit être au format international (+code pays + numéro). 
                Exemple : +237612345678 pour le Cameroun
              </span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>
                Ces paramètres sont utilisés dans l'application Flutter (écrans Support et Auth)
              </span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>
                Après modification, les utilisateurs verront les nouveaux contacts immédiatement
              </span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>
                N'oubliez pas de cliquer sur "Enregistrer" pour sauvegarder les modifications
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
