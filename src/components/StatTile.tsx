import type { ReactNode } from 'react';

export function StatTile({
  label, value, note, tone = 'line',
}: { label: string; value: ReactNode; note?: string; tone?: 'line' | 'inv' | 'green' }) {
  const bg = tone === 'inv' ? 'var(--wb-inv)' : tone === 'green' ? 'var(--wb-green-tint)' : 'var(--wb-line)';
  const fg = tone === 'inv' ? '#f2ece1' : tone === 'green' ? 'var(--wb-green-ink)' : 'var(--wb-ink)';
  return (
    <div style={{ flex: 1, padding: 15, borderRadius: 24, background: bg, color: fg }}>
      <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.65 }}>{label}</div>
      <div className="display tabular" style={{ fontSize: 24, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {note && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{note}</div>}
    </div>
  );
}
