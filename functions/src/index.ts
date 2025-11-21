// Entry point that re-exports all functions from individual modules
import * as admin from 'firebase-admin';

// Initialize Firebase Admin once at the top level
admin.initializeApp();

import * as debts from './debts';
import * as notifications from './notifications';
import * as affiliates from './affiliates';
import * as auth from './auth';

// Re-export each named export so Firebase can discover them from lib/index.js
export = Object.assign({}, debts, notifications, affiliates, auth);
