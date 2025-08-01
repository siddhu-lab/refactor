import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  GridItem,
  Divider,
  Spinner,
  Center,
  SimpleGrid,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  RadioGroup,
  Radio,
  Stack,
  Flex,
  useDisclosure,
  Collapse,
  CheckboxGroup,
  Checkbox,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { InfoIcon, SettingsIcon } from '@chakra-ui/icons';
import { Network } from 'vis-network';
  
import dashboardContext from '../../context/dashboard.js';

const UnifiedDashboard: React.FC = () => {
  const { community, role, me } = useContext(dashboardContext);
  const networkRef = useRef<HTMLDivElement>(null);
  
  // Color theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const mainBgColor = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  
  // Data State
  const [rawData, setRawData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState<Network | null>(null);
  
  // Data Type Selection (only one at a time)
  const [dataType, setDataType] = useState<'activity' | 'knowledge'>('activity');
  
  // Filter State
  const [selectedView, setSelectedView] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  
  // Display Options
  const [hideNames, setHideNames] = useState(role !== 'manager');
  
  // Graph Settings
  const [graphLayout, setGraphLayout] = useState<'force' | 'hierarchical' | 'circular'>('force');
  const [nodeSize, setNodeSize] = useState(25);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [nodeSpacing, setNodeSpacing] = useState(200);
  const [showDirections, setShowDirections] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [clusterByType, setClusterByType] = useState(false);
  const [edgeSmoothing, setEdgeSmoothing] = useState(true);
  
  // Selection State
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<any>(null);
  const [hoveredEdgeInfo, setHoveredEdgeInfo] = useState<any>(null);
  
  // Activity Analysis Options
  const [activityOptions, setActivityOptions] = useState<string[]>([]);
  const { isOpen: isActivitySectionOpen, onToggle: toggleActivitySection } = useDisclosure();
  
  // Bottom section refs
  const statsChartRef = useRef<HTMLDivElement>(null);
  const timelineChartRef = useRef<HTMLDivElement>(null);
  const readingPatternRef = useRef<HTMLDivElement>(null);

  const isManager = role === 'manager';
  const currentUserName = `${me?.firstName} ${me?.lastName}`;

  // Enhanced dummy data
  const dummyData = [
    // Activity data
    {
      id: '1', when: Date.now() - 86400000 * 5, type: 'read',
      from: 'John Smith', fromId: 'author-1', fromPseudo: 'JohnS',
      to: 'Sarah Johnson', toPseudo: 'SarahJ',
      title: 'Climate Change Discussion', view: 'Science Discussion',
      data: { body: '<p>This is a discussion about climate change and its impacts.</p>' },
      ID: 'contrib-1'
    },
    {
      id: '2', when: Date.now() - 86400000 * 3, type: 'created',
      from: 'Sarah Johnson', fromId: 'author-2', fromPseudo: 'SarahJ',
      to: 'Sarah Johnson', toPseudo: 'SarahJ',
      title: 'Mathematical Proof Analysis', view: 'Math Problems',
      data: { body: '<p>Here is my analysis of the mathematical proof presented in class.</p>' },
      ID: 'contrib-2'
    },
    {
      id: '3', when: Date.now() - 86400000 * 2, type: 'modified',
      from: 'Mike Wilson', fromId: 'author-3', fromPseudo: 'MikeW',
      to: 'Mike Wilson', toPseudo: 'MikeW',
      title: 'History Essay Update', view: 'History Class',
      data: { body: '<p>Updated my essay on World War II with additional sources.</p>' },
      ID: 'contrib-3'
    },
    {
      id: '4', when: Date.now() - 86400000 * 1, type: 'read',
      from: 'Alice Brown', fromId: 'author-4', fromPseudo: 'AliceB',
      to: 'John Smith', toPseudo: 'JohnS',
      title: 'Climate Change Discussion', view: 'Science Discussion',
      data: { body: '<p>Reading the climate change discussion.</p>' },
      ID: 'contrib-1'
    },
    {
      id: '5', when: Date.now() - 86400000 * 4, type: 'read',
      from: 'Bob Davis', fromId: 'author-5', fromPseudo: 'BobD',
      to: 'Sarah Johnson', toPseudo: 'SarahJ',
      title: 'Mathematical Proof Analysis', view: 'Math Problems',
      data: { body: '<p>Reading the mathematical proof analysis.</p>' },
      ID: 'contrib-2'
    },
    {
      id: '6', when: Date.now() - 86400000 * 6, type: 'read',
      from: 'Carol White', fromId: 'author-6', fromPseudo: 'CarolW',
      to: 'Mike Wilson', toPseudo: 'MikeW',
      title: 'History Essay Update', view: 'History Class',
      data: { body: '<p>Reading the updated history essay.</p>' },
      ID: 'contrib-3'
    },
    // Knowledge building data
    {
      id: '7', when: Date.now() - 86400000 * 1, type: 'buildson',
      from: 'Alice Brown', fromId: 'author-4', fromPseudo: 'AliceB',
      to: 'John Smith', toPseudo: 'JohnS',
      title: 'Building on Climate Discussion', view: 'Science Discussion',
      data: { body: '<p>Building on the climate change discussion with additional research.</p>' },
      ID: 'contrib-4', strength: 3
    },
    {
      id: '8', when: Date.now() - 86400000 * 4, type: 'buildson',
      from: 'Bob Davis', fromId: 'author-5', fromPseudo: 'BobD',
      to: 'Sarah Johnson', toPseudo: 'SarahJ',
      title: 'Math Proof Extension', view: 'Math Problems',
      data: { body: '<p>Extending the mathematical proof with new theorems.</p>' },
      ID: 'contrib-5', strength: 2
    },
    {
      id: '9', when: Date.now() - 86400000 * 7, type: 'buildson',
      from: 'John Smith', fromId: 'author-1', fromPseudo: 'JohnS',
      to: 'Bob Davis', toPseudo: 'BobD',
      title: 'Further Math Extensions', view: 'Math Problems',
      data: { body: '<p>Building further on the mathematical concepts.</p>' },
      ID: 'contrib-6', strength: 1
    },
    {
      id: '10', when: Date.now() - 86400000 * 3, type: 'buildson',
      from: 'Sarah Johnson', fromId: 'author-2', fromPseudo: 'SarahJ',
      to: 'John Smith', toPseudo: 'JohnS',
      title: 'Climate Research Extension', view: 'Science Discussion',
      data: { body: '<p>Building on climate research with new data.</p>' },
      ID: 'contrib-7', strength: 2
    }
  ];

  // Initialize data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const processedData = dummyData.map((d) => {
        const dCopy = { ...d };
        const date = new Date(parseInt(dCopy.when));
        dCopy.date = date;
        dCopy.value = 1;
        return dCopy;
      });
      
      setRawData(processedData);
      setLoading(false);
    }, 500);
  }, []);

  // Apply filters to data based on selected data type
  const applyFilters = (data: any[]) => {
    let filtered = data;

    // Filter by data type first
    if (dataType === 'activity') {
      filtered = filtered.filter(d => ['read', 'created', 'modified'].includes(d.type));
    } else {
      filtered = filtered.filter(d => d.type === 'buildson');
    }

    // View filter
    if (selectedView !== 'all') {
      filtered = filtered.filter(d => d.view === selectedView);
    }

    // Group filter
    if (selectedGroup !== 'all') {
      const group = community.groups?.find(g => g.id === selectedGroup);
      if (group) {
        filtered = filtered.filter(d => group.members.includes(d.fromId));
      }
    }

    // Author filter
    if (selectedAuthor !== 'all') {
      filtered = filtered.filter(d => d.fromId === selectedAuthor);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = Date.now();
      const ranges = {
        'week': 7 * 24 * 60 * 60 * 1000,
        'month': 30 * 24 * 60 * 60 * 1000,
        '3months': 90 * 24 * 60 * 60 * 1000
      };
      const rangeMs = ranges[dateRange as keyof typeof ranges];
      if (rangeMs) {
        filtered = filtered.filter(d => (now - new Date(d.when).getTime()) <= rangeMs);
      }
    }

    return filtered;
  };

  // Update filtered data when filters change
  useEffect(() => {
    const filtered = applyFilters(rawData);
    setFilteredData(filtered);
    setSelectedNodeInfo(null); // Clear selection when data changes
  }, [rawData, dataType, selectedView, selectedGroup, selectedAuthor, dateRange]);

  // Process network data based on data type
  const networkData = useMemo(() => {
    const nodes = new Map();
    const edges: any[] = [];
    const edgeMap = new Map();
    
    // Build user activity summary
    const userActivities = new Map();
    
    filteredData.forEach((item: any) => {
      const fromName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
      const toName = item.to ? (hideNames && item.to !== currentUserName ? item.toPseudo : item.to) : fromName;
      
      // Track user activities
      if (!userActivities.has(fromName)) {
        userActivities.set(fromName, {
          reads: 0, creates: 0, modifies: 0, buildons: 0,
          activities: [], buildsonConnections: [], builtUponBy: []
        });
      }
      
      const userActivity = userActivities.get(fromName);
      userActivity.activities.push(item);
      
      if (item.type === 'read') userActivity.reads++;
      else if (item.type === 'created') userActivity.creates++;
      else if (item.type === 'modified') userActivity.modifies++;
      else if (item.type === 'buildson') {
        userActivity.buildons++;
        userActivity.buildsonConnections.push({ 
          target: toName, 
          strength: item.strength || 1, 
          title: item.title,
          date: item.date
        });
        
        // Track who built upon this user's work
        if (!userActivities.has(toName)) {
          userActivities.set(toName, {
            reads: 0, creates: 0, modifies: 0, buildons: 0,
            activities: [], buildsonConnections: [], builtUponBy: []
          });
        }
        userActivities.get(toName).builtUponBy.push({
          source: fromName,
          strength: item.strength || 1,
          title: item.title,
          date: item.date
        });
      }
      
      // Create nodes
      const isCurrentUser = item.fromId === community.author.id;
      
      if (!nodes.has(fromName)) {
        nodes.set(fromName, {
          id: fromName,
          label: showNodeLabels ? fromName : '',
          size: nodeSize,
          color: isCurrentUser ? '#e53e3e' : '#3182ce',
          borderWidth: 2,
          interactions: 1,
          isCurrentUser,
          font: { size: showNodeLabels ? 14 : 0, color: '#333333' },
          shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 5, x: 2, y: 2 }
        });
      } else {
        const node = nodes.get(fromName);
        node.interactions += 1;
        node.size = Math.max(nodeSize, Math.min(nodeSize * 2, nodeSize + (node.interactions * 2)));
      }
      
      // Create target node if different
      if (fromName !== toName && item.to) {
        const isTargetCurrentUser = toName === currentUserName;
        if (!nodes.has(toName)) {
          nodes.set(toName, {
            id: toName,
            label: showNodeLabels ? toName : '',
            size: nodeSize,
            color: isTargetCurrentUser ? '#e53e3e' : '#3182ce',
            borderWidth: 2,
            interactions: 1,
            isCurrentUser: isTargetCurrentUser,
            font: { size: showNodeLabels ? 14 : 0, color: '#333333' },
            shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 5, x: 2, y: 2 }
          });
        }
      }
      
      // Create edges
      if (fromName !== toName && item.to) {
        const edgeKey = dataType === 'activity' ? 
          `${fromName}-${toName}` : // For activity, direction matters less
          `${fromName}-${toName}`; // For buildson, direction is important
        
        if (edgeMap.has(edgeKey)) {
          const existingEdge = edgeMap.get(edgeKey);
          existingEdge.weight += 1;
          existingEdge.width = Math.max(edgeWidth, existingEdge.weight * edgeWidth);
          existingEdge.interactions.push(item);
        } else {
          const newEdge = {
            id: item.id,
            from: fromName,
            to: toName,
            weight: 1,
            width: item.type === 'buildson' && item.strength ? item.strength * edgeWidth : edgeWidth,
            color: getEdgeColor(item.type),
            arrows: showDirections ? 'to' : undefined,
            smooth: edgeSmoothing ? { type: 'continuous' } : false,
            interactions: [item],
            label: showEdgeLabels ? (dataType === 'activity' ? `${item.type}` : `builds on`) : undefined,
            font: showEdgeLabels ? { size: 10, color: '#666666' } : undefined,
            title: getEdgeTitle(item, fromName, toName),
            shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 3, x: 1, y: 1 }
          };
          
          edgeMap.set(edgeKey, newEdge);
        }
      }
    });
    
    // Update edge titles for combined edges
    edgeMap.forEach((edge) => {
      if (edge.interactions.length > 1) {
        if (dataType === 'activity') {
          const types = [...new Set(edge.interactions.map(i => i.type))];
          edge.title = `${edge.from} → ${edge.to}\n${edge.interactions.length} interactions\nTypes: ${types.join(', ')}`;
        } else {
          edge.title = `${edge.from} built on ${edge.to}'s work\n${edge.interactions.length} times`;
        }
      }
      edges.push(edge);
    });

    // Add user activity data to nodes
    nodes.forEach((node, nodeName) => {
      const activity = userActivities.get(nodeName);
      if (activity) {
        node.userActivity = activity;
      }
    });

    function getEdgeColor(type: string): string {
      if (dataType === 'activity') {
        switch (type) {
          case 'read': return '#38a169';
          case 'modified': return '#d69e2e';
          case 'created': return '#805ad5';
          default: return '#718096';
        }
      } else {
        return '#e53e3e'; // Buildson color
      }
    }
    
    function getEdgeTitle(item: any, fromName: string, toName: string): string {
      if (item.type === 'buildson') {
        return `${fromName} built on ${toName}'s work${item.strength ? ` (strength: ${item.strength})` : ''}`;
      } else {
        return `${fromName} ${item.type} ${toName}'s content`;
      }
    }

    const nodeArray = Array.from(nodes.values());
    
    return {
      nodes: nodeArray,
      edges,
      stats: {
        totalNodes: nodeArray.length,
        totalConnections: edges.length,
        mostActiveUser: nodeArray.length > 0 ? nodeArray.reduce((prev, current) => 
          (prev.interactions > current.interactions) ? prev : current
        ).label : 'None'
      }
    };
  }, [filteredData, hideNames, nodeSize, edgeWidth, showDirections, showNodeLabels, showEdgeLabels, edgeSmoothing, dataType]);

  // Network visualization
  useEffect(() => {
    if (!networkRef.current || !networkData.nodes.length) return;

    const getLayoutOptions = () => {
      switch (graphLayout) {
        case 'hierarchical':
          return {
            layout: {
              hierarchical: {
                enabled: true,
                direction: 'UD',
                sortMethod: 'directed',
                nodeSpacing: nodeSpacing,
                levelSeparation: nodeSpacing * 1.5
              }
            },
            physics: { enabled: false }
          };
        case 'circular':
          return {
            layout: { randomSeed: 2 },
            physics: {
              enabled: true,
              stabilization: { iterations: 100 },
              barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.1,
                springLength: nodeSpacing,
                springConstant: 0.04,
                damping: 0.09
              }
            }
          };
        default:
          return {
            physics: {
              enabled: true,
              stabilization: { iterations: 200 },
              barnesHut: {
                gravitationalConstant: -80000,
                springConstant: 0.001,
                springLength: nodeSpacing,
                centralGravity: 0.3,
                damping: 0.09
              }
            }
          };
      }
    };

    const options = {
      nodes: {
        shape: 'dot',
        scaling: { min: 15, max: 60 },
        font: { size: 12, color: '#333333' }
      },
      edges: {
        smooth: edgeSmoothing ? { type: 'continuous' } : false
      },
      interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        hover: true,
        selectConnectedEdges: true,
        hoverConnectedEdges: true
      },
      ...getLayoutOptions()
    };

    const networkInstance = new Network(
      networkRef.current,
      { nodes: networkData.nodes, edges: networkData.edges },
      options
    );

    // Node click handler
    networkInstance.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = networkData.nodes.find(n => n.id === nodeId);
        if (node) {
          const connectedEdges = networkData.edges.filter(e => e.from === nodeId || e.to === nodeId);
          setSelectedNodeInfo({
            ...node,
            connectedEdges: connectedEdges.length,
            connections: connectedEdges.map(e => ({
              target: e.from === nodeId ? e.to : e.from,
              weight: e.weight,
              interactions: e.interactions
            }))
          });
        }
      } else {
        setSelectedNodeInfo(null);
      }
    });

    // Edge hover handler
    networkInstance.on('hoverEdge', (params) => {
      const edgeId = params.edge;
      const edge = networkData.edges.find(e => e.id === edgeId);
      if (edge) {
        setHoveredEdgeInfo(edge);
      }
    });

    networkInstance.on('blurEdge', () => {
      setHoveredEdgeInfo(null);
    });

    setNetwork(networkInstance);

    return () => {
      networkInstance.destroy();
    };
  }, [networkData, graphLayout, nodeSpacing, edgeSmoothing, clusterByType]);

  const resetAllFilters = () => {
    setSelectedView('all');
    setSelectedGroup('all');
    setSelectedAuthor('all');
    setDateRange('all');
    setSelectedNodeInfo(null);
    setHoveredEdgeInfo(null);
  };

  // Handle activity options change
  const handleActivityOptionsChange = (values: string[]) => {
    setActivityOptions(values);
    if (values.length > 0 && !isActivitySectionOpen) {
      toggleActivitySection();
    } else if (values.length === 0 && isActivitySectionOpen) {
      toggleActivitySection();
    }
  };

  // Create user activity stats chart
  const createUserActivityStats = useCallback(() => {
    if (!statsChartRef.current || !filteredData.length) return;

    const container = d3.select(statsChartRef.current);
    container.selectAll('*').remove();

    // Process data for user activity stats
    const userStats = new Map();
    filteredData.forEach(item => {
      const userName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
      if (!userStats.has(userName)) {
        userStats.set(userName, { reads: 0, creates: 0, modifies: 0, total: 0 });
      }
      const stats = userStats.get(userName);
      if (item.type === 'read') stats.reads++;
      else if (item.type === 'created') stats.creates++;
      else if (item.type === 'modified') stats.modifies++;
      stats.total++;
    });

    const data = Array.from(userStats.entries()).map(([user, stats]) => ({ user, ...stats }));
    
    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const width = 600 - margin.left - margin.right;
    const height = Math.max(300, data.length * 25) - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.user))
      .range([0, height])
      .padding(0.1);

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.user) || 0)
      .attr('width', d => xScale(d.total))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#3182ce')
      .attr('opacity', 0.8);

    // Add labels
    g.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', -5)
      .attr('y', d => (yScale(d.user) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .text(d => d.user);

    // Add value labels
    g.selectAll('.value')
      .data(data)
      .enter().append('text')
      .attr('class', 'value')
      .attr('x', d => xScale(d.total) + 5)
      .attr('y', d => (yScale(d.user) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .text(d => d.total);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));
  }, [filteredData, hideNames, community.author.id]);

  // Create daily activity timeline
  const createDailyTimeline = useCallback(() => {
    if (!timelineChartRef.current || !filteredData.length) return;

    const container = d3.select(timelineChartRef.current);
    container.selectAll('*').remove();

    // Process data by day
    const dailyData = d3.rollup(
      filteredData,
      v => v.length,
      d => d3.timeDay(d.date)
    );

    const data = Array.from(dailyData, ([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([height, 0]);

    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3182ce')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', 3)
      .attr('fill', '#3182ce');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));
  }, [filteredData]);

  // Create reading pattern analysis
  const createReadingPatterns = useCallback(() => {
    if (!readingPatternRef.current || !filteredData.length) return;

    const container = d3.select(readingPatternRef.current);
    container.selectAll('*').remove();

    const readData = filteredData.filter(d => d.type === 'read');
    
    // Reading by hour
    const hourlyData = d3.rollup(
      readData,
      v => v.length,
      d => d.date.getHours()
    );

    const data = Array.from(hourlyData, ([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.hour.toString()))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([height, 0]);

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.hour.toString()) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d.count))
      .attr('fill', '#38a169');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));
  }, [filteredData]);

  // Update activity charts when options change
  useEffect(() => {
    if (dataType === 'activity' && activityOptions.length > 0) {
      setTimeout(() => {
        if (activityOptions.includes('user-stats')) createUserActivityStats();
        if (activityOptions.includes('timeline')) createDailyTimeline();
        if (activityOptions.includes('reading-patterns')) createReadingPatterns();
      }, 100);
    }
  }, [activityOptions, dataType, createUserActivityStats, createDailyTimeline, createReadingPatterns]);

  // Get dynamic legend based on data type
  const getLegendContent = () => {
    if (dataType === 'activity') {
      return {
        title: "Activity Network",
        nodeInfo: "Nodes: Username + Activity Count",
        edgeInfo: "Edges: Interaction count between users",
        hoverInfo: "Hover: View detailed activity tooltips",
        nodeColors: [
          { color: "red.500", label: "Current User" },
          { color: "blue.500", label: "Other Users" }
        ],
        edgeColors: [
          { color: "green.500", label: "Read" },
          { color: "yellow.500", label: "Modify" },
          { color: "purple.500", label: "Create" }
        ]
      };
    } else {
      return {
        title: "Knowledge Building Network",
        nodeInfo: "Nodes: Username + Buildson Count",
        edgeInfo: "Edges: Knowledge building connections",
        hoverInfo: "Hover: View buildson relationship details",
        nodeColors: [
          { color: "red.500", label: "Current User" },
          { color: "blue.500", label: "Other Users" }
        ],
        edgeColors: [
          { color: "red.500", label: "Buildson" }
        ]
      };
    }
  };

  const legendContent = getLegendContent();

  if (loading) {
    return (
      <Center h="100vh">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading Knowledge Forum Dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box bg={mainBgColor} h="100vh" display="flex" flexDirection="column">
      <Grid templateColumns="1fr 400px" flex="1" overflow="hidden">
        {/* Main Graph Area */}
        <GridItem bg={bgColor} position="relative" display="flex" flexDirection="column">
          {/* Graph Header */}
          <Box p={4} borderBottom="1px" borderColor={borderColor} bg={bgColor}>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="md" color="blue.600">
                  {legendContent.title}
                </Heading>
                <HStack spacing={4} fontSize="sm" color="gray.600">
                  <Text>
                    <Badge colorScheme="blue" mr={1}>{networkData.stats.totalNodes}</Badge>
                    Users
                  </Text>
                  <Text>
                    <Badge colorScheme="green" mr={1}>{networkData.stats.totalConnections}</Badge>
                    Connections
                  </Text>
                  <Text>
                    <Badge colorScheme="purple" mr={1}>{networkData.stats.mostActiveUser}</Badge>
                    Most Active
                  </Text>
                </HStack>
              </VStack>
              
              <HStack>
                <Button size="sm" onClick={resetAllFilters} colorScheme="red" variant="outline">
                  Reset Filters
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Graph Container */}
          <Box flex="1" position="relative" minH="400px">
            <Box ref={networkRef} w="100%" h="100%" />
            
            {/* Hover Edge Info Overlay */}
            {hoveredEdgeInfo && (
              <Box
                position="absolute"
                top={4}
                left={4}
                bg="blackAlpha.800"
                color="white"
                p={3}
                borderRadius="md"
                fontSize="sm"
                maxW="300px"
                zIndex={1000}
              >
                <Text fontWeight="bold">{hoveredEdgeInfo.from} → {hoveredEdgeInfo.to}</Text>
                <Text>Interactions: {hoveredEdgeInfo.interactions.length}</Text>
                {hoveredEdgeInfo.interactions.slice(0, 3).map((interaction, idx) => (
                  <Text key={idx} fontSize="xs" color="gray.300">
                    • {interaction.type}: {interaction.title}
                  </Text>
                ))}
                {hoveredEdgeInfo.interactions.length > 3 && (
                  <Text fontSize="xs" color="gray.400">
                    ...and {hoveredEdgeInfo.interactions.length - 3} more
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </GridItem>

        {/* Right Sidebar */}
        <GridItem bg={sidebarBg} borderLeft="1px" borderColor={borderColor} overflowY="auto">
          <VStack spacing={4} p={4} align="stretch">
            {/* Data Type Selection */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Data Type</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <RadioGroup value={dataType} onChange={(value) => setDataType(value as 'activity' | 'knowledge')}>
                  <Stack spacing={3}>
                    <Radio value="activity" colorScheme="blue">
                      <VStack align="start" spacing={0} ml={2}>
                        <Text fontWeight="bold" fontSize="sm">Activity Analysis</Text>
                        <Text fontSize="xs" color="gray.600">Reading, creating, modifying content</Text>
                      </VStack>
                    </Radio>
                    <Radio value="knowledge" colorScheme="purple">
                      <VStack align="start" spacing={0} ml={2}>
                        <Text fontWeight="bold" fontSize="sm">Knowledge Building</Text>
                        <Text fontSize="xs" color="gray.600">Ideas building upon each other</Text>
                      </VStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </CardBody>
            </Card>

            {/* Activity Analysis Options */}
            {dataType === 'activity' && (
              <Card>
                <CardHeader pb={2}>
                  <Heading size="sm">Activity Analysis Options</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <CheckboxGroup value={activityOptions} onChange={handleActivityOptionsChange}>
                    <VStack align="start" spacing={2}>
                      <Checkbox value="user-stats" colorScheme="blue">
                        <Text fontSize="sm">User Activity Stats</Text>
                      </Checkbox>
                      <Checkbox value="records" colorScheme="green">
                        <Text fontSize="sm">Activity Records</Text>
                      </Checkbox>
                      <Checkbox value="timeline" colorScheme="purple">
                        <Text fontSize="sm">Daily Activity Timeline</Text>
                      </Checkbox>
                      <Checkbox value="reading-patterns" colorScheme="orange">
                        <Text fontSize="sm">Reading Pattern Analysis</Text>
                      </Checkbox>
                    </VStack>
                  </CheckboxGroup>
                </CardBody>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Filters</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">View</FormLabel>
                    <Select size="sm" value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                      <option value="all">All Views</option>
                      <option value="Science Discussion">Science Discussion</option>
                      <option value="Math Problems">Math Problems</option>
                      <option value="History Class">History Class</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Group</FormLabel>
                    <Select size="sm" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                      <option value="all">All Groups</option>
                      {community.groups?.map(group => (
                        <option key={group.id} value={group.id}>{group.title}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Author</FormLabel>
                    <Select size="sm" value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}>
                      <option value="all">All Authors</option>
                      {community.authors?.map(author => (
                        <option key={author.id} value={author.id}>
                          {hideNames ? author.pseudoName : `${author.firstName} ${author.lastName}`}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Time Range</FormLabel>
                    <Select size="sm" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="3months">Last 3 Months</option>
                    </Select>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Graph Settings */}
            <Card>
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={SettingsIcon} />
                  <Heading size="sm">Graph Settings</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Layout</FormLabel>
                    <Select size="sm" value={graphLayout} onChange={(e) => setGraphLayout(e.target.value as any)}>
                      <option value="force">Force-Directed</option>
                      <option value="hierarchical">Hierarchical</option>
                      <option value="circular">Circular</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Node Size: {nodeSize}</FormLabel>
                    <Slider value={nodeSize} onChange={setNodeSize} min={15} max={50} step={5}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Connection Width: {edgeWidth}</FormLabel>
                    <Slider value={edgeWidth} onChange={setEdgeWidth} min={1} max={8}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Node Spacing: {nodeSpacing}</FormLabel>
                    <Slider value={nodeSpacing} onChange={setNodeSpacing} min={100} max={400} step={50}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <SimpleGrid columns={2} spacing={2}>
                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs">Show Names</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={!hideNames} 
                        onChange={(e) => setHideNames(!e.target.checked)}
                        isDisabled={!isManager}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs">Directions</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={showDirections} 
                        onChange={(e) => setShowDirections(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs">Node Labels</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={showNodeLabels} 
                        onChange={(e) => setShowNodeLabels(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs">Edge Labels</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={showEdgeLabels} 
                        onChange={(e) => setShowEdgeLabels(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs">Smooth Edges</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={edgeSmoothing} 
                        onChange={(e) => setEdgeSmoothing(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs">Cluster Types</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={clusterByType} 
                        onChange={(e) => setClusterByType(e.target.checked)}
                      />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Selected Node Info */}
            {selectedNodeInfo && (
              <Card>
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={InfoIcon} />
                    <Heading size="sm">Selected User</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="start" spacing={3}>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="lg">{selectedNodeInfo.label}</Text>
                      <Badge colorScheme={selectedNodeInfo.isCurrentUser ? 'red' : 'blue'}>
                        {selectedNodeInfo.isCurrentUser ? 'You' : 'Peer'}
                      </Badge>
                    </VStack>

                    <Divider />

                    {dataType === 'activity' && selectedNodeInfo.userActivity && (
                      <>
                        <VStack align="start" spacing={2} w="full">
                          <Text fontWeight="bold" fontSize="sm">
                            {selectedNodeInfo.label} performed {selectedNodeInfo.interactions} activities.
                          </Text>
                          <SimpleGrid columns={2} spacing={2} w="full" fontSize="xs">
                            <Text>📖 Reads: {selectedNodeInfo.userActivity.reads}</Text>
                            <Text>✏️ Creates: {selectedNodeInfo.userActivity.creates}</Text>
                            <Text>🔄 Modifies: {selectedNodeInfo.userActivity.modifies}</Text>
                          </SimpleGrid>
                        </VStack>
                        <Divider />
                      </>
                    )}

                    {dataType === 'knowledge' && selectedNodeInfo.userActivity && (
                      <>
                        <VStack align="start" spacing={2} w="full">
                          <Text fontWeight="bold" fontSize="sm">
                            {selectedNodeInfo.label} wrote {selectedNodeInfo.userActivity.creates || 0} notes.
                          </Text>
                          
                          {selectedNodeInfo.userActivity.buildsonConnections?.length > 0 && (
                            <>
                              <Text fontWeight="bold" fontSize="sm">
                                {selectedNodeInfo.label} built onto {selectedNodeInfo.userActivity.buildsonConnections.length} notes:
                              </Text>
                              <VStack align="start" spacing={1} maxH="120px" overflowY="auto" w="full">
                                {selectedNodeInfo.userActivity.buildsonConnections.map((conn, idx) => (
                                  <Text key={idx} fontSize="xs">
                                    • {conn.strength} by {conn.target}
                                  </Text>
                                ))}
                              </VStack>
                            </>
                          )}

                          {selectedNodeInfo.userActivity.builtUponBy?.length > 0 && (
                            <>
                              <Text fontWeight="bold" fontSize="sm">
                                {selectedNodeInfo.userActivity.builtUponBy.length} note{selectedNodeInfo.userActivity.builtUponBy.length > 1 ? 's were' : ' was'} built onto notes written by {selectedNodeInfo.label}:
                              </Text>
                              <VStack align="start" spacing={1} maxH="120px" overflowY="auto" w="full">
                                {selectedNodeInfo.userActivity.builtUponBy.map((conn, idx) => (
                                  <Text key={idx} fontSize="xs">
                                    • {conn.strength} by {conn.source}
                                  </Text>
                                ))}
                              </VStack>
                            </>
                          )}
                        </VStack>
                        <Divider />
                      </>
                    )}

                    <SimpleGrid columns={2} spacing={2} w="full">
                      <Stat size="sm">
                        <StatLabel fontSize="xs">Total Activity</StatLabel>
                        <StatNumber fontSize="md">{selectedNodeInfo.interactions}</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel fontSize="xs">Connections</StatLabel>
                        <StatNumber fontSize="md">{selectedNodeInfo.connectedEdges}</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Legend */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Legend</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={2} fontSize="xs">
                  <Text fontWeight="bold">{legendContent.nodeInfo}</Text>
                  <Text fontWeight="bold">{legendContent.edgeInfo}</Text>
                  <Text fontWeight="bold">{legendContent.hoverInfo}</Text>
                  
                  <Divider />
                  <Text fontWeight="bold">Node Colors:</Text>
                  {legendContent.nodeColors.map((item, idx) => (
                    <HStack key={idx}>
                      <Box w={3} h={3} bg={item.color} borderRadius="full" />
                      <Text>{item.label}</Text>
                    </HStack>
                  ))}
                  
                  <Divider />
                  <Text fontWeight="bold">Edge Colors:</Text>
                  {legendContent.edgeColors.map((item, idx) => (
                    <HStack key={idx}>
                      <Box w={3} h={0.5} bg={item.color} />
                      <Text>{item.label}</Text>
                    </HStack>
                  ))}

                  <Alert status="info" size="sm" mt={2}>
                    <AlertIcon />
                    <AlertDescription fontSize="xs">
                      Click nodes for details. Hover edges for activity info. Larger nodes = more activity.
                    </AlertDescription>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>

      {/* Bottom Activity Analysis Section */}
      {dataType === 'activity' && activityOptions.length > 0 && (
        <Box
          bg={bgColor}
          borderTop="1px"
          borderColor={borderColor}
          h="300px"
          overflowX="auto"
          overflowY="hidden"
        >
          <HStack h="100%" spacing={0} align="stretch">
            {activityOptions.includes('user-stats') && (
              <Box minW="650px" h="100%" p={4} borderRight="1px" borderColor={borderColor}>
                <VStack align="start" spacing={3} h="100%">
                  <Heading size="sm" color="blue.600">User Activity Statistics</Heading>
                  <Box ref={statsChartRef} flex="1" w="100%" />
                </VStack>
              </Box>
            )}

            {activityOptions.includes('records') && (
              <Box minW="600px" h="100%" p={4} borderRight="1px" borderColor={borderColor}>
                <VStack align="start" spacing={3} h="100%">
                  <Heading size="sm" color="green.600">Activity Records</Heading>
                  <Box flex="1" w="100%" overflowY="auto">
                    <TableContainer>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>User</Th>
                            <Th>Action</Th>
                            <Th>Title</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredData.slice(0, 10).map((record, idx) => (
                            <Tr key={idx}>
                              <Td fontSize="xs">{record.date.toLocaleDateString()}</Td>
                              <Td fontSize="xs">
                                {hideNames && record.fromId !== community.author.id ? record.fromPseudo : record.from}
                              </Td>
                              <Td>
                                <Badge
                                  size="sm"
                                  colorScheme={
                                    record.type === 'read' ? 'green' :
                                    record.type === 'created' ? 'blue' : 'orange'
                                  }
                                >
                                  {record.type}
                                </Badge>
                              </Td>
                              <Td fontSize="xs" maxW="200px" isTruncated>
                                {record.title}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                </VStack>
              </Box>
            )}

            {activityOptions.includes('timeline') && (
              <Box minW="850px" h="100%" p={4} borderRight="1px" borderColor={borderColor}>
                <VStack align="start" spacing={3} h="100%">
                  <Heading size="sm" color="purple.600">Daily Activity Timeline</Heading>
                  <Box ref={timelineChartRef} flex="1" w="100%" />
                </VStack>
              </Box>
            )}

            {activityOptions.includes('reading-patterns') && (
              <Box minW="650px" h="100%" p={4}>
                <VStack align="start" spacing={3} h="100%">
                  <Heading size="sm" color="orange.600">Reading Pattern Analysis</Heading>
                  <Box ref={readingPatternRef} flex="1" w="100%" />
                </VStack>
              </Box>
            )}
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default UnifiedDashboard;