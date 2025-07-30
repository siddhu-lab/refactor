import React, { useState, useEffect, useRef, useContext } from 'react';
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center
} from '@chakra-ui/react';
import { Network } from 'vis-network';
import * as d3 from 'd3';
import dashboardContext from '../../context/dashboard.js';

interface GraphData {
  nodes: any[];
  edges: any[];
  stats: {
    totalNodes: number;
    totalConnections: number;
    mostActive: string;
    timeRange: string;
  };
}

const UnifiedGraphDashboard: React.FC = () => {
  const { community, role, me } = useContext(dashboardContext);
  const networkRef = useRef<HTMLDivElement>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  
  // Graph Configuration
  const [graphType, setGraphType] = useState<'activity' | 'buildons'>('activity');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [showNames, setShowNames] = useState(role === 'manager');
  const [nodeSize, setNodeSize] = useState(20);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [showDirections, setShowDirections] = useState(false);
  
  // Data and UI State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<any>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Dummy data for demonstration
  const activityData = [
    { id: '1', from: 'John Smith', to: 'Sarah Johnson', type: 'read', date: new Date(), view: 'Science Discussion' },
    { id: '2', from: 'Sarah Johnson', to: 'Mike Wilson', type: 'modified', date: new Date(), view: 'Math Problems' },
    { id: '3', from: 'Mike Wilson', to: 'Alice Brown', type: 'created', date: new Date(), view: 'History Class' },
    { id: '4', from: 'Alice Brown', to: 'John Smith', type: 'read', date: new Date(), view: 'Science Discussion' },
  ];

  const buildonsData = [
    { id: '1', from: 'John Smith', to: 'Sarah Johnson', type: 'buildson', strength: 3, date: new Date() },
    { id: '2', from: 'Sarah Johnson', to: 'Mike Wilson', type: 'buildson', strength: 2, date: new Date() },
    { id: '3', from: 'Mike Wilson', to: 'Alice Brown', type: 'buildson', strength: 1, date: new Date() },
  ];

  const processGraphData = (): GraphData => {
    const data = graphType === 'activity' ? activityData : buildonsData;
    const nodes = new Map();
    const edges: any[] = [];
    
    // Filter data based on selections
    let filteredData = data;
    if (selectedView !== 'all') {
      filteredData = filteredData.filter((item: any) => item.view === selectedView);
    }
    
    // Process nodes
    filteredData.forEach((item: any) => {
      // Add source node
      if (!nodes.has(item.from)) {
        nodes.set(item.from, {
          id: item.from,
          label: showNames ? item.from : `User ${nodes.size + 1}`,
          size: nodeSize,
          color: item.from === `${me?.firstName} ${me?.lastName}` ? '#e53e3e' : '#3182ce',
          interactions: 1
        });
      } else {
        const node = nodes.get(item.from);
        node.interactions += 1;
        node.size = Math.max(nodeSize, node.interactions * 5);
      }
      
      // Add target node
      if (!nodes.has(item.to)) {
        nodes.set(item.to, {
          id: item.to,
          label: showNames ? item.to : `User ${nodes.size + 1}`,
          size: nodeSize,
          color: item.to === `${me?.firstName} ${me?.lastName}` ? '#e53e3e' : '#3182ce',
          interactions: 1
        });
      } else {
        const node = nodes.get(item.to);
        node.interactions += 1;
        node.size = Math.max(nodeSize, node.interactions * 5);
      }
      
      // Add edge
      edges.push({
        id: item.id,
        from: item.from,
        to: item.to,
        width: graphType === 'buildons' ? (item.strength || 1) * edgeWidth : edgeWidth,
        color: graphType === 'activity' ? 
          (item.type === 'read' ? '#38a169' : item.type === 'modified' ? '#d69e2e' : '#805ad5') : 
          '#718096',
        arrows: showDirections ? 'to' : undefined,
        title: graphType === 'activity' ? 
          `${item.from} ${item.type} ${item.to}'s content` :
          `${item.from} built on ${item.to}'s work (strength: ${item.strength || 1})`
      });
    });

    const nodeArray = Array.from(nodes.values());
    const mostActive = nodeArray.reduce((prev, current) => 
      (prev.interactions > current.interactions) ? prev : current
    );

    return {
      nodes: nodeArray,
      edges,
      stats: {
        totalNodes: nodeArray.length,
        totalConnections: edges.length,
        mostActive: mostActive.label,
        timeRange: timeRange === 'all' ? 'All time' : timeRange
      }
    };
  };

  const updateGraph = () => {
    setLoading(true);
    setTimeout(() => {
      const data = processGraphData();
      setGraphData(data);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    updateGraph();
  }, [graphType, selectedView, selectedGroup, selectedAuthor, timeRange, showNames, nodeSize, edgeWidth, showDirections]);

  useEffect(() => {
    if (!networkRef.current || !graphData) return;

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 50
        },
        font: {
          size: 12,
          color: '#333333'
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
      { nodes: graphData.nodes, edges: graphData.edges },
      options
    );

    networkInstance.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = graphData.nodes.find(n => n.id === nodeId);
        setSelectedNodeInfo(node);
      } else {
        setSelectedNodeInfo(null);
      }
    });

    setNetwork(networkInstance);

    return () => {
      networkInstance.destroy();
    };
  }, [graphData]);

  const resetFilters = () => {
    setSelectedView('all');
    setSelectedGroup('all');
    setSelectedAuthor('all');
    setTimeRange('all');
    setSelectedNodeInfo(null);
  };

  return (
    <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card>
          <CardHeader>
            <Heading size="lg" color="blue.600">
              Knowledge Forum Network Visualization
            </Heading>
            <Text color="gray.600" mt={2}>
              Explore relationships and interactions in your learning community
            </Text>
          </CardHeader>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <Heading size="md">Graph Configuration</Heading>
          </CardHeader>
          <CardBody>
            <Tabs value={graphType} onChange={(value) => setGraphType(value as 'activity' | 'buildons')}>
              <TabList>
                <Tab>Activity Network</Tab>
                <Tab>Knowledge Building</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Activity Network</AlertTitle>
                      <AlertDescription>
                        Shows who is reading, modifying, and creating content. Great for understanding engagement patterns.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </TabPanel>
                <TabPanel>
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Knowledge Building Network</AlertTitle>
                      <AlertDescription>
                        Shows how ideas build upon each other. Reveals knowledge construction pathways.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Divider my={4} />

            {/* Filters */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" color="gray.700">Filters</Text>
              
              <HStack spacing={4} wrap="wrap">
                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">View</FormLabel>
                  <Select value={selectedView} onChange={(e) => setSelectedView(e.target.value)} size="sm">
                    <option value="all">All Views</option>
                    <option value="Science Discussion">Science Discussion</option>
                    <option value="Math Problems">Math Problems</option>
                    <option value="History Class">History Class</option>
                  </Select>
                </FormControl>

                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Group</FormLabel>
                  <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} size="sm">
                    <option value="all">All Groups</option>
                    <option value="group1">Science Group</option>
                    <option value="group2">Math Group</option>
                  </Select>
                </FormControl>

                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Time Range</FormLabel>
                  <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} size="sm">
                    <option value="all">All Time</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </Select>
                </FormControl>

                <Button colorScheme="gray" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </HStack>

              <Divider />

              {/* Visual Settings */}
              <Text fontWeight="bold" color="gray.700">Visual Settings</Text>
              
              <HStack spacing={6} wrap="wrap">
                <FormControl display="flex" alignItems="center" maxW="200px">
                  <FormLabel htmlFor="show-names" mb="0" fontSize="sm">
                    Show Real Names
                  </FormLabel>
                  <Switch 
                    id="show-names" 
                    isChecked={showNames} 
                    onChange={(e) => setShowNames(e.target.checked)}
                    isDisabled={role !== 'manager'}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" maxW="200px">
                  <FormLabel htmlFor="show-directions" mb="0" fontSize="sm">
                    Show Directions
                  </FormLabel>
                  <Switch 
                    id="show-directions" 
                    isChecked={showDirections} 
                    onChange={(e) => setShowDirections(e.target.checked)}
                  />
                </FormControl>

                <FormControl maxW="150px">
                  <FormLabel fontSize="sm">Node Size: {nodeSize}</FormLabel>
                  <Slider value={nodeSize} onChange={setNodeSize} min={10} max={40}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>

                <FormControl maxW="150px">
                  <FormLabel fontSize="sm">Edge Width: {edgeWidth}</FormLabel>
                  <Slider value={edgeWidth} onChange={setEdgeWidth} min={1} max={8}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Main Content */}
        <HStack spacing={6} align="start">
          {/* Graph */}
          <Card flex="1" minH="600px">
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">
                  {graphType === 'activity' ? 'Activity Network' : 'Knowledge Building Network'}
                </Heading>
                {loading && <Spinner size="sm" />}
              </HStack>
            </CardHeader>
            <CardBody>
              {loading ? (
                <Center h="500px">
                  <VStack>
                    <Spinner size="xl" />
                    <Text>Loading graph data...</Text>
                  </VStack>
                </Center>
              ) : (
                <Box ref={networkRef} h="500px" border="1px" borderColor={borderColor} borderRadius="md" />
              )}
            </CardBody>
          </Card>

          {/* Sidebar */}
          <VStack spacing={4} w="300px">
            {/* Stats */}
            <Card w="full">
              <CardHeader>
                <Heading size="sm">Network Statistics</Heading>
              </CardHeader>
              <CardBody>
                {graphData && (
                  <VStack spacing={3} align="stretch">
                    <Stat>
                      <StatLabel>Total Users</StatLabel>
                      <StatNumber>{graphData.stats.totalNodes}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Connections</StatLabel>
                      <StatNumber>{graphData.stats.totalConnections}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Most Active</StatLabel>
                      <StatNumber fontSize="md">{graphData.stats.mostActive}</StatNumber>
                    </Stat>
                  </VStack>
                )}
              </CardBody>
            </Card>

            {/* Selected Node Info */}
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
                    <Text fontSize="sm">
                      Interactions: {selectedNodeInfo.interactions}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Legend */}
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
                    <Text>Peer activity</Text>
                  </HStack>
                  {graphType === 'activity' && (
                    <>
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
                    </>
                  )}
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Click on nodes to see details. Larger nodes indicate more activity.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
};

export default UnifiedGraphDashboard;