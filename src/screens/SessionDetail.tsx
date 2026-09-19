import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Icon } from '../components/Icon';
import { SetLine } from '../components/SetLine';
import { Sheet } from '../components/Sheet';
import { Keypad } from '../components/Keypad';
import { recordBadgeKeys } from '../domain/analytics';
import { fieldName, fieldValue, withUserInput } from '../domain/metrics';
import { useSettingsStore } from '../store/settings';
import type { Exercise, ExerciseId, FieldKey } from '../domain/types';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const session = useLiveQuery(() => (id ? db.sessions.get(id) : undefined), [id]);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const allSessions = useLiveQuery(() => db.sessions.toArray(), []);
  const exMap: Record<string, Exercise> = {};
  (exercises ?? []).forEach((e) => { exMap[e.id] = e; });

  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ exerciseId: ExerciseId; setIndex: number; field: FieldKey } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (session) setName(session.name); }, [session?.id, session?.name]);
  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); }, []);

  const badgeKeysByExercise = useMemo(() => {
    const map: Record<ExerciseId, Set<string>> = {};
    if (!session || !allSessions) return map;
    for (const entry of session.entries) {
      const ex = exMap[entry.exerciseId];
      if (ex) map[entry.exerciseId] = recordBadgeKeys(allSessions, entry.exerciseId, ex.measurement);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, allSessions, exercises]);

  if (!session) return null;

  async function commitName() {
    const trimmed = name.trim();
    await repo.updateSession(session!.id, (s) => { s.name = trimmed || s.name; });
  }

  async function removeExercise(exerciseId: ExerciseId) {
    await repo.updateSession(session!.id, (s) => {
      s.entries = s.entries.filter((e) => e.exerciseId !== exerciseId);
    });
  }

  async function deleteSet(exerciseId: ExerciseId, setIdx: number) {
    await repo.updateSession(session!.id, (s) => {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId);
      if (entry) entry.sets.splice(setIdx, 1);
    });
  }

  async function commitField(exerciseId: ExerciseId, setIdx: number, field: FieldKey, typed: number) {
    await repo.updateSession(session!.id, (s) => {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId);
      const st = entry?.sets[setIdx];
      if (st) Object.assign(st, withUserInput(st, field, typed, settings.unit));
    });
  }

  function onDeleteWorkoutClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    void repo.deleteSession(session!.id).then(() => navigate('/history', { replace: true }));
  }

  const editingSet = editing
    ? session.entries.find((e) => e.exerciseId === editing.exerciseId)?.sets[editing.setIndex]
    : null;
  const editingExercise = editing ? exMap[editing.exerciseId] : null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'var(--wb-bg)', color: 'var(--wb-ink)', display: 'flex', flexDirection: 'column', animation: 'wbFade .18s ease' }}>
      <div style={{ padding: 'max(14px, env(safe-area-inset-top)) 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--wb-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={18} style={{ strokeWidth: 2.2 } as never} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void commitName()}
            className="display"
            style={{ fontSize: 20, background: 'transparent', border: 'none', outline: 'none', color: 'var(--wb-ink)', width: '100%' }}
          />
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            {new Date(session.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {session.durationMin} min
          </div>
        </div>
      </div>

      <div className="wbScroll" style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 40px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 11, opacity: 0.5 }}>Tap a value to edit · swipe a set left to delete</div>

        {session.entries.map((entry) => {
          const ex = exMap[entry.exerciseId];
          const badgeKeys = badgeKeysByExercise[entry.exerciseId] ?? new Set<string>();
          return (
            <div key={entry.exerciseId} style={{ borderRadius: 24, background: 'var(--wb-surf)', padding: '14px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div
                  onClick={() => navigate(`/exercise/${entry.exerciseId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1, minWidth: 0 }}
                >
                  <div className="display" style={{ fontSize: 17 }}>{ex?.name ?? entry.exerciseId}</div>
                  <Icon name="chevron-right" size={15} style={{ opacity: 0.35 } as never} />
                </div>
                <button
                  onClick={() => void removeExercise(entry.exerciseId)}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
                >
                  <Icon name="close" size={16} style={{ strokeWidth: 2, opacity: 0.4 } as never} />
                </button>
              </div>
              {ex && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {entry.sets.map((st, i) => (
                    <SetLine
                      key={i}
                      rowKey={`${entry.exerciseId}-${i}`}
                      index={i + 1}
                      set={st}
                      measurement={ex.measurement}
                      unit={settings.unit}
                      isPR={badgeKeys.has(`${session.id}:${i}`)}
                      onEditField={(field) => setEditing({ exerciseId: entry.exerciseId, setIndex: i, field })}
                      onDelete={() => void deleteSet(entry.exerciseId, i)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={onDeleteWorkoutClick}
          style={{
            marginTop: 8, padding: 12, border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13,
            color: confirmDelete ? 'var(--wb-brick)' : 'rgba(var(--wb-ink-rgb),.62)',
          }}
        >
          {confirmDelete ? 'Tap again to delete workout' : 'Delete workout'}
        </button>
      </div>

      {editing && editingSet && editingExercise && (
        <Sheet onDismiss={() => setEditing(null)} height="auto">
          <Keypad
            fieldLabel={fieldName(editing.field, settings.unit).toUpperCase()}
            context={`${editingExercise.name} · set ${editing.setIndex + 1}`}
            currentValue={String(fieldValue(editingSet, editing.field, settings.unit))}
            isDuration={editing.field === 'secs'}
            onCommit={(typed) => void commitField(editing.exerciseId, editing.setIndex, editing.field, typed)}
            onDone={() => setEditing(null)}
          />
        </Sheet>
      )}
    </div>
  );
}
