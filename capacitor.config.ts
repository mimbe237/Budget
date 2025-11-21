import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.touchpointinsights.budget',
  appName: 'Budget Pro',
  webDir: 'out',
  server: {
    // Pour le développement local
    // url: 'http://localhost:9002',
    // cleartext: true,
    
    // Pour la production, pointer vers Firebase Hosting
    url: 'https://studio-3821270625-cd276.web.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#1F2937',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FFFFFF',
    },
  },
};

export default config;
