import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/db';
import { HeatMap } from '../components/HeatMap';

export function HistoryTab() {
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.orderBy('performedAt').reverse().toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const exNames: Record<string, string> = {};
  (exercises ?? []).forEach((e) => { exNames[e.id] = e.name; });

  const stats = useMemo(() => {
    const all = sessions ?? [];
    const weekAgo = Date.now() - 7 * 864e5;
    const weekSessions = all.filter((s) => s.performedAt >= weekAgo);
    const weekSets = weekSessions.reduce((a, s) => a + s.entries.reduce((b, e) => b + e.sets.length, 0), 0);
    return [
      { value: weekSessions.length, label: 'sessions, 7 days' },
      { value: weekSets, label: 'sets, 7 days' },
      { value: all.length, label: 'total workouts' },
    ];
  }, [sessions]);

  return (
    <div style={{ padding: '20px 18px 118px', maxWidth: 980, margin: '0 auto' }}>
      <div className="display" style={{ fontSize: 30, marginBottom: 14 }}>History</div>

      <HeatMap sessions={sessions ?? []} onOpenSession={(id) => navigate(`/history/${id}`)} />

      <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ flex: 1, minWidth: 0, padding: '12px 13px', borderRadius: 20, background: 'var(--wb-line)' }}>
            <div className="display tabular" style={{ fontSize: 19, lineHeight: 1, whiteSpace: 'nowrap' }}>{s.value}</div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
        {(sessions ?? []).map((s) => (
          <div
            key={s.id}
            onClick={() => navigate(`/history/${s.id}`)}
            style={{ padding: 16, borderRadius: 26, background: 'var(--wb-surf)', boxShadow: '0 1px 2px rgba(var(--wb-shad-rgb),.1)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wb-brick)' }} />
              <div className="display" style={{ fontSize: 18 }}>{s.name}</div>
              <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.5 }}>
                {new Date(s.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <b>{s.durationMin} min</b> · <b>{s.entries.reduce((a, e) => a + e.sets.length, 0)} sets</b>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {s.entries.slice(0, 3).map((e) => (
                <div key={e.exerciseId} style={{ fontSize: 13, color: 'rgba(var(--wb-ink-rgb),.75)' }}>
                  {e.sets.length} × {exNames[e.exerciseId] ?? e.exerciseId}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
