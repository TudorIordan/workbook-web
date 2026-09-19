import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { useLiveStore } from '../store/live';
import { useUIStore } from '../store/ui';
import { Icon } from '../components/Icon';
import { Pill } from '../components/Pill';
import { ExercisePicker } from '../components/ExercisePicker';
import type { Exercise, ExerciseId } from '../domain/types';

const ROW_GAP = 8;
const SLACK = 14;

export function RoutineEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const draftKey = isNew ? 'new' : id!;
  const navigate = useNavigate();
  const existing = useLiveQuery(() => (!isNew && id ? db.routines.get(id) : undefined), [id, isNew]);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const startFromRoutine = useLiveStore((s) => s.startFromRoutine);
  const routineDraft = useUIStore((s) => s.routineDraft);
  const setRoutineDraft = useUIStore((s) => s.setRoutineDraft);
  const clearRoutineDraft = useUIStore((s) => s.clearRoutineDraft);

  const [name, setName] = useState('');
  const [exerciseIds, setExerciseIds] = useState<ExerciseId[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    if (routineDraft && routineDraft.key === draftKey) {
      setName(routineDraft.name);
      setExerciseIds(routineDraft.exerciseIds);
      initedRef.current = true;
    } else if (isNew || existing) {
      setName(existing?.name ?? '');
      setExerciseIds(existing?.exerciseIds ?? []);
      initedRef.current = true;
    }
  }, [existing, isNew, routineDraft, draftKey]);

  useEffect(() => {
    if (!initedRef.current) return;
    setRoutineDraft({ key: draftKey, name, exerciseIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, exerciseIds, draftKey]);

  const exMap: Record<string, Exercise> = {};
  (exercises ?? []).forEach((e) => { exMap[e.id] = e; });

  async function save() {
    if (!exerciseIds.length) { clearRoutineDraft(); navigate(-1); return; }
    const now = Date.now();
    await repo.saveRoutine({
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim() || 'New routine',
      exerciseIds,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    clearRoutineDraft();
    navigate(-1);
  }

  async function remove() {
    if (existing && confirm('Delete this routine?')) {
      await repo.deleteRoutine(existing.id);
      clearRoutineDraft();
      navigate('/');
    }
  }

  function back() {
    clearRoutineDraft();
    navigate(-1);
  }

  // ── drag to reorder ──────────────────────────────────────────────────
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{ id: string | null; y0: number; pid: number | null; rowH: number }>({ id: null, y0: 0, pid: null, rowH: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  function onGripDown(e: React.PointerEvent, exId: string) {
    const row = rowRefs.current[exId];
    const rowH = (row?.offsetHeight ?? 58) + ROW_GAP;
    dragRef.current = { id: exId, y0: e.clientY, pid: e.pointerId, rowH };
    setDragId(exId);
    setDragDelta(0);
    setHoverIndex(exerciseIds.indexOf(exId));
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* noop */ }
  }

  function onGripMove(e: React.PointerEvent) {
    const g = dragRef.current;
    if (!g.id) return;
    const idx = exerciseIds.indexOf(g.id);
    const rawDelta = e.clientY - g.y0;
    const min = -(idx * g.rowH) - SLACK;
    const max = (exerciseIds.length - 1 - idx) * g.rowH + SLACK;
    const delta = Math.max(min, Math.min(max, rawDelta));
    setDragDelta(delta);
    const nextIndex = Math.max(0, Math.min(exerciseIds.length - 1, idx + Math.round(delta / g.rowH)));
    setHoverIndex(nextIndex);
  }

  function onGripUp() {
    const g = dragRef.current;
    if (g.id && hoverIndex != null) {
      const from = exerciseIds.indexOf(g.id);
      if (hoverIndex !== from) {
        setExerciseIds((ids) => {
          const next = ids.slice();
          const [moved] = next.splice(from, 1);
          next.splice(hoverIndex, 0, moved);
          return next;
        });
      }
    }
    dragRef.current = { id: null, y0: 0, pid: null, rowH: 0 };
    setDragId(null);
    setDragDelta(0);
    setHoverIndex(null);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'var(--wb-bg)', color: 'var(--wb-ink)', display: 'flex', flexDirection: 'column', animation: 'wbFade .18s ease' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={back} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--wb-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={18} style={{ strokeWidth: 2.2 } as never} />
        </button>
        <div className="display" style={{ fontSize: 20, flex: 1 }}>{isNew ? 'New routine' : 'Edit routine'}</div>
        <button onClick={save} style={{ border: 'none', background: 'transparent', color: 'var(--wb-accent-ink)', fontWeight: 700, fontSize: 13 }}>Save</button>
      </div>

      <div className="wbScroll" style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push A"
          style={{ padding: '13px 16px', borderRadius: 999, border: '1px solid rgba(var(--wb-ink-rgb),.14)', background: 'var(--wb-surf)', fontSize: 15, fontWeight: 700, outline: 'none', color: 'var(--wb-ink)' }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: 0.5 }}>
          {exerciseIds.length} exercises
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP, position: 'relative' }}>
          {exerciseIds.map((exId, i) => {
            const ex = exMap[exId];
            if (!ex) return null;
            const isDragging = dragId === exId;
            let offset = 0;
            if (dragId && !isDragging) {
              const from = exerciseIds.indexOf(dragId);
              if (hoverIndex != null) {
                if (hoverIndex > from && i > from && i <= hoverIndex) offset = -1;
                else if (hoverIndex < from && i < from && i >= hoverIndex) offset = 1;
              }
            }
            return (
              <div
                key={exId}
                ref={(el) => { rowRefs.current[exId] = el; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 20, background: 'var(--wb-surf)',
                  transform: isDragging
                    ? `translateY(${dragDelta}px)`
                    : `translateY(${offset ? offset * (((rowRefs.current[exId]?.offsetHeight ?? 58) + ROW_GAP)) : 0}px)`,
                  transition: isDragging ? 'none' : 'transform .2s cubic-bezier(.2,.8,.2,1)',
                  position: isDragging ? 'relative' : 'static',
                  zIndex: isDragging ? 2 : 1,
                  boxShadow: isDragging ? '0 10px 24px rgba(var(--wb-shad-rgb),.28)' : 'none',
                }}
              >
                <div className="display" style={{ width: 22, textAlign: 'center', fontSize: 15, opacity: 0.6, flex: 'none' }}>{i + 1}</div>
                <div
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.5 }}>{ex.muscle} · {ex.equipment}</div>
                </div>
                <button
                  onClick={() => setExerciseIds((ids) => ids.filter((x) => x !== exId))}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', opacity: 0.4, flex: 'none' }}
                >
                  ✕
                </button>
                <div
                  onPointerDown={(e) => onGripDown(e, exId)}
                  onPointerMove={onGripMove}
                  onPointerUp={onGripUp}
                  onPointerLeave={isDragging ? onGripUp : undefined}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', opacity: 0.4, touchAction: 'none', cursor: 'grab',
                  }}
                >
                  <Icon name="grip" size={18} />
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          style={{ padding: 14, borderRadius: 999, border: '1.5px dashed rgba(var(--wb-ink-rgb),.28)', background: 'transparent', color: 'var(--wb-accent-ink)', fontWeight: 700, fontSize: 14 }}
        >
          Add exercises
        </button>

        <div style={{ marginTop: 8 }}>
          <Pill
            variant="primary"
            onClick={() => {
              if (!exerciseIds.length) return;
              startFromRoutine(name.trim() || 'New routine', existing?.id, exerciseIds, exMap, sessions ?? []);
              clearRoutineDraft();
              navigate('/session');
            }}
          >
            Start this workout
          </Pill>
        </div>

        {existing && (
          <button onClick={remove} style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, opacity: 0.62, padding: 10 }}>
            Delete routine
          </button>
        )}
      </div>

      {showPicker && (
        <ExercisePicker
          excludeIds={exerciseIds}
          onCancel={() => setShowPicker(false)}
          onAdd={(ids) => { setExerciseIds((cur) => [...cur, ...ids]); setShowPicker(false); }}
        />
      )}
    </div>
  );
}
