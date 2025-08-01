import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  FormControl,
  FormLabel,
  Switch,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useColorModeValue,
  Icon,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import {
  SearchIcon,
  CalendarIcon,
  Network,
  Activity,
  Users,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Network as VisNetwork } from 'vis-network';
import * as d3 from 'd3';
import * as dc from 'dc';
import crossfilter from 'crossfilter2';
import dashboardContext from '../../context/dashboard.js';
import './UnifiedGraphDashboard.css';

// Mock data
const mockSocialInteractions = [
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
  }
];

const mockBuildsonLinks = [
  {
    id: 'link-1',
    from: 'contrib-1',
    to: 'contrib-2',
    type: 'buildson',
    created: Date.now() - 86400000 * 3,
    _from: { authors: ['author-1'] },
    _to: { authors: ['author-2'] }
  },
  {
    id: 'link-2',
    from: 'contrib-2',
    to: 'contrib-3',
    type: 'buildson',
    created: Date.now() - 86400000 * 2,
    _from: { authors: ['author-2'] },
    _to: { authors: ['author-3'] }
  }
];

const mockContributions = [
  {
    id: 'contrib-1',
    _id: 'contrib-1',
    title: 'Climate Change Discussion',
    created: Date.now() - 86400000 * 5,
    authors: ['author-1'],
    type: 'note',
    data: { body: 'This is a discussion about climate change and its impacts.' }
  },
  {
    id: 'contrib-2',
    _id: 'contrib-2',
    title: 'Mathematical Proof Analysis',
    created: Date.now() - 86400000 * 3,
    authors: ['author-2'],
    type: 'note',
    data: { body: 'Here is my analysis of the mathematical proof presented in class.' }
  },
  {
    id: 'contrib-3',
    _id: 'contrib-3',
    title: 'History Essay Update',
    created: Date.now() - 86400000 * 2,
    authors: ['author-3'],
    type: 'note',
    data: { body: 'Updated my essay on World War II with additional sources.' }
  }
];

type DataType = 'activity' | 'buildons';
type TimeRange = 'all' | '7d' | '30d' | '90d' | 'custom';

interface FilterState {
  dataType: DataType;
  timeRange: TimeRange;
  selectedGroup: string;
  selectedView: string;
  selectedAuthor: string;
  searchTerm: string;
  hideNames: boolean;
  hideManagers: boolean;
  customDateFrom: string;
  customDateTo: string;
}

