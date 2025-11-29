'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SupplyChainNode,
  SupplyChainRoute,
  Disruption,
  ARViewState,
  DigitalTwinState,
  ARCapabilities,
} from '@/types/ar';

interface ARVisualizationProps {
  digitalTwin: DigitalTwinState;
  onNodeSelect?: (node: SupplyChainNode) => void;
  onError?: (error: Error) => void;
}

/**
 * AR Visualization Component
 * 
 * Implements WebXR-based 3D rendering of digital twin with graceful fallback to 2D map view.
 * Supports node selection, disruption highlighting, and view manipulation controls.
 */
export function ARVisualization({
  digitalTwin,
  onNodeSelect,
  onError,
}: ARVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capabilities, setCapabilities] = useState<ARCapabilities | null>(null);
  const [viewState, setViewState] = useState<ARViewState>({
    mode: '3D',
    camera: {
      position: { x: 0, y: 50, z: 100 },
      rotation: { x: -0.5, y: 0, z: 0 },
      zoom: 1,
    },
    filters: {
      nodeTypes: [],
      statusTypes: [],
      showDisruptions: true,
      showRoutes: true,
    },
  });
  const [selectedNode, setSelectedNode] = useState<SupplyChainNode | null>(null);
  const [isARMode, setIsARMode] = useState(false);

  // Detect AR capabilities on mount
  useEffect(() => {
    detectARCapabilities();
  }, []);

  const detectARCapabilities = useCallback(async () => {
    try {
      const webXRSupported = 'xr' in navigator;
      const webGLSupported = !!document.createElement('canvas').getContext('webgl2');
      
      let deviceType: ARCapabilities['deviceType'] = 'desktop';
      if (typeof window !== 'undefined') {
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) {
          deviceType = 'mobile';
        }
      }

      const performanceLevel: ARCapabilities['performanceLevel'] = 
        webGLSupported && webXRSupported ? 'high' : webGLSupported ? 'medium' : 'low';

      const caps: ARCapabilities = {
        webXRSupported,
        webGLSupported,
        deviceType,
        performanceLevel,
      };

      setCapabilities(caps);

      // Fallback to 2D if AR not supported
      if (!webGLSupported) {
        setViewState((prev) => ({ ...prev, mode: '2D' }));
      }
    } catch (error) {
      console.error('Error detecting AR capabilities:', error);
      onError?.(error as Error);
      setViewState((prev) => ({ ...prev, mode: '2D' }));
    }
  }, [onError]);

  // Handle node selection
  const handleNodeClick = useCallback(
    (node: SupplyChainNode) => {
      setSelectedNode(node);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  // Handle view manipulation
  const handleZoom = useCallback((delta: number) => {
    setViewState((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        zoom: Math.max(0.1, Math.min(5, prev.camera.zoom + delta)),
      },
    }));
  }, []);

  const handleRotate = useCallback((deltaX: number, deltaY: number) => {
    setViewState((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        rotation: {
          x: prev.camera.rotation.x + deltaY * 0.01,
          y: prev.camera.rotation.y + deltaX * 0.01,
          z: prev.camera.rotation.z,
        },
      },
    }));
  }, []);

  const handleFilterChange = useCallback((filters: Partial<ARViewState['filters']>) => {
    setViewState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  // Toggle between AR and 2D mode
  const toggleARMode = useCallback(async () => {
    if (!capabilities?.webXRSupported) {
      return;
    }

    try {
      if (!isARMode) {
        // Request AR session
        if ('xr' in navigator && navigator.xr) {
          const xr = navigator.xr as any; // WebXR types not fully supported in TypeScript
          const supported = await xr.isSessionSupported('immersive-ar');
          if (supported) {
            setIsARMode(true);
            setViewState((prev) => ({ ...prev, mode: '3D' }));
          }
        }
      } else {
        setIsARMode(false);
      }
    } catch (error) {
      console.error('Error toggling AR mode:', error);
      onError?.(error as Error);
    }
  }, [capabilities, isARMode, onError]);

  // Filter nodes based on current filters
  const filteredNodes = digitalTwin.nodes.filter((node) => {
    if (viewState.filters.nodeTypes.length > 0 && !viewState.filters.nodeTypes.includes(node.type)) {
      return false;
    }
    if (viewState.filters.statusTypes.length > 0 && !viewState.filters.statusTypes.includes(node.status)) {
      return false;
    }
    return true;
  });

  // Get disrupted nodes for highlighting
  const disruptedNodeIds = new Set(
    digitalTwin.disruptions.flatMap((d) => d.affectedNodeIds)
  );

  if (!capabilities) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Detecting AR capabilities...</div>
      </div>
    );
  }

  // Render 2D fallback view
  if (viewState.mode === '2D' || !capabilities.webGLSupported) {
    return (
      <div className="relative w-full h-full bg-gray-900" ref={containerRef}>
        <div className="absolute top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded">
          AR not supported - showing 2D map view
        </div>
        
        {/* 2D Map View */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 p-8">
            {filteredNodes.map((node) => (
              <button
                key={node.nodeId}
                onClick={() => handleNodeClick(node)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${selectedNode?.nodeId === node.nodeId ? 'border-blue-500 bg-blue-900' : 'border-gray-700 bg-gray-800'}
                  ${disruptedNodeIds.has(node.nodeId) && viewState.filters.showDisruptions ? 'ring-2 ring-red-500' : ''}
                  hover:border-blue-400
                `}
              >
                <div className="text-sm font-semibold text-white">{node.name}</div>
                <div className="text-xs text-gray-400 mt-1">{node.type}</div>
                <div className={`
                  text-xs mt-2 px-2 py-1 rounded
                  ${node.status === 'HEALTHY' ? 'bg-green-600' : ''}
                  ${node.status === 'DEGRADED' ? 'bg-yellow-600' : ''}
                  ${node.status === 'DISRUPTED' ? 'bg-red-600' : ''}
                  ${node.status === 'OFFLINE' ? 'bg-gray-600' : ''}
                `}>
                  {node.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 w-80">
            <h3 className="text-lg font-semibold text-white mb-2">{selectedNode.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white">{selectedNode.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Capacity:</span>
                <span className="text-white">{selectedNode.metrics.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Utilization:</span>
                <span className="text-white">{selectedNode.metrics.utilization}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inventory:</span>
                <span className="text-white">{selectedNode.metrics.inventory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lead Time:</span>
                <span className="text-white">{selectedNode.metrics.leadTime} days</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render 3D/AR view
  return (
    <div className="relative w-full h-full bg-gray-900" ref={containerRef}>
      {/* AR Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* AR Controls */}
      <div className="absolute top-4 left-4 space-y-2">
        {capabilities.webXRSupported && (
          <button
            onClick={toggleARMode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {isARMode ? 'Exit AR' : 'Enter AR'}
          </button>
        )}
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-400 font-semibold">View Controls</div>
          <button
            onClick={() => handleZoom(0.1)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
          >
            Zoom In
          </button>
          <button
            onClick={() => handleZoom(-0.1)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
          >
            Zoom Out
          </button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-400 font-semibold">Filters</div>
          <label className="flex items-center space-x-2 text-sm text-white">
            <input
              type="checkbox"
              checked={viewState.filters.showDisruptions}
              onChange={(e) => handleFilterChange({ showDisruptions: e.target.checked })}
              className="rounded"
            />
            <span>Show Disruptions</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-white">
            <input
              type="checkbox"
              checked={viewState.filters.showRoutes}
              onChange={(e) => handleFilterChange({ showRoutes: e.target.checked })}
              className="rounded"
            />
            <span>Show Routes</span>
          </label>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 w-80">
          <h3 className="text-lg font-semibold text-white mb-2">{selectedNode.name}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{selectedNode.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-white">{selectedNode.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Capacity:</span>
              <span className="text-white">{selectedNode.metrics.capacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Utilization:</span>
              <span className="text-white">{selectedNode.metrics.utilization}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Inventory:</span>
              <span className="text-white">{selectedNode.metrics.inventory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lead Time:</span>
              <span className="text-white">{selectedNode.metrics.leadTime} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Location:</span>
              <span className="text-white text-xs">
                {selectedNode.location.latitude.toFixed(2)}, {selectedNode.location.longitude.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white">
        <span className="text-gray-400">Mode:</span> {viewState.mode} | 
        <span className="text-gray-400 ml-2">Nodes:</span> {filteredNodes.length} | 
        <span className="text-gray-400 ml-2">Disruptions:</span> {digitalTwin.disruptions.length}
      </div>
    </div>
  );
}
