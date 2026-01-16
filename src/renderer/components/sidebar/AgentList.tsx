import { useSettingsStore } from '../../store/settingsStore';
import { useTerminal } from '../../hooks/useTerminal';
import type { AgentPreset } from '@shared/types';
import './AgentList.css';

export function AgentList() {
  const { agents } = useSettingsStore();
  const { launchAgent } = useTerminal();

  const handleLaunchAgent = async (agent: AgentPreset) => {
    try {
      await launchAgent(agent);
    } catch (error) {
      console.error('Failed to launch agent:', error);
    }
  };

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h3>Available Agents</h3>
      </div>
      <div className="agent-list-items">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className="agent-item"
            onClick={() => handleLaunchAgent(agent)}
            title={agent.description || `Launch ${agent.name}`}
          >
            <div className="agent-icon">
              {agent.icon || getDefaultAgentIcon(agent.id)}
            </div>
            <div className="agent-info">
              <span className="agent-name">{agent.name}</span>
              <span className="agent-command">
                {agent.command} {agent.args.join(' ')}
              </span>
            </div>
            <div className="agent-launch-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3.5a.5.5 0 01.5.5v8a.5.5 0 01-1 0V4a.5.5 0 01.5-.5zm4 0a.5.5 0 01.5.5v8a.5.5 0 01-1 0V4a.5.5 0 01.5-.5z" />
                <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 010 1.393z" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getDefaultAgentIcon(agentId: string): string {
  const icons: Record<string, string> = {
    'claude-code': '🤖',
    'copilot-cli': '🚀',
    'aider': '🔧',
    'cline': '📟',
    'continue': '➡️',
  };
  return icons[agentId] || '⚡';
}
