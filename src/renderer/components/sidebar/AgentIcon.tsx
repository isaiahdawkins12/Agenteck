import claudeIcon from '../../assets/agent-icons/claude.svg';
import geminiIcon from '../../assets/agent-icons/gemini.svg';
import codexIcon from '../../assets/agent-icons/codex.svg';
import qwenIcon from '../../assets/agent-icons/qwen.svg';
import opencodeIcon from '../../assets/agent-icons/opencode.svg';
import copilotIcon from '../../assets/agent-icons/copilot.svg';

const AGENT_ICONS: Record<string, string> = {
  claude: claudeIcon,
  gemini: geminiIcon,
  codex: codexIcon,
  qwen: qwenIcon,
  opencode: opencodeIcon,
  copilot: copilotIcon,
};

interface AgentIconProps {
  agentId: string;
  size?: number;
  className?: string;
}

export function AgentIcon({ agentId, size = 20, className = '' }: AgentIconProps) {
  const iconSrc = AGENT_ICONS[agentId];

  if (!iconSrc) {
    // Fallback to a default icon for unknown agents
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        🤖
      </span>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={`${agentId} icon`}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
    />
  );
}
