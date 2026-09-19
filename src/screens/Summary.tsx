import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { prStr, setStr } from '../domain/metrics';
import { useSettingsStore } from '../store/settings';
import { InstallPrompt } from '../components/InstallPrompt';

export function Summary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const session = useLiveQuery(() => (id ? db.sessions.get(id) : undefined), [id]);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const exMap: Record<string, { name: string; measurement: string }> = {};
  (exercises ?? []).forEach((e) => { exMap[e.id] = { name: e.name, measurement: e.measurement }; });

  const [name, setName] = useState('');
  useEffect(() => { if (session) setName(session.name); }, [session?.id, session?.name]);

  if (!session) return null;

  async function commitName() {
    const trimmed = name.trim();
    if (trimmed) await repo.updateSession(session!.id, (s) => { s.name = trimmed; });
  }

  const setCount = session.entries.reduce((a, e) => a + e.sets.length, 0);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'var(--wb-inv)', color: '#f2ece1', display: 'flex', flexDirection: 'column', padding: 'max(34px, calc(env(safe-area-inset-top) + 20px)) 22px max(28px, env(safe-area-inset-bottom))', gap: 18, animation: 'wbFade .2s ease' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: '#e0a79f' }}>WORKOUT COMPLETE</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void commitName()}
          className="display"
          style={{ fontSize: 36, lineHeight: 1.05, marginTop: 6, background: 'transparent', border: 'none', outline: 'none', color: '#f2ece1', width: '100%' }}
        />
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>
          Finished {new Date(session.performedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: 14, borderRadius: 22, background: 'rgba(247,242,232,.09)' }}>
          <div className="display" style={{ fontSize: 19 }}>{session.durationMin} min</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Duration</div>
        </div>
        <div style={{ flex: 1, padding: 14, borderRadius: 22, background: 'rgba(247,242,232,.09)' }}>
          <div className="display" style={{ fontSize: 19 }}>{setCount}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Sets</div>
        </div>
      </div>

      {session.prs && session.prs.length > 0 && (
        <div style={{ padding: 16, borderRadius: 26, background: 'var(--wb-green)', color: '#f1f7ee' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: 0.85, marginBottom: 8 }}>PERSONAL RECORDS</div>
          {session.prs.map((pr, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{exMap[pr.exerciseId]?.name ?? pr.exerciseId}</div>
              <div className="display tabular" style={{ fontSize: 18 }}>
                {exMap[pr.exerciseId] ? prStr(pr.set, exMap[pr.exerciseId].measurement as never, settings.unit) : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="wbScroll" style={{ flex: 1, overflowY: 'auto' }}>
        {session.entries.map((e) => {
          const ex = exMap[e.exerciseId];
          const top = e.sets[e.sets.length - 1];
          return (
            <div key={e.exerciseId} style={{ padding: '11px 0', borderBottom: '1px solid rgba(247,242,232,.12)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14 }}>{e.sets.length} × {ex?.name ?? e.exerciseId}</div>
              <div className="tabular" style={{ fontSize: 13, opacity: 0.65 }}>
                {ex && top ? setStr(top, ex.measurement as never, settings.unit) : ''}
              </div>
            </div>
          );
        })}
      </div>

      <InstallPrompt tone="dark" />

      <button
        onClick={() => navigate('/')}
        style={{ padding: 16, borderRadius: 999, border: 'none', background: 'var(--wb-brick)', color: '#f2ece1', fontFamily: 'Caprasimo, serif', fontSize: 18 }}
      >
        Done
      </button>
    </div>
  );
}
