import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface FundingPipelineChartProps {
  data: { status: string; count: number; color: string }[];
}

export function FundingPipelineChart({ data }: FundingPipelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const wrapperBase = wrapperRef.current;
    
    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const width = wrapperBase.clientWidth || 300;
    const height = 180;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.status))
      .range([0, innerWidth])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 10])
      .nice()
      .range([innerHeight, 0]);

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', '#e5e7eb'))
      .call(g => g.selectAll('text')
        .attr('dy', 12)
        .style('font-family', 'inherit')
        .style('font-size', '12px')
        .style('fill', '#6b7280')
      );

    // Y Axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(-innerWidth))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#f3f4f6')
        .attr('stroke-dasharray', '4,4')
      )
      .call(g => g.selectAll('text')
        .style('font-family', 'inherit')
        .style('font-size', '12px')
        .style('fill', '#6b7280')
        .attr('dx', -4)
      );

    // Bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.status) || 0)
      .attr('width', x.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .attr('ry', 4)
      .transition()
      .duration(750)
      .attr('y', d => y(d.count))
      .attr('height', d => innerHeight - y(d.count));

    // Labels
    svg.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (x(d.status) || 0) + x.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .style('font-family', 'inherit')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', '#4b5563')
      .text(d => d.count)
      .transition()
      .duration(750)
      .attr('y', d => y(d.count) - 8);

  }, [data]);

  return (
    <div ref={wrapperRef} className="w-full h-[180px]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
