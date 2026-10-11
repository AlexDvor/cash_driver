import { useCallback, useEffect, useRef } from 'react';

// Invalidate stale responses immediately, but combine notifications in the same
// turn into one read. Changing query/service or unmounting cancels queued work.
export function useCoalescedRefresh(
  refresh: () => Promise<void>,
  invalidate: () => boolean,
) {
  const scheduled = useRef<(() => Promise<void>) | null>(null);
  useEffect(
    () => () => {
      scheduled.current = null;
    },
    [refresh],
  );
  return useCallback(() => {
    if (!invalidate() || scheduled.current === refresh) {
      return;
    }
    scheduled.current = refresh;
    Promise.resolve().then(() => {
      if (scheduled.current === refresh) {
        scheduled.current = null;
        refresh();
      }
    });
  }, [refresh, invalidate]);
}
