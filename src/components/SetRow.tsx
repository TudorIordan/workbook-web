import { Icon } from './Icon';
import { SwipeDeleteRow } from './SwipeDeleteRow';

export interface SetRowProps {
  rowKey: string;
  label: string;
  isWarmup: boolean;
  v1: string | number;
  v2?: string | number;
  twoFields: boolean;
  prev: string;
  prevAvailable: boolean;
  done: boolean;
  /** Which value column (0 or 1) carries the PR badge — see PR_FIELD_INDEX. */
  prField: 0 | 1;
  isPR: boolean;
  onTapLabel: () => void;
  onTapV1: () => void;
  onTapV2: () => void;
  onTapPrev: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
}

/** The app's signature component: a set row with swipe-to-delete. */
export function SetRow(props: SetRowProps) {
  const {
    rowKey, label, isWarmup, v1, v2, twoFields, prev, prevAvailable, done, prField, isPR,
    onTapLabel, onTapV1, onTapV2, onTapPrev, onToggleDone, onDelete,
  } = props;

  const grid = twoFields ? '38px 1fr 1fr 64px 48px' : '38px 1fr 64px 48px';
  const plainStyle: React.CSSProperties = {
    height: 44, borderRadius: 14, border: 'none', background: 'transparent',
    fontSize: 16, fontWeight: 700, color: 'var(--wb-ink)',
  };
  const prStyle: React.CSSProperties = {
    ...plainStyle, color: 'var(--wb-brick)', boxShadow: 'inset 0 0 0 1.5px var(--wb-brick)',
  };
  const v1IsPR = isPR && prField === 0;
  const v2IsPR = isPR && prField === 1;

  return (
    <SwipeDeleteRow rowKey={rowKey} onDelete={onDelete} radius={18} background={done ? 'var(--wb-sand-tint)' : 'var(--wb-surf)'}>
      {(guard) => (
        <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 6, padding: '3px 2px' }}>
          <button
            onClick={() => guard(onTapLabel)}
            style={{
              height: 44, borderRadius: 14, border: 'none', fontSize: 13, fontWeight: 800,
              background: isWarmup ? 'var(--wb-green-tint)' : 'rgba(var(--wb-ink-rgb),.07)',
              color: isWarmup ? 'var(--wb-green-ink)' : 'var(--wb-ink)',
            }}
          >
            {label}
          </button>
          <button onClick={() => guard(onTapV1)} className="tabular" style={v1IsPR ? prStyle : plainStyle}>
            {v1}{v1IsPR && <span style={{ fontSize: 9, fontWeight: 800, marginLeft: 3, verticalAlign: 'super' }}>PR</span>}
          </button>
          {twoFields && (
            <button onClick={() => guard(onTapV2)} className="tabular" style={v2IsPR ? prStyle : plainStyle}>
              {v2}{v2IsPR && <span style={{ fontSize: 9, fontWeight: 800, marginLeft: 3, verticalAlign: 'super' }}>PR</span>}
            </button>
          )}
          <div
            onClick={prevAvailable ? () => guard(onTapPrev) : undefined}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
              color: 'rgba(var(--wb-ink-rgb),.62)', cursor: prevAvailable ? 'pointer' : 'default',
            }}
          >
            {prev}
          </div>
          <button
            onClick={() => guard(onToggleDone)}
            aria-label={done ? 'Mark set not done' : 'Mark set done'}
            style={{
              width: 48, height: 44, borderRadius: 15, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? 'var(--wb-green)' : 'rgba(var(--wb-ink-rgb),.07)',
              color: done ? '#f1f7ee' : 'rgba(var(--wb-ink-rgb),.35)',
            }}
          >
            <Icon name="check" size={19} style={{ strokeWidth: 3 } as never} />
          </button>
        </div>
      )}
    </SwipeDeleteRow>
  );
}
