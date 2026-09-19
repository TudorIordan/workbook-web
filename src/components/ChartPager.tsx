import { useRef, useState, type ReactNode } from 'react';

/** Two-page swipeable pager: bars, then the trend line — with a tap-to-switch dot pair. */
export function ChartPager({ bars, line }: { bars: ReactNode; line: ReactNode }) {
  const [page, setPage] = useState(0);
  const dragRef = useRef({ x0: 0, active: false });

  function onDown(e: React.PointerEvent) { dragRef.current = { x0: e.clientX, active: true }; }
  function onUp(e: React.PointerEvent) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x0;
    dragRef.current.active = false;
    if (dx < -40) setPage(1);
    else if (dx > 40) setPage(0);
  }

  return (
    <div>
      <div onPointerDown={onDown} onPointerUp={onUp} style={{ overflow: 'hidden', touchAction: 'pan-y' }}>
        <div style={{ display: 'flex', transform: `translateX(-${page * 100}%)`, transition: 'transform .25s cubic-bezier(.2,.8,.2,1)' }}>
          <div style={{ minWidth: '100%' }}>{bars}</div>
          <div style={{ minWidth: '100%' }}>{line}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            onClick={() => setPage(i)}
            style={{
              width: 6, height: 6, borderRadius: '50%', cursor: 'pointer',
              background: page === i ? 'var(--wb-ink)' : 'rgba(var(--wb-ink-rgb),.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
