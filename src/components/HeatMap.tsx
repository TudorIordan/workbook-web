import { useMemo, useState } from 'react';
import { Sheet } from './Sheet';
import type { Session } from '../domain/types';

const WEEKS = 12;
const WEEKDAY_LABELS = ['M', '', 'W', '', 'F', '', 'S'];

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface DayCell {
  key: string;
  date: Date;
  bg: string;
  ring: string;
  sessionIds: string[];
}

export function HeatMap({
  sessions, onOpenSession,
}: { sessions: Session[]; onOpenSession: (id: string) => void }) {
  const [daySheet, setDaySheet] = useState<{ date: Date; sessions: Session[] } | null>(null);

  const { weeks, months, streakLabel, totalLabel } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const byKey = new Map<string, { sessionIds: string[]; sets: number }>();
    let maxSets = 1;
    sessions.forEach((s) => {
      const sets = s.entries.reduce((a, e) => a + e.sets.filter((x) => x.type === 'work').length, 0);
      const key = dayKey(new Date(s.performedAt));
      const cur = byKey.get(key);
      if (cur) { cur.sessionIds.push(s.id); cur.sets += sets; } else byKey.set(key, { sessionIds: [s.id], sets });
    });
    byKey.forEach((v) => { if (v.sets > maxSets) maxSets = v.sets; });

    const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    anchor.setDate(anchor.getDate() + (7 - ((anchor.getDay() + 6) % 7)) - 1);

    const heatWeeks: DayCell[][] = [];
    const monthCols: { label: string }[] = [];
    for (let wi = WEEKS - 1; wi >= 0; wi--) {
      const days: DayCell[] = [];
      let colMonth: Date | null = null;
      for (let di = 0; di < 7; di++) {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() - wi * 7 - (6 - di));
        if (di === 0) colMonth = d;
        const key = dayKey(d);
        const hit = byKey.get(key);
        const future = d > now;
        const t = hit ? 0.35 + 0.65 * (hit.sets / maxSets) : 0;
        days.push({
          key, date: d,
          bg: hit ? `rgba(156,59,52,${t.toFixed(2)})` : future ? 'transparent' : 'rgba(var(--wb-ink-rgb),.07)',
          ring: key === dayKey(now) ? 'inset 0 0 0 2px var(--wb-green)' : 'none',
          sessionIds: hit ? hit.sessionIds : [],
        });
      }
      monthCols.push({ label: colMonth!.getDate() <= 7 ? colMonth!.toLocaleDateString('en-US', { month: 'short' }) : '' });
      heatWeeks.push(days);
    }

    let streak = 0;
    for (let wi = 0; wi < WEEKS; wi++) {
      const any = heatWeeks[WEEKS - 1 - wi].some((d) => d.sessionIds.length);
      if (any) streak++;
      else if (wi > 0) break;
    }

    const total = sessions.filter((s) => (now.getTime() - s.performedAt) / 864e5 < 84).length;

    return {
      weeks: heatWeeks, months: monthCols,
      streakLabel: `${streak} week streak`,
      totalLabel: `${total} workouts · 12 weeks`,
    };
  }, [sessions]);

  function openCell(cell: DayCell) {
    if (!cell.sessionIds.length) return;
    if (cell.sessionIds.length === 1) { onOpenSession(cell.sessionIds[0]); return; }
    const matches = cell.sessionIds
      .map((id) => sessions.find((s) => s.id === id))
      .filter((s): s is Session => !!s)
      .sort((a, b) => a.performedAt - b.performedAt);
    setDaySheet({ date: cell.date, sessions: matches });
  }

  return (
    <div style={{ padding: '15px 15px 13px', borderRadius: 26, background: 'var(--wb-surf)', boxShadow: '0 1px 2px rgba(var(--wb-shad-rgb),.1)', maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="display" style={{ fontSize: 16 }}>{streakLabel}</div>
        <div style={{ fontSize: 11, opacity: 0.62 }}>{totalLabel}</div>
      </div>

      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 'none', width: 12 }}>
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} style={{ height: 16, fontSize: 10, fontWeight: 700, opacity: 0.62, lineHeight: '16px' }}>{label}</div>
          ))}
        </div>
        <div className="wbScroll" style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {week.map((cell) => (
                <div
                  key={cell.key}
                  onClick={() => openCell(cell)}
                  title={cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  style={{
                    position: 'relative', height: 16, borderRadius: 5, background: cell.bg, boxShadow: cell.ring,
                    cursor: cell.sessionIds.length ? 'pointer' : 'default',
                  }}
                >
                  {cell.sessionIds.length >= 2 && (
                    <div style={{
                      position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--wb-green)', boxShadow: '0 0 0 1.5px var(--wb-surf)',
                    }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '7px 0 0 16px' }}>
        {months.map((m, i) => (
          <div key={i} style={{ flex: 1, fontSize: 10, fontWeight: 700, opacity: 0.62 }}>{m.label}</div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, fontSize: 11, opacity: 0.62 }}>
        <div>Lighter</div>
        <div style={{ width: 13, height: 13, borderRadius: 4, background: 'rgba(156,59,52,.35)' }} />
        <div style={{ width: 13, height: 13, borderRadius: 4, background: 'rgba(156,59,52,.65)' }} />
        <div style={{ width: 13, height: 13, borderRadius: 4, background: 'rgba(156,59,52,1)' }} />
        <div>More sets</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--wb-green)' }} />
          <div>2+ that day</div>
        </div>
      </div>

      {daySheet && (
        <Sheet onDismiss={() => setDaySheet(null)} height="auto">
          <div style={{ padding: '14px 16px 24px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(var(--wb-ink-rgb),.2)', margin: '0 auto 14px' }} />
            <div className="display" style={{ fontSize: 20, marginBottom: 10 }}>
              {daySheet.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daySheet.sessions.map((s) => {
                const sets = s.entries.reduce((a, e) => a + e.sets.length, 0);
                return (
                  <div
                    key={s.id}
                    onClick={() => { setDaySheet(null); onOpenSession(s.id); }}
                    style={{ padding: '13px 15px', borderRadius: 20, background: 'var(--wb-line)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.55 }}>
                        {new Date(s.performedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 3 }}>
                      {s.durationMin} min · {sets} sets · {s.entries.length} exercises
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
