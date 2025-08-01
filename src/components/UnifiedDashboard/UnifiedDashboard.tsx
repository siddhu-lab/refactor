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
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { InfoIcon, SettingsIcon, ViewIcon, ViewOffIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Network } from 'vis-network';
import { useLazyQuery, useQuery } from '@apollo/client';
import Dictionary from '../../Queries/Dictionary.js';
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
  
  // API Queries
  const [getLinksFromId] = useLazyQuery(Dictionary.getLinksFromId);
  const [getKObjectById] = useLazyQuery(Dictionary.getKObjectById);
  
  // Activity Data API
  const { data: activityData, loading: activityLoading, refetch: refetchActivity } = useQuery(Dictionary.getSocialInteractions, {
    variables: { communityId: community.id },
    skip: !community.id
  });

  // Buildson Data API  
  const { data: buildsonData, loading: buildsonLoading, refetch: refetchBuildson } = useQuery(Dictionary.buildsonLinks, {
    variables: { communityId: community.id },
    skip: !community.id
  });

  // Contributions Data API
  const { data: contribData, loading: contribLoading } = useQuery(Dictionary.searchContributions, {
    variables: {
      query: {
        communityId: community.id,
        status: "active",
        pagesize: 10000,
      },
    },
    skip: !community.id
  });

  // Data State
  const [mergedData, setMergedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<Network | null>(null);
  
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

  // Table visibility controls
  const { isOpen: showUserStats, onToggle: toggleUserStats } = useDisclosure();
  const { isOpen: showActivityRecords, onToggle: toggleActivityRecords } = useDisclosure();
  
  // Table controls
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const isManager = role === 'manager';
  const currentUserName = `${me?.firstName} ${me?.lastName}`;

  // Apply filters function
  const applyFilters = (data: any[]) => {
    let filtered = [...data];

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

  // Merge data from both APIs
  useEffect(() => {
    if (activityLoading || buildsonLoading || contribLoading) {
      setLoading(true);
      return;
    }
    
    const merged: any[] = [];
    
    // Process activity data (reads, creates, modifies)
    if (activityData?.getSocialInteractions) {
      activityData.getSocialInteractions.forEach((activity: any) => {
        const processedActivity = {
          ...activity,
          date: new Date(parseInt(activity.when)),
          value: 1,
          source: 'activity'
        };
        merged.push(processedActivity);
      });
    }

    // Process buildson data
    if (buildsonData?.buildsonLinks && contribData?.searchContributions) {
      const contributions = contribData.searchContributions;
      
      buildsonData.buildsonLinks.forEach((link: any) => {
        // Find source and target contributions
        const sourceContrib = contributions.find((c: any) => c.id === link.from || c._id === link.from);
        const targetContrib = contributions.find((c: any) => c.id === link.to || c._id === link.to);
        
        if (sourceContrib && targetContrib) {
          // Get author information
          const sourceAuthor = community.authors?.find((a: any) => sourceContrib.authors?.includes(a.id));
          const targetAuthor = community.authors?.find((a: any) => targetContrib.authors?.includes(a.id));
          
          if (sourceAuthor && targetAuthor) {
            const buildsonActivity = {
              id: link.id,
              when: link.created,
              date: new Date(parseInt(link.created)),
              type: 'buildson',
              from: `${sourceAuthor.firstName} ${sourceAuthor.lastName}`,
              fromId: sourceAuthor.id,
              fromPseudo: sourceAuthor.pseudoName,
              to: `${targetAuthor.firstName} ${targetAuthor.lastName}`,
              toPseudo: targetAuthor.pseudoName,
              title: sourceContrib.title || 'Untitled',
              view: sourceContrib.view || 'Unknown',
              data: sourceContrib.data || { body: '' },
              ID: sourceContrib.id || sourceContrib._id,
              targetID: targetContrib.id || targetContrib._id,
              strength: 1, // You can calculate this based on your logic
              value: 1,
              source: 'buildson',
              _from: { authors: sourceContrib.authors },
              _to: { authors: targetContrib.authors }
            };
            merged.push(buildsonActivity);
          }
        }
      });
    }

    setMergedData(merged);
    setLoading(false);
  }, [activityData, buildsonData, contribData, activityLoading, buildsonLoading, contribLoading]);

  // Update filtered data when filters change
  useEffect(() => {
    const filtered = applyFilters(mergedData);
    setFilteredData(filtered);
    setSelectedNodeInfo(null); // Clear selection when data changes
  }, [mergedData, selectedView, selectedGroup, selectedAuthor, dateRange]);

  // Process unified network data combining both activity and knowledge building
  const networkData = useMemo(() => {
    const nodes = new Map();
    const edges: any[] = [];
    const edgeMap = new Map();
    
    // Build comprehensive user activity summary
    const userActivities = new Map();
    
    filteredData.forEach((item: any) => {
      const fromName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
      const toName = item.to ? (hideNames && item.to !== currentUserName ? item.toPseudo : item.to) : fromName;
      
      // Track user activities
      if (!userActivities.has(fromName)) {
        userActivities.set(fromName, {
          reads: 0, creates: 0, modifies: 0, buildons: 0,
          activities: [], buildsonConnections: [], builtUponBy: [],
          totalActivity: 0, sharedPieces: new Set()
        });
      }
      
      const userActivity = userActivities.get(fromName);
      userActivity.activities.push(item);
      userActivity.totalActivity++;
      
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
            activities: [], buildsonConnections: [], builtUponBy: [],
            totalActivity: 0, sharedPieces: new Set()
          });
        }
        userActivities.get(toName).builtUponBy.push({
          source: fromName,
          strength: item.strength || 1,
          title: item.title,
          date: item.date
        });
      }
      
      // Track shared content pieces
      if (item.ID) {
        userActivity.sharedPieces.add(item.ID);
        if (toName !== fromName && userActivities.has(toName)) {
          userActivities.get(toName).sharedPieces.add(item.ID);
        }
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
        const edgeKey = `${fromName}-${toName}`;
        if (edgeMap.has(edgeKey)) {
          const existingEdge = edgeMap.get(edgeKey);
          existingEdge.weight += 1;
          existingEdge.width = Math.max(edgeWidth, existingEdge.weight * edgeWidth);
          existingEdge.interactions.push(item);
          
          // Track shared pieces for this edge
          if (item.ID) {
            existingEdge.sharedPieces.add(item.ID);
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
            label: showEdgeLabels ? `${item.type}` : undefined,
            font: showEdgeLabels ? { size: 10, color: '#666666' } : undefined,
            title: getEdgeTitle(item, fromName, toName),
            shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 3, x: 1, y: 1 },
            sharedPieces: new Set(item.ID ? [item.ID] : [])
          };
          
          edgeMap.set(edgeKey, newEdge);
        }
      }
    });
    
    // Update edge titles for combined edges
    edgeMap.forEach((edge) => {
      if (edge.interactions.length > 1) {
        const types = [...new Set(edge.interactions.map(i => i.type))];
        const sharedCount = edge.sharedPieces.size;
        edge.title = `${edge.from} → ${edge.to}\n${edge.interactions.length} interactions\nTypes: ${types.join(', ')}\nShared pieces: ${sharedCount}`;
      }
      edges.push(edge);
    });

    // Add user activity data to nodes
    nodes.forEach((node, nodeName) => {
      const activity = userActivities.get(nodeName);
      if (activity) {
        activity.sharedPiecesCount = activity.sharedPieces.size;
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
        totalActivities: filteredData.length,
        totalBuildsons: filteredData.filter(d => d.type === 'buildson').length,
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

  // Unified legend content
  const legendContent = {
    title: "Unified Knowledge Network",
    nodeInfo: "Nodes: Username + Total Activity",
    edgeInfo: "Edges: All interactions between users",
    hoverInfo: "Click nodes for details, hover edges for shared content info",
    nodeColors: [
      { color: "red.500", label: "Current User" },
      { color: "blue.500", label: "Other Users" }
    ],
    edgeColors: [
      { color: "green.500", label: "Read" },
      { color: "yellow.500", label: "Modify" },
      { color: "purple.500", label: "Create" },
      { color: "red.500", label: "Buildson" }
    ]
  };

  // User statistics data for table
  const userStatsData = useMemo(() => {
    const stats = new Map();
    
    filteredData.forEach(item => {
      const userName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
      
      if (!stats.has(userName)) {
        stats.set(userName, {
          name: userName,
          reads: 0,
          creates: 0,
          modifies: 0,
          buildons: 0,
          total: 0
        });
      }
      
      const userStat = stats.get(userName);
      userStat[item.type] = (userStat[item.type] || 0) + 1;
      userStat.total += 1;
    });
    
    return Array.from(stats.values()).sort((a, b) => b.total - a.total);
  }, [filteredData, hideNames, community.author.id]);

  // Activity records data for table
  const activityRecordsData = useMemo(() => {
    return filteredData
      .filter(item => {
        if (!searchTerm) return true;
        const userName = hideNames && item.fromId !== community.author.id ? item.fromPseudo : item.from;
        return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
               userName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData, searchTerm, hideNames, community.author.id]);

  // Pagination for activity records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return activityRecordsData.slice(startIndex, endIndex);
  }, [activityRecordsData, currentPage, entriesPerPage]);
  
  const totalPages = Math.ceil(activityRecordsData.length / entriesPerPage);

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
                    <Badge colorScheme="orange" mr={1}>{networkData.stats.totalActivities}</Badge>
                    Activities
                  </Text>
                  <Text>
                    <Badge colorScheme="red" mr={1}>{networkData.stats.totalBuildsons}</Badge>
                    Buildsons
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
                <Text>Interactions: {hoveredEdgeInfo.interactions.length}</Text>
                <Text>Shared pieces: {hoveredEdgeInfo.sharedPieces?.size || 0}</Text>
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
            {/* Table Visibility Controls */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Data Tables</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3}>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm">User Statistics</Text>
                    <Button
                      size="xs"
                      leftIcon={showUserStats ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={toggleUserStats}
                      variant="outline"
                    >
                      {showUserStats ? 'Hide' : 'Show'}
                    </Button>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm">Activity Records</Text>
                    <Button
                      size="xs"
                      leftIcon={showActivityRecords ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={toggleActivityRecords}
                      variant="outline"
                    >
                      {showActivityRecords ? 'Hide' : 'Show'}
                    </Button>
                  </HStack>
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
                      {community.views?.map(view => (
                        <option key={view.id} value={view.title}>{view.title}</option>
                      ))}
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
                  <Heading size="sm">Selected User: {selectedNodeInfo.label}</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="start" spacing={2}>
                    {selectedNodeInfo.userActivity && (
                      <>
                        <SimpleGrid columns={2} spacing={2} w="full">
                          <Stat size="sm">
                            <StatLabel fontSize="xs">Reads</StatLabel>
                            <StatNumber fontSize="md">{selectedNodeInfo.userActivity.reads}</StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel fontSize="xs">Creates</StatLabel>
                            <StatNumber fontSize="md">{selectedNodeInfo.userActivity.creates}</StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel fontSize="xs">Modifies</StatLabel>
                            <StatNumber fontSize="md">{selectedNodeInfo.userActivity.modifies}</StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel fontSize="xs">Buildsons</StatLabel>
                            <StatNumber fontSize="md">{selectedNodeInfo.userActivity.buildons}</StatNumber>
                          </Stat>
                        </SimpleGrid>
                        
                        {selectedNodeInfo.userActivity.buildsonConnections?.length > 0 && (
                          <>
                            <Text fontWeight="bold" fontSize="sm">
                              Built onto {selectedNodeInfo.userActivity.buildsonConnections.length} notes:
                            </Text>
                            <VStack align="start" spacing={1} maxH="100px" overflowY="auto" w="full">
                              {selectedNodeInfo.userActivity.buildsonConnections.map((conn, idx) => (
                                <Text key={idx} fontSize="xs">
                                  • Strength {conn.strength} by {conn.target}
                                </Text>
                              ))}
                            </VStack>
                          </>
                        )}

                        {selectedNodeInfo.userActivity.builtUponBy?.length > 0 && (
                          <>
                            <Text fontWeight="bold" fontSize="sm">
                              {selectedNodeInfo.userActivity.builtUponBy.length} note{selectedNodeInfo.userActivity.builtUponBy.length > 1 ? 's were' : ' was'} built upon:
                            </Text>
                            <VStack align="start" spacing={1} maxH="100px" overflowY="auto" w="full">
                              {selectedNodeInfo.userActivity.builtUponBy.map((conn, idx) => (
                                <Text key={idx} fontSize="xs">
                                  • Strength {conn.strength} by {conn.source}
                                </Text>
                              ))}
                            </VStack>
                          </>
                        )}
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
                      Click nodes for complete activity & buildson data. Hover edges for shared content info.
                    </AlertDescription>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
      
      {/* User Statistics Table */}
      <Collapse in={showUserStats} animateOpacity>
        <Box position="fixed" bottom={4} left={4} right="420px" bg={bgColor} 
             borderRadius="md" shadow="lg" border="1px" borderColor={borderColor} 
             maxH="300px" overflowY="auto" zIndex={1000}>
          <Box p={4} borderBottom="1px" borderColor={borderColor}>
            <HStack justify="space-between">
              <Heading size="sm">User Activity Statistics</Heading>
              <Button size="xs" onClick={toggleUserStats}>
                <ChevronUpIcon />
              </Button>
            </HStack>
          </Box>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>User</Th>
                  <Th isNumeric>Reads</Th>
                  <Th isNumeric>Creates</Th>
                  <Th isNumeric>Modifies</Th>
                  <Th isNumeric>Buildsons</Th>
                  <Th isNumeric>Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {userStatsData.map((user, idx) => (
                  <Tr key={idx}>
                    <Td fontWeight="medium">{user.name}</Td>
                    <Td isNumeric>{user.reads || 0}</Td>
                    <Td isNumeric>{user.creates || 0}</Td>
                    <Td isNumeric>{user.modifies || 0}</Td>
                    <Td isNumeric>{user.buildons || 0}</Td>
                    <Td isNumeric fontWeight="bold">{user.total}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
      
      {/* Activity Records Table */}
      <Collapse in={showActivityRecords} animateOpacity>
        <Box position="fixed" bottom={4} left={4} right="420px" bg={bgColor} 
             borderRadius="md" shadow="lg" border="1px" borderColor={borderColor} 
             maxH="400px" overflowY="auto" zIndex={1000}>
          <Box p={4} borderBottom="1px" borderColor={borderColor}>
            <HStack justify="space-between" mb={3}>
              <Heading size="sm">Activity Records</Heading>
              <Button size="xs" onClick={toggleActivityRecords}>
                <ChevronUpIcon />
              </Button>
            </HStack>
            <HStack spacing={3}>
              <Input
                size="sm"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxW="200px"
              />
              <Select size="sm" value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))} maxW="100px">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </Select>
              <Text fontSize="xs" color="gray.600">
                {((currentPage - 1) * entriesPerPage) + 1}-{Math.min(currentPage * entriesPerPage, activityRecordsData.length)} of {activityRecordsData.length}
              </Text>
            </HStack>
          </Box>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>User</Th>
                  <Th>Title</Th>
                  <Th>View</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedRecords.map((record, idx) => {
                  const userName = hideNames && record.fromId !== community.author.id ? record.fromPseudo : record.from;
                  return (
                    <Tr key={idx}>
                      <Td fontSize="xs">{record.date.toLocaleDateString()}</Td>
                      <Td>
                        <Badge 
                          size="sm" 
                          colorScheme={
                            record.type === 'read' ? 'green' : 
                            record.type === 'created' ? 'purple' : 
                            record.type === 'modified' ? 'yellow' : 'red'
                          }
                        >
                          {record.type}
                        </Badge>
                      </Td>
                      <Td fontSize="xs">{userName}</Td>
                      <Td fontSize="xs" maxW="200px" isTruncated>{record.title}</Td>
                      <Td fontSize="xs">{record.view}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box p={3} borderTop="1px" borderColor={borderColor}>
              <HStack justify="center" spacing={2}>
                <Button 
                  size="xs" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="xs">Page {currentPage} of {totalPages}</Text>
                <Button 
                  size="xs" 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default UnifiedDashboard;