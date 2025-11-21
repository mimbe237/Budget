'use client';

interface ReportFooterProps {
  userProfile: any;
  generatedAt: Date;
  isFrench: boolean;
}

export function ReportFooter({ userProfile, generatedAt, isFrench }: ReportFooterProps) {
  const translations = {
    generatedOn: isFrench ? 'Généré le' : 'Generated on',
    user: isFrench ? 'Utilisateur' : 'User', 
    currency: isFrench ? 'Devise' : 'Currency',
    at: isFrench ? 'à' : 'at',
  };

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString(isFrench ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} ${translations.at} ${timeStr}`;
  };

  return (
    <div className="mt-12 pt-6 border-t border-gray-200 text-center print:mt-8">
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          {translations.generatedOn} {formatDateTime(generatedAt)}
        </p>
        <p>
          {translations.user}: {userProfile?.firstName} {userProfile?.lastName || userProfile?.email}
        </p>
        <p>
          {translations.currency}: {userProfile?.displayCurrency || 'USD'}
        </p>
      </div>
    </div>
  );
}