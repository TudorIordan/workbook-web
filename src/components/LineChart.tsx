import { shortDate } from '../domain/metrics';
import type { ChartPoint } from '../domain/types';

/** Time-proportional trend line — area fill, a dot per session, hi/lo callouts, date range. */
export function LineChart({ points, unit, height = 112 }: { points: ChartPoint[]; unit: string; height?: number }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const hiVal = Math.max(...values);
  const loVal = Math.min(...values);
  const hiPoint = points.find((p) => p.value === hiVal)!;
  const loPoint = points.find((p) => p.value === loVal)!;
  const t0 = points[0].performedAt;
  const t1 = points[points.length - 1].performedAt;
  const span = Math.max(1, t1 - t0);

  const W = 300;
  const H = height;
  const padX = 6;
  const padY = 14;

  function xy(p: ChartPoint): [number, number] {
    const x = padX + ((p.performedAt - t0) / span) * (W - padX * 2);
    const y = hiVal === loVal ? H / 2 : padY + (1 - (p.value - loVal) / (hiVal - loVal)) * (H - padY * 2);
    return [x, y];
  }

  const coords = points.map(xy);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(1)},${H} L${coords[0][0].toFixed(1)},${H} Z`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div className="display tabular" style={{ fontSize: 15 }}>{hiPoint.label} {unit}</div>
          <div style={{ fontSize: 10, opacity: 0.55 }}>High</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="display tabular" style={{ fontSize: 15 }}>{loPoint.label} {unit}</div>
          <div style={{ fontSize: 10, opacity: 0.55 }}>Low</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
        <path d={areaPath} fill="var(--wb-green-tint)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--wb-green)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="var(--wb-green)" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.62, marginTop: 6 }}>
        <span>{shortDate(t0)}</span>
        <span>{shortDate(t1)}</span>
      </div>
    </div>
  );
}
