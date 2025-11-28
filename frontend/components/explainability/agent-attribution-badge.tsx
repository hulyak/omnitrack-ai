'use client';

interface AgentAttributionBadgeProps {
  agentName: string;
  confidence?: number;
  size?: 'small' | 'medium' | 'large';
  showConfidence?: boolean;
  className?: string;
}

export function AgentAttributionBadge({
  agentName,
  confidence,
  size = 'medium',
  showConfidence = true,
  className = '',
}: AgentAttributionBadgeProps) {
  const agentInfo = getAgentInfo(agentName);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const iconSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 rounded-full font-medium ${agentInfo.bgColor} ${agentInfo.textColor} ${sizeClasses[size]} ${className}`}
    >
      <span className={iconSizeClasses[size]}>{agentInfo.icon}</span>
      <span>{agentName}</span>
      {showConfidence && confidence !== undefined && (
        <span className="opacity-75">({Math.round(confidence * 100)}%)</span>
      )}
    </div>
  );
}

interface AgentInfo {
  icon: string;
  bgColor: string;
  textColor: string;
  description: string;
}

function getAgentInfo(agentName: string): AgentInfo {
  const agentMap: Record<string, AgentInfo> = {
    'Info Agent': {
      icon: '📊',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      description: 'Gathers and synthesizes supply chain data',
    },
    'Scenario Agent': {
      icon: '🎯',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-700',
      description: 'Generates disruption scenarios',
    },
    'Impact Agent': {
      icon: '💥',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      description: 'Analyzes potential impacts',
    },
    'Strategy Agent': {
      icon: '🎲',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      description: 'Recommends mitigation strategies',
    },
    'Learning Module': {
      icon: '🧠',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      description: 'Learns from feedback and improves predictions',
    },
    'Sustainability Service': {
      icon: '🌱',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      description: 'Calculates environmental impact',
    },
  };

  // Try exact match first
  if (agentMap[agentName]) {
    return agentMap[agentName];
  }

  // Try partial match
  for (const [key, value] of Object.entries(agentMap)) {
    if (agentName.includes(key) || key.includes(agentName)) {
      return value;
    }
  }

  // Default fallback
  return {
    icon: '🤖',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    description: 'AI Agent',
  };
}

// Detailed agent card component
export function AgentAttributionCard({
  agentName,
  confidence,
  insights,
  dataSourcesUsed,
  className = '',
}: {
  agentName: string;
  confidence: number;
  insights: string[];
  dataSourcesUsed?: string[];
  className?: string;
}) {
  const agentInfo = getAgentInfo(agentName);

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${agentInfo.bgColor}`}
          >
            {agentInfo.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{agentName}</h4>
            <p className="text-sm text-gray-600">{agentInfo.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-600">Confidence:</span>
          <span className={`text-sm font-semibold ${agentInfo.textColor}`}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      {insights && insights.length > 0 && (
        <div className="space-y-2 mb-3">
          <h5 className="text-sm font-semibold text-gray-900">Key Insights:</h5>
          <ul className="space-y-1">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className={`mr-2 ${agentInfo.textColor}`}>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dataSourcesUsed && dataSourcesUsed.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Data sources:</span> {dataSourcesUsed.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact agent list component
export function AgentAttributionList({
  agents,
  className = '',
}: {
  agents: Array<{ name: string; confidence?: number }>;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {agents.map((agent, idx) => (
        <AgentAttributionBadge
          key={idx}
          agentName={agent.name}
          confidence={agent.confidence}
          size="small"
        />
      ))}
    </div>
  );
}
