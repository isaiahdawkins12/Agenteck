import { useLayoutStore } from '../../store/layoutStore';
import { useTerminal } from '../../hooks/useTerminal';
import { DEFAULT_LAYOUT_PRESETS } from '@shared/constants';
import './LayoutPresets.css';

export function LayoutPresets() {
  const { setLayout } = useLayoutStore();
  const { createNewTerminal, closeAllTerminals, terminals } = useTerminal();

  const handleApplyPreset = async (presetId: string) => {
    const preset = DEFAULT_LAYOUT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Close existing terminals
    await closeAllTerminals();

    // Apply layout based on preset
    if (preset.id === 'single') {
      const session = await createNewTerminal();
      setLayout(session.id);
    } else if (preset.id === 'split-horizontal') {
      const session1 = await createNewTerminal();
      const session2 = await createNewTerminal();
      setLayout({
        direction: 'row',
        first: session1.id,
        second: session2.id,
        splitPercentage: 50,
      });
    } else if (preset.id === 'split-vertical') {
      const session1 = await createNewTerminal();
      const session2 = await createNewTerminal();
      setLayout({
        direction: 'column',
        first: session1.id,
        second: session2.id,
        splitPercentage: 50,
      });
    } else if (preset.id === 'quad') {
      const session1 = await createNewTerminal();
      const session2 = await createNewTerminal();
      const session3 = await createNewTerminal();
      const session4 = await createNewTerminal();
      setLayout({
        direction: 'row',
        first: {
          direction: 'column',
          first: session1.id,
          second: session2.id,
          splitPercentage: 50,
        },
        second: {
          direction: 'column',
          first: session3.id,
          second: session4.id,
          splitPercentage: 50,
        },
        splitPercentage: 50,
      });
    }
  };

  const terminalCount = Object.keys(terminals).length;

  return (
    <div className="layout-presets">
      <div className="layout-presets-header">
        <h3>Layout Presets</h3>
      </div>
      <div className="layout-presets-items">
        {DEFAULT_LAYOUT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="layout-preset-item"
            onClick={() => handleApplyPreset(preset.id)}
            title={preset.description}
          >
            <span className="layout-preset-icon">{preset.icon}</span>
            <div className="layout-preset-info">
              <span className="layout-preset-name">{preset.name}</span>
              <span className="layout-preset-description">
                {preset.description}
              </span>
            </div>
          </button>
        ))}
      </div>
      {terminalCount > 0 && (
        <div className="layout-presets-warning">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM6.5 4a.5.5 0 011 0v3a.5.5 0 01-1 0V4zm.5 5.5a.75.75 0 100 1.5.75.75 0 000-1.5z" />
          </svg>
          <span>Applying a preset will close existing terminals</span>
        </div>
      )}
    </div>
  );
}
