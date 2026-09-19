import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Sheet } from './Sheet';
import { Chip, Pill } from './Pill';
import { NewExerciseCard } from './NewExerciseCard';
import { muscleTint } from './muscleTint';
import type { Equipment, ExerciseId, MuscleGroup } from '../domain/types';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EQUIPMENT: Equipment[] = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

export function ExercisePicker({
  onCancel, onAdd, excludeIds = [],
}: { onCancel: () => void; onAdd: (ids: ExerciseId[]) => void; excludeIds?: ExerciseId[] }) {
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [selected, setSelected] = useState<ExerciseId[]>([]);
  const [showNewCard, setShowNewCard] = useState(false);

  const filtered = useMemo(() => {
    return (exercises ?? []).filter((e) => {
      if (e.archivedAt) return false;
      if (excludeIds.includes(e.id)) return false;
      if (muscle && e.muscle !== muscle) return false;
      if (equipment && e.equipment !== equipment) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [exercises, muscle, equipment, search, excludeIds]);

  const exactMatch = (exercises ?? []).some((e) => e.name.toLowerCase() === search.trim().toLowerCase());
  const showCreatePrompt = showNewCard || (search.trim().length > 1 && !exactMatch);

  function toggle(id: ExerciseId) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <Sheet onDismiss={onCancel} height="82%">
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(var(--wb-ink-rgb),.2)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="display" style={{ fontSize: 22 }}>Add exercise</div>
          <button onClick={onCancel} style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, opacity: 0.5 }}>Cancel</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises"
          style={{ padding: '10px 14px', borderRadius: 999, background: 'var(--wb-line)', border: 'none', outline: 'none', fontSize: 14, marginBottom: 10, color: 'var(--wb-ink)' }}
        />
        <div className="wbScroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 7 }}>
          {MUSCLES.map((m) => (
            <Chip key={m} selected={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>{m}</Chip>
          ))}
        </div>
        <div className="wbScroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 12 }}>
          {EQUIPMENT.map((eq) => (
            <Chip key={eq} selected={equipment === eq} onClick={() => setEquipment(equipment === eq ? null : eq)}>{eq}</Chip>
          ))}
        </div>

        <div className="wbScroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {showCreatePrompt && (
            <NewExerciseCard
              initialName={search}
              onCreate={async (draft) => {
                const ex = await repo.createExercise(draft);
                setSelected((s) => [...s, ex.id]);
                setShowNewCard(false);
                setSearch('');
              }}
            />
          )}
          {filtered.map((ex) => {
            const isSelected = selected.includes(ex.id);
            const [bg, fg] = muscleTint(ex.muscle);
            return (
              <div
                key={ex.id}
                onClick={() => toggle(ex.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 20, cursor: 'pointer',
                  background: isSelected ? 'var(--wb-green-tint)' : 'var(--wb-surf)',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 7, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isSelected ? 'none' : 'inset 0 0 0 1.5px rgba(var(--wb-ink-rgb),.28)',
                  background: isSelected ? 'var(--wb-green)' : 'transparent', color: '#f1f7ee', fontSize: 13,
                }}>
                  {isSelected ? '✓' : ''}
                </div>
                <div className="display" style={{ width: 30, height: 30, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flex: 'none' }}>
                  {ex.name.slice(0, 1)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.5 }}>{ex.muscle} · {ex.equipment}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ paddingTop: 12 }}>
          <Pill
            variant={selected.length ? 'primary' : 'disabled'}
            disabled={!selected.length}
            onClick={() => selected.length && onAdd(selected)}
          >
            {selected.length ? `Add ${selected.length} exercise${selected.length > 1 ? 's' : ''}` : 'Select exercises'}
          </Pill>
        </div>
      </div>
    </Sheet>
  );
}
