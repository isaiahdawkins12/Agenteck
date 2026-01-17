import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { AgentLaunchButton } from './AgentLaunchButton';
import { AgentSelector } from './AgentSelector';
import './AgentList.css';

export function AgentList() {
  const { agents, removeAgent } = useSettingsStore();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h3>Available Agents</h3>
        {agents.length > 0 && (
          <button
            className="agent-add-button"
            onClick={() => setShowSelector(!showSelector)}
            title="Add agent"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        )}
      </div>

      {showSelector && (
        <AgentSelector onClose={() => setShowSelector(false)} />
      )}

      <div className="agent-list-items">
        {agents.length === 0 ? (
          <div className="agent-list-empty">
            <div className="empty-icon">🤖</div>
            <p>No agents added yet</p>
            <button
              className="empty-add-button"
              onClick={() => setShowSelector(true)}
            >
              Add your first agent
            </button>
          </div>
        ) : (
          agents.map((agent) => (
            <AgentLaunchButton
              key={agent.id}
              agent={agent}
              icon={agent.icon || getDefaultAgentIcon(agent.id)}
              onRemove={() => removeAgent(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function getDefaultAgentIcon(agentId: string): string {
  const icons: Record<string, string> = {
    'claude-code': '🤖',
    'openai-codex': '🧠',
    'gemini': '✨',
  };
  return icons[agentId] || '⚡';
}
