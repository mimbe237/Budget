"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Affiliate {
  id: string;
  userId: string;
  affiliateCode: string;
  status: "PENDING" | "APPROVED" | "BLOCKED" | "SUSPENDED";
  tier: "BASIC" | "PRO" | "VIP";
  payoutMethod?: "SEPA" | "PAYPAL" | "MOBILE_MONEY";
  payoutDetails?: any;
  promotionChannels?: string;
}

export default function AffiliateProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const affiliatesRef = collection(db, "affiliates");
      const q = query(affiliatesRef, where("userId", "==", user!.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        router.push("/affiliates");
        return;
      }

      const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as Affiliate;
      setAffiliate(data);

      // Pré-remplir le formulaire
      setFormData({
        payoutMethod: (data.payoutMethod as any) || "SEPA",
        bankName: data.payoutDetails?.bankName || "",
        iban: data.payoutDetails?.iban || "",
        paypalEmail: data.payoutDetails?.paypalEmail || "",
        mobileOperator: data.payoutDetails?.mobileOperator || "",
        mobileNumber: data.payoutDetails?.mobileNumber || "",
        promotionChannels: data.promotionChannels || "",
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Impossible de charger votre profil affilié");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!affiliate) return;

    // Validation minimale
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
      setSaving(true);
      setError(null);
      setSuccess(false);

      const ref = doc(db, "affiliates", affiliate.id);
      await updateDoc(ref, {
        payoutMethod: formData.payoutMethod,
        payoutDetails: {
          bankName: formData.bankName || null,
          iban: formData.iban || null,
          paypalEmail: formData.paypalEmail || null,
          mobileOperator: formData.mobileOperator || null,
          mobileNumber: formData.mobileNumber || null,
        },
        promotionChannels: formData.promotionChannels || null,
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Erreur lors de l'enregistrement de vos informations");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Compte affilié non trouvé</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil affilié</CardTitle>
          <CardDescription>
            Mettez à jour vos informations et votre méthode de paiement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Modifications enregistrées</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {/* Méthode de paiement */}
              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <Select
                  value={formData.payoutMethod}
                  onValueChange={(value: any) => setFormData({ ...formData, payoutMethod: value })}
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
                    <Label htmlFor="bankName">Nom de la banque</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Ex: Société Générale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    />
                  </div>
                </>
              )}

              {/* Détails PayPal */}
              {formData.payoutMethod === "PAYPAL" && (
                <div className="space-y-2">
                  <Label htmlFor="paypalEmail">Email PayPal</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                    placeholder="vous@email.com"
                  />
                </div>
              )}

              {/* Détails Mobile Money */}
              {formData.payoutMethod === "MOBILE_MONEY" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mobileOperator">Opérateur</Label>
                    <Select
                      value={formData.mobileOperator}
                      onValueChange={(value) => setFormData({ ...formData, mobileOperator: value })}
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
                    <Label htmlFor="mobileNumber">Numéro de téléphone</Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </>
              )}

              {/* Canaux de promotion */}
              <div className="space-y-2">
                <Label htmlFor="promotionChannels">Vos canaux de promotion</Label>
                <Textarea
                  id="promotionChannels"
                  value={formData.promotionChannels}
                  onChange={(e) => setFormData({ ...formData, promotionChannels: e.target.value })}
                  placeholder="Ex: blog, réseaux sociaux, newsletter, YouTube, etc."
                  rows={4}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
