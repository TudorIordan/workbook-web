import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Icon } from '../components/Icon';
import { StatTile } from '../components/StatTile';
import { EmptyState } from '../components/EmptyState';
import { BarChart } from '../components/BarChart';
import { LineChart } from '../components/LineChart';
import { ChartPager } from '../components/ChartPager';
import { SetLine } from '../components/SetLine';
import { Sheet } from '../components/Sheet';
import { Keypad } from '../components/Keypad';
import { bestSet, secondaryStat, progressChart, sessionsForExerciseAsc, recordBadgeKeys } from '../domain/analytics';
import { ago, fieldValue, fieldName, prStr, withUserInput } from '../domain/metrics';
import { useSettingsStore } from '../store/settings';
import type { FieldKey } from '../domain/types';

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const ex = useLiveQuery(() => (id ? db.exercises.get(id) : undefined), [id]);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  const unit = settings.unit;
  const [editing, setEditing] = useState<{ sessionId: string; setIndex: number; field: FieldKey } | null>(null);

  const best = useMemo(() => (ex && sessions ? bestSet(sessions, ex.id, ex.measurement) : null), [ex, sessions]);
  const secondary = useMemo(() => (ex && sessions ? secondaryStat(sessions, ex.id, ex.measurement, unit) : null), [ex, sessions, unit]);
  const chart = useMemo(() => (ex && sessions ? progressChart(sessions, ex.id, ex.measurement, unit) : null), [ex, sessions, unit]);
  const history = useMemo(() => (ex && sessions ? sessionsForExerciseAsc(sessions, ex.id).reverse() : []), [ex, sessions]);
  const badgeKeys = useMemo(() => (ex && sessions ? recordBadgeKeys(sessions, ex.id, ex.measurement) : new Set<string>()), [ex, sessions]);

  if (!ex) return null;

  async function deleteSet(sessionId: string, setIdx: number) {
    await repo.updateSession(sessionId, (s) => {
      const entry = s.entries.find((e) => e.exerciseId === ex!.id);
      if (entry) entry.sets.splice(setIdx, 1);
    });
  }

  async function commitField(sessionId: string, setIdx: number, field: FieldKey, typed: number) {
    await repo.updateSession(sessionId, (s) => {
      const entry = s.entries.find((e) => e.exerciseId === ex!.id);
      const st = entry?.sets[setIdx];
      if (st) Object.assign(st, withUserInput(st, field, typed, unit));
    });
  }

  const editingSet = editing
    ? history.find((s) => s.id === editing.sessionId)?.entries.find((e) => e.exerciseId === ex.id)?.sets[editing.setIndex]
    : null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'var(--wb-bg)', color: 'var(--wb-ink)', display: 'flex', flexDirection: 'column', animation: 'wbFade .18s ease' }}>
      <div style={{ padding: 'max(14px, env(safe-area-inset-top)) 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--wb-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={18} style={{ strokeWidth: 2.2 } as never} />
        </button>
        <div>
          <div className="display" style={{ fontSize: 20, lineHeight: 1.1 }}>{ex.name}</div>
          <div style={{ fontSize: 12, opacity: 0.55 }}>{ex.muscle} · {ex.equipment}</div>
        </div>
      </div>

      <div className="wbScroll" style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatTile label="Best set" value={best ? prStr(best.set, ex.measurement, unit) : '—'} note={best ? ago(best.performedAt) : 'no data'} tone="inv" />
          <StatTile label={secondary?.label ?? '—'} value={secondary?.value ?? '—'} note={secondary?.note} tone="green" />
        </div>

        {!chart || chart.allPoints.length === 0 ? (
          <EmptyState icon="chart" title="No sets logged yet" body="Log a set for this exercise to start tracking progress." />
        ) : (
          <div style={{ padding: 17, borderRadius: 26, background: 'var(--wb-surf)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="display" style={{ fontSize: 17 }}>Progress</div>
              {chart.trend != null && (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wb-green-text)' }}>
                  {chart.trend === 0 ? '—' : `${chart.trend > 0 ? '+' : ''}${Math.round(chart.trend * 100) / 100} ${chart.unit}`}
                </div>
              )}
            </div>
            {chart.allPoints.length < 2 ? (
              <BarChart points={chart.points} />
            ) : (
              <ChartPager
                bars={<BarChart points={chart.points} />}
                line={<LineChart points={chart.allPoints} unit={chart.unit} />}
              />
            )}
            {chart.allPoints.length === 1 && (
              <div style={{ fontSize: 12, opacity: 0.55, textAlign: 'center', marginTop: 10 }}>
                Log this exercise again to plot a trend.
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="display" style={{ fontSize: 19, marginBottom: 4 }}>Logged sets</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 10 }}>tap a value to edit · swipe to delete</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((s) => {
                const entry = s.entries.find((e) => e.exerciseId === ex.id);
                if (!entry) return null;
                return (
                  <div key={s.id} style={{ borderRadius: 20, background: 'var(--wb-line)', padding: '9px 11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(s.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>{s.name}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {entry.sets.map((st, i) => (
                        <SetLine
                          key={i}
                          rowKey={`${s.id}-${i}`}
                          index={i + 1}
                          set={st}
                          measurement={ex.measurement}
                          unit={unit}
                          isPR={badgeKeys.has(`${s.id}:${i}`)}
                          onEditField={(field) => setEditing({ sessionId: s.id, setIndex: i, field })}
                          onDelete={() => void deleteSet(s.id, i)}
                          background="var(--wb-line)"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editing && editingSet && (
        <Sheet onDismiss={() => setEditing(null)} height="auto">
          <Keypad
            fieldLabel={fieldName(editing.field, unit).toUpperCase()}
            context={`${ex.name} · set ${editing.setIndex + 1}`}
            currentValue={String(fieldValue(editingSet, editing.field, unit))}
            isDuration={editing.field === 'secs'}
            onCommit={(typed) => void commitField(editing.sessionId, editing.setIndex, editing.field, typed)}
            onDone={() => setEditing(null)}
          />
        </Sheet>
      )}
    </div>
  );
}
