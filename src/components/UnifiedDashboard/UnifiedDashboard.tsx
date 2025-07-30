import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
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
  Flex,
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Progress,
  Tooltip,
  ButtonGroup
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon, InfoIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Network } from 'vis-network';
import * as d3 from 'd3';
import * as dc from 'dc';
import crossfilter from 'crossfilter2';
import dashboardContext from '../../context/dashboard.js';

// Import the chart utilities
import { initializeCharts } from '../ActivityDashboard/chartUtils.ts';

const UnifiedDashboard: React.FC = () => {
  const { community, role, me, baseURL } = useContext(dashboardContext);
  const networkRef = useRef<HTMLDivElement>(null);
  const typeChartRef = useRef<HTMLDivElement>(null);
  const authorChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const rangeChartRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [rawData, setRawData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState<Network | null>(null);
  
  // UI State
  const [showActivityData, setShowActivityData] = useState(true);
  const [showBuildsonData, setShowBuildsonData] = useState(true);
  const [graphLayout, setGraphLayout] = useState<'force' | 'hierarchical' | 'circular'>('force');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [hideNames, setHideNames] = useState(role !== 'manager');
  const [hideManagers, setHideManagers] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNetwork, setShowNetwork] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [showDataTable, setShowDataTable] = useState(true);
  const [nodeLabels, setNodeLabels] = useState(true);
  const [edgeLabels, setEdgeLabels] = useState(false);
  const [clusterByType, setClusterByType] = useState(false);
  
  // Network Settings
  const [nodeSize, setNodeSize] = useState(20);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [showDirections, setShowDirections] = useState(false);
  const [nodeSpacing, setNodeSpacing] = useState(200);
  const [edgeSmoothing, setEdgeSmoothing] = useState(true);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Chart State
  const [statisticsData, setStatisticsData] = useState<any[]>([]);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [crossfilterInstance, setCrossfilterInstance] = useState<any>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<any>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const mainBgColor = useColorModeValue('gray.50', 'gray.900');
  const isManager = role === 'manager';

  // Dummy data - combining both activity and buildons
  const dummyData = [
    {
      id: '1',
      when: Date.now() - 86400000 * 5,
      type: 'read',
      from: 'John Smith',
      fromId: 'author-1',
      fromPseudo: 'JohnS',
      to: 'Sarah Johnson',
      toPseudo: 'SarahJ',
      title: 'Climate Change Discussion',
      view: 'Science Discussion',
      data: { body: '<p>This is a discussion about climate change and its impacts.</p>' },
      ID: 'contrib-1'
    },
    {
      id: '2',
      when: Date.now() - 86400000 * 3,
      type: 'created',
      from: 'Sarah Johnson',
      fromId: 'author-2',
      fromPseudo: 'SarahJ',
      to: 'Sarah Johnson',
      toPseudo: 'SarahJ',
      title: 'Mathematical Proof Analysis',
      view: 'Math Problems',
      data: { body: '<p>Here is my analysis of the mathematical proof presented in class.</p>' },
      ID: 'contrib-2'
    },
    {
      id: '3',
      when: Date.now() - 86400000 * 2,
      type: 'modified',
      from: 'Mike Wilson',
      fromId: 'author-3',
      fromPseudo: 'MikeW',
      to: 'Mike Wilson',
      toPseudo: 'MikeW',
      title: 'History Essay Update',
      view: 'History Class',
      data: { body: '<p>Updated my essay on World War II with additional sources.</p>' },
      ID: 'contrib-3'
    },
    {
      id: '4',
      when: Date.now() - 86400000 * 1,
      type: 'buildson',
      from: 'Alice Brown',
      fromId: 'author-4',
      fromPseudo: 'AliceB',
      to: 'John Smith',
      toPseudo: 'JohnS',
      title: 'Building on Climate Discussion',
      view: 'Science Discussion',
      data: { body: '<p>Building on the climate change discussion with additional research.</p>' },
      ID: 'contrib-4',
      strength: 3
    },
    {
      id: '5',
      when: Date.now() - 86400000 * 4,
      type: 'buildson',
      from: 'Bob Davis',
      fromId: 'author-5',
      fromPseudo: 'BobD',
      to: 'Sarah Johnson',
      toPseudo: 'SarahJ',
      title: 'Math Proof Extension',
      view: 'Math Problems',
      data: { body: '<p>Extending the mathematical proof with new theorems.</p>' },
      ID: 'contrib-5',
      strength: 2
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
        dCopy.year = new Date(date.getFullYear(), 0, 1);
        dCopy.month = new Date(date.getFullYear(), date.getMonth(), 1);
        dCopy.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        dCopy.week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        dCopy.value = 1;
        dCopy.read = 0;
        dCopy.modified = 0;
        dCopy.created = 0;
        dCopy.buildson = 0;
        dCopy[dCopy.type] = 1;
        return dCopy;
      });
      
      setRawData(processedData);
      setFilteredData(processedData);
      
      // Initialize charts
      setTimeout(() => {
        const { statsData, labelsData, ndx } = initializeCharts(processedData, hideNames, { _id: community.author.id, role });
        setStatisticsData(statsData);
        setLabels(labelsData);
        setCrossfilterInstance(ndx);
      }, 100);
      
      setLoading(false);
    }, 500);
  }, []);

  // Process network data
  const networkData = useMemo(() => {
    const nodes = new Map();
    const edges: any[] = [];
    const edgeMap = new Map(); // To combine multiple edges between same nodes
    
    // Get all relevant data based on user selections
    let relevantData = filteredData;
    
    if (!showActivityData) {
      relevantData = relevantData.filter(d => !['read', 'created', 'modified'].includes(d.type));
    }
    if (!showBuildsonData) {
      relevantData = relevantData.filter(d => d.type !== 'buildson');
    }
    
    // Apply filters
    let processedData = relevantData;
    if (selectedView !== 'all') {
      processedData = processedData.filter(d => d.view === selectedView);
    }
    if (selectedGroup !== 'all') {
      // Filter by group members
      const group = community.groups?.find(g => g.id === selectedGroup);
      if (group) {
        processedData = processedData.filter(d => group.members.includes(d.fromId));
      }
    }
    if (selectedAuthor !== 'all') {
      processedData = processedData.filter(d => d.fromId === selectedAuthor);
    }

    // Build nodes and edges
    processedData.forEach((item: any) => {
      const fromName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
      const toName = item.to ? (hideNames && item.to !== me?.firstName + " " + me?.lastName ? item.toPseudo : item.to) : fromName;
      
      // Add source node
      if (!nodes.has(fromName)) {
        const isCurrentUser = item.fromId === community.author.id;
        const nodeGroup = item.type === 'buildson' ? 'knowledge' : 'activity';
        nodes.set(fromName, {
          id: fromName,
          label: fromName,
          size: nodeSize,
          color: isCurrentUser ? '#e53e3e' : (nodeGroup === 'knowledge' ? '#805ad5' : '#3182ce'),
          interactions: 1,
          group: nodeGroup,
          isCurrentUser,
          activityCount: item.type !== 'buildson' ? 1 : 0,
          buildsonCount: item.type === 'buildson' ? 1 : 0,
          font: {
            size: nodeLabels ? 14 : 0,
            color: '#333333'
          }
        });
      } else {
        const node = nodes.get(fromName);
        node.interactions += 1;
        if (item.type === 'buildson') {
          node.buildsonCount += 1;
          node.group = 'mixed';
          node.color = item.fromId === community.author.id ? '#e53e3e' : '#9f7aea';
        } else {
          node.activityCount += 1;
          if (node.buildsonCount > 0) {
            node.group = 'mixed';
            node.color = item.fromId === community.author.id ? '#e53e3e' : '#9f7aea';
          }
        }
        node.size = Math.max(nodeSize, node.interactions * 3 + nodeSize);
      }
      
      // Add target node if different from source
      if (fromName !== toName && item.to) {
        const isCurrentUser = toName === me?.firstName + " " + me?.lastName;
        const nodeGroup = item.type === 'buildson' ? 'knowledge' : 'activity';
        if (!nodes.has(toName)) {
          nodes.set(toName, {
            id: toName,
            label: toName,
            size: nodeSize,
            color: isCurrentUser ? '#e53e3e' : (nodeGroup === 'knowledge' ? '#805ad5' : '#3182ce'),
            interactions: 1,
            group: nodeGroup,
            isCurrentUser,
            activityCount: item.type !== 'buildson' ? 1 : 0,
            buildsonCount: item.type === 'buildson' ? 1 : 0,
            font: {
              size: nodeLabels ? 14 : 0,
              color: '#333333'
            }
          });
        } else {
          const node = nodes.get(toName);
          node.interactions += 1;
          if (item.type === 'buildson') {
            node.buildsonCount += 1;
            node.group = 'mixed';
            node.color = isCurrentUser ? '#e53e3e' : '#9f7aea';
          } else {
            node.activityCount += 1;
            if (node.buildsonCount > 0) {
              node.group = 'mixed';
              node.color = isCurrentUser ? '#e53e3e' : '#9f7aea';
            }
          }
          node.size = Math.max(nodeSize, node.interactions * 3 + nodeSize);
        }
      }
      
      // Add edge (combine multiple edges between same nodes)
      if (fromName !== toName && item.to) {
        const edgeKey = `${fromName}-${toName}`;
        const reverseKey = `${toName}-${fromName}`;
        
        // Check if edge already exists (in either direction for undirected relationships)
        const existingKey = edgeMap.has(edgeKey) ? edgeKey : (edgeMap.has(reverseKey) ? reverseKey : null);
        
        if (existingKey) {
          const existingEdge = edgeMap.get(existingKey);
          existingEdge.weight += 1;
          existingEdge.width = Math.max(edgeWidth, existingEdge.weight * edgeWidth);
          existingEdge.interactions.push(item);
          
          // Update edge type if mixed
          if (!existingEdge.types.includes(item.type)) {
            existingEdge.types.push(item.type);
            existingEdge.color = existingEdge.types.length > 1 ? '#718096' : getEdgeColor(item.type);
          }
        } else {
          const newEdge = {
            id: item.id,
            from: fromName,
            to: toName,
            weight: 1,
            width: edgeWidth,
            color: getEdgeColor(item.type),
            arrows: showDirections ? 'to' : undefined,
            smooth: edgeSmoothing ? { type: 'continuous' } : false,
            interactions: [item],
            types: [item.type],
            label: edgeLabels ? `${item.type}` : undefined,
            font: edgeLabels ? { size: 10, color: '#666666' } : undefined,
            title: getEdgeTitle(item, fromName, toName)
          };
          
          if (item.type === 'buildson' && item.strength) {
            newEdge.width = item.strength * edgeWidth;
            newEdge.weight = item.strength;
          }
          
          edgeMap.set(edgeKey, newEdge);
        }
      }
    });
    
    // Convert edge map to array and update titles
    edgeMap.forEach((edge, key) => {
      if (edge.interactions.length > 1) {
        edge.title = `${edge.from} ↔ ${edge.to}\n${edge.interactions.length} interactions\nTypes: ${edge.types.join(', ')}`;
      }
      edges.push(edge);
    });

    function getEdgeColor(type: string): string {
      switch (type) {
        case 'read': return '#38a169';
        case 'modified': return '#d69e2e';
        case 'created': return '#805ad5';
        case 'buildson': return '#e53e3e';
        default: return '#718096';
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
    const mostActive = nodeArray.length > 0 ? nodeArray.reduce((prev, current) => 
      (prev.interactions > current.interactions) ? prev : current
    ) : null;

    return {
      nodes: nodeArray,
      edges,
      stats: {
        totalNodes: nodeArray.length,
        totalConnections: edges.length,
        activityNodes: nodeArray.filter(n => n.group === 'activity' || n.group === 'mixed').length,
        knowledgeNodes: nodeArray.filter(n => n.group === 'knowledge' || n.group === 'mixed').length,
        mostActive: mostActive ? mostActive.label : 'None',
        totalInteractions: nodeArray.reduce((sum, node) => sum + node.interactions, 0)
      }
    };
  }, [filteredData, showActivityData, showBuildsonData, selectedView, selectedGroup, selectedAuthor, hideNames, nodeSize, edgeWidth, showDirections, nodeLabels, edgeLabels, edgeSmoothing]);

  // Update network visualization with improved options
  useEffect(() => {
    if (!networkRef.current || !showNetwork || !networkData.nodes.length) return;

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
            physics: {
              enabled: false
            }
          };
        case 'circular':
          return {
            layout: {
              randomSeed: 2
            },
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
        default: // force
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
        scaling: { min: 10, max: 50 },
        font: { size: 12, color: '#333333' },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 5,
          x: 2,
          y: 2
        }
      },
      edges: {
        smooth: edgeSmoothing ? { type: 'continuous' } : false,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 3,
          x: 1,
          y: 1
        }
      },
      groups: clusterByType ? {
        activity: { color: { background: '#3182ce', border: '#2c5aa0' } },
        knowledge: { color: { background: '#805ad5', border: '#6b46c1' } },
        mixed: { color: { background: '#9f7aea', border: '#8b5cf6' } }
      } : undefined,
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

    // Enhanced node selection with detailed info
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
              type: e.types ? e.types.join(', ') : 'unknown',
              weight: e.weight
            }))
          });
        }
      } else {
        setSelectedNodeInfo(null);
      }
    });

    // Highlight connected nodes on hover
    networkInstance.on('hoverNode', (params) => {
      const nodeId = params.node;
      const connectedNodes = new Set();
      const connectedEdges = new Set();
      
      networkData.edges.forEach(edge => {
        if (edge.from === nodeId || edge.to === nodeId) {
          connectedEdges.add(edge.id);
          connectedNodes.add(edge.from);
          connectedNodes.add(edge.to);
        }
      });
      
      const updateArray = networkData.nodes.map(node => ({
        id: node.id,
        color: connectedNodes.has(node.id) ? node.color : { ...node.color, opacity: 0.3 }
      }));
      
      networkInstance.setData({
        nodes: updateArray,
        edges: networkData.edges.map(edge => ({
          ...edge,
          color: connectedEdges.has(edge.id) ? edge.color : { ...edge.color, opacity: 0.3 }
        }))
      });
    });
    
    networkInstance.on('blurNode', () => {
      networkInstance.setData({ nodes: networkData.nodes, edges: networkData.edges });
    });

    setNetwork(networkInstance);

    return () => {
      networkInstance.destroy();
    };
  }, [networkData, showNetwork, graphLayout, nodeSpacing, edgeSmoothing, clusterByType]);

  // Filter table data
  const tableData = useMemo(() => {
    let data = filteredData;
    if (searchTerm) {
      data = data.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.from.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return tableData.slice(startIndex, startIndex + entriesPerPage);
  }, [tableData, currentPage, entriesPerPage]);

  const resetFilters = () => {
    setSelectedView('all');
    setSelectedGroup('all');
    setSelectedAuthor('all');
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedNodeInfo(null);
    // Reset DC.js filters
    dc.filterAll();
    dc.renderAll();
  };

  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    const headers = ['Date', 'Type', 'From', 'To', 'Title', 'View'];
    const csvContent = [
      headers.join(','),
      ...tableData.map(item => [
        `"${item.date.toLocaleDateString()}"`,
        `"${item.type}"`,
        `"${hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from}"`,
        `"${hideNames && item.to !== me?.firstName + " " + me?.lastName ? item.toPseudo : item.to}"`,
        `"${item.title}"`,
        `"${item.view}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `knowledge_forum_data.${format}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <Box p={6} bg={mainBgColor} minH="100vh" color={textColor}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="blue.600">
                  Knowledge Forum Analytics Dashboard
                </Heading>
                <Text color="gray.600">
                  Unified view of learning activities and knowledge building
                </Text>
              </VStack>
              <HStack>
                <Badge colorScheme="blue" p={2}>
                  Current User: {me?.firstName} {me?.lastName}
                </Badge>
                <Badge colorScheme={isManager ? 'green' : 'gray'} p={2}>
                  {isManager ? 'Manager' : 'Student'}
                </Badge>
              </HStack>
            </Flex>
          </CardHeader>
        </Card>

        {/* Main Controls */}
        <Card>
          <CardHeader>
            <Heading size="md">Dashboard Configuration</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Data Type Selection */}
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Unified Graph Analysis:</AlertTitle>
                  <AlertDescription>
                    This graph combines both activity data (reading, creating, modifying) and knowledge building data (buildson relationships) in a single visualization. Toggle the data types below to focus your analysis.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Data Type Toggles */}
              <Card p={4} bg="blue.50">
                <VStack spacing={4}>
                  <Text fontWeight="bold" fontSize="lg">Data Types to Display</Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0" fontWeight="bold">📊 Activity Data</FormLabel>
                        <Text fontSize="sm" color="gray.600">Reading, creating, modifying content</Text>
                      </VStack>
                      <Switch 
                        size="lg"
                        isChecked={showActivityData} 
                        onChange={(e) => setShowActivityData(e.target.checked)}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0" fontWeight="bold">🔗 Knowledge Building</FormLabel>
                        <Text fontSize="sm" color="gray.600">Ideas building upon each other</Text>
                      </VStack>
                      <Switch 
                        size="lg"
                        isChecked={showBuildsonData} 
                        onChange={(e) => setShowBuildsonData(e.target.checked)}
                        colorScheme="purple"
                      />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </Card>

              <Divider />

              {/* Filters */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <FormControl>
                  <FormLabel>Filter by View</FormLabel>
                  <Select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                    <option value="all">All Views</option>
                    <option value="Science Discussion">Science Discussion</option>
                    <option value="Math Problems">Math Problems</option>
                    <option value="History Class">History Class</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Filter by Group</FormLabel>
                  <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                    <option value="all">All Groups</option>
                    {community.groups?.map(group => (
                      <option key={group.id} value={group.id}>{group.title}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Filter by Author</FormLabel>
                  <Select value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}>
                    <option value="all">All Authors</option>
                    {community.authors?.map(author => (
                      <option key={author.id} value={author.id}>
                        {hideNames ? author.pseudoName : `${author.firstName} ${author.lastName}`}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <VStack>
                  <Button colorScheme="red" onClick={resetFilters} w="full">
                    Reset All Filters
                  </Button>
                </VStack>
              </SimpleGrid>

              <Divider />

              {/* Graph Layout & Display Options */}
              <Card p={4} bg="gray.50">
                <VStack spacing={4}>
                  <Text fontWeight="bold" fontSize="lg">Graph Layout & Appearance</Text>
                  
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Graph Layout</FormLabel>
                      <Select value={graphLayout} onChange={(e) => setGraphLayout(e.target.value as any)}>
                        <option value="force">Force-Directed</option>
                        <option value="hierarchical">Hierarchical</option>
                        <option value="circular">Circular</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Node Spacing: {nodeSpacing}</FormLabel>
                      <Slider value={nodeSpacing} onChange={setNodeSpacing} min={100} max={400}>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>
                    
                    <VStack spacing={2}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" fontSize="sm">Cluster by Type</FormLabel>
                        <Switch isChecked={clusterByType} onChange={(e) => setClusterByType(e.target.checked)} />
                      </FormControl>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" fontSize="sm">Edge Smoothing</FormLabel>
                        <Switch isChecked={edgeSmoothing} onChange={(e) => setEdgeSmoothing(e.target.checked)} />
                      </FormControl>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </Card>
              
              {/* Display Options */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">
                    <Icon as={hideNames ? ViewOffIcon : ViewIcon} mr={2} />
                    Show Real Names
                  </FormLabel>
                  <Switch 
                    isChecked={!hideNames} 
                    onChange={(e) => setHideNames(!e.target.checked)}
                    isDisabled={!isManager}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Node Labels</FormLabel>
                  <Switch isChecked={nodeLabels} onChange={(e) => setNodeLabels(e.target.checked)} />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Edge Labels</FormLabel>
                  <Switch isChecked={edgeLabels} onChange={(e) => setEdgeLabels(e.target.checked)} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Show Network Graph</FormLabel>
                  <Switch isChecked={showNetwork} onChange={(e) => setShowNetwork(e.target.checked)} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Show Timeline</FormLabel>
                  <Switch isChecked={showTimeline} onChange={(e) => setShowTimeline(e.target.checked)} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Show Directions</FormLabel>
                  <Switch isChecked={showDirections} onChange={(e) => setShowDirections(e.target.checked)} />
                </FormControl>
              </SimpleGrid>

              {/* Visual Settings */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <FormLabel>Node Size: {nodeSize}</FormLabel>
                  <Slider value={nodeSize} onChange={setNodeSize} min={10} max={40}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>

                <FormControl>
                  <FormLabel>Connection Width: {edgeWidth}</FormLabel>
                  <Slider value={edgeWidth} onChange={setEdgeWidth} min={1} max={8}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Statistics Overview */}
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Users</StatLabel>
                <StatNumber>{networkData.stats.totalNodes}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Connections</StatLabel>
                <StatNumber>{networkData.stats.totalConnections}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Activity Nodes</StatLabel>
                <StatNumber>{networkData.stats.activityNodes}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Knowledge Nodes</StatLabel>
                <StatNumber>{networkData.stats.knowledgeNodes}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Most Active</StatLabel>
                <StatNumber fontSize="md">{networkData.stats.mostActive}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Interactions</StatLabel>
                <StatNumber>{networkData.stats.totalInteractions}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Charts Section */}
        {showTimeline && (
          <Card>
            <CardHeader>
              <Heading size="md">Interactive Charts & Timeline</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4} mb={6}>
                <Box>
                  <Text fontWeight="bold" mb={2}>Activity Types</Text>
                  <Box ref={typeChartRef} id="type-chart" h="200px" />
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>Authors</Text>
                  <Box ref={authorChartRef} id="author-chart" h="200px" />
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>Data Count</Text>
                  <Box className="dc-data-count" p={4} bg="green.50" borderRadius="md">
                    <Text><span className="filter-count"></span> selected out of <span className="total-count"></span> records</Text>
                  </Box>
                </Box>
              </SimpleGrid>
              
              <VStack spacing={4}>
                <Box w="full">
                  <Text fontWeight="bold" mb={2}>Timeline</Text>
                  <Box ref={lineChartRef} id="line-chart" h="200px" bg={cardBg} />
                </Box>
                <Box w="full">
                  <Box ref={rangeChartRef} id="range-chart" h="60px" bg={cardBg} />
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Network Visualization */}
        {showNetwork && (
          <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={6}>
            <Card>
              <CardHeader>
                <Heading size="md">
                  Unified Knowledge Network
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  {showActivityData && showBuildsonData ? 'Combined Activity & Knowledge Building' : 
                   showActivityData ? 'Activity Data Only' : 
                   showBuildsonData ? 'Knowledge Building Data Only' : 'No Data Selected'}
                </Text>
              </CardHeader>
              <CardBody>
                <Box ref={networkRef} h="500px" border="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} />
              </CardBody>
            </Card>

            {/* Network Info Sidebar */}
            <VStack spacing={4}>
              {selectedNodeInfo && (
                <Card w="full">
                  <CardHeader>
                    <Heading size="sm">Selected User</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">{selectedNodeInfo.label}</Text>
                      <Badge colorScheme={selectedNodeInfo.color === '#e53e3e' ? 'red' : 'blue'}>
                        {selectedNodeInfo.color === '#e53e3e' ? 'You' : 'Peer'}
                      </Badge>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm"><strong>Total Interactions:</strong> {selectedNodeInfo.interactions}</Text>
                        <Text fontSize="sm"><strong>Activity Count:</strong> {selectedNodeInfo.activityCount}</Text>
                        <Text fontSize="sm"><strong>Knowledge Building:</strong> {selectedNodeInfo.buildsonCount}</Text>
                        <Text fontSize="sm"><strong>Connected to:</strong> {selectedNodeInfo.connectedEdges} users</Text>
                      </VStack>
                      {selectedNodeInfo.connections && selectedNodeInfo.connections.length > 0 && (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold">Connections:</Text>
                          <VStack align="start" spacing={1} maxH="150px" overflowY="auto">
                            {selectedNodeInfo.connections.slice(0, 5).map((conn, idx) => (
                              <Text key={idx} fontSize="xs">
                                → {conn.target} ({conn.type}, weight: {conn.weight})
                              </Text>
                            ))}
                            {selectedNodeInfo.connections.length > 5 && (
                              <Text fontSize="xs" color="gray.500">
                                ...and {selectedNodeInfo.connections.length - 5} more
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}

              <Card w="full">
                <CardHeader>
                  <Heading size="sm">Legend</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={2} fontSize="sm">
                    <HStack>
                      <Box w={4} h={4} bg="red.500" borderRadius="full" />
                      <Text>Your activity</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={4} bg="blue.500" borderRadius="full" />
                      <Text>Peer activity data</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={4} bg="purple.500" borderRadius="full" />
                      <Text>Knowledge building</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={4} bg="purple.300" borderRadius="full" />
                      <Text>Mixed activity</Text>
                    </HStack>
                    <Divider />
                    <Text fontWeight="bold">Edge Colors:</Text>
                    <HStack>
                      <Box w={4} h={1} bg="green.500" />
                      <Text>Read actions</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={1} bg="yellow.500" />
                      <Text>Modify actions</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={1} bg="purple.500" />
                      <Text>Create actions</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={1} bg="red.500" />
                      <Text>Knowledge building</Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={1} bg="gray.500" />
                      <Text>Mixed interactions</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Click nodes for details. Hover to highlight connections. Larger nodes = more activity.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Grid>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Heading size="md">Activity Records</Heading>
              <HStack>
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <ButtonGroup>
                  <Button leftIcon={<DownloadIcon />} onClick={() => exportData('csv')} size="sm">
                    CSV
                  </Button>
                  <Button leftIcon={<DownloadIcon />} onClick={() => exportData('excel')} size="sm">
                    Excel
                  </Button>
                </ButtonGroup>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <HStack>
                  <Text fontSize="sm">Show</Text>
                  <Select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))} size="sm" w="auto">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Select>
                  <Text fontSize="sm">entries</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, tableData.length)} of {tableData.length} entries
                </Text>
              </HStack>

              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th>From</Th>
                      <Th>Title</Th>
                      <Th>View</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedData.map((item, index) => (
                      <Tr key={`${item.id}-${index}`}>
                        <Td>{item.date.toLocaleDateString()}</Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              item.type === 'read' ? 'green' : 
                              item.type === 'modified' ? 'yellow' : 
                              item.type === 'created' ? 'blue' : 
                              item.type === 'buildson' ? 'red' : 'purple'
                            }
                          >
                            {item.type}
                          </Badge>
                        </Td>
                        <Td>{hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from}</Td>
                        <Td>
                          <Text 
                            color="blue.500" 
                            cursor="pointer" 
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => window.open(`${baseURL}/contribution/${item.ID}`, '_blank')}
                          >
                            {item.title}
                          </Text>
                        </Td>
                        <Td>{item.view}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Pagination */}
              {Math.ceil(tableData.length / entriesPerPage) > 1 && (
                <HStack justify="center" spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, Math.ceil(tableData.length / entriesPerPage)) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        size="sm"
                        colorScheme={currentPage === page ? 'blue' : 'gray'}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    isDisabled={currentPage === Math.ceil(tableData.length / entriesPerPage)}
                  >
                    Next
                  </Button>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default UnifiedDashboard;