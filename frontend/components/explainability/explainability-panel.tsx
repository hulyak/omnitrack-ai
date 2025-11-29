'use client';

import { useState } from 'react';
import { DecisionTreeVisualization } from './decision-tree-visualization';
import { NaturalLanguageSummary } from './natural-language-summary';
import { ConfidenceIndicator } from './confidence-indicator';
import { AgentAttributionBadge } from './agent-attribution-badge';
import type { ExplainabilityData } from '@/types/explainability';

interface ExplainabilityPanelProps {
  data: ExplainabilityData;
  className?: string;
}

type TabType = 'summary' | 'decision-tree' | 'agents' | 'uncertainty';

export function ExplainabilityPanel({ data, className = '' }: ExplainabilityPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { summary, decisionTree, agentContributions, uncertaintyRanges, overallConfidence } = data;

  return (
    <div className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">AI Explainability</h2>
            <p className="text-sm text-slate-400 mt-1">
              Understand how the AI reached its recommendations
            </p>
          </div>
          <ConfidenceIndicator confidence={overallConfidence} size="large" showLabel />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800/50">
        <nav className="flex -mb-px">
          <TabButton
            label="Summary"
            active={activeTab === 'summary'}
            onClick={() => setActiveTab('summary')}
            icon="📝"
          />
          <TabButton
            label="Decision Tree"
            active={activeTab === 'decision-tree'}
            onClick={() => setActiveTab('decision-tree')}
            icon="🌳"
          />
          <TabButton
            label="Agent Contributions"
            active={activeTab === 'agents'}
            onClick={() => setActiveTab('agents')}
            icon="🤖"
          />
          <TabButton
            label="Uncertainty Analysis"
            active={activeTab === 'uncertainty'}
            onClick={() => setActiveTab('uncertainty')}
            icon="📊"
          />
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'summary' && (
          <SummaryTab
            summary={summary}
            confidence={overallConfidence}
            agentContributions={agentContributions}
          />
        )}
        {activeTab === 'decision-tree' && decisionTree && (
          <DecisionTreeTab
            decisionTree={decisionTree}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
        )}
        {activeTab === 'agents' && agentContributions && (
          <AgentsTab agentContributions={agentContributions} />
        )}
        {activeTab === 'uncertainty' && uncertaintyRanges && (
          <UncertaintyTab uncertaintyRanges={uncertaintyRanges} />
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: string;
}

function TabButton({ label, active, onClick, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
        active
          ? 'border-purple-500 text-purple-400'
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SummaryTab({
  summary,
  confidence,
  agentContributions,
}: {
  summary: string;
  confidence: number;
  agentContributions?: any[];
}) {
  return (
    <div className="space-y-6">
      {/* Natural Language Summary */}
      <NaturalLanguageSummary summary={summary} confidence={confidence} />

      {/* Quick Agent Overview */}
      {agentContributions && agentContributions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Contributing Agents</h3>
          <div className="flex flex-wrap gap-2">
            {agentContributions.map((contribution) => (
              <AgentAttributionBadge
                key={contribution.agentId}
                agentName={contribution.agentName}
                confidence={contribution.confidence}
                size="medium"
              />
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>
                The recommendation is based on analysis from multiple specialized AI agents
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Overall confidence level: {(confidence * 100).toFixed(0)}%</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Explore the Decision Tree tab to see the detailed reasoning path</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DecisionTreeTab({
  decisionTree,
  selectedNode,
  onNodeSelect,
}: {
  decisionTree: any;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">How to Read This Tree</h3>
        <p className="text-sm text-slate-300">
          This decision tree shows the reasoning path the AI followed to reach its recommendations.
          Each node represents a decision point or analysis step. Node colors indicate confidence
          levels, and agent labels show which AI component contributed each insight.
        </p>
      </div>

      <DecisionTreeVisualization
        tree={decisionTree}
        selectedNode={selectedNode}
        onNodeSelect={onNodeSelect}
      />

      {selectedNode && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Node Details</h3>
          <p className="text-sm text-slate-300">Selected node: {selectedNode}</p>
        </div>
      )}
    </div>
  );
}

function AgentsTab({ agentContributions }: { agentContributions: any[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">
        Multiple specialized AI agents collaborated to generate this recommendation. Each agent
        focuses on a specific aspect of supply chain analysis.
      </p>

      <div className="space-y-4">
        {agentContributions.map((contribution) => (
          <div key={contribution.agentId} className="border border-slate-700/50 bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <AgentAttributionBadge
                  agentName={contribution.agentName}
                  confidence={contribution.confidence}
                  size="large"
                />
                <div>
                  <h4 className="font-semibold text-white">{contribution.agentName}</h4>
                  <p className="text-sm text-slate-400">{contribution.role}</p>
                </div>
              </div>
              <ConfidenceIndicator confidence={contribution.confidence} size="small" showLabel />
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-white">Key Contributions:</h5>
              <ul className="space-y-1">
                {contribution.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {contribution.dataSourcesUsed && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-400">
                  Data sources: {contribution.dataSourcesUsed.join(', ')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UncertaintyTab({ uncertaintyRanges }: { uncertaintyRanges: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Understanding Uncertainty</h3>
        <p className="text-sm text-slate-300">
          All AI predictions involve some degree of uncertainty. These ranges show the possible
          variation in predicted outcomes based on different scenarios and assumptions.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(uncertaintyRanges).map(([metric, range]: [string, any]) => (
          <div key={metric} className="border border-slate-700/50 bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white capitalize">
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <ConfidenceIndicator confidence={range.confidence} size="small" showLabel />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Best Case:</span>
                <span className="font-semibold text-green-400">
                  {formatValue(range.bestCase, metric)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Expected:</span>
                <span className="font-semibold text-white">
                  {formatValue(range.expected, metric)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Worst Case:</span>
                <span className="font-semibold text-red-400">
                  {formatValue(range.worstCase, metric)}
                </span>
              </div>
            </div>

            {/* Visual range indicator */}
            <div className="mt-3">
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  style={{ width: '100%' }}
                />
                <div
                  className="absolute h-full w-1 bg-white"
                  style={{
                    left: `${calculatePosition(range)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Best</span>
                <span>Expected</span>
                <span>Worst</span>
              </div>
            </div>

            {range.assumptions && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-400">
                  <span className="font-semibold">Assumptions:</span> {range.assumptions}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(value: number, metric: string): string {
  if (metric.toLowerCase().includes('cost')) {
    return `$${value.toLocaleString()}`;
  }
  if (metric.toLowerCase().includes('time') || metric.toLowerCase().includes('delay')) {
    return `${value} days`;
  }
  if (metric.toLowerCase().includes('percent') || metric.toLowerCase().includes('confidence')) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toLocaleString();
}

function calculatePosition(range: any): number {
  const total = range.worstCase - range.bestCase;
  const position = range.expected - range.bestCase;
  return (position / total) * 100;
}
