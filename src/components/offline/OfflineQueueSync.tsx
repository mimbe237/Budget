"use client";

import { useEffect } from 'react';
import { syncQueue } from '@/lib/offline-queue';

export function OfflineQueueSync() {
  useEffect(() => {
    // Try to sync at mount and then rely on 'online' listener in module
    syncQueue().catch(() => {});
  }, []);
  return null;
}
