'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/use-notifications';
import { Bell, BellOff, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type NotificationToggleButtonProps = {
  id: string;
  isActive: boolean;
  labelOn: string;
  labelOff: string;
  onToggle: () => void;
};

function NotificationToggleButton({
  id,
  isActive,
  labelOn,
  labelOff,
  onToggle,
}: NotificationToggleButtonProps) {
  return (
    <Button
      id={id}
      onClick={onToggle}
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      className="min-w-[120px] text-sm"
      aria-pressed={isActive}
    >
      {isActive ? (
        <CheckCircle className="mr-2 h-4 w-4" />
      ) : (
        <BellOff className="mr-2 h-4 w-4" />
      )}
      {isActive ? labelOn : labelOff}
    </Button>
  );
}

export function NotificationSettings() {
  const { permission, fcmToken, error, requestPermission, isSupported } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState({
    budgetExceeded: true,
    goalAchieved: true,
    largeTransaction: true,
    weeklyReport: true,
    monthlyReport: true,
  });
  const toggleLabels = {
    on: 'Activé',
    off: 'Désactivé',
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotificationType = (type: keyof typeof notificationTypes) => {
    setNotificationTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    // TODO: Sauvegarder les préférences dans Firestore
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications non supportées
          </CardTitle>
          <CardDescription>
            Votre navigateur ne supporte pas les notifications push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Recevez des alertes importantes sur vos finances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statut des permissions */}
        {permission === 'default' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Activez les notifications pour recevoir des alertes sur vos budgets, objectifs et transactions importantes.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'granted' && fcmToken && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Les notifications sont activées. Vous recevrez des alertes importantes.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Bouton d'activation */}
        {permission !== 'granted' && (
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === 'denied'}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Activation...
                </div>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Activer les notifications
                </>
              )}
            </Button>
          </div>
        )}

        {/* Préférences de notification */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Types de notifications</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="budget-exceeded">Budget dépassé</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertes quand vous dépassez un budget
                    </p>
                  </div>
                  <NotificationToggleButton
                    id="budget-exceeded"
                    isActive={notificationTypes.budgetExceeded}
                    labelOn={toggleLabels.on}
                    labelOff={toggleLabels.off}
                    onToggle={() => handleToggleNotificationType('budgetExceeded')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="goal-achieved">Objectif atteint</Label>
                    <p className="text-sm text-muted-foreground">
                      Célébrez vos réussites financières
                    </p>
                  </div>
                  <NotificationToggleButton
                    id="goal-achieved"
                    isActive={notificationTypes.goalAchieved}
                    labelOn={toggleLabels.on}
                    labelOff={toggleLabels.off}
                    onToggle={() => handleToggleNotificationType('goalAchieved')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="large-transaction">Transaction importante</Label>
                    <p className="text-sm text-muted-foreground">
                      Dépenses supérieures à 100€
                    </p>
                  </div>
                  <NotificationToggleButton
                    id="large-transaction"
                    isActive={notificationTypes.largeTransaction}
                    labelOn={toggleLabels.on}
                    labelOff={toggleLabels.off}
                    onToggle={() => handleToggleNotificationType('largeTransaction')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-report">Rapport hebdomadaire</Label>
                    <p className="text-sm text-muted-foreground">
                      Résumé de vos dépenses chaque semaine
                    </p>
                  </div>
                  <NotificationToggleButton
                    id="weekly-report"
                    isActive={notificationTypes.weeklyReport}
                    labelOn={toggleLabels.on}
                    labelOff={toggleLabels.off}
                    onToggle={() => handleToggleNotificationType('weeklyReport')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monthly-report">Rapport mensuel</Label>
                    <p className="text-sm text-muted-foreground">
                      Analyse complète en fin de mois
                    </p>
                  </div>
                  <NotificationToggleButton
                    id="monthly-report"
                    isActive={notificationTypes.monthlyReport}
                    labelOn={toggleLabels.on}
                    labelOff={toggleLabels.off}
                    onToggle={() => handleToggleNotificationType('monthlyReport')}
                  />
                </div>
              </div>
            </div>

            {/* Info technique */}
            {fcmToken && (
              <div className="border-t pt-4">
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Informations techniques
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded font-mono break-all">
                    Token: {fcmToken.substring(0, 50)}...
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
