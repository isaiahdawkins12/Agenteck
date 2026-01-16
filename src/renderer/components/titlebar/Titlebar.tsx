import { useSettingsStore } from '../../store/settingsStore';
import { IPC_CHANNELS } from '@shared/constants';
import './Titlebar.css';

export function Titlebar() {
  const { isMaximized } = useSettingsStore();

  const handleMinimize = () => {
    window.electronAPI.invoke(IPC_CHANNELS.APP.MINIMIZE);
  };

  const handleMaximize = () => {
    window.electronAPI.invoke(IPC_CHANNELS.APP.MAXIMIZE);
  };

  const handleClose = () => {
    window.electronAPI.invoke(IPC_CHANNELS.APP.CLOSE);
  };

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <div className="titlebar-logo">
          <span className="titlebar-icon">⬡</span>
          <span className="titlebar-title">Agenteck</span>
        </div>
      </div>

      <div className="titlebar-controls">
        <button
          className="titlebar-button"
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect fill="currentColor" width="10" height="1" />
          </svg>
        </button>

        <button
          className="titlebar-button"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                fill="currentColor"
                d="M2 0v2H0v8h8V8h2V0H2zm6 8H2V4h6v4zm0-6H4V2h6v6H8V2z"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                x="0.5"
                y="0.5"
                width="9"
                height="9"
              />
            </svg>
          )}
        </button>

        <button
          className="titlebar-button titlebar-button-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              fill="currentColor"
              d="M1.41 0L0 1.41l3.59 3.59L0 8.59 1.41 10l3.59-3.59L8.59 10 10 8.59 6.41 5 10 1.41 8.59 0 5 3.59 1.41 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
