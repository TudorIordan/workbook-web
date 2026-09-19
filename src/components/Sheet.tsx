import type { ReactNode } from 'react';

export function Sheet({
  onDismiss, children, height,
}: { onDismiss: () => void; children: ReactNode; height?: string }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 11, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', background: 'rgba(var(--wb-shad-rgb),.42)',
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--wb-bg)', borderRadius: '30px 30px 0 0', animation: 'wbUp .22s ease',
          height, boxShadow: '0 -8px 30px rgba(var(--wb-shad-rgb),.2)', display: 'flex', flexDirection: 'column',
          maxHeight: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Overlay({ children, zIndex = 9 }: { children: ReactNode; zIndex?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex, background: 'var(--wb-bg)',
      animation: 'wbFade .18s ease', display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}
