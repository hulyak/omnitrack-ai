'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DecisionTreeNode } from '@/types/explainability';

interface DecisionTreeVisualizationProps {
  tree: DecisionTreeNode;
  selectedNode?: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function DecisionTreeVisualization({
  tree,
  selectedNode,
  onNodeSelect,
}: DecisionTreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<DecisionTreeNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !tree) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 600;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    // Create SVG
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tree layout
    const treeLayout = d3
      .tree<DecisionTreeNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    // Convert data to hierarchy
    const root = d3.hierarchy(tree);
    const treeData = treeLayout(root);

    // Create links with animation
    const links = g
      .selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .attr(
        'd',
        d3
          .linkHorizontal<any, any>()
          .x((d: any) => d.y)
          .y((d: any) => d.x)
      );

    // Animate links
    links.transition().duration(500).attr('opacity', 1);

    // Create nodes
    const nodes = g
      .selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', function (event, d: any) {
        event.stopPropagation();
        if (onNodeSelect) {
          onNodeSelect(d.data.id === selectedNode ? null : d.data.id);
        }
      })
      .on('mouseenter', function (event, d: any) {
        setHoveredNode(d.data);
        const rect = container.getBoundingClientRect();
        setTooltipPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });

        // Highlight connected paths
        d3.select(this).select('circle').attr('r', 12).attr('stroke-width', 3);
      })
      .on('mouseleave', function () {
        setHoveredNode(null);
        d3.select(this).select('circle').attr('r', 8).attr('stroke-width', 2);
      });

    // Add circles for nodes with animation
    nodes
      .append('circle')
      .attr('r', 0)
      .attr('fill', (d: any) => getNodeColor(d.data))
      .attr('stroke', (d: any) => (d.data.id === selectedNode ? '#1e40af' : '#fff'))
      .attr('stroke-width', (d: any) => (d.data.id === selectedNode ? 3 : 2))
      .transition()
      .duration(500)
      .delay((d: any, i: number) => i * 50)
      .attr('r', 8);

    // Add labels
    nodes
      .append('text')
      .attr('dy', '.35em')
      .attr('x', (d: any) => (d.children ? -12 : 12))
      .attr('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .attr('opacity', 0)
      .text((d: any) => {
        const label = d.data.label;
        const maxLength = 30;
        return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
      })
      .transition()
      .duration(500)
      .delay((d: any, i: number) => i * 50)
      .attr('opacity', 1);

    // Add agent attribution badges
    nodes
      .filter((d: any) => d.data.agent)
      .append('rect')
      .attr('x', (d: any) => (d.children ? -80 : 12))
      .attr('y', 12)
      .attr('width', 60)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', (d: any) => getAgentColor(d.data.agent))
      .attr('opacity', 0.9);

    nodes
      .filter((d: any) => d.data.agent)
      .append('text')
      .attr('x', (d: any) => (d.children ? -50 : 42))
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text((d: any) => d.data.agent.substring(0, 8));

    // Add confidence badges
    nodes
      .filter((d: any) => d.data.confidence !== undefined)
      .append('circle')
      .attr('cx', 0)
      .attr('cy', -15)
      .attr('r', 12)
      .attr('fill', (d: any) => getConfidenceColor(d.data.confidence))
      .attr('opacity', 0.9);

    nodes
      .filter((d: any) => d.data.confidence !== undefined)
      .append('text')
      .attr('dy', '-11')
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text((d: any) => `${(d.data.confidence * 100).toFixed(0)}%`);
  }, [tree, selectedNode, onNodeSelect]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-gray-600">High Confidence (≥80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-gray-600">Good (60-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-gray-600">Medium (40-59%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-gray-600">Low (&lt;40%)</span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="overflow-x-auto">
        <svg ref={svgRef} className="border border-gray-200 rounded-lg bg-white" />
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-10 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
          }}
        >
          <div className="font-semibold mb-1">{hoveredNode.label}</div>
          {hoveredNode.value !== undefined && (
            <div className="text-gray-300">Value: {hoveredNode.value}</div>
          )}
          {hoveredNode.confidence !== undefined && (
            <div className="text-gray-300">
              Confidence: {(hoveredNode.confidence * 100).toFixed(0)}%
            </div>
          )}
          {hoveredNode.agent && (
            <div className="text-gray-300 mt-1">
              <span className="font-semibold">Agent:</span> {hoveredNode.agent}
            </div>
          )}
          {hoveredNode.description && (
            <div className="text-gray-300 mt-1 text-xs">{hoveredNode.description}</div>
          )}
        </div>
      )}
    </div>
  );
}

function getNodeColor(node: DecisionTreeNode): string {
  const confidence = node.confidence;
  if (confidence !== undefined) {
    if (confidence >= 0.8) return '#10b981'; // green-500
    if (confidence >= 0.6) return '#3b82f6'; // blue-500
    if (confidence >= 0.4) return '#f59e0b'; // orange-500
    return '#ef4444'; // red-500
  }
  return '#6b7280'; // gray-500
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#059669'; // green-600
  if (confidence >= 0.6) return '#2563eb'; // blue-600
  if (confidence >= 0.4) return '#d97706'; // orange-600
  return '#dc2626'; // red-600
}

function getAgentColor(agentName: string): string {
  const colors: Record<string, string> = {
    Info: '#8b5cf6', // purple-500
    Scenario: '#ec4899', // pink-500
    Impact: '#f59e0b', // orange-500
    Strategy: '#10b981', // green-500
    Learning: '#3b82f6', // blue-500
  };

  for (const [key, color] of Object.entries(colors)) {
    if (agentName.includes(key)) {
      return color;
    }
  }

  return '#6b7280'; // gray-500
}
