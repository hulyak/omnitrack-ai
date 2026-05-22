'use client';

import { useEffect, useState } from 'react';

interface Node {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer';
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    inventory: number;
    capacity: number;
    utilization: number;
  };
}

interface SupplyChainNetworkProps {
  demoMode?: boolean;
}

export function SupplyChainNetwork({ demoMode = false }: SupplyChainNetworkProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data and set up real-time stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectToStream = async () => {
      try {
        // Fetch initial data
        const response = await fetch('/api/supply-chain/nodes');
        if (response.ok) {
          const data = await response.json();
          setNodes(data.nodes);
        }

        // Connect to real-time stream
        eventSource = new EventSource('/api/supply-chain/stream');
        
        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.nodes) {
              setNodes(data.nodes);
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setError('Connection lost. Retrying...');
          eventSource?.close();
          
          // Retry connection after 3 seconds
          setTimeout(connectToStream, 3000);
        };
      } catch (err) {
        console.error('Error connecting to stream:', err);
        setError('Failed to connect to data stream');
      }
    };

    connectToStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'supplier':
        return '🏭';
      case 'manufacturer':
        return '⚙️';
      case 'warehouse':
        return '📦';
      case 'distributor':
        return '🚚';
      case 'retailer':
        return '🏪';
      default:
        return '📍';
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary dark:text-zinc-50">
          Supply Chain Network
        </h2>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs text-text-tertiary dark:text-zinc-500">
            {isConnected ? 'Live Data' : error || 'Connecting...'}
          </span>
        </div>
      </div>

      {nodes.length === 0 && !error && (
        <div className="text-center py-8 text-text-tertiary dark:text-zinc-500">
          Loading supply chain data...
        </div>
      )}

      {/* Network Visualization */}
      <div className="space-y-3">
        {nodes.map((node, index) => (
          <div key={node.id}>
            {/* Node Card */}
            <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4 hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(node.type)}</span>
                  <div>
                    <h3 className="font-medium text-text-primary dark:text-zinc-200 text-sm">
                      {node.name}
                    </h3>
                    <p className="text-xs text-text-tertiary dark:text-zinc-500 capitalize">
                      {node.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(node.status)}`}></div>
                  <span className="text-xs text-text-tertiary dark:text-zinc-500 capitalize">
                    {node.status}
                  </span>
                </div>
              </div>

              {/* Location & Industry Info */}
              {(node as any).location && (
                <div className="mb-3 pb-3 border-b border-slate-200 dark:border-zinc-700">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-text-tertiary dark:text-zinc-500">Location</p>
                      <p className="font-medium text-text-primary dark:text-zinc-200">
                        {(node as any).location.city}, {(node as any).location.country}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary dark:text-zinc-500">Region</p>
                      <p className="font-medium text-text-primary dark:text-zinc-200">
                        {(node as any).location.region}
                      </p>
                    </div>
                    {(node as any).details && (
                      <>
                        <div>
                          <p className="text-text-tertiary dark:text-zinc-500">Industry</p>
                          <p className="font-medium text-text-primary dark:text-zinc-200">
                            {(node as any).details.industry}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-tertiary dark:text-zinc-500">Currency</p>
                          <p className="font-medium text-text-primary dark:text-zinc-200">
                            {(node as any).details.currency}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <p className="text-text-tertiary dark:text-zinc-500 mb-1">Inventory</p>
                  <p className="font-semibold text-text-primary dark:text-zinc-200">
                    {node.metrics.inventory}
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary dark:text-zinc-500 mb-1">Capacity</p>
                  <p className="font-semibold text-text-primary dark:text-zinc-200">
                    {node.metrics.capacity}
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary dark:text-zinc-500 mb-1">Utilization</p>
                  <p className="font-semibold text-text-primary dark:text-zinc-200">
                    {node.metrics.utilization}%
                  </p>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mb-3">
                <div className="h-2 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(node.status)} transition-all duration-500`}
                    style={{ width: `${node.metrics.utilization}%` }}
                  ></div>
                </div>
              </div>

              {/* Shipping Methods */}
              {(node as any).details?.shippingMethods && (
                <div className="text-xs">
                  <p className="text-text-tertiary dark:text-zinc-500 mb-1">Shipping Methods</p>
                  <div className="flex flex-wrap gap-1">
                    {(node as any).details.shippingMethods.map((method: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-xs"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Info - Collapsible */}
              {(node as any).details && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium">
                    View Details
                  </summary>
                  <div className="mt-2 space-y-2 pl-2 border-l-2 border-purple-500/30">
                    {(node as any).details.supplierInfo && (
                      <div>
                        <p className="font-medium text-text-primary dark:text-zinc-200 mb-1">Supplier Info</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Contact: {(node as any).details.supplierInfo.contactPerson}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Lead Time: {(node as any).details.supplierInfo.leadTime}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Certs: {(node as any).details.supplierInfo.certifications.join(', ')}</p>
                      </div>
                    )}
                    {(node as any).details.factoryInfo && (
                      <div>
                        <p className="font-medium text-text-primary dark:text-zinc-200 mb-1">Factory Info</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Capacity: {(node as any).details.factoryInfo.productionCapacity}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Workforce: {(node as any).details.factoryInfo.workforceSize} employees</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Hours: {(node as any).details.factoryInfo.operatingHours}</p>
                      </div>
                    )}
                    {(node as any).details.warehouseInfo && (
                      <div>
                        <p className="font-medium text-text-primary dark:text-zinc-200 mb-1">Warehouse Info</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Type: {(node as any).details.warehouseInfo.storageType}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Security: {(node as any).details.warehouseInfo.securityLevel}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Capacity: {(node as any).details.warehouseInfo.handlingCapacity}</p>
                      </div>
                    )}
                    {(node as any).details.portInfo && (
                      <div>
                        <p className="font-medium text-text-primary dark:text-zinc-200 mb-1">Port Info</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Port: {(node as any).details.portInfo.portName} ({(node as any).details.portInfo.portCode})</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Customs: {(node as any).details.portInfo.customsClearanceTime}</p>
                      </div>
                    )}
                    {(node as any).details.distributionInfo && (
                      <div>
                        <p className="font-medium text-text-primary dark:text-zinc-200 mb-1">Distribution Info</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Coverage: {(node as any).details.distributionInfo.coverageArea}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Fleet: {(node as any).details.distributionInfo.fleetSize} vehicles</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Speed: {(node as any).details.distributionInfo.deliverySpeed}</p>
                      </div>
                    )}
                    {(node as any).details.retailerInfo && (
                      <div>
                        <p className="font-medium text-text-primary dark:text-zinc-200 mb-1">Retailer Info</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Stores: {(node as any).details.retailerInfo.storeCount}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Channels: {(node as any).details.retailerInfo.salesChannels.join(', ')}</p>
                        <p className="text-text-tertiary dark:text-zinc-500">Customers: {(node as any).details.retailerInfo.customerBase}</p>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Connection Line */}
            {index < nodes.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="w-0.5 h-4 bg-slate-300 dark:bg-zinc-600"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-text-tertiary dark:text-zinc-500">Healthy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <span className="text-text-tertiary dark:text-zinc-500">Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span className="text-text-tertiary dark:text-zinc-500">Critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
