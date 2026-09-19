import { useState } from 'react';
import { Icon } from './Icon';
import { Pill } from './Pill';

interface KeypadProps {
  fieldLabel: string;
  context: string;
  currentValue: string;
  isDuration: boolean;
  onCommit: (typedValue: number) => void;
  onDone: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function parseBuffer(buffer: string, isDuration: boolean): number {
  if (isDuration) {
    const digits = buffer.replace(/\D/g, '');
    const secs = digits.length <= 2 ? Number(digits || '0') : Number(digits.slice(-2));
    const mins = digits.length <= 2 ? 0 : Number(digits.slice(0, -2));
    return mins * 60 + secs;
  }
  return Number(buffer) || 0;
}

function displayBuffer(buffer: string, isDuration: boolean): string {
  if (!buffer) return '';
  if (isDuration) {
    const digits = buffer.replace(/\D/g, '');
    const secs = digits.length <= 2 ? digits.padStart(1, '0') : digits.slice(-2);
    const mins = digits.length <= 2 ? '0' : String(Number(digits.slice(0, -2)));
    return `${mins}:${secs.padStart(2, '0')}`;
  }
  return buffer;
}

export function Keypad({ fieldLabel, context, currentValue, isDuration, onCommit, onDone }: KeypadProps) {
  const [buffer, setBuffer] = useState('');

  function commit(next: string) {
    setBuffer(next);
    if (next) onCommit(parseBuffer(next, isDuration));
  }

  function pressDigit(d: string) {
    commit(buffer + d);
  }
  function pressDecimal() {
    if (isDuration) { commit(buffer + '00'); return; }
    if (buffer.includes('.')) return;
    commit(buffer === '' ? '0.' : buffer + '.');
  }
  function pressBackspace() {
    commit(buffer.slice(0, -1));
  }

  const readout = buffer ? displayBuffer(buffer, isDuration) : currentValue;

  return (
    <div style={{ padding: '16px 16px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--wb-accent-ink)' }}>
        {fieldLabel}
      </div>
      <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{context}</div>
      <div className="display tabular" style={{ fontSize: 34, lineHeight: 1, textAlign: 'right', margin: '14px 0' }}>
        {readout}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => pressDigit(k)}
            style={{ height: 52, borderRadius: 18, border: 'none', background: 'var(--wb-line)', fontSize: 21, fontWeight: 700, color: 'var(--wb-ink)' }}
          >
            {k}
          </button>
        ))}
        <button
          onClick={pressDecimal}
          style={{ height: 52, borderRadius: 18, border: 'none', background: 'var(--wb-line)', fontSize: 21, fontWeight: 700, color: 'var(--wb-ink)' }}
        >
          {isDuration ? '00' : '.'}
        </button>
        <button
          onClick={() => pressDigit('0')}
          style={{ height: 52, borderRadius: 18, border: 'none', background: 'var(--wb-line)', fontSize: 21, fontWeight: 700, color: 'var(--wb-ink)' }}
        >
          0
        </button>
        <button
          onClick={pressBackspace}
          style={{ height: 52, borderRadius: 18, border: 'none', background: 'rgba(var(--wb-ink-rgb),.06)', color: 'rgba(var(--wb-ink-rgb),.62)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="backspace" size={24} />
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <Pill variant="primary" onClick={onDone}>Done</Pill>
      </div>
    </div>
  );
}
