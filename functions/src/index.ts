// Entry point that re-exports all functions from individual modules
import * as debts from './debts';
import * as notifications from './notifications';
import * as affiliates from './affiliates';

// Re-export each named export so Firebase can discover them from lib/index.js
export = Object.assign({}, debts, notifications, affiliates);
