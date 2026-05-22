'use client';

interface AgentResultsProps {
  results: any;
  agent: string;
}

export function AgentResults({ results, agent }: AgentResultsProps) {
  if (!results) return null;

  const renderInfoAgentResults = (data: any) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-text-primary dark:text-zinc-200">
        Anomalies Detected: {data.anomalies?.length || 0}
      </h3>
      {data.anomalies?.map((anomaly: any) => (
        <div
          key={anomaly.id}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">
                {anomaly.type}
              </span>
              <h4 className="font-medium text-text-primary dark:text-zinc-200 mt-1">
                {anomaly.location}
              </h4>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                anomaly.severity === 'high'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}
            >
              {anomaly.severity}
            </span>
          </div>
          <p className="text-sm text-text-secondary dark:text-zinc-400 mb-2">
            {anomaly.description}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            💡 {anomaly.recommendation}
          </p>
        </div>
      ))}
    </div>
  );

  const renderScenarioAgentResults = (data: any) => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary dark:text-zinc-200 mb-2">
          Scenario: {data.scenario}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-100 dark:bg-zinc-700 p-3">
            <p className="text-text-tertiary dark:text-zinc-500 mb-1">Delivery Delay</p>
            <p className="font-semibold text-text-primary dark:text-zinc-200">
              {data.impact?.deliveryDelay}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-zinc-700 p-3">
            <p className="text-text-tertiary dark:text-zinc-500 mb-1">Cost Increase</p>
            <p className="font-semibold text-red-600 dark:text-red-400">
              {data.impact?.costIncrease}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-zinc-700 p-3">
            <p className="text-text-tertiary dark:text-zinc-500 mb-1">Revenue Risk</p>
            <p className="font-semibold text-orange-600 dark:text-orange-400">
              {data.impact?.revenueRisk}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-zinc-700 p-3">
            <p className="text-text-tertiary dark:text-zinc-500 mb-1">Affected Nodes</p>
            <p className="font-semibold text-text-primary dark:text-zinc-200">
              {data.impact?.affectedNodes?.length || 0}
            </p>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-text-primary dark:text-zinc-200 mb-2">
          Recommendations
        </h4>
        <ul className="space-y-2">
          {data.recommendations?.map((rec: string, index: number) => (
            <li
              key={index}
              className="text-sm text-text-secondary dark:text-zinc-400 flex items-start gap-2"
            >
              <span className="text-green-500">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderStrategyAgentResults = (data: any) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-text-primary dark:text-zinc-200">
        Mitigation Strategies: {data.strategies?.length || 0}
      </h3>
      {data.strategies?.map((strategy: any) => (
        <div
          key={strategy.id}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-text-primary dark:text-zinc-200">
              {strategy.name}
            </h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                strategy.priority === 'high'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {strategy.priority}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div>
              <p className="text-text-tertiary dark:text-zinc-500">Timeframe</p>
              <p className="font-medium text-text-primary dark:text-zinc-200">
                {strategy.timeframe}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary dark:text-zinc-500">Cost</p>
              <p className="font-medium text-text-primary dark:text-zinc-200">{strategy.cost}</p>
            </div>
            <div>
              <p className="text-text-tertiary dark:text-zinc-500">Benefit</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {strategy.expectedBenefit}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary dark:text-zinc-500 mb-1">
              Actions:
            </p>
            <ul className="space-y-1">
              {strategy.actions?.map((action: string, index: number) => (
                <li key={index} className="text-xs text-text-secondary dark:text-zinc-400">
                  • {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

  const renderImpactAgentResults = (data: any) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary dark:text-zinc-200 mb-3">ESG Metrics</h3>
      
      {/* Environmental */}
      <div className="rounded-lg border border-green-200 dark:border-green-900/30 p-4">
        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">🌍 Environmental</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Carbon Footprint</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.environmental?.carbonFootprint}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Reduction</p>
            <p className="font-medium text-green-600 dark:text-green-400">
              {data.esgMetrics?.environmental?.carbonReduction}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Energy Efficiency</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.environmental?.energyEfficiency}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Waste Reduction</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.environmental?.wasteReduction}
            </p>
          </div>
        </div>
      </div>

      {/* Social */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-900/30 p-4">
        <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">👥 Social</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Labor Practices</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.social?.laborPractices}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Supplier Diversity</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.social?.supplierDiversity}
            </p>
          </div>
        </div>
      </div>

      {/* Governance */}
      <div className="rounded-lg border border-purple-200 dark:border-purple-900/30 p-4">
        <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2">⚖️ Governance</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Ethics Compliance</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.governance?.ethicsCompliance}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary dark:text-zinc-500">Transparency Score</p>
            <p className="font-medium text-text-primary dark:text-zinc-200">
              {data.esgMetrics?.governance?.transparencyScore}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="font-medium text-text-primary dark:text-zinc-200 mb-2">
          Recommendations
        </h4>
        <ul className="space-y-2">
          {data.recommendations?.map((rec: string, index: number) => (
            <li
              key={index}
              className="text-sm text-text-secondary dark:text-zinc-400 flex items-start gap-2"
            >
              <span className="text-green-500">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary dark:text-zinc-50">
          Agent Results
        </h2>
        <span className="text-xs text-text-tertiary dark:text-zinc-500">
          {new Date(results.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {agent === 'info' && renderInfoAgentResults(results.data)}
      {agent === 'scenario' && renderScenarioAgentResults(results.data)}
      {agent === 'strategy' && renderStrategyAgentResults(results.data)}
      {agent === 'impact' && renderImpactAgentResults(results.data)}
    </div>
  );
}
