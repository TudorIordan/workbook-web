import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { InstallPrompt } from '../components/InstallPrompt';
import { usePwaInstall } from '../app/usePwaInstall';
import { useSettingsStore } from '../store/settings';
import { repo } from '../data/repo';
import { mmss } from '../domain/metrics';
import type { ThemePref, WeightUnit } from '../domain/types';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, borderRadius: 26, background: 'var(--wb-surf)', boxShadow: '0 1px 2px rgba(var(--wb-shad-rgb),.1)' }}>
      <div className="display" style={{ fontSize: 18, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 46, height: 27, borderRadius: 999, padding: 3, cursor: 'pointer',
        background: on ? 'var(--wb-green)' : 'rgba(var(--wb-ink-rgb),.2)', transition: 'background .18s ease',
      }}
    >
      <div style={{
        width: 21, height: 21, borderRadius: '50%', background: '#fbf7ef',
        boxShadow: '0 1px 2px rgba(43,38,28,.35)', transform: `translateX(${on ? 20 : 0}px)`,
        transition: 'transform .18s cubic-bezier(.2,.8,.2,1)',
      }} />
    </div>
  );
}

export function SettingsScreen() {
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const patch = useSettingsStore((s) => s.patch);
  const { canInstall, iosHint } = usePwaInstall();

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'var(--wb-bg)', color: 'var(--wb-ink)', display: 'flex', flexDirection: 'column', animation: 'wbFade .18s ease' }}>
      <div style={{ padding: 'max(14px, env(safe-area-inset-top)) 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(var(--wb-ink-rgb),.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={18} style={{ strokeWidth: 2.2 } as never} />
        </button>
        <div className="display" style={{ fontSize: 24 }}>Settings</div>
      </div>

      <div className="wbScroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 44px', display: 'flex', flexDirection: 'column', gap: 13, maxWidth: 620, margin: '0 auto', width: '100%' }}>
        <Card title="Units">
          {(['kg', 'lb'] as WeightUnit[]).map((u) => {
            const selected = settings.unit === u;
            return (
              <div
                key={u}
                onClick={() => patch({ unit: u })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 20, cursor: 'pointer',
                  background: selected ? 'var(--wb-green-tint)' : 'transparent', marginBottom: 6,
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flex: 'none',
                  boxShadow: selected ? 'none' : 'inset 0 0 0 1.5px rgba(var(--wb-ink-rgb),.28)',
                  background: selected ? 'var(--wb-green)' : 'transparent',
                }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>{u === 'kg' ? 'Metric — kilograms · kilometres · metres' : 'Imperial — pounds · miles · yards'}</div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>Sets are stored in metric and converted for display, so switching never rewrites history.</div>
        </Card>

        {(canInstall || iosHint) && (
          <Card title="App">
            <InstallPrompt />
          </Card>
        )}

        <Card title="Theme">
          <div style={{ display: 'flex', gap: 7 }}>
            {(['light', 'dark', 'auto'] as ThemePref[]).map((t) => {
              const selected = settings.theme === t;
              return (
                <button
                  key={t}
                  onClick={() => patch({ theme: t })}
                  style={{
                    flex: 1, padding: '12px 6px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 13,
                    background: selected ? 'var(--wb-sel)' : 'rgba(var(--wb-ink-rgb),.06)',
                    color: selected ? 'var(--wb-sel-fg)' : 'rgba(var(--wb-ink-rgb),.62)', textTransform: 'capitalize',
                  }}
                >
                  {t === 'auto' ? 'System' : t}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Rest timer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Enable rest timer</div>
            <Switch on={settings.restEnabled} onToggle={() => patch({ restEnabled: !settings.restEnabled })} />
          </div>

          {settings.restEnabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 22, background: 'rgba(var(--wb-ink-rgb),.05)', marginBottom: 10 }}>
                <button
                  onClick={() => patch({ restDefaultSec: Math.max(15, settings.restDefaultSec - 15) })}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--wb-surf)', fontSize: 17 }}
                >−</button>
                <div style={{ textAlign: 'center' }}>
                  <div className="display tabular" style={{ fontSize: 30 }}>{mmss(settings.restDefaultSec)}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>DURATION</div>
                </div>
                <button
                  onClick={() => patch({ restDefaultSec: Math.min(600, settings.restDefaultSec + 15) })}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--wb-surf)', fontSize: 17 }}
                >+</button>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {[45, 60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => patch({ restDefaultSec: sec })}
                    className="tabular"
                    style={{
                      padding: '8px 15px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 13,
                      background: settings.restDefaultSec === sec ? 'var(--wb-sel)' : 'rgba(var(--wb-ink-rgb),.06)',
                      color: settings.restDefaultSec === sec ? 'var(--wb-sel-fg)' : 'rgba(var(--wb-ink-rgb),.62)',
                    }}
                  >
                    {mmss(sec)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Rest after warm-ups</div>
                </div>
                <Switch on={settings.restWarmup} onToggle={() => patch({ restWarmup: !settings.restWarmup })} />
              </div>
            </>
          )}
        </Card>

        <Card title="Live session">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Keep screen awake</div>
            <Switch on={settings.keepAwake} onToggle={() => patch({ keepAwake: !settings.keepAwake })} />
          </div>
        </Card>

        <div style={{ fontSize: 12, opacity: 0.45, textAlign: 'center' }}>
          Everything stays on this device — no account, no sync.
        </div>

        <button
          onClick={async () => {
            const blob = await repo.exportAll();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workbook-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, opacity: 0.7, padding: 10 }}
        >
          Export data
        </button>
      </div>
    </div>
  );
}
