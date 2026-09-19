import type { CSSProperties } from 'react';

export type IconName =
  | 'backspace' | 'chart' | 'check' | 'chevron-left' | 'chevron-right' | 'close'
  | 'dumbbell' | 'equip-any' | 'equip-barbell' | 'equip-bodyweight' | 'equip-cable'
  | 'equip-dumbbell' | 'equip-machine' | 'grip' | 'history' | 'install' | 'list' | 'minus'
  | 'moon' | 'play' | 'plus' | 'routine-new' | 'search' | 'settings' | 'sun' | 'trash'
  | 'workout';

const PATHS: Record<IconName, { d: string; sw?: number; fill?: boolean; extra?: string }> = {
  backspace: { d: 'M21 5H9.5a2 2 0 0 0-1.5.7L3 12l5 6.3a2 2 0 0 0 1.5.7H21a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z', sw: 2.2, extra: '<path d="m17 9-5 6M12 9l5 6"/>' },
  chart: { d: 'M3 3v18h18', sw: 2, extra: '<path d="m19 9-5 5-4-4-3 3"/>' },
  check: { d: 'm5 13 4 4L19 7', sw: 3 },
  'chevron-left': { d: 'm15 18-6-6 6-6', sw: 2.4 },
  'chevron-right': { d: 'm9 18 6-6-6-6', sw: 2.2 },
  close: { d: 'M18 6 6 18M6 6l12 12', sw: 2 },
  dumbbell: { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z', sw: 2 },
  'equip-any': { d: 'M3 6h18M3 12h18M3 18h18', sw: 2.4 },
  'equip-barbell': { d: 'M2 12h2M20 12h2M6 7v10M18 7v10M9 9v6M15 9v6M6 12h12', sw: 2.4 },
  'equip-bodyweight': { d: 'M12 8v7M5 10h14M9 21l3-6 3 6', sw: 2.4, extra: '<circle cx="12" cy="5" r="2.4"/>' },
  'equip-cable': { d: 'M12 3v8', sw: 2.4, extra: '<path d="M8 11h8v4a4 4 0 0 1-8 0z"/><path d="M6 21h12"/>' },
  'equip-dumbbell': { d: 'M5 8v8M9 6v12M15 6v12M19 8v8M9 12h6', sw: 2.4 },
  'equip-machine': { d: 'M7 20h10M12 16v4', sw: 2.4, extra: '<rect x="3" y="4" width="18" height="12" rx="2"/>' },
  grip: { d: 'M0 0', fill: true, extra: '<circle cx="9" cy="5" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="19" r="1.4"/><circle cx="15" cy="5" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="19" r="1.4"/>' },
  history: { d: 'M3 12a9 9 0 1 0 3-6.7L3 8', sw: 2, extra: '<path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>' },
  install: { d: 'M12 3v12M7 11l5 5 5-5M5 21h14', sw: 2.4 },
  list: { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', sw: 2 },
  minus: { d: 'M5 12h14', sw: 2.2 },
  moon: { d: 'M20.8 13.4A8.6 8.6 0 1 1 10.6 3.2a6.7 6.7 0 0 0 10.2 10.2Z', sw: 2.6 },
  play: { d: 'M6 4l14 8-14 8z', fill: true },
  plus: { d: 'M12 5v14M5 12h14', sw: 2.6 },
  'routine-new': { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', sw: 2, extra: '<path d="M12 11v6M9 14h6"/>' },
  search: { d: 'm20 20-3.5-3.5', sw: 2, extra: '<circle cx="11" cy="11" r="7"/>' },
  settings: { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', sw: 1.9, extra: '<circle cx="12" cy="12" r="3"/>' },
  sun: { d: 'M12 2.6v2M12 19.4v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.6 12h2M19.4 12h2M6 18l-1.4 1.4M19.4 4.6L18 6', sw: 2.6, extra: '<circle cx="12" cy="12" r="4.2"/>' },
  trash: { d: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14', sw: 2.75 },
  workout: { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z', sw: 2 },
};

export function Icon({ name, size = 20, style, className }: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
  const p = PATHS[name];
  const common = p.fill
    ? { fill: 'currentColor' as const }
    : { fill: 'none' as const, stroke: 'currentColor', strokeWidth: p.sw ?? 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block', flex: 'none', ...style }}
      className={className}
      {...common}
      dangerouslySetInnerHTML={{ __html: `<path d="${p.d}"/>${p.extra ?? ''}` }}
    />
  );
}
