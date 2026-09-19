import { useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

const PANEL_W = 74;
const INSET = 1;
const LATCH_X = -(PANEL_W + INSET);
const MAX_DRAG = LATCH_X - 16;
const LATCH_THRESHOLD = LATCH_X / 2;

interface GestureState {
  key: string | null;
  x0: number;
  base: number;
  moved: boolean;
  pid: number | null;
  endedAt: number;
}

/**
 * Swipe-left-to-delete wrapper shared by set rows across the live session,
 * exercise detail and history detail — the delete panel carries its own
 * background so nothing bleeds at rest.
 */
export function SwipeDeleteRow({
  rowKey, onDelete, radius = 18, background = 'var(--wb-surf)', children,
}: {
  rowKey: string;
  onDelete: () => void;
  radius?: number;
  background?: string;
  /** Render prop: wrap any tap handler in `guard` to suppress the tap right after a swipe. */
  children: (guard: (fn: () => void) => void) => ReactNode;
}) {
  const gestureRef = useRef<GestureState>({ key: null, x0: 0, base: 0, moved: false, pid: null, endedAt: 0 });
  const [x, setX] = useState(0);
  const [latched, setLatched] = useState(false);
  const [dragging, setDragging] = useState(false);

  function guard(fn: () => void) {
    const g = gestureRef.current;
    if (g.endedAt && Date.now() - g.endedAt < 250) return;
    if (latched) { setLatched(false); setX(0); return; }
    fn();
  }

  function onPointerDown(e: React.PointerEvent) {
    const g = gestureRef.current;
    g.key = rowKey;
    g.x0 = e.clientX;
    g.base = latched ? LATCH_X : 0;
    g.moved = false;
    g.pid = e.pointerId;
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gestureRef.current;
    if (g.key !== rowKey) return;
    const dx = e.clientX - g.x0;
    if (!g.moved && Math.abs(dx) > 7) {
      g.moved = true;
      setDragging(true);
      try { (e.target as Element).setPointerCapture(g.pid!); } catch { /* noop */ }
    }
    if (!g.moved) return;
    setX(Math.max(MAX_DRAG, Math.min(0, g.base + dx)));
  }

  function onPointerUp(e: React.PointerEvent) {
    const g = gestureRef.current;
    if (g.key !== rowKey) return;
    const finalX = g.moved ? Math.max(MAX_DRAG, Math.min(0, g.base + (e.clientX - g.x0))) : g.base;
    const willLatch = finalX <= LATCH_THRESHOLD;
    setLatched(willLatch);
    setX(willLatch ? LATCH_X : 0);
    setDragging(false);
    if (g.moved) g.endedAt = Date.now();
    try { (e.target as Element).releasePointerCapture(g.pid!); } catch { /* noop */ }
    g.key = null; g.moved = false; g.pid = null;
  }

  return (
    <div style={{ position: 'relative', borderRadius: radius, overflow: 'hidden' }}>
      <div
        onClick={onDelete}
        style={{
          position: 'absolute', right: INSET, top: INSET, bottom: INSET, width: PANEL_W,
          borderRadius: Math.max(0, radius - INSET), display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2, color: '#f2ece1', background: 'var(--wb-brick)',
        }}
      >
        <Icon name="trash" size={15} style={{ strokeWidth: 2.75 } as never} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>Delete</span>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={dragging ? onPointerUp : undefined}
        style={{
          position: 'relative', borderRadius: radius, background, touchAction: 'pan-y',
          transform: `translateX(${x}px)`,
          transition: dragging ? 'none' : 'transform .2s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {children(guard)}
      </div>
    </div>
  );
}
