import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLiveStore } from '../store/live';
import { Icon } from '../components/Icon';
import { MiniBar } from './MiniBar';

const NAV_ITEMS = [
  { path: '/history', label: 'History', icon: 'history' as const },
  { path: '/', label: 'Workout', icon: 'workout' as const },
  { path: '/exercises', label: 'Exercises', icon: 'list' as const },
];

function useIsDesktop() {
  const [wide, setWide] = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return wide;
}

export function Shell() {
  const desktop = useIsDesktop();
  const location = useLocation();
  const navigate = useNavigate();
  const live = useLiveStore((s) => s.live);

  if (desktop) {
    return (
      <div style={{ height: '100vh', display: 'flex', background: 'var(--wb-bg)', color: 'var(--wb-ink)', overflow: 'hidden' }}>
        <div style={{ width: 264, flex: 'none', background: 'var(--wb-inv)', color: '#f2ece1', display: 'flex', flexDirection: 'column', gap: 22, padding: '26px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 6px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--wb-brick)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="workout" size={19} />
            </div>
            <div className="display" style={{ fontSize: 21 }}>Workbook</div>
          </div>
          <button
            onClick={() => navigate('/session')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14, borderRadius: 999, background: 'var(--wb-brick)', color: '#f2ece1', fontWeight: 700, fontSize: 14, border: 'none' }}
          >
            <Icon name="plus" size={17} />New workout
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {NAV_ITEMS.map((n) => {
              const active = location.pathname === n.path;
              return (
                <div
                  key={n.path}
                  onClick={() => navigate(n.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
                    cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    background: active ? 'var(--wb-brick)' : 'transparent',
                    color: active ? '#f2ece1' : 'rgba(242,236,225,.72)',
                  }}
                >
                  <Icon name={n.icon} size={19} />{n.label}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {live && (
              <div onClick={() => navigate('/session')} style={{ padding: 14, borderRadius: 20, background: 'rgba(242,236,225,.09)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wb-brick)' }} />
                  <div style={{ fontSize: 11, letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.7 }}>In progress</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{live.name}</div>
              </div>
            )}
            <div
              onClick={() => navigate('/settings')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'rgba(242,236,225,.72)' }}
            >
              <Icon name="settings" size={19} />Settings
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }} className="wbScroll">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--wb-bg)', color: 'var(--wb-ink)' }}>
      <div className="wbScroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Outlet />
      </div>
      {live && <MiniBar />}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex',
        background: 'var(--wb-line)', padding: '8px 8px max(14px, env(safe-area-inset-bottom))',
        boxShadow: '0 -1px 0 rgba(var(--wb-ink-rgb),.07)',
      }}>
        {NAV_ITEMS.map((n) => {
          const active = location.pathname === n.path;
          return (
            <div
              key={n.path}
              onClick={() => navigate(n.path)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0', cursor: 'pointer' }}
            >
              <div style={{
                padding: '4px 20px', borderRadius: 999, background: active ? 'var(--wb-sel)' : 'transparent',
                color: active ? 'var(--wb-sel-fg)' : 'var(--wb-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={n.icon} size={22} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--wb-ink)' : 'rgba(var(--wb-ink-rgb),.5)' }}>{n.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
