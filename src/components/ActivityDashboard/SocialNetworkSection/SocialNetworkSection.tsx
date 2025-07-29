import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Network } from 'vis-network';
import * as d3 from 'd3';
import { ActivityRecord } from '../types';
import './SocialNetworkSection.css';

interface SocialNetworkSectionProps {
  data: ActivityRecord[];
  hideNames: boolean;
  currentAuthor: { _id: string; role: string; name: string; pseudoName: string; };
}

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  font: { size: number; color: string };
  color: {
    background: string;
    border: string;
    highlight: { background: string; border: string };
  };
  borderWidth: number;
  shadow: boolean;
}

interface NetworkEdge {
  id: any;
  from: string;
  to: string;
  value: number;
  width: number;
  color: {
    color: string;
    highlight: string;
    hover: string;
  };
  arrows?: string;
  title: string;
  smooth: { type: string };
}

const SocialNetworkSection: React.FC<SocialNetworkSectionProps> = ({
  data,
  hideNames,
  currentAuthor
}) => {
  const networkRef = useRef<HTMLDivElement>(null);
  const readingPatternRef = useRef<HTMLDivElement>(null);
  const beingReadPatternRef = useRef<HTMLDivElement>(null);
  //const timelineRef = useRef<HTMLDivElement>(null);
  
  const [network, setNetwork] = useState<Network | null>(null);
  const [showNetwork, setShowNetwork] = useState(true);
  const [networkSettings, setNetworkSettings] = useState({
    nodeSize: 15,
    edgeWidth: 8,
    directional: false
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState<[Date, Date] | null>(null);

  // Get date range for the timeline
  const dateRange = useMemo(() => {
    if (data.length === 0) return null;
    const dates = data.map(d => d.date);
    return [new Date(Math.min(...dates.map(d => d.getTime()))), new Date(Math.max(...dates.map(d => d.getTime())))];
  }, [data]);

  // Filter data by time range if selected
  const filteredData = useMemo(() => {
    if (!selectedTimeRange) return data;
    const [start, end] = selectedTimeRange;
    return data.filter(d => d.date >= start && d.date <= end);
  }, [data, selectedTimeRange]);

  // Process data for network visualization
  const networkData = useMemo(() => {
    const readData = filteredData.filter(d => d.type === 'read');
  
    // Step 1: Build user info
    const userInfo: { [key: string]: { name: string; interactions: number; realName: string } } = {};
  
    readData.forEach(interaction => {
      const userId = interaction.fromId;
      const displayName = hideNames && userId !== currentAuthor._id
        ? interaction.fromPseudo
        : interaction.from;
      const realName = interaction.from;
  
      if (!userInfo[displayName]) {
        userInfo[displayName] = {
          name: displayName,
          interactions: 0,
          realName: realName
        };
      }
      userInfo[displayName].interactions++;
    });
  
    // Step 2: Build edges
    const userConnections: { [fromUser: string]: { [toUser: string]: number } } = {};
  
    readData.forEach(interaction => {
      const fromUser = hideNames && interaction.fromId !== currentAuthor._id
        ? interaction.fromPseudo
        : interaction.from;
      const toUser = hideNames && interaction.to !== currentAuthor.name
        ? interaction.toPseudo
        : interaction.to;
  
      if (fromUser === toUser) return;
  
      if (!userConnections[fromUser]) userConnections[fromUser] = {};
      userConnections[fromUser][toUser] = (userConnections[fromUser][toUser] || 0) + 1;
    });
  
    // Step 3: Create nodes
    const maxInteractions = Math.max(...Object.values(userInfo).map(u => u.interactions));
    const minNodeSize = Math.max(10, networkSettings.nodeSize);
    const maxNodeSize = Math.max(30, networkSettings.nodeSize * 2);
  
    const nodes: NetworkNode[] = Object.entries(userInfo).map(([userId, info]) => {
        const isCurrentUser =
        userId === currentAuthor.name ||
        userId === currentAuthor._id;
  
      const sizeRatio = info.interactions / maxInteractions;
      const nodeSize = minNodeSize + (maxNodeSize - minNodeSize) * sizeRatio;
  
      return {
        id: userId,
        label: userId,
        size: Math.min(nodeSize, maxNodeSize),
        title: `${userId}\Reads: ${info.interactions}`,
        font: {
          size: 30,
          color: '#333333'
        },
        color: {
          background: isCurrentUser ? '#e74c3c' : '#3498db',
          border: isCurrentUser ? '#c0392b' : '#2980b9',
          highlight: {
            background: isCurrentUser ? '#e67e22' : '#5dade2',
            border: isCurrentUser ? '#d35400' : '#3498db'
          }
        },
        borderWidth: 2,
        shadow: true
      };
    });
  
    // Step 4: Create edges
    const edges: NetworkEdge[] = [];
    const edgeMap: { [key: string]: NetworkEdge } = {};
  
    Object.entries(userConnections).forEach(([fromUser, targets]) => {
      Object.entries(targets).forEach(([toUser, count]) => {
        if (fromUser === toUser) return;
  
        if (networkSettings.directional) {
          const key = `${fromUser}->${toUser}`;
          if (!edgeMap[key]) {
            edgeMap[key] = {
              id: key,
              from: fromUser,
              to: toUser,
              value: 0,
              width: 1,
              color: {
                color: '#95a5a6',
                highlight: '#34495e',
                hover: '#34495e'
              },
              arrows: 'to',
              title: '',
              smooth: { type: 'continuous' }
            };
          }
          edgeMap[key].value += count;
          edgeMap[key].width = Math.max(1, Math.min(edgeMap[key].value * networkSettings.edgeWidth / 3, 15));
          edgeMap[key].title = `${fromUser} → ${toUser}: ${edgeMap[key].value} interactions`;
        } 
        else {
            const [user1, user2] = [fromUser, toUser].sort(); 
            const key = `${user1}<->${user2}`;
          
            if (!edgeMap[key]) {
              edgeMap[key] = {
                id: key,
                from: user1,
                to: user2,
                value: 0,
                width: 1,
                color: {
                  color: '#95a5a6',
                  highlight: '#34495e',
                  hover: '#34495e'
                },
                arrows: undefined,
                title: '',
                smooth: { type: 'continuous' }
              };
            }
          
            edgeMap[key].value += count;
            edgeMap[key].width = Math.max(1, Math.min(edgeMap[key].value * networkSettings.edgeWidth / 3, 15));
            edgeMap[key].title = `${user1} ↔ ${user2}: ${edgeMap[key].value} interactions`;
          }
      });
    });
  
    edges.push(...Object.values(edgeMap));


    if(networkSettings.directional == false){
    edges.forEach(edge => {
        edge.value = Math.max(0, edge.value - 1);
      });
    }
  
    return { nodes, edges };
  }, [filteredData, hideNames, currentAuthor, networkSettings]);
  
  

  // Process data for reading patterns
  const readingPatternsData = useMemo(() => {
    const readData = filteredData.filter(d => d.type === 'read');
    
    // Reading Activity: Who is reading
    const readingActivity = d3.rollup(
      readData,
      v => v.length,
      d => hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from
    );

    const beingReadActivity = d3.rollup(
        readData,
        v => v.length,
        d => hideNames && (d.to !== currentAuthor.name)  ? d.toPseudo : d.to
      );
      

    const readingData = Array.from(readingActivity, ([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const beingReadData = Array.from(beingReadActivity, ([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { readingData, beingReadData };
  }, [filteredData, hideNames, currentAuthor]);

  // Timeline data
  const timelineData = useMemo(() => {
    const dailyData = d3.rollup(
      filteredData,
      v => v.length,
      d => d3.timeDay(d.date)
    );

    return Array.from(dailyData, ([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredData]);

  // Initialize network
  useEffect(() => {
    if (!networkRef.current || !showNetwork) return;

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 50
        }
      },
      edges: {
        smooth: {
          type: 'continuous'
        }
      },
      physics: {
        stabilization: { iterations: 200 },
        barnesHut: {
          gravitationalConstant: -80000,
          springConstant: 0.001,
          springLength: 200
        }
      },
      interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        hover: true
      }
    };

    const networkInstance = new Network(
      networkRef.current,
      networkData,
      {
        ...options,
        interaction: {
          ...options.interaction,
          tooltipDelay: 100,
          hover: true
        }
      }
    );

    networkInstance.on('hoverNode', function (params) {
      if (networkRef.current) {
        networkRef.current.style.cursor = 'pointer';
      }
      
      const nodeId = params.node;
      const nodeData = networkData.nodes.find(n => n.id === nodeId);
      if (nodeData) {
        let tooltip = document.getElementById('network-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'network-tooltip';
          tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.2s ease;
          `;
          document.body.appendChild(tooltip);
        }
        
        const interactionCount = nodeData.title?.split('Reads: ')[1] || '0';
        tooltip.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 4px;">${nodeData.label}</div>
          <div>Reads: ${interactionCount}</div>
        `;
        tooltip.style.opacity = '1';
      }
    });

    networkInstance.on('blurNode', function (params) {
      if (networkRef.current) {
        networkRef.current.style.cursor = 'default';
      }
      
      const tooltip = document.getElementById('network-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    });

    networkInstance.on('hoverEdge', function (params) {
        if (networkRef.current) {
          networkRef.current.style.cursor = 'pointer';
        }
        
        // Get edge information from the vis-network event
        const edgeId = params.edge;
        
        // Find the corresponding edge in our data
        const edgeData = networkData.edges.find(edge => 
          (edge.id === edgeId) ||
          (!networkSettings.directional && edge.id === edgeId)
        );
        
        // Create or update tooltip
        let tooltip = document.getElementById('network-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'network-tooltip';
          tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.2s ease;
          `;
          document.body.appendChild(tooltip);
        }
        
        if (edgeData && edgeId) {
          tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${edgeData.from} ${networkSettings.directional ? ' → ' : ' ↔ '} ${edgeData.to}</div>
            <div>${edgeData.value} shared content pieces</div>
          `;
        } else {
          tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${edgeData?.from || 'Unknown'} ${networkSettings.directional ? ' → ' : ' ↔ '} ${edgeData?.to || 'Unknown'}</div>
            <div>No connection data</div>
          `;
        }
        
        tooltip.style.opacity = '1';
      });

    networkInstance.on('blurEdge', function (params) {
      if (networkRef.current) {
        networkRef.current.style.cursor = 'default';
      }
      
      // Hide tooltip
      const tooltip = document.getElementById('network-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    });
    
    // Update tooltip position on mouse move
    const handleMouseMove = (event: MouseEvent) => {
      const tooltip = document.getElementById('network-tooltip');
      if (tooltip && tooltip.style.opacity === '1') {
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
      }
    };
    
    if (networkRef.current) {
      networkRef.current.addEventListener('mousemove', handleMouseMove);
    }
    
    setNetwork(networkInstance);

    return () => {
      networkInstance.destroy();
    };
  }, [networkData, showNetwork]);

  // Create timeline chart
//   useEffect(() => {
//     if (!timelineRef.current || timelineData.length === 0) return;

//     const container = d3.select(timelineRef.current);
//     container.selectAll('*').remove();

//     const margin = { top: 20, right: 30, bottom: 40, left: 40 };
//     const width = 800 - margin.left - margin.right;
//     const height = 200 - margin.top - margin.bottom;

//     const svg = container
//       .append('svg')
//       .attr('width', width + margin.left + margin.right)
//       .attr('height', height + margin.top + margin.bottom);

//     const g = svg
//       .append('g')
//       .attr('transform', `translate(${margin.left},${margin.top})`);

//     const xScale = d3.scaleTime()
//       .domain(d3.extent(timelineData, d => d.date) as [Date, Date])
//       .range([0, width]);

//     const yScale = d3.scaleLinear()
//       .domain([0, d3.max(timelineData, d => d.count) || 0])
//       .range([height, 0]);

//     // Add brush for time selection
//     const brush = d3.brushX()
//       .extent([[0, 0], [width, height]])
//       .on('end', (event) => {
//         if (!event.selection) {
//           setSelectedTimeRange(null);
//           return;
//         }
//         const [x0, x1] = event.selection;
//         const range: [Date, Date] = [xScale.invert(x0), xScale.invert(x1)];
//         setSelectedTimeRange(range);
//       });

//     // Add bars
//     g.selectAll('.bar')
//       .data(timelineData)
//       .enter()
//       .append('rect')
//       .attr('class', 'bar')
//       .attr('x', d => xScale(d.date))
//       .attr('y', d => yScale(d.count))
//       .attr('width', Math.max(1, width / timelineData.length - 1))
//       .attr('height', d => height - yScale(d.count))
//       .attr('fill', '#17a2b8')
//       .attr('opacity', 0.7);

//     // Add axes
//     g.append('g')
//       .attr('transform', `translate(0,${height})`)
//       .call(d3.axisBottom(xScale));

//     g.append('g')
//       .call(d3.axisLeft(yScale));

//     // Add brush
//     g.append('g')
//       .attr('class', 'brush')
//       .call(brush);

//   }, [timelineData]);

  const createReadingPattern = (container: HTMLDivElement, title: string, data: Array<{user: string, count: number}>, isReading: boolean) => {
    const d3Container = d3.select(container);
    d3Container.selectAll('*').remove();

    if (data.length === 0) {
      d3Container.append('div')
        .attr('class', 'empty-state')
        .style('text-align', 'center')
        .style('padding', '60px 20px')
        .style('color', '#666')
        .style('background', '#f8f9fa')
        .style('border-radius', '8px')
        .style('border', '2px dashed #dee2e6')
        .html(`
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📊</div>
          <div style="font-weight: 600; margin-bottom: 8px;">No ${isReading ? 'Reading' : 'User'} Data</div>
          <div style="font-size: 14px;">Select a time range or adjust filters to view patterns</div>
        `);
      return;
    }

    const containerDiv = d3Container
      .append('div')
      .style('background', 'white')
      .style('border-radius', '12px')
      .style('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.08)')
      .style('padding', '24px')
      .style('border', '1px solid #e2e8f0')
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column');

    // Add title
    containerDiv
      .append('h4')
      .style('margin', '0 0 20px 0')
      .style('color', '#2c3e50')
      .style('font-weight', '600')
      .style('font-size', '16px')
      .style('text-align', 'center')
      .style('padding-bottom', '12px')
      .style('border-bottom', '2px solid #e2e8f0')
      .text(title);

    const width = 480;
    const height = 320;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG container centered
    const svgContainer = containerDiv
      .append('div')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('flex', '1');

    const svg = svgContainer
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#fafafa')
      .style('border-radius', '8px');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.user))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([innerHeight, 0])
      .nice();

    const colorScale = isReading ? 
      d3.scaleSequential()
        .domain([0, data.length - 1])
        .interpolator(() => '#3b82f6') :
      d3.scaleSequential()
        .domain([0, data.length - 1])
        .interpolator(() => '#3b82f6'); 

    // Create gradient definitions
    const defs = svg.append('defs');
    data.forEach((d, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${isReading ? 'reading' : 'content'}-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', yScale(0))
        .attr('x2', 0).attr('y2', yScale(d.count));

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(i))
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(i))
        .attr('stop-opacity', 1);
    });

    // Create bars with animation
    const bars = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.user) || 0)
      .attr('y', innerHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', (d, i) => `url(#gradient-${isReading ? 'reading' : 'content'}-${i})`)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        
        // Show the value label on hover
        g.selectAll('.label')
          .filter((labelData: any) => labelData.user === d.user)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        // Show the x-axis label on hover
        xAxis.selectAll('text')
          .filter(function() {
            return d3.select(this).text() === d.user;
          })
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        const tooltip = containerDiv
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'linear-gradient(135deg, #1e293b 0%, #334155 100%)')
          .style('color', 'white')
          .style('padding', '12px 16px')
          .style('border-radius', '8px')
          .style('font-size', '13px')
          .style('font-weight', '500')
          .style('pointer-events', 'none')
          .style('opacity', 0)
          .style('box-shadow', '0 8px 32px rgba(0,0,0,0.3)')
          .style('backdrop-filter', 'blur(10px)')
          .style('border', '1px solid rgba(255,255,255,0.1)');

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div style="font-weight: 600; margin-bottom: 4px;">${d.user}</div>
          <div>${d.count} ${isReading ? 'reads performed' : 'times being read'}</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
          .attr('transform', 'scale(1)');
        
        // Hide the value label when not hovering
        g.selectAll('.label')
          .filter((labelData: any) => labelData.user === d.user)
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        // Hide the x-axis label when not hovering
        xAxis.selectAll('text')
          .filter(function() {
            return d3.select(this).text() === d.user;
          })
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        containerDiv.selectAll('.tooltip').remove();
      });

    // Animate bars
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.count))
      .attr('height', d => innerHeight - yScale(d.count));

    // Add value labels on bars
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.user) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .style('opacity', 0) 
      .text(d => d.count)
      ;

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .style('font-size', '11px');

    xAxis.selectAll('text')
      .style('opacity', 0)
      .style('font-weight', '500')
      .style('fill', '#475569');

    xAxis.select('.domain')
      .style('stroke', '#cbd5e1')
      .style('stroke-width', '2px');

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .style('font-size', '11px');

    yAxis.selectAll('text')
      .style('font-weight', '500')
      .style('fill', '#475569');

    yAxis.select('.domain')
      .style('stroke', '#cbd5e1')
      .style('stroke-width', '2px');


    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', '#475569')
      .text(isReading ? 'Reads Performed' : 'Times Being Read');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', '#475569')
      .text('Users');

    // Add summary stats
    const totalReads = data.reduce((sum, d) => sum + d.count, 0);
    const avgReads = (totalReads / data.length).toFixed(1);
    
    containerDiv
      .append('div')
      .style('margin-top', '16px')
      .style('padding', '12px')
      .style('background', '#f1f5f9')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('color', '#475569')
      .html(`
        <div style="display: flex; justify-content: space-between;">
          <span><strong>Total:</strong> ${totalReads}</span>
          <span><strong>Average:</strong> ${avgReads}</span>
          <span><strong>Items:</strong> ${data.length}</span>
        </div>
      `);
  };

  // Update reading patterns
  useEffect(() => {
    if (readingPatternRef.current) {
      createReadingPattern(readingPatternRef.current, 'Reading Activity', readingPatternsData.readingData, true);
    }
    if (beingReadPatternRef.current) {
      createReadingPattern(beingReadPatternRef.current, 'Being Read Network', readingPatternsData.beingReadData, false);
    }
  }, [readingPatternsData]);

  const handleNetworkSettingChange = (setting: string, value: any) => {
    setNetworkSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

//   const clearTimeSelection = () => {
//     setSelectedTimeRange(null);
//     if (timelineRef.current) {
//       d3.select(timelineRef.current).select('.brush').call(d3.brushX().clear);
//     }
//   };

  return (
    <div className="social-network-section">
      <div className="section-header">
        <h3>Social Network Analysis</h3>
        <div className="header-stats">
          {/* <span className="stat-badge">
            <strong>{filteredData.length}</strong> interactions
          </span> */}
          <span className="stat-badge">
            <strong>{filteredData.filter(d => d.type === 'read').length}</strong> reads
          </span>
          {/* {selectedTimeRange && (
            <span className="time-filter-badge">
              {selectedTimeRange[0].toLocaleDateString()} - {selectedTimeRange[1].toLocaleDateString()}
              <button onClick={clearTimeSelection} className="clear-filter-btn">×</button>
            </span>
          )} */}
        </div>
      </div>

      {/* Timeline Filter */}
      {/* <div className="timeline-filter-section">
        <h4>Time Range Filter</h4>
        <div ref={timelineRef} className="timeline-container"></div>
      </div> */}
      
      {/* Network Graph */}
      <div className="network-graph-section">
        <div className="graph-header">
          <h4>Interaction Network</h4>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowNetwork(!showNetwork)}
          >
            {showNetwork ? 'Hide' : 'Show'} Graph
          </button>
        </div>
        
        {showNetwork && (
          <div className="graph-container">
            <div 
              ref={networkRef} 
              className="network-visualization"
            ></div>
            <div className="network-controls">
              <h5>Graph Settings</h5>
              
              {/* Information Panel */}
              <div className="info-panel">
                <h6>Network Information</h6>
                <div className="info-item">
                  <strong>Nodes:</strong> Username + Read Count
                </div>
                <div className="info-item">
                  <strong>Edges:</strong> Shared count between users
                </div>
                <div className="info-item">
                  <strong>Hover:</strong> View detailed tooltips
                </div>
                <div className="info-item">
                  <span className="legend-dot current-user" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                  <strong>Red:</strong> Current User
                </div>
                <div className="info-item">
                  <span className="legend-dot other-user" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                  <strong>Blue:</strong> Other Users
                </div>
              </div>
              
              <div className="control-group">
                <label>Node Size</label>
                <div className="input-group">
                  <input 
                    type="range"
                    min="5"
                    max="20"
                    value={networkSettings.nodeSize}
                    onChange={(e) => handleNetworkSettingChange('nodeSize', parseInt(e.target.value))}
                  />
                  <span className="value-display">{networkSettings.nodeSize}</span>
                </div>
              </div>
              <div className="control-group">
                <label>Edge Width</label>
                <div className="input-group">
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    value={networkSettings.edgeWidth}
                    onChange={(e) => handleNetworkSettingChange('edgeWidth', parseInt(e.target.value))}
                  />
                  <span className="value-display">{networkSettings.edgeWidth}</span>
                </div>
              </div>
              <div className="control-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={networkSettings.directional}
                    onChange={(e) => handleNetworkSettingChange('directional', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Directional arrows
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Reading Patterns */}
      <div className="reading-patterns-section">
        <h4>Reading Patterns Analysis</h4>
        <div className="patterns-container">
          <div className="pattern-chart">
            <div ref={readingPatternRef}></div>
          </div>
          <div className="pattern-chart">
            <div ref={beingReadPatternRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialNetworkSection;