import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Icon } from '../components/Icon';
import { Chip } from '../components/Pill';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { NewExerciseCard } from '../components/NewExerciseCard';
import { muscleTint } from '../components/muscleTint';
import { ago } from '../domain/metrics';
import { bestSet } from '../domain/analytics';
import { prStr } from '../domain/metrics';
import type { Equipment, MuscleGroup } from '../domain/types';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EQUIPMENT: Equipment[] = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

export function ExercisesTab() {
  const navigate = useNavigate();
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const settings = useLiveQuery(() => repo.getSettings(), []);
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return (exercises ?? []).filter((e) => {
      if (e.archivedAt) return false;
      if (muscle && e.muscle !== muscle) return false;
      if (equipment && e.equipment !== equipment) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [exercises, muscle, equipment, search]);

  const unit = settings?.unit ?? 'kg';

  return (
    <div>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--wb-bg)', padding: '20px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="display" style={{ fontSize: 30 }}>Exercises</div>
          <button
            onClick={() => setCreating(true)}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--wb-brick)', color: '#f2ece1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(var(--wb-accent-rgb),.24)' }}
          >
            <Icon name="plus" size={20} style={{ strokeWidth: 2.6 } as never} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 999, background: 'var(--wb-line)', marginBottom: 10 }}>
          <Icon name="search" size={16} style={{ opacity: 0.45 } as never} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, flex: 1, color: 'var(--wb-ink)' }}
          />
        </div>
        <div className="wbScroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 7 }}>
          {MUSCLES.map((m) => (
            <Chip key={m} selected={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>{m}</Chip>
          ))}
        </div>
        <div className="wbScroll" style={{ display: 'flex', gap: 7, overflowX: 'auto' }}>
          {EQUIPMENT.map((eq) => (
            <Chip key={eq} selected={equipment === eq} onClick={() => setEquipment(equipment === eq ? null : eq)}>{eq}</Chip>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 18px 118px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Nothing matches"
            body={`No ${muscle ?? ''} exercises${equipment ? ` with ${equipment}` : ''}${search ? ` matching "${search}"` : ''}.`}
            actions={(
              <>
                <button onClick={() => { setMuscle(null); setEquipment(null); setSearch(''); }} style={{ padding: '11px 20px', borderRadius: 999, border: 'none', background: 'var(--wb-line)', fontWeight: 700, fontSize: 13 }}>Clear filters</button>
                <button onClick={() => setCreating(true)} style={{ padding: '11px 20px', borderRadius: 999, border: 'none', background: 'var(--wb-sel)', color: 'var(--wb-sel-fg)', fontWeight: 700, fontSize: 13 }}>New exercise</button>
              </>
            )}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
            {filtered.map((ex) => {
              const [bg, fg] = muscleTint(ex.muscle);
              const best = sessions ? bestSet(sessions, ex.id, ex.measurement) : null;
              return (
                <div
                  key={ex.id}
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 22, background: 'var(--wb-surf)', cursor: 'pointer' }}
                >
                  <div className="display" style={{ width: 38, height: 38, borderRadius: 13, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flex: 'none' }}>
                    {ex.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.55 }}>{ex.muscle} · {ex.equipment}</div>
                  </div>
                  {best && (
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <div className="display tabular" style={{ fontSize: 15, lineHeight: 1.1 }}>{prStr(best.set, ex.measurement, unit)}</div>
                      <div style={{ fontSize: 11, opacity: 0.45 }}>{ago(best.performedAt)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <Sheet onDismiss={() => setCreating(false)} height="auto">
          <div style={{ padding: 16 }}>
            <NewExerciseCard
              initialName={search}
              onCreate={async (draft) => {
                const ex = await repo.createExercise(draft);
                setCreating(false);
                navigate(`/exercise/${ex.id}`);
              }}
            />
          </div>
        </Sheet>
      )}
    </div>
  );
}
