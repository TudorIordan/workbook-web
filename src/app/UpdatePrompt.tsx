import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLiveStore } from '../store/live';

export function UpdatePrompt() {
  const live = useLiveStore((s) => s.live);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh || live) return null;

  return (
    <div
      style={{
        position: 'fixed', left: 12, right: 12, zIndex: 50, maxWidth: 420, margin: '0 auto',
        bottom: 'max(14px, calc(env(safe-area-inset-bottom) + 14px))',
        padding: '12px 12px 12px 16px', borderRadius: 22, background: 'var(--wb-inv)', color: '#f2ece1',
        boxShadow: '0 14px 30px rgba(var(--wb-shad-rgb),.3)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Update ready</div>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{ border: 'none', background: 'transparent', color: 'rgba(242,236,225,.7)', fontWeight: 700, fontSize: 13, padding: 8 }}
      >
        Later
      </button>
      <button
        onClick={() => void updateServiceWorker(true)}
        style={{ border: 'none', background: 'var(--wb-brick)', color: '#f2ece1', fontWeight: 700, fontSize: 13, padding: '10px 16px', borderRadius: 999 }}
      >
        Reload
      </button>
    </div>
  );
}
