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
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Simulation Results</h2>
            <p className="text-sm text-gray-600 mt-1">
              Completed in {executionTime ? `${(executionTime / 1000).toFixed(1)}s` : 'N/A'}
            </p>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New Simulation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
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
      <div className="p-6">
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
      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function OverviewTab({ summary, impacts }: { summary?: string; impacts?: any }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {/* Quick metrics */}
      {impacts && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Impacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Total Cost Impact"
              value={`$${impacts.cost.value.toLocaleString()}`}
              color="text-red-600"
              icon="💰"
            />
            <MetricCard
              label="Delivery Delay"
              value={`${impacts.deliveryTime.delayDays} days`}
              color="text-orange-600"
              icon="📦"
            />
            <MetricCard
              label="Affected Orders"
              value={impacts.deliveryTime.affectedOrders.toLocaleString()}
              color="text-yellow-600"
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
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Impact</h3>
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
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Impact</h3>
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
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Impact</h3>
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
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainability Impact</h3>
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
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Recommended mitigation strategies ranked by effectiveness
      </p>
      {strategies.map((strategy, index) => (
        <div
          key={strategy.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </span>
              <div>
                <h4 className="font-semibold text-gray-900">{strategy.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-gray-600">Confidence:</span>
              <span className="font-semibold text-gray-900">
                {(strategy.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Cost Reduction</p>
              <p className="text-sm font-semibold text-green-600">
                ${strategy.impact.costReduction.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Time Reduction</p>
              <p className="text-sm font-semibold text-green-600">
                {strategy.impact.timeReduction} days
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Risk Reduction</p>
              <p className="text-sm font-semibold text-green-600">
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
      <p className="text-sm text-gray-600 mb-4">
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
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function ImpactRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
