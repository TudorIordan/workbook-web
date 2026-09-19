import { useEffect, useRef } from 'react';

interface WakeLockSentinel {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const nav = navigator as unknown as { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } };
    if (!active || !nav.wakeLock) return;

    let cancelled = false;
    async function acquire() {
      try {
        const sentinel = await nav.wakeLock!.request('screen');
        if (cancelled) { void sentinel.release(); return; }
        sentinelRef.current = sentinel;
      } catch { /* denied or unsupported — no-op */ }
    }
    void acquire();

    function onVisible() {
      if (document.visibilityState === 'visible' && !sentinelRef.current) void acquire();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      const s = sentinelRef.current;
      sentinelRef.current = null;
      if (s && !s.released) void s.release();
    };
  }, [active]);
}
