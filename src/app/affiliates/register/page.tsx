"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function AffiliateRegister() {
  const { user } = useUser();
  const functions = getFunctions();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    payoutMethod: "SEPA" as "SEPA" | "PAYPAL" | "MOBILE_MONEY",
    bankName: "",
    iban: "",
    paypalEmail: "",
    mobileOperator: "",
    mobileNumber: "",
    promotionChannels: "",
    agreedToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Vous devez être connecté pour créer un compte affilié");
      return;
    }

    if (!formData.agreedToTerms) {
      setError("Vous devez accepter les conditions générales");
      return;
    }

    // Validation selon la méthode de paiement
    if (formData.payoutMethod === "SEPA" && (!formData.bankName || !formData.iban)) {
      setError("Veuillez renseigner votre banque et IBAN");
      return;
    }

    if (formData.payoutMethod === "PAYPAL" && !formData.paypalEmail) {
      setError("Veuillez renseigner votre email PayPal");
      return;
    }

    if (formData.payoutMethod === "MOBILE_MONEY" && (!formData.mobileOperator || !formData.mobileNumber)) {
      setError("Veuillez renseigner votre opérateur et numéro mobile");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const createAffiliate = httpsCallable(functions, "createAffiliate");
      const result = await createAffiliate({
        userId: user.uid,
        payoutMethod: formData.payoutMethod,
        payoutDetails: {
          bankName: formData.bankName || undefined,
          iban: formData.iban || undefined,
          paypalEmail: formData.paypalEmail || undefined,
          mobileOperator: formData.mobileOperator || undefined,
          mobileNumber: formData.mobileNumber || undefined,
        },
        promotionChannels: formData.promotionChannels,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/affiliates");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating affiliate:", err);
      setError(err.message || "Erreur lors de la création du compte affilié");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 />
              Demande envoyée !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Votre demande d'affiliation a été soumise avec succès. Notre équipe va l'examiner dans les 24 à 48 heures.
                Vous recevrez un email dès que votre compte sera approuvé.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Devenir affilié Budget Pro</CardTitle>
          <CardDescription>
            Remplissez ce formulaire pour rejoindre notre programme d'affiliation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Méthode de paiement */}
            <div className="space-y-2">
              <Label htmlFor="payoutMethod">Méthode de paiement préférée *</Label>
              <Select
                value={formData.payoutMethod}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, payoutMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPA">Virement SEPA (Europe)</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money (MTN/Orange)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Détails SEPA */}
            {formData.payoutMethod === "SEPA" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nom de la banque *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Ex: Société Générale"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    required
                  />
                </div>
              </>
            )}

            {/* Détails PayPal */}
            {formData.payoutMethod === "PAYPAL" && (
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">Email PayPal *</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={formData.paypalEmail}
                  onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            )}

            {/* Détails Mobile Money */}
            {formData.payoutMethod === "MOBILE_MONEY" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobileOperator">Opérateur *</Label>
                  <Select
                    value={formData.mobileOperator}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mobileOperator: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                      <SelectItem value="ORANGE">Orange Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Numéro de téléphone *</Label>
                  <Input
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                </div>
              </>
            )}

            {/* Canaux de promotion */}
            <div className="space-y-2">
              <Label htmlFor="promotionChannels">Comment comptez-vous promouvoir Budget Pro ?</Label>
              <Textarea
                id="promotionChannels"
                value={formData.promotionChannels}
                onChange={(e) => setFormData({ ...formData, promotionChannels: e.target.value })}
                placeholder="Ex: blog, réseaux sociaux, newsletter, YouTube, etc."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Facultatif, mais nous aide à mieux comprendre votre profil
              </p>
            </div>

            {/* Conditions générales */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreedToTerms: checked as boolean })
                }
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                J'accepte les{" "}
                <a href="/terms" target="_blank" className="text-primary underline">
                  conditions générales
                </a>{" "}
                du programme d'affiliation et j'atteste que les informations fournies sont exactes.
              </Label>
            </div>

            {/* Informations programme */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <h4 className="font-semibold">Ce que vous obtenez :</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Commissions de 15% à 25% selon votre performance</li>
                <li>✓ Bonus à l'inscription pour chaque nouveau client</li>
                <li>✓ Commissions récurrentes jusqu'à 12 mois</li>
                <li>✓ Paiements mensuels automatiques (seuil minimum 20 000 XAF)</li>
                <li>✓ Tableau de bord en temps réel</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Soumettre ma demande"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
