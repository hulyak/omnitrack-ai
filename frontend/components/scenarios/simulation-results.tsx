'use client';

import { useState } from 'react';
import type { ScenarioResult } from '@/types/dashboard';
import { DecisionTreeVisualization } from '@/components/scenarios/decision-tree-visualization';

interface SimulationResultsProps {
  result: ScenarioResult;
  onReset: () => void;
}

type TabType = 'overview' | 'impacts' | 'strategies' | 'decision-tree';

export function SimulationResults({ result, onReset }: SimulationResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { impacts, strategies, decisionTree, summary, executionTime } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-700/50">
        <div>
          <h3 className="text-2xl font-bold text-white">Simulation Results</h3>
          <p className="text-slate-400 mt-1">
            Completed in {executionTime ? `${(executionTime / 1000).toFixed(1)}s` : 'N/A'}
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-6 py-3 text-sm font-semibold text-slate-300 bg-slate-800/50 border border-slate-700 hover:border-purple-500 rounded-lg hover:bg-slate-800 hover:text-purple-400 transition-all duration-200"
        >
          New Simulation
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700/50">
        <nav className="flex gap-2 -mb-px">
          <TabButton
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            label="Impact Analysis"
            active={activeTab === 'impacts'}
            onClick={() => setActiveTab('impacts')}
          />
          <TabButton
            label="Strategies"
            active={activeTab === 'strategies'}
            onClick={() => setActiveTab('strategies')}
          />
          <TabButton
            label="Decision Tree"
            active={activeTab === 'decision-tree'}
            onClick={() => setActiveTab('decision-tree')}
          />
        </nav>
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === 'overview' && <OverviewTab summary={summary} impacts={impacts} />}
        {activeTab === 'impacts' && impacts && <ImpactsTab impacts={impacts} />}
        {activeTab === 'strategies' && strategies && <StrategiesTab strategies={strategies} />}
        {activeTab === 'decision-tree' && decisionTree && (
          <DecisionTreeTab decisionTree={decisionTree} />
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all duration-200 border-b-2 ${
        active
          ? 'border-purple-500 text-purple-400 bg-slate-800/50'
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
      }`}
    >
      {label}
    </button>
  );
}

function OverviewTab({ summary, impacts }: { summary?: string; impacts?: any }) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      {summary && (
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border-2 border-purple-500/50 shadow-lg backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Executive Summary
          </h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-slate-200 leading-relaxed text-base">{summary}</p>
          </div>
        </div>
      )}

      {/* Quick metrics */}
      {impacts && (
        <div>
          <h3 className="text-xl font-bold text-white mb-6">Key Impacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Cost Impact"
              value={`$${impacts.cost.value.toLocaleString()}`}
              color="text-red-400"
              icon="💰"
            />
            <MetricCard
              label="Delivery Delay"
              value={`${impacts.deliveryTime.delayDays} days`}
              color="text-orange-400"
              icon="📦"
            />
            <MetricCard
              label="Affected Orders"
              value={impacts.deliveryTime.affectedOrders.toLocaleString()}
              color="text-yellow-400"
              icon="📋"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactsTab({ impacts }: { impacts: any }) {
  return (
    <div className="space-y-6">
      {/* Cost Impact */}
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span>
          Cost Impact
        </h3>
        <div className="space-y-3">
          <ImpactRow
            label="Direct Costs"
            value={`$${impacts.cost.breakdown.direct.toLocaleString()}`}
          />
          <ImpactRow
            label="Indirect Costs"
            value={`$${impacts.cost.breakdown.indirect.toLocaleString()}`}
          />
          <ImpactRow
            label="Opportunity Costs"
            value={`$${impacts.cost.breakdown.opportunity.toLocaleString()}`}
          />
          <div className="pt-3 border-t border-gray-200">
            <ImpactRow
              label="Total Cost"
              value={`$${impacts.cost.value.toLocaleString()} ${impacts.cost.currency}`}
              bold
            />
          </div>
        </div>
      </div>

      {/* Delivery Impact */}
      <div className="bg-orange-900/20 border border-orange-500/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📦</span>
          Delivery Impact
        </h3>
        <div className="space-y-3">
          <ImpactRow label="Average Delay" value={`${impacts.deliveryTime.delayDays} days`} />
          <ImpactRow
            label="Affected Orders"
            value={impacts.deliveryTime.affectedOrders.toLocaleString()}
          />
          <ImpactRow
            label="Critical Orders"
            value={impacts.deliveryTime.criticalOrders.toLocaleString()}
          />
        </div>
      </div>

      {/* Inventory Impact */}
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Inventory Impact
        </h3>
        <div className="space-y-3">
          <ImpactRow label="Shortfall" value={impacts.inventory.shortfall.toLocaleString()} />
          <ImpactRow label="Excess Stock" value={impacts.inventory.excessStock.toLocaleString()} />
          <ImpactRow
            label="Affected SKUs"
            value={impacts.inventory.affectedSKUs.toLocaleString()}
          />
        </div>
      </div>

      {/* Sustainability Impact */}
      {impacts.sustainability && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            Sustainability Impact
          </h3>
          <div className="space-y-3">
            <ImpactRow
              label="Carbon Footprint"
              value={`${impacts.sustainability.carbonFootprint.toLocaleString()} kg CO₂`}
            />
            <ImpactRow
              label="Emissions Increase"
              value={`${impacts.sustainability.emissionsIncrease.toFixed(1)}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StrategiesTab({ strategies }: { strategies: any[] }) {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 mb-6">
        Recommended mitigation strategies ranked by effectiveness
      </p>
      {strategies.map((strategy, index) => (
        <div
          key={strategy.id}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                {index + 1}
              </span>
              <div>
                <h4 className="font-bold text-white text-lg">{strategy.title}</h4>
                <p className="text-slate-300 mt-1 leading-relaxed">{strategy.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/50">
              <span className="text-sm text-purple-300 font-medium">Confidence:</span>
              <span className="font-bold text-purple-200">
                {(strategy.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/50">
              <p className="text-xs text-green-300 font-medium mb-2">Cost Reduction</p>
              <p className="text-lg font-bold text-green-400">
                ${strategy.impact.costReduction.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/50">
              <p className="text-xs text-blue-300 font-medium mb-2">Time Reduction</p>
              <p className="text-lg font-bold text-blue-400">
                {strategy.impact.timeReduction} days
              </p>
            </div>
            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/50">
              <p className="text-xs text-purple-300 font-medium mb-2">Risk Reduction</p>
              <p className="text-lg font-bold text-purple-400">
                {(strategy.impact.riskReduction * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionTreeTab({ decisionTree }: { decisionTree: any }) {
  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">
        Visual representation of the AI reasoning process
      </p>
      <DecisionTreeVisualization tree={decisionTree} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function ImpactRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold text-white' : 'text-slate-400'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-semibold text-white' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}
