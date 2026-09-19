import { useState } from 'react';
import type { Equipment, MeasurementType, MuscleGroup } from '../domain/types';
import { MEASUREMENTS, MEASUREMENT_ORDER } from '../domain/types';
import { Pill } from './Pill';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EQUIPMENT: Equipment[] = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band', 'Other'];

export function NewExerciseCard({
  initialName, onCreate,
}: { initialName?: string; onCreate: (draft: { name: string; muscle: MuscleGroup; equipment: Equipment; measurement: MeasurementType }) => void }) {
  const [name, setName] = useState(initialName ?? '');
  const [muscle, setMuscle] = useState<MuscleGroup>('Chest');
  const [equipment, setEquipment] = useState<Equipment>('Barbell');
  const [measurement, setMeasurement] = useState<MeasurementType>('weight_reps');

  const canCreate = name.trim().length > 0;

  return (
    <div style={{ padding: 16, borderRadius: 24, background: 'var(--wb-surf)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: 0.55 }}>New exercise</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name it above"
          className="display"
          style={{ fontSize: 19, border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--wb-ink)', padding: '4px 0' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {MUSCLES.map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            style={{
              padding: '8px 14px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700,
              background: muscle === m ? 'var(--wb-sel)' : 'var(--wb-sand-tint)',
              color: muscle === m ? 'var(--wb-sel-fg)' : 'rgba(var(--wb-ink-rgb),.65)',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {EQUIPMENT.map((eq) => (
          <button
            key={eq}
            onClick={() => setEquipment(eq)}
            style={{
              padding: '8px 14px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700,
              background: equipment === eq ? 'var(--wb-sel)' : 'var(--wb-sand-tint)',
              color: equipment === eq ? 'var(--wb-sel-fg)' : 'rgba(var(--wb-ink-rgb),.65)',
            }}
          >
            {eq}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MEASUREMENT_ORDER.map((m) => {
          const spec = MEASUREMENTS[m];
          const selected = measurement === m;
          return (
            <div
              key={m}
              onClick={() => setMeasurement(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 18, cursor: 'pointer',
                background: selected ? 'var(--wb-green-tint)' : 'var(--wb-bg)',
                boxShadow: selected ? 'inset 0 0 0 1.5px var(--wb-green)' : 'none',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flex: 'none',
                boxShadow: selected ? 'none' : 'inset 0 0 0 1.5px rgba(var(--wb-ink-rgb),.28)',
                background: selected ? 'var(--wb-green)' : 'transparent',
              }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--wb-green-ink)' : 'var(--wb-ink)' }}>{spec.label}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{spec.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      <Pill
        variant={canCreate ? 'primary' : 'disabled'}
        disabled={!canCreate}
        onClick={() => canCreate && onCreate({ name: name.trim(), muscle, equipment, measurement })}
      >
        {canCreate ? 'Create and select' : 'Enter a name'}
      </Pill>
    </div>
  );
}
