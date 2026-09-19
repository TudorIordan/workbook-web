import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/db';
import { useLiveStore } from '../store/live';
import { Icon } from '../components/Icon';
import { Pill } from '../components/Pill';
import { muscleTint } from '../components/muscleTint';
import { ago } from '../domain/metrics';
import type { Exercise } from '../domain/types';

export function WorkoutTab() {
  const navigate = useNavigate();
  const routines = useLiveQuery(() => db.routines.toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.orderBy('performedAt').reverse().toArray(), []);
  const live = useLiveStore((s) => s.live);
  const startEmpty = useLiveStore((s) => s.startEmpty);
  const startFromRoutine = useLiveStore((s) => s.startFromRoutine);

  const exMap: Record<string, Exercise> = {};
  (exercises ?? []).forEach((e) => { exMap[e.id] = e; });

  function lastDoneFor(routineId: string): number | null {
    const s = (sessions ?? []).find((x) => x.routineId === routineId);
    return s ? s.performedAt : null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 18px 118px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>Workout</div>
        <button
          onClick={() => navigate('/settings')}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(var(--wb-ink-rgb),.14)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="settings" size={20} style={{ opacity: 0.62 } as never} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Pill
            variant="neutral"
            icon={<Icon name="plus" size={16} style={{ strokeWidth: 2.4 } as never} />}
            onClick={() => { startEmpty(); navigate('/session'); }}
          >
            Empty workout
          </Pill>
        </div>
        <button
          onClick={() => navigate('/routine/new')}
          style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(var(--wb-ink-rgb),.16)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="routine-new" size={18} />
        </button>
      </div>

      {live && (
        <div
          onClick={() => navigate('/session')}
          style={{ padding: 16, borderRadius: 24, background: 'var(--wb-inv)', color: '#f2ece1', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wb-brick)' }} />
            <div style={{ fontSize: 11, letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.7 }}>In progress</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{live.name}</div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: 0.5, marginBottom: 8 }}>
          Routines
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(routines ?? []).map((r) => {
            const first = exMap[r.exerciseIds[0]];
            const [bg, fg] = muscleTint(first?.muscle ?? 'Core');
            const last = lastDoneFor(r.id);
            return (
              <div
                key={r.id}
                onClick={() => navigate(`/routine/${r.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', borderRadius: 26,
                  background: 'var(--wb-surf)', boxShadow: '0 1px 2px rgba(var(--wb-shad-rgb),.12)', cursor: 'pointer',
                }}
              >
                <div className="display" style={{
                  width: 42, height: 42, borderRadius: 15, background: bg, color: fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: 'none',
                }}>
                  {r.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="display" style={{ fontSize: 18, lineHeight: 1.15 }}>{r.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.exerciseIds.length} exercises{last ? ` · last done ${ago(last)}` : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startFromRoutine(r.name, r.id, r.exerciseIds, exMap, sessions ?? []);
                    navigate('/session');
                  }}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--wb-brick)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
                >
                  <Icon name="play" size={14} style={{ color: '#f2ece1' } as never} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
