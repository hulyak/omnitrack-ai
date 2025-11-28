'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { DecisionTreeNode } from '@/types/dashboard';

interface DecisionTreeVisualizationProps {
  tree: DecisionTreeNode;
}

export function DecisionTreeVisualization({ tree }: DecisionTreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Create links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr(
        'd',
        d3
          .linkHorizontal<any, any>()
          .x((d: any) => d.y)
          .y((d: any) => d.x)
      );

    // Create nodes
    const nodes = g
      .selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

    // Add circles for nodes
    nodes
      .append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => {
        const confidence = d.data.confidence;
        if (confidence !== undefined) {
          if (confidence >= 0.8) return '#10b981'; // green
          if (confidence >= 0.6) return '#3b82f6'; // blue
          if (confidence >= 0.4) return '#f59e0b'; // orange
          return '#ef4444'; // red
        }
        return '#6b7280'; // gray
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels
    nodes
      .append('text')
      .attr('dy', '.35em')
      .attr('x', (d: any) => (d.children ? -12 : 12))
      .attr('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text((d: any) => {
        const label = d.data.label;
        const value = d.data.value;
        if (value !== undefined) {
          return `${label}: ${value}`;
        }
        return label;
      });

    // Add agent attribution if available
    nodes
      .filter((d: any) => d.data.agent)
      .append('text')
      .attr('dy', '1.5em')
      .attr('x', (d: any) => (d.children ? -12 : 12))
      .attr('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
      .text((d: any) => `(${d.data.agent})`);

    // Add confidence badges
    nodes
      .filter((d: any) => d.data.confidence !== undefined)
      .append('text')
      .attr('dy', '-1.2em')
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text((d: any) => `${(d.data.confidence * 100).toFixed(0)}%`);
  }, [tree]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <div className="mb-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-gray-600">High Confidence (≥80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-gray-600">Good Confidence (60-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-gray-600">Medium Confidence (40-59%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-gray-600">Low Confidence (&lt;40%)</span>
        </div>
      </div>
      <svg ref={svgRef} className="border border-gray-200 rounded-lg bg-white" />
    </div>
  );
}
