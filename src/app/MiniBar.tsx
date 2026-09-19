import { useNavigate } from 'react-router-dom';
import { useLiveStore } from '../store/live';

function elapsedStr(startedAt: number): string {
  const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function MiniBar() {
  const navigate = useNavigate();
  const live = useLiveStore((s) => s.live);
  useLiveStore((s) => s.tick); // re-render each second
  if (!live) return null;

  return (
    <div
      onClick={() => navigate('/session')}
      style={{
        position: 'absolute', left: 12, right: 12, zIndex: 7,
        bottom: 'calc(84px + env(safe-area-inset-bottom))',
        padding: '12px 14px', borderRadius: 22, background: 'var(--wb-inv)', color: '#f2ece1',
        boxShadow: '0 14px 30px rgba(var(--wb-shad-rgb),.3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--wb-brick)', flex: 'none' }} />
      <div style={{ fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{live.name}</div>
      <div className="tabular" style={{ opacity: 0.7 }}>{elapsedStr(live.startedAt)}</div>
    </div>
  );
}
