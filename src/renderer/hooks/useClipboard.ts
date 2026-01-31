import { useCallback } from 'react';

export function useClipboard() {
  const readClipboard = useCallback(async (): Promise<string> => {
    return window.electronAPI.invoke('clipboard:read') as Promise<string>;
  }, []);

  const writeClipboard = useCallback(async (text: string): Promise<void> => {
    await window.electronAPI.invoke('clipboard:write', text);
  }, []);

  return { readClipboard, writeClipboard };
}
