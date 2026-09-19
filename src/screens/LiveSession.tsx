import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/db';
import { useLiveStore } from '../store/live';
import { useSettingsStore } from '../store/settings';
import { useUIStore } from '../store/ui';
import { Icon } from '../components/Icon';
import { SetRow } from '../components/SetRow';
import { Sheet } from '../components/Sheet';
import { Keypad } from '../components/Keypad';
import { ExercisePicker } from '../components/ExercisePicker';
import { EmptyState } from '../components/EmptyState';
import { fieldHead, fieldName, fieldValue, mmss, shortStr } from '../domain/metrics';
import { lastSets, recordBadgeKeys, type RecordSource } from '../domain/analytics';
import type { Exercise, MeasurementType } from '../domain/types';
import { MEASUREMENTS, PR_FIELD_INDEX } from '../domain/types';

function elapsedStr(startedAt: number): string {
  const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function fieldsFor(m: MeasurementType) {
  return MEASUREMENTS[m].fields;
}

export function LiveSessionScreen() {
  const navigate = useNavigate();
  const live = useLiveStore((s) => s.live);
  const tick = useLiveStore((s) => s.tick);
  const rename = useLiveStore((s) => s.rename);
  const discard = useLiveStore((s) => s.discard);
  const finish = useLiveStore((s) => s.finish);
  const addExercises = useLiveStore((s) => s.addExercises);
  const removeExercise = useLiveStore((s) => s.removeExercise);
  const addSet = useLiveStore((s) => s.addSet);
  const removeSet = useLiveStore((s) => s.removeSet);
  const toggleType = useLiveStore((s) => s.toggleType);
  const toggleDone = useLiveStore((s) => s.toggleDone);
  const writeField = useLiveStore((s) => s.writeField);
  const applyPrev = useLiveStore((s) => s.applyPrev);
  const extendRest = useLiveStore((s) => s.extendRest);
  const skipRest = useLiveStore((s) => s.skipRest);

  const settings = useSettingsStore((s) => s.settings);
  const keypad = useUIStore((s) => s.keypad);
  const openKeypad = useUIStore((s) => s.openKeypad);
  const closeKeypad = useUIStore((s) => s.closeKeypad);

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const exMap: Record<string, Exercise> = {};
  (exercises ?? []).forEach((e) => { exMap[e.id] = e; });

  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { void tick; }, [tick]);

  if (!live) {
    navigate('/', { replace: true });
    return null;
  }

  const unit = settings.unit;
  const restPct = live.rest ? Math.max(0, Math.min(100, ((live.rest.endsAt - Date.now()) / (live.rest.totalSec * 1000)) * 100)) : 0;
  const setsDone = live.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 8, display: 'flex', flexDirection: 'column', background: 'var(--wb-bg)', color: 'var(--wb-ink)' }}>
      <div style={{ background: 'var(--wb-inv)', color: '#f2ece1', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
        <button
          onClick={() => navigate('/')}
          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(247,242,232,.14)', color: '#f2ece1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="minus" size={18} style={{ strokeWidth: 2.2 } as never} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={live.name}
            onChange={(e) => rename(e.target.value)}
            className="display"
            style={{ fontSize: 17, background: 'transparent', border: 'none', outline: 'none', color: '#f2ece1', width: '100%' }}
          />
          <div className="tabular" style={{ fontSize: 12, opacity: 0.65 }}>{elapsedStr(live.startedAt)} · {setsDone} sets done</div>
        </div>
        <button
          onClick={async () => {
            const result = await finish();
            navigate(result ? `/session/summary/${result.id}` : '/');
          }}
          style={{ padding: '9px 17px', borderRadius: 999, border: 'none', background: 'var(--wb-brick)', color: '#f2ece1', fontWeight: 700, fontSize: 13 }}
        >
          Finish
        </button>
      </div>

      <div className="wbScroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 130px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {live.entries.length === 0 && (
          <EmptyState icon="dumbbell" title="No exercises yet" body="Add exercises below to start logging." />
        )}

        {live.entries.map((entry) => {
          const ex = exMap[entry.exerciseId];
          if (!ex) return null;
          const fields = fieldsFor(ex.measurement);
          const two = fields.length > 1;
          const prev = lastSets(sessions ?? [], entry.exerciseId);
          const liveSource: RecordSource = { id: 'live', performedAt: Date.now(), entries: [{ exerciseId: entry.exerciseId, sets: entry.sets }] };
          const badgeKeys = recordBadgeKeys([...(sessions ?? []), liveSource], entry.exerciseId, ex.measurement);
          let workNum = 0;

          return (
            <div key={entry.id} style={{ padding: '14px 14px 8px', borderRadius: 26, background: 'var(--wb-surf)', boxShadow: '0 1px 2px rgba(var(--wb-shad-rgb),.1)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <div
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 0 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 18, lineHeight: 1.1 }}>{ex.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{ex.muscle} · {ex.equipment}</div>
                  </div>
                  <Icon name="chevron-right" size={14} style={{ opacity: 0.35, flex: 'none' } as never} />
                </div>
                <button
                  onClick={() => removeExercise(entry.id)}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="close" size={16} style={{ strokeWidth: 2, opacity: 0.4 } as never} />
                </button>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: two ? '38px 1fr 1fr 64px 48px' : '38px 1fr 64px 48px',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', opacity: 0.62,
                padding: '0 2px 6px', textAlign: 'center',
              }}>
                <div>SET</div>
                <div>{fieldHead(fields[0], unit)}</div>
                {two && <div>{fieldHead(fields[1], unit)}</div>}
                <div>PREV</div>
                <div />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entry.sets.map((st, si) => {
                  const isWarmup = st.type === 'warmup';
                  if (!isWarmup) workNum++;
                  const p = prev[si];
                  return (
                    <SetRow
                      key={st.id}
                      rowKey={`${entry.id}-${st.id}`}
                      label={isWarmup ? 'W' : String(workNum)}
                      isWarmup={isWarmup}
                      v1={fieldValue(st, fields[0], unit)}
                      v2={two ? fieldValue(st, fields[1], unit) : undefined}
                      twoFields={two}
                      prev={p ? shortStr(p, ex.measurement, unit) : '—'}
                      prevAvailable={!!p}
                      done={st.done}
                      prField={PR_FIELD_INDEX[ex.measurement] as 0 | 1}
                      isPR={badgeKeys.has(`live:${si}`)}
                      onTapLabel={() => toggleType(entry.id, st.id)}
                      onTapV1={() => openKeypad({
                        entryId: entry.id, setId: st.id, field: fields[0],
                        exerciseName: ex.name, setLabel: isWarmup ? 'Warm-up set' : `Set ${workNum}`,
                      })}
                      onTapV2={() => two && openKeypad({
                        entryId: entry.id, setId: st.id, field: fields[1],
                        exerciseName: ex.name, setLabel: isWarmup ? 'Warm-up set' : `Set ${workNum}`,
                      })}
                      onTapPrev={() => p && applyPrev(entry.id, st.id, p)}
                      onToggleDone={() => toggleDone(entry.id, st.id, ex, settings.restEnabled, settings.restScope, settings.restWarmup, settings.restDefaultSec)}
                      onDelete={() => removeSet(entry.id, st.id)}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => addSet(entry.id)}
                style={{ margin: '6px 0 8px', padding: 9, width: '100%', borderRadius: 14, border: 'none', background: 'rgba(var(--wb-ink-rgb),.05)', fontWeight: 700, fontSize: 13, color: 'rgba(var(--wb-ink-rgb),.55)' }}
              >
                Add set
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setShowPicker(true)}
          style={{ padding: 15, borderRadius: 999, border: '1.5px dashed rgba(var(--wb-ink-rgb),.28)', background: 'transparent', color: 'var(--wb-accent-ink)', fontWeight: 700, fontSize: 14 }}
        >
          Add exercise
        </button>

        <button
          onClick={() => { if (confirm('Discard this workout?')) { discard(); navigate('/'); } }}
          style={{ padding: 12, border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, opacity: 0.62 }}
        >
          Discard workout
        </button>
      </div>

      {live.rest && (
        <div style={{
          position: 'absolute', left: 12, right: 12, bottom: 14, padding: '12px 14px', borderRadius: 24,
          background: 'var(--wb-inv)', color: '#f2ece1', boxShadow: '0 12px 28px rgba(var(--wb-shad-rgb),.35)',
          animation: 'wbUp .22s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', opacity: 0.6 }}>Rest</div>
              <div className="display tabular" style={{ fontSize: 24 }}>{mmss(Math.max(0, (live.rest.endsAt - Date.now()) / 1000))}</div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => extendRest(15)} style={{ padding: '7px 12px', borderRadius: 999, border: 'none', background: 'rgba(247,242,232,.14)', color: '#f2ece1', fontWeight: 700, fontSize: 12 }}>+15s</button>
            <button onClick={skipRest} style={{ padding: '7px 12px', borderRadius: 999, border: 'none', background: 'var(--wb-brick)', color: '#f2ece1', fontWeight: 700, fontSize: 12 }}>Skip</button>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(247,242,232,.2)', marginTop: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${restPct}%`, background: 'var(--wb-brick)' }} />
          </div>
        </div>
      )}

      {showPicker && (
        <ExercisePicker
          excludeIds={live.entries.map((e) => e.exerciseId)}
          onCancel={() => setShowPicker(false)}
          onAdd={(ids) => { addExercises(ids, sessions ?? []); setShowPicker(false); }}
        />
      )}

      {keypad && (() => {
        const entry = live.entries.find((e) => e.id === keypad.entryId);
        const st = entry?.sets.find((s) => s.id === keypad.setId);
        if (!st) return null;
        const isDuration = keypad.field === 'secs';
        return (
          <Sheet onDismiss={closeKeypad} height="auto">
            <Keypad
              fieldLabel={fieldName(keypad.field, unit).toUpperCase()}
              context={`${keypad.exerciseName} · ${keypad.setLabel}`}
              currentValue={String(fieldValue(st, keypad.field, unit))}
              isDuration={isDuration}
              onCommit={(typed) => writeField(keypad.entryId, keypad.setId, keypad.field, typed, unit)}
              onDone={closeKeypad}
            />
          </Sheet>
        );
      })()}
    </div>
  );
}
