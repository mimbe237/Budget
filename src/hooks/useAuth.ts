'use client';

import { useUser } from '@/firebase';

type UseAuthResult = {
  user: ReturnType<typeof useUser>['user'];
  loading: boolean;
};

export function useAuth(): UseAuthResult {
  const { user, isUserLoading } = useUser();
  return { user, loading: isUserLoading };
}
