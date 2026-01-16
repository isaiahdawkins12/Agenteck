import { useEffect, useCallback } from 'react';
import type { IpcChannels, IpcEvents } from '@shared/types';

export function useIpcInvoke<K extends keyof IpcChannels>(
  channel: K
): (...args: Parameters<IpcChannels[K]>) => ReturnType<IpcChannels[K]> {
  return useCallback(
    (...args: Parameters<IpcChannels[K]>) => {
      return window.electronAPI.invoke(channel, ...args) as ReturnType<IpcChannels[K]>;
    },
    [channel]
  );
}

export function useIpcListener<K extends keyof IpcEvents>(
  channel: K,
  callback: (data: IpcEvents[K]) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsub = window.electronAPI.on(channel, callback as (data: unknown) => void);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, ...deps]);
}
