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
  Spinner,
  Center,
  SimpleGrid,
  Tooltip,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription
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
  
  // Filter State
  const [selectedView, setSelectedView] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  
  // Display Options
  const [showActivityData, setShowActivityData] = useState(true);
  const [showBuildsonData, setShowBuildsonData] = useState(true);
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

  const isManager = role === 'manager';

  // Enhanced dummy data combining activity and buildson relationships
  const dummyData = [
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
      id: '4', when: Date.now() - 86400000 * 1, type: 'buildson',
      from: 'Alice Brown', fromId: 'author-4', fromPseudo: 'AliceB',
      to: 'John Smith', toPseudo: 'JohnS',
      title: 'Building on Climate Discussion', view: 'Science Discussion',
      data: { body: '<p>Building on the climate change discussion with additional research.</p>' },
      ID: 'contrib-4', strength: 3
    },
    {
      id: '5', when: Date.now() - 86400000 * 4, type: 'buildson',
      from: 'Bob Davis', fromId: 'author-5', fromPseudo: 'BobD',
      to: 'Sarah Johnson', toPseudo: 'SarahJ',
      title: 'Math Proof Extension', view: 'Math Problems',
      data: { body: '<p>Extending the mathematical proof with new theorems.</p>' },
      ID: 'contrib-5', strength: 2
    },
    {
      id: '6', when: Date.now() - 86400000 * 6, type: 'read',
      from: 'Carol White', fromId: 'author-6', fromPseudo: 'CarolW',
      to: 'Mike Wilson', toPseudo: 'MikeW',
      title: 'History Essay Update', view: 'History Class',
      data: { body: '<p>Reading the updated history essay.</p>' },
      ID: 'contrib-3'
    },
    {
      id: '7', when: Date.now() - 86400000 * 7, type: 'buildson',
      from: 'John Smith', fromId: 'author-1', fromPseudo: 'JohnS',
      to: 'Bob Davis', toPseudo: 'BobD',
      title: 'Further Math Extensions', view: 'Math Problems',
      data: { body: '<p>Building further on the mathematical concepts.</p>' },
      ID: 'contrib-6', strength: 1
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
      setFilteredData(processedData);
      setLoading(false);
    }, 500);
  }, []);

  // Apply filters to data
  const applyFilters = (data: any[]) => {
    let filtered = data;

    // Data type filters
    if (!showActivityData) {
      filtered = filtered.filter(d => !['read', 'created', 'modified'].includes(d.type));
    }
    if (!showBuildsonData) {
      filtered = filtered.filter(d => d.type !== 'buildson');
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
  }, [rawData, showActivityData, showBuildsonData, selectedView, selectedGroup, selectedAuthor, dateRange]);

  // Process network data
  const networkData = useMemo(() => {
    const nodes = new Map();
    const edges: any[] = [];
    const edgeMap = new Map();
    
    // Build user activity summary
    const userActivities = new Map();
    
    filteredData.forEach((item: any) => {
      const fromName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
      const toName = item.to ? (hideNames && item.to !== me?.firstName + " " + me?.lastName ? item.toPseudo : item.to) : fromName;
      
      // Track user activities
      if (!userActivities.has(fromName)) {
        userActivities.set(fromName, {
          reads: 0, creates: 0, modifies: 0, buildons: 0,
          activities: [], buildsonConnections: []
        });
      }
      
      const userActivity = userActivities.get(fromName);
      userActivity.activities.push(item);
      
      if (item.type === 'read') userActivity.reads++;
      else if (item.type === 'created') userActivity.creates++;
      else if (item.type === 'modified') userActivity.modifies++;
      else if (item.type === 'buildson') {
        userActivity.buildons++;
        userActivity.buildsonConnections.push({ target: toName, strength: item.strength || 1, title: item.title });
      }
      
      // Create nodes
      const isCurrentUser = item.fromId === community.author.id;
      const hasActivity = ['read', 'created', 'modified'].includes(item.type);
      const hasBuildson = item.type === 'buildson';
      
      if (!nodes.has(fromName)) {
        nodes.set(fromName, {
          id: fromName,
          label: showNodeLabels ? fromName : '',
          size: nodeSize,
          color: isCurrentUser ? '#e53e3e' : (hasBuildson ? '#805ad5' : '#3182ce'),
          borderWidth: 2,
          interactions: 1,
          isCurrentUser,
          activityCount: hasActivity ? 1 : 0,
          buildsonCount: hasBuildson ? 1 : 0,
          font: { size: showNodeLabels ? 14 : 0, color: '#333333' },
          shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 5, x: 2, y: 2 }
        });
      } else {
        const node = nodes.get(fromName);
        node.interactions += 1;
        if (hasActivity) node.activityCount += 1;
        if (hasBuildson) node.buildsonCount += 1;
        
        // Update color based on mixed activity
        if (node.activityCount > 0 && node.buildsonCount > 0) {
          node.color = isCurrentUser ? '#e53e3e' : '#9f7aea';
        }
        
        node.size = Math.max(nodeSize, Math.min(nodeSize * 2, nodeSize + (node.interactions * 2)));
      }
      
      // Create target node if different
      if (fromName !== toName && item.to) {
        const isTargetCurrentUser = toName === me?.firstName + " " + me?.lastName;
        if (!nodes.has(toName)) {
          nodes.set(toName, {
            id: toName,
            label: showNodeLabels ? toName : '',
            size: nodeSize,
            color: isTargetCurrentUser ? '#e53e3e' : '#3182ce',
            borderWidth: 2,
            interactions: 1,
            isCurrentUser: isTargetCurrentUser,
            activityCount: 0,
            buildsonCount: 0,
            font: { size: showNodeLabels ? 14 : 0, color: '#333333' },
            shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 5, x: 2, y: 2 }
          });
        }
      }
      
      // Create edges
      if (fromName !== toName && item.to) {
        const edgeKey = `${fromName}-${toName}`;
        const reverseKey = `${toName}-${fromName}`;
        
        const existingKey = edgeMap.has(edgeKey) ? edgeKey : (edgeMap.has(reverseKey) ? reverseKey : null);
        
        if (existingKey) {
          const existingEdge = edgeMap.get(existingKey);
          existingEdge.weight += 1;
          existingEdge.width = Math.max(edgeWidth, existingEdge.weight * edgeWidth);
          existingEdge.interactions.push(item);
          
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
            width: item.type === 'buildson' && item.strength ? item.strength * edgeWidth : edgeWidth,
            color: getEdgeColor(item.type),
            arrows: showDirections ? 'to' : undefined,
            smooth: edgeSmoothing ? { type: 'continuous' } : false,
            interactions: [item],
            types: [item.type],
            label: showEdgeLabels ? item.type : undefined,
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
        edge.title = `${edge.from} ↔ ${edge.to}\n${edge.interactions.length} interactions\nTypes: ${edge.types.join(', ')}`;
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
    
    return {
      nodes: nodeArray,
      edges,
      stats: {
        totalNodes: nodeArray.length,
        totalConnections: edges.length,
        activityConnections: edges.filter(e => e.types.some(t => ['read', 'created', 'modified'].includes(t))).length,
        buildsonConnections: edges.filter(e => e.types.includes('buildson')).length,
        mostActiveUser: nodeArray.length > 0 ? nodeArray.reduce((prev, current) => 
          (prev.interactions > current.interactions) ? prev : current
        ).label : 'None'
      }
    };
  }, [filteredData, hideNames, nodeSize, edgeWidth, showDirections, showNodeLabels, showEdgeLabels, edgeSmoothing]);

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
              types: e.types,
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
    <Box bg={mainBgColor} h="100vh" overflow="hidden">
      <Grid templateColumns="1fr 400px" h="100%">
        {/* Main Graph Area */}
        <GridItem bg={bgColor} position="relative">
          {/* Graph Header */}
          <Box p={4} borderBottom="1px" borderColor={borderColor} bg={bgColor}>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="md" color="blue.600">
                  Knowledge Forum Network
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
                    <Badge colorScheme="purple" mr={1}>{networkData.stats.buildsonConnections}</Badge>
                    Knowledge Links
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
          <Box h="calc(100vh - 80px)" position="relative">
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
                <Text>Types: {hoveredEdgeInfo.types.join(', ')}</Text>
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
            {/* Data Type Controls */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Data Types</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3}>
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <VStack align="start" spacing={0}>
                      <FormLabel mb="0" fontSize="sm" fontWeight="bold">Activity Data</FormLabel>
                      <Text fontSize="xs" color="gray.600">Reading, creating, modifying</Text>
                    </VStack>
                    <Switch 
                      isChecked={showActivityData} 
                      onChange={(e) => setShowActivityData(e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <VStack align="start" spacing={0}>
                      <FormLabel mb="0" fontSize="sm" fontWeight="bold">Knowledge Building</FormLabel>
                      <Text fontSize="xs" color="gray.600">Ideas building upon each other</Text>
                    </VStack>
                    <Switch 
                      isChecked={showBuildsonData} 
                      onChange={(e) => setShowBuildsonData(e.target.checked)}
                      colorScheme="purple"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

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

                    {selectedNodeInfo.userActivity && (
                      <>
                        <Divider />
                        <VStack align="start" spacing={2} w="full">
                          <Text fontWeight="bold" fontSize="sm">Activity Breakdown</Text>
                          <SimpleGrid columns={2} spacing={2} w="full" fontSize="xs">
                            <Text>📖 Reads: {selectedNodeInfo.userActivity.reads}</Text>
                            <Text>✏️ Creates: {selectedNodeInfo.userActivity.creates}</Text>
                            <Text>🔄 Modifies: {selectedNodeInfo.userActivity.modifies}</Text>
                            <Text>🔗 Buildons: {selectedNodeInfo.userActivity.buildons}</Text>
                          </SimpleGrid>
                        </VStack>
                      </>
                    )}

                    {selectedNodeInfo.userActivity?.buildsonConnections?.length > 0 && (
                      <>
                        <Divider />
                        <VStack align="start" spacing={2} w="full">
                          <Text fontWeight="bold" fontSize="sm">Knowledge Building</Text>
                          <VStack align="start" spacing={1} maxH="120px" overflowY="auto" w="full">
                            {selectedNodeInfo.userActivity.buildsonConnections.map((conn, idx) => (
                              <Box key={idx} p={2} bg="purple.50" borderRadius="md" w="full">
                                <Text fontSize="xs" fontWeight="bold">→ {conn.target}</Text>
                                <Text fontSize="xs" color="gray.600">{conn.title}</Text>
                                <Badge size="sm" colorScheme="purple">Strength: {conn.strength}</Badge>
                              </Box>
                            ))}
                          </VStack>
                        </VStack>
                      </>
                    )}

                    {selectedNodeInfo.connections?.length > 0 && (
                      <>
                        <Divider />
                        <VStack align="start" spacing={2} w="full">
                          <Text fontWeight="bold" fontSize="sm">Recent Connections</Text>
                          <VStack align="start" spacing={1} maxH="100px" overflowY="auto" w="full">
                            {selectedNodeInfo.connections.slice(0, 5).map((conn, idx) => (
                              <Text key={idx} fontSize="xs">
                                → {conn.target} ({conn.types.join(', ')})
                              </Text>
                            ))}
                            {selectedNodeInfo.connections.length > 5 && (
                              <Text fontSize="xs" color="gray.500">
                                ...and {selectedNodeInfo.connections.length - 5} more
                              </Text>
                            )}
                          </VStack>
                        </VStack>
                      </>
                    )}
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
                  <Text fontWeight="bold">Node Colors:</Text>
                  <HStack>
                    <Box w={3} h={3} bg="red.500" borderRadius="full" />
                    <Text>Your activity</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={3} bg="blue.500" borderRadius="full" />
                    <Text>Activity users</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={3} bg="purple.500" borderRadius="full" />
                    <Text>Knowledge builders</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={3} bg="purple.300" borderRadius="full" />
                    <Text>Mixed activity</Text>
                  </HStack>
                  
                  <Divider />
                  <Text fontWeight="bold">Edge Colors:</Text>
                  <HStack>
                    <Box w={3} h={0.5} bg="green.500" />
                    <Text>Read</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={0.5} bg="yellow.500" />
                    <Text>Modify</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={0.5} bg="purple.500" />
                    <Text>Create</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={0.5} bg="red.500" />
                    <Text>Buildson</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={0.5} bg="gray.500" />
                    <Text>Mixed</Text>
                  </HStack>

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
    </Box>
  );
};

export default UnifiedDashboard;