const UnifiedGraphDashboard: React.FC = () => {
  const { community, role, me } = useContext(dashboardContext);
  
  const [filters, setFilters] = useState<FilterState>({
    dataType: 'activity',
    timeRange: 'all',
    selectedGroup: 'all',
    selectedView: 'all',
    selectedAuthor: 'all',
    searchTerm: '',
    hideNames: true,
    hideManagers: false,
    customDateFrom: '',
    customDateTo: '',
  });

  const [selectedNodeInfo, setSelectedNodeInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const graphRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<VisNetwork | null>(null);
  const dcChartsRef = useRef<any>(null);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const currentAuthor = useMemo(() => ({
    _id: community?.author?.id || 'author-1',
    role: role,
    name: me?.firstName + " " + me?.lastName || 'Current User',
    pseudoName: me?.pseudoName || 'CurrentUser'
  }), [community, role, me]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      dataType: filters.dataType, // Keep current data type
      timeRange: 'all',
      selectedGroup: 'all',
      selectedView: 'all',
      selectedAuthor: 'all',
      searchTerm: '',
      hideNames: true,
      hideManagers: false,
      customDateFrom: '',
      customDateTo: '',
    });
    setSelectedNodeInfo('');
  };

  const renderActivityGraph = () => {
    if (!graphRef.current) return;

    // Clear previous content
    d3.select(graphRef.current).selectAll('*').remove();
    dc.deregisterAllCharts();

    // Process activity data
    const data = mockSocialInteractions.map((d) => {
      const dCopy = { ...d };
      const date = new Date(parseInt(dCopy.when));
      dCopy.date = date;
      dCopy.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dCopy.value = 1;
      dCopy.read = d.type === 'read' ? 1 : 0;
      dCopy.modified = d.type === 'modified' ? 1 : 0;
      dCopy.created = d.type === 'created' ? 1 : 0;
      return dCopy;
    });

    const ndx = crossfilter(data);
    const authorDimension = ndx.dimension((d: any) => {
      return filters.hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from;
    });

    const authorGroup = authorDimension.group().reduceSum((d: any) => d.value);

    // Create container
    const container = d3.select(graphRef.current)
      .append('div')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('justify-content', 'center');

    // Add chart container
    const chartContainer = container
      .append('div')
      .attr('id', 'activity-chart')
      .style('width', '400px')
      .style('height', '400px');

    // Create pie chart
    const chart = dc.pieChart('#activity-chart');
    
    const typeDimension = ndx.dimension((d: any) => d.type);
    const typeGroup = typeDimension.group().reduceSum((d: any) => d.value);

    chart
      .width(400)
      .height(400)
      .radius(150)
      .innerRadius(0)
      .dimension(typeDimension)
      .group(typeGroup)
      .colors(d3.scaleOrdinal().range(['#3b82f6', '#10b981', '#f59e0b']))
      .label((d: any) => `${d.key} (${d.value})`)
      .on('renderlet', function(chart) {
        chart.selectAll('g.pie-slice')
          .on('mouseover', function(event: any, d: any) {
            d3.select(this).style('opacity', 0.8);
          })
          .on('mouseout', function(event: any, d: any) {
            d3.select(this).style('opacity', 1);
          })
          .on('click', function(event: any, d: any) {
            const authorStats = authorGroup.all();
            let infoText = `<strong>${d.data.key} Activities</strong><br/>`;
            infoText += `Total: ${d.data.value}<br/><br/>`;
            infoText += '<strong>By Author:</strong><br/>';
            
            authorStats.forEach(author => {
              if (author.value > 0) {
                infoText += `• ${author.key}: ${author.value} activities<br/>`;
              }
            });
            
            setSelectedNodeInfo(infoText);
          });
      });

    chart.render();
    dcChartsRef.current = { chart, ndx };
  };

  const renderBuildonsGraph = () => {
    if (!graphRef.current) return;

    // Clear previous content
    d3.select(graphRef.current).selectAll('*').remove();
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    // Process buildson data
    const authors: { [key: string]: { name: string; size: number; realName: string } } = {};
    const buildsonConnections: { [key: string]: { source: string; target: string; weight: number } } = {};

    // Build user info from contributions
    mockContributions.forEach(contrib => {
      contrib.authors.forEach(authorId => {
        const member = community?.authors?.find((m: any) => m.id === authorId);
        if (member) {
          const displayName = filters.hideNames && authorId !== currentAuthor._id
            ? member.pseudoName
            : `${member.firstName} ${member.lastName}`;
          
          if (!authors[displayName]) {
            authors[displayName] = {
              name: displayName,
              size: 0,
              realName: `${member.firstName} ${member.lastName}`
            };
          }
          authors[displayName].size++;
        }
      });
    });

    // Build connections from buildson links
    mockBuildsonLinks.forEach(link => {
      link._from.authors.forEach(sourceId => {
        link._to.authors.forEach(targetId => {
          const sourceMember = community?.authors?.find((m: any) => m.id === sourceId);
          const targetMember = community?.authors?.find((m: any) => m.id === targetId);
          
          if (sourceMember && targetMember) {
            const sourceName = filters.hideNames && sourceId !== currentAuthor._id
              ? sourceMember.pseudoName
              : `${sourceMember.firstName} ${sourceMember.lastName}`;
            const targetName = filters.hideNames && targetId !== currentAuthor._id
              ? targetMember.pseudoName
              : `${targetMember.firstName} ${targetMember.lastName}`;

            const key = `${sourceName}->${targetName}`;
            if (!buildsonConnections[key]) {
              buildsonConnections[key] = {
                source: sourceName,
                target: targetName,
                weight: 0
              };
            }
            buildsonConnections[key].weight++;
          }
        });
      });
    });

    // Create vis-network data
    const nodes = Object.entries(authors).map(([name, info]) => {
      const isCurrentUser = name === currentAuthor.name || info.realName === currentAuthor.name;
      return {
        id: name,
        label: name,
        size: Math.max(20, info.size * 10),
        color: {
          background: isCurrentUser ? '#e74c3c' : '#3498db',
          border: isCurrentUser ? '#c0392b' : '#2980b9',
          highlight: {
            background: isCurrentUser ? '#e67e22' : '#5dade2',
            border: isCurrentUser ? '#d35400' : '#3498db'
          }
        },
        font: { size: 14, color: '#333333' },
        borderWidth: 2,
        shadow: true,
        title: `${name}\nContributions: ${info.size}`
      };
    });

    const edges = Object.values(buildsonConnections).map(conn => ({
      from: conn.source,
      to: conn.target,
      width: Math.max(2, conn.weight * 3),
      color: {
        color: '#95a5a6',
        highlight: '#34495e',
        hover: '#34495e'
      },
      arrows: 'to',
      title: `${conn.source} → ${conn.target}: ${conn.weight} connections`,
      smooth: { type: 'continuous' }
    }));

    // Create network
    const container = graphRef.current;
    const data = { nodes, edges };
    const options = {
      nodes: {
        shape: 'dot',
        scaling: { min: 10, max: 50 }
      },
      edges: {
        smooth: { type: 'continuous' }
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

    const network = new VisNetwork(container, data, options);
    networkRef.current = network;

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = nodes.find(n => n.id === nodeId);
        if (nodeData) {
          let infoText = `<strong>${nodeData.label}</strong><br/>`;
          infoText += `Contributions: ${authors[nodeId]?.size || 0}<br/><br/>`;
          
          // Find connections
          const outgoing = edges.filter(e => e.from === nodeId);
          const incoming = edges.filter(e => e.to === nodeId);
          
          if (outgoing.length > 0) {
            infoText += '<strong>Builds on:</strong><br/>';
            outgoing.forEach(edge => {
              infoText += `• ${edge.to} (${edge.width / 3} connections)<br/>`;
            });
          }
          
          if (incoming.length > 0) {
            infoText += '<strong>Built upon by:</strong><br/>';
            incoming.forEach(edge => {
              infoText += `• ${edge.from} (${edge.width / 3} connections)<br/>`;
            });
          }
          
          setSelectedNodeInfo(infoText);
        }
      }
    });

    network.on('hoverEdge', (params) => {
      const edge = edges.find(e => 
        (e.from === params.edge.from && e.to === params.edge.to) ||
        (e.from === params.edge.to && e.to === params.edge.from)
      );
      if (edge) {
        // Show edge info in tooltip or status
        console.log(`Edge: ${edge.title}`);
      }
    });
  };

  useEffect(() => {
    if (filters.dataType === 'activity') {
      renderActivityGraph();
    } else {
      renderBuildonsGraph();
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
      if (dcChartsRef.current) {
        dc.deregisterAllCharts();
        dcChartsRef.current = null;
      }
    };
  }, [filters, currentAuthor]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (filters.dataType === 'activity') {
        renderActivityGraph();
      } else {
        renderBuildonsGraph();
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="lg" color={textColor}>
                  Knowledge Forum Analytics
                </Heading>
                <Text color={mutedColor} fontSize="sm">
                  Interactive graph visualization with dynamic filtering
                </Text>
              </VStack>
              
              <HStack spacing={3}>
                <Badge
                  colorScheme={filters.dataType === 'activity' ? 'blue' : 'purple'}
                  variant="subtle"
                  px={3}
                  py={1}
                >
                  {filters.dataType === 'activity' ? 'Activity Analysis' : 'Buildson Network'}
                </Badge>
                
                <Tooltip label="Refresh data">
                  <Button
                    leftIcon={<Icon as={RefreshCw} />}
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    isLoading={isLoading}
                    loadingText="Refreshing"
                  >
                    Refresh
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Flex gap={6} align="stretch" minH="600px">
          {/* Graph Area - Left Side */}
          <Card bg={cardBg} shadow="sm" borderColor={borderColor} flex="1">
            <CardHeader pb={4}>
              <HStack>
                <Icon 
                  as={filters.dataType === 'activity' ? Activity : Network} 
                  color={filters.dataType === 'activity' ? 'blue.500' : 'purple.500'} 
                />
                <Heading size="md" color={textColor}>
                  {filters.dataType === 'activity' ? 'Activity Graph' : 'Buildson Network'}
                </Heading>
              </HStack>
            </CardHeader>
            
            <CardBody pt={0}>
              <Box
                ref={graphRef}
                w="100%"
                h="500px"
                bg={useColorModeValue('gray.50', 'gray.900')}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
                position="relative"
                className="graph-container"
              />
            </CardBody>
          </Card>

          {/* Controls Panel - Right Side */}
          <VStack spacing={4} w="350px" flexShrink={0}>
            {/* Primary Filter */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor} w="100%">
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={Filter} color="blue.500" />
                  <Heading size="sm" color={textColor}>Data Type</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <FormControl>
                  <Select
                    value={filters.dataType}
                    onChange={(e) => handleFilterChange('dataType', e.target.value as DataType)}
                    size="sm"
                  >
                    <option value="activity">Activity Analysis</option>
                    <option value="buildons">Buildson Network</option>
                  </Select>
                </FormControl>
              </CardBody>
            </Card>

            {/* Time Range Filter */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor} w="100%">
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>Time Range</Heading>
              </CardHeader>
              <CardBody pt={2}>
                <VStack spacing={3} align="stretch">
                  <FormControl>
                    <Select
                      value={filters.timeRange}
                      onChange={(e) => handleFilterChange('timeRange', e.target.value as TimeRange)}
                      size="sm"
                    >
                      <option value="all">All time</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="custom">Custom range</option>
                    </Select>
                  </FormControl>

                  {filters.timeRange === 'custom' && (
                    <>
                      <FormControl>
                        <FormLabel fontSize="xs" color={mutedColor}>From Date</FormLabel>
                        <InputGroup size="sm">
                          <InputLeftElement>
                            <Icon as={CalendarIcon} color={mutedColor} />
                          </InputLeftElement>
                          <Input
                            type="date"
                            value={filters.customDateFrom}
                            onChange={(e) => handleFilterChange('customDateFrom', e.target.value)}
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs" color={mutedColor}>To Date</FormLabel>
                        <InputGroup size="sm">
                          <InputLeftElement>
                            <Icon as={CalendarIcon} color={mutedColor} />
                          </InputLeftElement>
                          <Input
                            type="date"
                            value={filters.customDateTo}
                            onChange={(e) => handleFilterChange('customDateTo', e.target.value)}
                          />
                        </InputGroup>
                      </FormControl>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Content Filters */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor} w="100%">
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>Content Filters</Heading>
              </CardHeader>
              <CardBody pt={2}>
                <VStack spacing={3} align="stretch">
                  <FormControl>
                    <FormLabel fontSize="xs" color={mutedColor}>Group</FormLabel>
                    <Select
                      value={filters.selectedGroup}
                      onChange={(e) => handleFilterChange('selectedGroup', e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Groups</option>
                      {community?.groups?.map((group: any) => (
                        <option key={group.id} value={group.id}>
                          {group.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" color={mutedColor}>View</FormLabel>
                    <Select
                      value={filters.selectedView}
                      onChange={(e) => handleFilterChange('selectedView', e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Views</option>
                      {community?.views?.map((view: any) => (
                        <option key={view.id} value={view.id}>
                          {view.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" color={mutedColor}>Author</FormLabel>
                    <Select
                      value={filters.selectedAuthor}
                      onChange={(e) => handleFilterChange('selectedAuthor', e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Authors</option>
                      {community?.authors?.map((author: any) => (
                        <option key={author.id} value={author.id}>
                          {author.firstName} {author.lastName}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" color={mutedColor}>Search</FormLabel>
                    <InputGroup size="sm">
                      <InputLeftElement>
                        <Icon as={SearchIcon} color={mutedColor} />
                      </InputLeftElement>
                      <Input
                        placeholder="Search content..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Privacy Controls */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor} w="100%">
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>Privacy Settings</Heading>
              </CardHeader>
              <CardBody pt={2}>
                <VStack spacing={3} align="stretch">
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel fontSize="sm" color={textColor} mb={0}>
                      Hide Names
                    </FormLabel>
                    <Switch
                      size="sm"
                      colorScheme="blue"
                      isChecked={filters.hideNames}
                      onChange={(e) => handleFilterChange('hideNames', e.target.checked)}
                    />
                  </FormControl>

                  {role === 'manager' && (
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel fontSize="sm" color={textColor} mb={0}>
                        Hide Managers
                      </FormLabel>
                      <Switch
                        size="sm"
                        colorScheme="blue"
                        isChecked={filters.hideManagers}
                        onChange={(e) => handleFilterChange('hideManagers', e.target.checked)}
                      />
                    </FormControl>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Node Information */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor} w="100%">
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={Info} color="green.500" />
                  <Heading size="sm" color={textColor}>Node Information</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <Box
                  minH="100px"
                  p={3}
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  borderRadius="md"
                  fontSize="sm"
                  color={textColor}
                >
                  {selectedNodeInfo ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedNodeInfo }} />
                  ) : (
                    <Text color={mutedColor} fontStyle="italic">
                      Click on a node to see detailed information
                    </Text>
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* Reset Button */}
            <Button
              colorScheme="gray"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              w="100%"
            >
              Reset All Filters
            </Button>
          </VStack>
        </Flex>
      </VStack>
    </Box>
  );
};

export default UnifiedGraphDashboard;