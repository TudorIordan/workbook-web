import { chartBarPct } from '../domain/analytics';
import { shortDate } from '../domain/metrics';
import type { ChartPoint } from '../domain/types';

export function BarChart({ points, height = 112 }: { points: ChartPoint[]; height?: number }) {
  const pcts = chartBarPct(points.map((p) => p.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {points.map((p, i) => (
        <div key={p.performedAt} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div className="tabular" style={{ fontSize: 10, opacity: 0.62, marginBottom: 2 }}>{p.label}</div>
          <div style={{
            width: '100%', height: `${Math.max(4, pcts[i])}%`, borderRadius: '6px 6px 3px 3px',
            background: 'var(--wb-brick)',
          }} />
          <div style={{ fontSize: 10, opacity: 0.62, marginTop: 4 }}>{shortDate(p.performedAt)}</div>
        </div>
      ))}
    </div>
  );
}
