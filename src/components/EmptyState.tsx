import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function EmptyState({
  icon, title, body, actions,
}: { icon: IconName; title: string; body: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'var(--wb-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={25} style={{ opacity: 0.45 }} />
      </div>
      <div className="display" style={{ fontSize: 20 }}>{title}</div>
      <div style={{ fontSize: 13, opacity: 0.6, maxWidth: 240 }}>{body}</div>
      {actions && <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>{actions}</div>}
    </div>
  );
}
