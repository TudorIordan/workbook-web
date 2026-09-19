import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type Variant = 'primary' | 'primaryCompact' | 'neutral' | 'quiet' | 'dashed' | 'ghost' | 'text' | 'disabled';

const VARIANT_STYLE: Record<Variant, CSSProperties> = {
  primary: { padding: '15px', borderRadius: 999, background: 'var(--wb-brick)', color: '#f2ece1', fontFamily: 'Caprasimo, serif', fontSize: 17 },
  primaryCompact: { padding: '9px 17px', borderRadius: 999, background: 'var(--wb-brick)', color: '#f2ece1', fontWeight: 700, fontSize: 13 },
  neutral: { padding: '13px', borderRadius: 999, background: 'var(--wb-sel)', color: 'var(--wb-sel-fg)', fontWeight: 700, fontSize: 14 },
  quiet: { padding: '9px', borderRadius: 14, background: 'rgba(var(--wb-ink-rgb),.05)', color: 'rgba(var(--wb-ink-rgb),.55)', fontWeight: 700, fontSize: 13 },
  dashed: { padding: '14px', borderRadius: 999, background: 'transparent', border: '1.5px dashed rgba(var(--wb-ink-rgb),.28)', color: 'var(--wb-accent-ink)', fontWeight: 700, fontSize: 14 },
  ghost: { padding: '12px', borderRadius: 999, background: 'transparent', boxShadow: 'var(--sh-inset-ring)', color: 'inherit', fontWeight: 700, fontSize: 13 },
  text: { padding: '10px 12px', borderRadius: 999, background: 'transparent', color: 'rgba(var(--wb-ink-rgb),.62)', fontWeight: 700, fontSize: 13 },
  disabled: { padding: '15px', borderRadius: 999, background: 'rgba(var(--wb-ink-rgb),.25)', color: 'var(--wb-bg)', fontFamily: 'Caprasimo, serif', fontSize: 17, cursor: 'default' },
};

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Pill({ variant = 'neutral', icon, children, style, ...rest }: PillProps) {
  return (
    <button
      {...rest}
      style={{
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 9, width: '100%', textAlign: 'center', transition: 'transform .15s',
        ...VARIANT_STYLE[variant], ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function Chip({
  selected, onClick, children, icon,
}: { selected: boolean; onClick: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 'none', border: 'none', padding: '6px 13px', borderRadius: 999,
        fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
        background: selected ? 'var(--wb-sel)' : 'var(--wb-line)',
        color: selected ? 'var(--wb-sel-fg)' : 'rgba(var(--wb-ink-rgb),.6)',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </button>
  );
}
