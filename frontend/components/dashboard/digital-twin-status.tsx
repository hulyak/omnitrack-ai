'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/websocket-context';

interface DigitalTwinData {
  status: 'active' | 'syncing' | 'error';
  lastSync: string;
  nodeCount: number;
  healthyNodes: number;
  degradedNodes: number;
  disruptedNodes: number;
}

interface DigitalTwinStatusProps {
  data?: DigitalTwinData;
  isLoading: boolean;
  error?: Error;
}

export function DigitalTwinStatus({ data, isLoading, error }: DigitalTwinStatusProps) {
  const { subscribe } = useWebSocket();
  const [liveData, setLiveData] = useState<DigitalTwinData | undefined>(data);

  useEffect(() => {
    if (data) {
      setLiveData(data);
    }
  }, [data]);

  useEffect(() => {
    const unsubscribe = subscribe('digital_twin_update', (message) => {
      setLiveData(message.data as DigitalTwinData);
    });

    return unsubscribe;
  }, [subscribe]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Digital Twin Status
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
          Digital Twin Status
        </h2>
        <p className="text-error">Error loading digital twin data</p>
      </div>
    );
  }

  const statusColor = {
    active: 'bg-success',
    syncing: 'bg-warning',
    error: 'bg-error',
  }[liveData?.status || 'error'];

  const statusText = {
    active: 'Active',
    syncing: 'Syncing',
    error: 'Error',
  }[liveData?.status || 'error'];

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-text-primary dark:text-zinc-50">
        Digital Twin Status
      </h2>

      {liveData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusColor}`}></div>
            <span className="font-medium text-text-primary dark:text-zinc-300">{statusText}</span>
          </div>

          <div className="space-y-2 text-sm text-text-secondary dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Total Nodes</span>
              <span className="font-medium text-text-primary dark:text-zinc-300">
                {liveData.nodeCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Healthy</span>
              <span className="font-medium text-success">{liveData.healthyNodes}</span>
            </div>
            {liveData.degradedNodes > 0 && (
              <div className="flex justify-between">
                <span>Degraded</span>
                <span className="font-medium text-warning">{liveData.degradedNodes}</span>
              </div>
            )}
            {liveData.disruptedNodes > 0 && (
              <div className="flex justify-between">
                <span>Disrupted</span>
                <span className="font-medium text-error">{liveData.disruptedNodes}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3 dark:border-zinc-700">
            <p className="text-xs text-text-tertiary dark:text-zinc-500">
              Last synced: {new Date(liveData.lastSync).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
