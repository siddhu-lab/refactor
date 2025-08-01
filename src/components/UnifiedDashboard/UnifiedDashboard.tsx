import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Tooltip,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { InfoIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react';
import * as d3 from 'd3';
import * as dc from 'dc';
import crossfilter from 'crossfilter2';
import { Network } from 'vis-network';
import dashboardContext from '../../context/dashboard';

// Enhanced dummy data
const dummySocialInteractions = [
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
    type: 'read',
    from: 'Alice Brown',
    fromId: 'author-4',
    fromPseudo: 'AliceB',
    to: 'John Smith',
    toPseudo: 'JohnS',
    title: 'Climate Change Discussion',
    view: 'Science Discussion',
    data: { body: '<p>This is a discussion about climate change and its impacts.</p>' },
    ID: 'contrib-1'
  },
  {
    id: '5',
    when: Date.now() - 86400000 * 4,
    type: 'created',
    from: 'Bob Davis',
    fromId: 'author-5',
    fromPseudo: 'BobD',
    to: 'Bob Davis',
    toPseudo: 'BobD',
    title: 'Physics Lab Report',
    view: 'Science Discussion',
    data: { body: '<p>Lab report on electromagnetic induction experiments.</p>' },
    ID: 'contrib-4'
  }
];

const dummyBuildsonData = [
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

type VisualizationType = 'activity-timeline' | 'social-network' | 'buildson-network' | 'user-statistics';

interface UnifiedDashboardProps {}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = () => {
  const { community, role: loggedInPersonRole, me } = useContext(dashboardContext);
  const members = community.authors || [];
  const views = community.views || [];
  const groups = community.groups || [];

  // State management
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('activity-timeline');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [hideNames, setHideNames] = useState(true);
  const [dateRange, setDateRange] = useState([0, 30]); // Last 30 days
  const [nodeSize, setNodeSize] = useState(15);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [showDirectional, setShowDirectional] = useState(false);
  
  // Data state
  const [filteredData, setFilteredData] = useState(dummySocialInteractions);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Refs
  const graphRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const currentAuthor = {
    _id: community.author.id,
    role: loggedInPersonRole,
    name: me?.firstName + " " + me?.lastName,
    pseudoName: me?.pseudoName
  };

  // Filter data based on current selections
  useEffect(() => {
    let filtered = [...dummySocialInteractions];

    // Date filtering
    const now = Date.now();
    const startDate = now - (dateRange[1] * 24 * 60 * 60 * 1000);
    const endDate = now - (dateRange[0] * 24 * 60 * 60 * 1000);
    
    filtered = filtered.filter(item => {
      const itemDate = parseInt(item.when);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // View filtering
    if (selectedView !== 'all') {
      filtered = filtered.filter(item => item.view === selectedView);
    }

    // User filtering
    if (selectedUser !== 'all') {
      filtered = filtered.filter(item => item.fromId === selectedUser);
    }

    setFilteredData(filtered);
    updateStatistics(filtered);
  }, [selectedView, selectedGroup, selectedUser, dateRange]);

  const updateStatistics = (data: any[]) => {
    const stats = {
      totalInteractions: data.length,
      uniqueUsers: new Set(data.map(d => d.fromId)).size,
      readActions: data.filter(d => d.type === 'read').length,
      createdActions: data.filter(d => d.type === 'created').length,
      modifiedActions: data.filter(d => d.type === 'modified').length,
    };
    setStatistics(stats);
  };

  // Render different visualizations
  const renderVisualization = () => {
    if (!graphRef.current) return;

    // Clear previous visualization
    d3.select(graphRef.current).selectAll("*").remove();
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    switch (visualizationType) {
      case 'activity-timeline':
        renderActivityTimeline();
        break;
      case 'social-network':
        renderSocialNetwork();
        break;
      case 'buildson-network':
        renderBuildsonNetwork();
        break;
      case 'user-statistics':
        renderUserStatistics();
        break;
    }
  };

  const renderActivityTimeline = () => {
    if (!graphRef.current) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = graphRef.current.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(graphRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data by day
    const dailyData = d3.rollup(
      filteredData,
      v => ({
        total: v.length,
        read: v.filter(d => d.type === 'read').length,
        created: v.filter(d => d.type === 'created').length,
        modified: v.filter(d => d.type === 'modified').length
      }),
      d => d3.timeDay(new Date(parseInt(d.when)))
    );

    const data = Array.from(dailyData, ([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (data.length === 0) return;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .range([height, 0]);

    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.total))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

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
      .attr('cy', d => yScale(d.total))
      .attr('r', 4)
      .attr('fill', '#3182ce');
  };

  const renderSocialNetwork = () => {
    if (!graphRef.current) return;

    const readData = filteredData.filter(d => d.type === 'read');
    
    // Build nodes and edges
    const nodes = new Map();
    const edges = new Map();

    readData.forEach(interaction => {
      const fromUser = hideNames && interaction.fromId !== currentAuthor._id 
        ? interaction.fromPseudo 
        : interaction.from;
      const toUser = hideNames && interaction.to !== currentAuthor.name 
        ? interaction.toPseudo 
        : interaction.to;

      // Add nodes
      if (!nodes.has(fromUser)) {
        nodes.set(fromUser, {
          id: fromUser,
          label: fromUser,
          size: nodeSize,
          color: interaction.fromId === currentAuthor._id ? '#e53e3e' : '#3182ce'
        });
      }

      if (!nodes.has(toUser)) {
        nodes.set(toUser, {
          id: toUser,
          label: toUser,
          size: nodeSize,
          color: toUser === currentAuthor.name ? '#e53e3e' : '#3182ce'
        });
      }

      // Add edges
      if (fromUser !== toUser) {
        const edgeId = `${fromUser}-${toUser}`;
        if (edges.has(edgeId)) {
          edges.get(edgeId).value += 1;
        } else {
          edges.set(edgeId, {
            from: fromUser,
            to: toUser,
            value: 1,
            width: edgeWidth,
            arrows: showDirectional ? 'to' : undefined
          });
        }
      }
    });

    const networkData = {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 30
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
      }
    };

    networkRef.current = new Network(graphRef.current, networkData, options);
  };

  const renderBuildsonNetwork = () => {
    if (!graphRef.current) return;

    // Build buildson network from dummy data
    const nodes = new Map();
    const edges = new Map();

    dummyBuildsonData.forEach(link => {
      link._from.authors.forEach(fromAuthor => {
        link._to.authors.forEach(toAuthor => {
          const fromMember = members.find(m => m.id === fromAuthor);
          const toMember = members.find(m => m.id === toAuthor);

          if (fromMember && toMember) {
            const fromName = hideNames && fromAuthor !== currentAuthor._id 
              ? fromMember.pseudoName 
              : `${fromMember.firstName} ${fromMember.lastName}`;
            const toName = hideNames && toAuthor !== currentAuthor._id 
              ? toMember.pseudoName 
              : `${toMember.firstName} ${toMember.lastName}`;

            // Add nodes
            if (!nodes.has(fromName)) {
              nodes.set(fromName, {
                id: fromName,
                label: fromName,
                size: nodeSize,
                color: fromAuthor === currentAuthor._id ? '#e53e3e' : '#38a169'
              });
            }

            if (!nodes.has(toName)) {
              nodes.set(toName, {
                id: toName,
                label: toName,
                size: nodeSize,
                color: toAuthor === currentAuthor._id ? '#e53e3e' : '#38a169'
              });
            }

            // Add edge
            const edgeId = `${fromName}-${toName}`;
            edges.set(edgeId, {
              from: fromName,
              to: toName,
              value: 1,
              width: edgeWidth,
              arrows: 'to',
              color: '#38a169'
            });
          }
        });
      });
    });

    const networkData = {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 30
        }
      },
      edges: {
        smooth: {
          type: 'continuous'
        }
      },
      physics: {
        stabilization: { iterations: 200 }
      }
    };

    networkRef.current = new Network(graphRef.current, networkData, options);
  };

  const renderUserStatistics = () => {
    if (!graphRef.current) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = graphRef.current.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(graphRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process user statistics
    const userStats = d3.rollup(
      filteredData,
      v => ({
        total: v.length,
        read: v.filter(d => d.type === 'read').length,
        created: v.filter(d => d.type === 'created').length,
        modified: v.filter(d => d.type === 'modified').length
      }),
      d => hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from
    );

    const data = Array.from(userStats, ([user, stats]) => ({ user, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 users

    if (data.length === 0) return;

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.user))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.user) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.total))
      .attr('height', d => height - yScale(d.total))
      .attr('fill', '#3182ce');
  };

  useEffect(() => {
    renderVisualization();
  }, [visualizationType, filteredData, hideNames, nodeSize, edgeWidth, showDirectional]);

  const handleExport = () => {
    // Export functionality
    console.log('Exporting data...');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      renderVisualization();
      setLoading(false);
    }, 1000);
  };

  return (
    <Box h="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex h="full">
        {/* Main Graph Area */}
        <Box flex="1" p={6}>
          <Card h="full" bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="lg" color={textColor}>
                  Knowledge Forum Analytics
                </Heading>
                <HStack>
                  <Tooltip label="Refresh visualization">
                    <IconButton
                      aria-label="Refresh"
                      icon={<RefreshCwIcon size={16} />}
                      size="sm"
                      onClick={handleRefresh}
                      isLoading={loading}
                    />
                  </Tooltip>
                  <Tooltip label="Export data">
                    <IconButton
                      aria-label="Export"
                      icon={<DownloadIcon size={16} />}
                      size="sm"
                      onClick={handleExport}
                    />
                  </Tooltip>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <Box ref={graphRef} h="full" w="full" />
            </CardBody>
          </Card>
        </Box>

        {/* Controls Panel */}
        <Box w="400px" p={6} bg={bgColor} borderLeft="1px" borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            {/* Visualization Type */}
            <Card>
              <CardHeader>
                <Heading size="md">Visualization Type</Heading>
              </CardHeader>
              <CardBody>
                <Select
                  value={visualizationType}
                  onChange={(e) => setVisualizationType(e.target.value as VisualizationType)}
                >
                  <option value="activity-timeline">Activity Timeline</option>
                  <option value="social-network">Social Network</option>
                  <option value="buildson-network">Buildson Network</option>
                  <option value="user-statistics">User Statistics</option>
                </Select>
              </CardBody>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <Heading size="md">Current Statistics</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Stat>
                    <StatLabel>Total Interactions</StatLabel>
                    <StatNumber>{statistics.totalInteractions || 0}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Active Users</StatLabel>
                    <StatNumber>{statistics.uniqueUsers || 0}</StatNumber>
                  </Stat>
                  <HStack spacing={4} w="full">
                    <Stat size="sm">
                      <StatLabel>Reads</StatLabel>
                      <StatNumber fontSize="md">{statistics.readActions || 0}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Created</StatLabel>
                      <StatNumber fontSize="md">{statistics.createdActions || 0}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Modified</StatLabel>
                      <StatNumber fontSize="md">{statistics.modifiedActions || 0}</StatNumber>
                    </Stat>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <Heading size="md">Filters</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>View</FormLabel>
                    <Select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                      <option value="all">All Views</option>
                      {views.map(view => (
                        <option key={view.id} value={view.title}>{view.title}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Group</FormLabel>
                    <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                      <option value="all">All Groups</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.title}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>User</FormLabel>
                    <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                      <option value="all">All Users</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {hideNames ? member.pseudoName : `${member.firstName} ${member.lastName}`}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Date Range (days ago)</FormLabel>
                    <RangeSlider
                      value={dateRange}
                      onChange={setDateRange}
                      min={0}
                      max={365}
                      step={1}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                      <RangeSliderThumb index={1} />
                    </RangeSlider>
                    <Text fontSize="sm" color="gray.500">
                      {dateRange[0]} - {dateRange[1]} days ago
                    </Text>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <Heading size="md">Display Options</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Hide Real Names</FormLabel>
                    <Switch
                      isChecked={hideNames}
                      onChange={(e) => setHideNames(e.target.checked)}
                    />
                  </FormControl>

                  {(visualizationType === 'social-network' || visualizationType === 'buildson-network') && (
                    <>
                      <FormControl>
                        <FormLabel>Node Size</FormLabel>
                        <Slider
                          value={nodeSize}
                          onChange={setNodeSize}
                          min={10}
                          max={30}
                          step={1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text fontSize="sm" color="gray.500">{nodeSize}px</Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Edge Width</FormLabel>
                        <Slider
                          value={edgeWidth}
                          onChange={setEdgeWidth}
                          min={1}
                          max={10}
                          step={1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text fontSize="sm" color="gray.500">{edgeWidth}px</Text>
                      </FormControl>

                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Show Directional Arrows</FormLabel>
                        <Switch
                          isChecked={showDirectional}
                          onChange={(e) => setShowDirectional(e.target.checked)}
                        />
                      </FormControl>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Help */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">How to use:</AlertTitle>
                <AlertDescription fontSize="xs">
                  Select a visualization type above, then use the filters to explore your data. 
                  The graph will update automatically based on your selections.
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default UnifiedDashboard;