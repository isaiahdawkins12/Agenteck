import { useSettingsStore } from '../../store/settingsStore';
import { AgentLaunchButton } from './AgentLaunchButton';
import './AgentList.css';

export function AgentList() {
  const { agents } = useSettingsStore();

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h3>Available Agents</h3>
      </div>
      <div className="agent-list-items">
        {agents.map((agent) => (
          <AgentLaunchButton
            key={agent.id}
            agent={agent}
            icon={agent.icon || getDefaultAgentIcon(agent.id)}
          />
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
