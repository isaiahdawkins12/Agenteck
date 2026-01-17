import { useSettingsStore } from '../../store/settingsStore';
import { DEFAULT_AGENTS } from '@shared/constants';
import './AgentSelector.css';

interface AgentSelectorProps {
  onClose: () => void;
}

export function AgentSelector({ onClose }: AgentSelectorProps) {
  const { agents, addAgent } = useSettingsStore();

  // Filter out agents that are already added
  const existingAgentIds = new Set(agents.map(a => a.id));
  const availableAgents = DEFAULT_AGENTS.filter(a => !existingAgentIds.has(a.id));

  const handleAddAgent = (agentId: string) => {
    const agent = DEFAULT_AGENTS.find(a => a.id === agentId);
    if (agent) {
      addAgent({ ...agent });
      onClose();
    }
  };

  return (
    <div className="agent-selector">
      <div className="agent-selector-header">
        <span>Add Agent</span>
        <button className="agent-selector-close" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>

      {availableAgents.length === 0 ? (
        <div className="agent-selector-empty">
          All available agents have been added
        </div>
      ) : (
        <div className="agent-selector-list">
          {availableAgents.map((agent) => (
            <button
              key={agent.id}
              className="agent-selector-item"
              onClick={() => handleAddAgent(agent.id)}
            >
              <span className="agent-selector-icon">
                {getAgentIcon(agent.id)}
              </span>
              <div className="agent-selector-info">
                <span className="agent-selector-name">{agent.name}</span>
                <span className="agent-selector-desc">{agent.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getAgentIcon(agentId: string): string {
  const icons: Record<string, string> = {
    'claude-code': '🤖',
    'copilot-cli': '🐙',
    'aider': '🔧',
    'cline': '⚡',
    'continue': '▶️',
  };
  return icons[agentId] || '🤖';
}
