import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(can: boolean) => void>();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  listeners.forEach((l) => l(true));
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  listeners.forEach((l) => l(false));
});

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(deferred != null);
  const [standalone] = useState(isStandalone);

  useEffect(() => {
    listeners.add(setCanInstall);
    return () => { listeners.delete(setCanInstall); };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    setCanInstall(false);
  }

  return {
    standalone,
    canInstall: canInstall && !standalone,
    iosHint: isIOS() && !standalone,
    install,
  };
}
