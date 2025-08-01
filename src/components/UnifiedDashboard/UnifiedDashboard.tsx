import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Button,
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
  Container
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
    <Container maxW="100%" p={0} h="100vh" bg={mainBgColor}>
      {/* Header */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={4} shadow="sm">
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="gray.800" fontWeight="600">
              Knowledge Forum Analytics
            </Heading>
            <HStack spacing={6} fontSize="sm" color="gray.600">
              <HStack>
                <Badge colorScheme="blue" variant="subtle">{networkData.stats.totalNodes}</Badge>
                <Text>Users</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green" variant="subtle">{networkData.stats.totalConnections}</Badge>
                <Text>Connections</Text>
              </HStack>
            </HStack>
          </VStack>
          
          <HStack spacing={6}>
            <HStack spacing={4}>
              <Text fontSize="sm" fontWeight="500" color="gray.700">Data Type:</Text>
              <RadioGroup value={dataType} onChange={(value) => setDataType(value as 'activity' | 'knowledge')}>
                <HStack spacing={4}>
                  <Radio value="activity" colorScheme="blue" size="sm">
                    <Text fontSize="sm" fontWeight="500">Activity Analysis</Text>
                  </Radio>
                  <Radio value="knowledge" colorScheme="purple" size="sm">
                    <Text fontSize="sm" fontWeight="500">Knowledge Building</Text>
                  </Radio>
                </HStack>
              </RadioGroup>
            </HStack>
            
            <Button size="sm" onClick={resetAllFilters} colorScheme="red" variant="outline">
              Reset Filters
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Grid templateColumns="1fr 350px" h="calc(100vh - 80px)">
        {/* Main Graph Area */}
        <GridItem bg="white" position="relative" borderRight="1px solid" borderColor="gray.200">
          <Box h="100%" position="relative">
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
                shadow="lg"
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
        <GridItem bg="gray.50" overflowY="auto">
          <VStack spacing={0} align="stretch" h="100%">
            {/* Selected Node Info - Fixed at top */}
            {selectedNodeInfo && (
              <Box bg="white" p={4} borderBottom="1px solid" borderColor="gray.200" shadow="sm">
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="100%">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="600" fontSize="lg" color="gray.800">{selectedNodeInfo.label}</Text>
                      <Badge colorScheme={selectedNodeInfo.isCurrentUser ? 'red' : 'blue'} variant="subtle">
                        {selectedNodeInfo.isCurrentUser ? 'You' : 'Peer'}
                      </Badge>
                    </VStack>
                    <Button size="xs" variant="ghost" onClick={() => setSelectedNodeInfo(null)}>×</Button>
                  </HStack>

                  {dataType === 'activity' && selectedNodeInfo.userActivity && (
                    <VStack align="start" spacing={2} w="full">
                      <Text fontWeight="500" fontSize="sm" color="gray.700">
                        {selectedNodeInfo.interactions} total activities
                      </Text>
                      <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
                        <VStack spacing={1}>
                          <Text fontWeight="500" color="green.600">{selectedNodeInfo.userActivity.reads}</Text>
                          <Text color="gray.600">Reads</Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontWeight="500" color="purple.600">{selectedNodeInfo.userActivity.creates}</Text>
                          <Text color="gray.600">Creates</Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontWeight="500" color="orange.600">{selectedNodeInfo.userActivity.modifies}</Text>
                          <Text color="gray.600">Modifies</Text>
                        </VStack>
                      </SimpleGrid>
                    </VStack>
                  )}

                  {dataType === 'knowledge' && selectedNodeInfo.userActivity && (
                    <VStack align="start" spacing={2} w="full">
                      <Text fontWeight="500" fontSize="sm" color="gray.700">
                        {selectedNodeInfo.userActivity.creates || 0} notes written
                      </Text>
                      
                      {selectedNodeInfo.userActivity.buildsonConnections?.length > 0 && (
                        <Box w="full">
                          <Text fontWeight="500" fontSize="xs" color="gray.600" mb={1}>
                            Built onto {selectedNodeInfo.userActivity.buildsonConnections.length} notes
                          </Text>
                          <Box maxH="60px" overflowY="auto">
                            {selectedNodeInfo.userActivity.buildsonConnections.map((conn, idx) => (
                              <Text key={idx} fontSize="xs" color="gray.500">
                                • Strength {conn.strength} - {conn.target}
                              </Text>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {selectedNodeInfo.userActivity.builtUponBy?.length > 0 && (
                        <Box w="full">
                          <Text fontWeight="500" fontSize="xs" color="gray.600" mb={1}>
                            {selectedNodeInfo.userActivity.builtUponBy.length} notes built upon their work
                          </Text>
                          <Box maxH="60px" overflowY="auto">
                            {selectedNodeInfo.userActivity.builtUponBy.map((conn, idx) => (
                              <Text key={idx} fontSize="xs" color="gray.500">
                                • Strength {conn.strength} - {conn.source}
                              </Text>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}

            {/* Filters */}
            <Box bg="white" p={4} borderBottom="1px solid" borderColor="gray.200">
              <VStack spacing={3} align="stretch">
                <Text fontWeight="600" fontSize="md" color="gray.800">Filters</Text>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">View</FormLabel>
                    <Select size="sm" value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                      <option value="all">All Views</option>
                      <option value="Science Discussion">Science Discussion</option>
                      <option value="Math Problems">Math Problems</option>
                      <option value="History Class">History Class</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Group</FormLabel>
                    <Select size="sm" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                      <option value="all">All Groups</option>
                      {community.groups?.map(group => (
                        <option key={group.id} value={group.id}>{group.title}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Author</FormLabel>
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
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Time Range</FormLabel>
                    <Select size="sm" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="3months">Last 3 Months</option>
                    </Select>
                  </FormControl>
                </VStack>
              </VStack>
            </Box>

            {/* Graph Settings */}
            <Box bg="white" p={4} borderBottom="1px solid" borderColor="gray.200">
              <VStack spacing={3} align="stretch">
                <HStack>
                  <Icon as={SettingsIcon} color="gray.600" />
                  <Text fontWeight="600" fontSize="md" color="gray.800">Graph Settings</Text>
                </HStack>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Layout</FormLabel>
                    <Select size="sm" value={graphLayout} onChange={(e) => setGraphLayout(e.target.value as any)}>
                      <option value="force">Force-Directed</option>
                      <option value="hierarchical">Hierarchical</option>
                      <option value="circular">Circular</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Node Size: {nodeSize}</FormLabel>
                    <Slider value={nodeSize} onChange={setNodeSize} min={15} max={50} step={5}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Connection Width: {edgeWidth}</FormLabel>
                    <Slider value={edgeWidth} onChange={setEdgeWidth} min={1} max={8}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="500" color="gray.700">Node Spacing: {nodeSpacing}</FormLabel>
                    <Slider value={nodeSpacing} onChange={setNodeSpacing} min={100} max={400} step={50}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <SimpleGrid columns={2} spacing={3}>
                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs" fontWeight="500" color="gray.700">Show Names</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={!hideNames} 
                        onChange={(e) => setHideNames(!e.target.checked)}
                        isDisabled={!isManager}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs" fontWeight="500" color="gray.700">Directions</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={showDirections} 
                        onChange={(e) => setShowDirections(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs" fontWeight="500" color="gray.700">Node Labels</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={showNodeLabels} 
                        onChange={(e) => setShowNodeLabels(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs" fontWeight="500" color="gray.700">Edge Labels</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={showEdgeLabels} 
                        onChange={(e) => setShowEdgeLabels(e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" flexDirection="column">
                      <FormLabel mb="1" fontSize="xs" fontWeight="500" color="gray.700">Smooth Edges</FormLabel>
                      <Switch 
                        size="sm"
                        isChecked={edgeSmoothing} 
                        onChange={(e) => setEdgeSmoothing(e.target.checked)}
                      />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </VStack>
            </Box>

            {/* Legend */}
            <Box bg="white" p={4} flex="1">
              <VStack spacing={3} align="stretch">
                <Text fontWeight="600" fontSize="md" color="gray.800">Legend</Text>
                <VStack align="start" spacing={2} fontSize="xs">
                  <Text fontWeight="500" color="gray.700">
                    {dataType === 'activity' ? 'Nodes: Username + Activity Count' : 'Nodes: Username + Buildson Count'}
                  </Text>
                  <Text fontWeight="500" color="gray.700">
                    {dataType === 'activity' ? 'Edges: Interaction count between users' : 'Edges: Knowledge building connections'}
                  </Text>
                  
                  <Divider />
                  <Text fontWeight="500" color="gray.700">Node Colors:</Text>
                  <HStack>
                    <Box w={3} h={3} bg="red.500" borderRadius="full" />
                    <Text>Current User</Text>
                  </HStack>
                  <HStack>
                    <Box w={3} h={3} bg="blue.500" borderRadius="full" />
                    <Text>Other Users</Text>
                  </HStack>
                  
                  <Divider />
                  <Text fontWeight="500" color="gray.700">Edge Colors:</Text>
                  {dataType === 'activity' ? (
                    <>
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
                    </>
                  ) : (
                    <HStack>
                      <Box w={3} h={0.5} bg="red.500" />
                      <Text>Buildson</Text>
                    </HStack>
                  )}

                  <Alert status="info" size="sm" mt={2}>
                    <AlertIcon />
                    <AlertDescription fontSize="xs">
                      Click nodes for details. Hover edges for activity info. Larger nodes = more activity.
                    </AlertDescription>
                  </Alert>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default UnifiedDashboard;