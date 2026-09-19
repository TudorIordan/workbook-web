import { useState } from 'react';
import { usePwaInstall } from '../app/usePwaInstall';

export function InstallPrompt({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { canInstall, iosHint, install } = usePwaInstall();
  const [showIosSheet, setShowIosSheet] = useState(false);

  if (!canInstall && !iosHint) return null;

  const fg = tone === 'dark' ? '#f2ece1' : 'var(--wb-ink)';
  const bg = tone === 'dark' ? 'rgba(247,242,232,.09)' : 'rgba(var(--wb-ink-rgb),.05)';

  return (
    <>
      <button
        onClick={() => (canInstall ? void install() : setShowIosSheet(true))}
        style={{
          border: 'none', background: bg, color: fg, fontWeight: 700, fontSize: 13,
          padding: '11px 16px', borderRadius: 999, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, width: '100%',
        }}
      >
        Install app
      </button>

      {showIosSheet && (
        <div
          onClick={() => setShowIosSheet(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', background: 'var(--wb-surf)', color: 'var(--wb-ink)', borderRadius: '26px 26px 0 0', padding: '20px 22px max(20px, env(safe-area-inset-bottom))' }}
          >
            <div className="display" style={{ fontSize: 20, marginBottom: 10 }}>Add to Home Screen</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.8 }}>
              Tap the Share icon in Safari's toolbar, then choose "Add to Home Screen" to install Workbook.
            </div>
            <button
              onClick={() => setShowIosSheet(false)}
              style={{ marginTop: 16, border: 'none', background: 'var(--wb-sel)', color: 'var(--wb-sel-fg)', fontWeight: 700, fontSize: 14, padding: 13, borderRadius: 999, width: '100%' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
