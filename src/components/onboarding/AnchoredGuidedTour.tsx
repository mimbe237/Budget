'use client';

import { useState, useCallback } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS, type CallBackProps, type Step } from '@/lib/joyride';
import { useTranslation } from '@/lib/i18n';

interface AnchoredGuidedTourProps {
  run: boolean;
  onFinish: () => void;
  onClose: () => void;
}

export function AnchoredGuidedTour({ run, onFinish, onClose }: AnchoredGuidedTourProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: '[data-tour="summary-cards"]',
      content: t('tour.dashboard.content'),
      title: t('tour.dashboard.title'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="spending-overview"]',
      content: t('tour.transactions.content'),
      title: t('tour.transactions.title'),
      placement: 'top',
    },
    {
      target: '[data-tour="budget-overview"]',
      content: t('tour.budgets.content'),
      title: t('tour.budgets.title'),
      placement: 'left',
    },
    {
      target: '[data-tour="goals-overview"]',
      content: t('tour.goals.content'),
      title: t('tour.goals.title'),
      placement: 'top',
    },
    {
      target: '[data-tour="nav-reports"]',
      content: t('tour.reports.content'),
      title: t('tour.reports.title'),
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
        onFinish();
      } else if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.NEXT) {
          setStepIndex(index + 1);
        } else if (action === ACTIONS.PREV) {
          setStepIndex(index - 1);
        }
      } else if (action === ACTIONS.CLOSE) {
        onClose();
      }
    },
    [onFinish, onClose]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#10b981', // emerald-500
          textColor: '#1f2937', // gray-800
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#10b981',
          borderRadius: 8,
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#9ca3af',
        },
      }}
      locale={{
        back: t('common.back'),
        close: t('common.close'),
        last: t('common.finish'),
        next: t('common.next'),
        skip: t('onboarding.skipTour'),
      }}
    />
  );
}
