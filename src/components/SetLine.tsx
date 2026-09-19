import { MEASUREMENTS, PR_FIELD_INDEX, type FieldKey, type MeasurementType, type SetRecord, type WeightUnit } from '../domain/types';
import { fieldHead, fieldValue } from '../domain/metrics';
import { SwipeDeleteRow } from './SwipeDeleteRow';

/** A single logged set as tappable, editable value chips — used by exercise detail and history detail. */
export function SetLine({
  rowKey, index, set, measurement, unit, isPR, onEditField, onDelete, background = 'var(--wb-surf)',
}: {
  rowKey: string;
  index: number;
  set: SetRecord;
  measurement: MeasurementType;
  unit: WeightUnit;
  isPR: boolean;
  onEditField: (field: FieldKey) => void;
  onDelete: () => void;
  /** Must be opaque and match the surrounding card — the delete panel behind would bleed through otherwise. */
  background?: string;
}) {
  const fields = MEASUREMENTS[measurement].fields;
  const sep = MEASUREMENTS[measurement].separator;
  const prFieldIndex = PR_FIELD_INDEX[measurement];

  return (
    <SwipeDeleteRow rowKey={rowKey} onDelete={onDelete} radius={13} background={background}>
      {(guard) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px', borderRadius: 13 }}>
          <span style={{ width: 18, fontSize: 11, fontWeight: 800, opacity: 0.62, flex: 'none' }}>{index}</span>
          {fields.map((f: FieldKey, i) => {
            const chipIsPR = isPR && i === prFieldIndex;
            return (
              <div key={f} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {i > 0 && <span style={{ opacity: 0.4, fontSize: 12 }}>{sep}</span>}
                <button
                  onClick={() => guard(() => onEditField(f))}
                  className="tabular"
                  style={{
                    border: 'none', background: 'rgba(var(--wb-ink-rgb),.05)', borderRadius: 10, padding: '4px 8px',
                    minHeight: 28, fontSize: 14, fontWeight: 800, color: chipIsPR ? 'var(--wb-brick)' : 'var(--wb-ink)',
                    boxShadow: chipIsPR ? 'inset 0 0 0 1.5px var(--wb-brick)' : 'none',
                    display: 'flex', alignItems: 'baseline', gap: 3,
                  }}
                >
                  <span>{fieldValue(set, f, unit)}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.78 }}>{fieldHead(f, unit)}</span>
                  {chipIsPR && <span style={{ fontSize: 9, fontWeight: 800, marginLeft: 1 }}>PR</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SwipeDeleteRow>
  );
}
