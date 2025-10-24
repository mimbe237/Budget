// Flat ESLint configuration for Next.js 15
import nextConfig from 'eslint-config-next';

// Ensure we always spread an array of configs
const nextArray = Array.isArray(nextConfig) ? nextConfig : [nextConfig];

export default [
  ...nextArray,
  {
    ignores: ['.next/**', 'node_modules/**', 'functions/**', 'tests/**', 'e2e/**'],
    rules: {
      // Relax some strict rules to avoid blocking CI on non-critical patterns
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
];
