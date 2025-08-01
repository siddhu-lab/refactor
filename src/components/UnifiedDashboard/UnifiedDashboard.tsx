import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  Switch,
  FormControl,
  FormLabel,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Checkbox,
  ButtonGroup,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  InfoIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { Network } from 'vis-network';
import * as d3 from 'd3';
import * as dc from 'dc';
import crossfilter from 'crossfilter2';
import dashboardContext from '../../context/dashboard';

// Types
interface ActivityRecord {
  id: string;
  date: Date;
  type: string;
  from: string;
  fromId: string;
  fromPseudo: string;
  to: string;
  toPseudo: string;
  title: string;
  view: string;
  data: { body: string };
}

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: { background: string; border: string };
}

interface NetworkEdge {
  from: string;
  to: string;
  value: number;
  title: string;
}

const UnifiedDashboard: React.FC = () => {
  const { community, role, me } = useContext(dashboardContext);
  
  // Core state
  const [analysisType, setAnalysisType] = useState<'knowledge' | 'activity'>('knowledge');
  const [showActivityRecords, setShowActivityRecords] = useState(false);
  const [hideNames, setHideNames] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  
  // Network settings
  const [networkSettings, setNetworkSettings] = useState({
    nodeSize: 15,
    edgeWidth: 5,
    showDirections: false
  });
  
  // Activity records state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Network state
  const [networkInfo, setNetworkInfo] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Refs
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  
  // Current user info
  const currentAuthor = {
    _id: community.author.id,
    role: role,
    name: me?.firstName + " " + me?.lastName,
    pseudoName: me?.pseudoName
  };
  
  // Dummy data
  const dummyActivityData: ActivityRecord[] = [
    {
      id: '1',
      date: new Date(Date.now() - 86400000 * 5),
      type: 'read',
      from: 'John Smith',
      fromId: 'author-1',
      fromPseudo: 'JohnS',
      to: 'Sarah Johnson',
      toPseudo: 'SarahJ',
      title: 'Climate Change Discussion',
      view: 'Science Discussion',
      data: { body: '<p>This is a discussion about climate change and its impacts.</p>' }
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000 * 3),
      type: 'created',
      from: 'Sarah Johnson',
      fromId: 'author-2',
      fromPseudo: 'SarahJ',
      to: 'Sarah Johnson',
      toPseudo: 'SarahJ',
      title: 'Mathematical Proof Analysis',
      view: 'Math Problems',
      data: { body: '<p>Here is my analysis of the mathematical proof presented in class.</p>' }
    },
    {
      id: '3',
      date: new Date(Date.now() - 86400000 * 2),
      type: 'modified',
      from: 'Mike Wilson',
      fromId: 'author-3',
      fromPseudo: 'MikeW',
      to: 'Mike Wilson',
      toPseudo: 'MikeW',
      title: 'History Essay Update',
      view: 'History Class',
      data: { body: '<p>Updated my essay on World War II with additional sources.</p>' }
    }
  ];

  const dummyKnowledgeData = [
    { from: 'author-1', to: 'author-2', weight: 3, type: 'buildson' },
    { from: 'author-2', to: 'author-3', weight: 2, type: 'buildson' },
    { from: 'author-3', to: 'author-1', weight: 1, type: 'buildson' }
  ];

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Process data based on analysis type
  const processedData = React.useMemo(() => {
    if (analysisType === 'knowledge') {
      return processKnowledgeData();
    } else {
      return processActivityData();
    }
  }, [analysisType, hideNames, selectedGroup, selectedView, selectedAuthor, dateRange]);

  function processKnowledgeData() {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    
    // Create nodes from authors
    community.authors.forEach(author => {
      const displayName = hideNames && author.id !== currentAuthor._id 
        ? author.pseudoName 
        : `${author.firstName} ${author.lastName}`;
      
      nodes.push({
        id: author.id,
        label: displayName,
        size: 20,
        color: {
          background: author.id === currentAuthor._id ? '#e53e3e' : '#3182ce',
          border: author.id === currentAuthor._id ? '#c53030' : '#2c5282'
        }
      });
    });

    // Create edges from knowledge building relationships
    dummyKnowledgeData.forEach(link => {
      edges.push({
        from: link.from,
        to: link.to,
        value: link.weight,
        title: `${link.weight} knowledge building connections`
      });
    });

    return { nodes, edges };
  }

  function processActivityData() {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    
    // Process activity data for network visualization
    const activityMap = new Map();
    
    dummyActivityData.forEach(record => {
      const fromName = hideNames && record.fromId !== currentAuthor._id 
        ? record.fromPseudo 
        : record.from;
      
      if (!activityMap.has(record.fromId)) {
        activityMap.set(record.fromId, {
          id: record.fromId,
          name: fromName,
          read: 0,
          created: 0,
          modified: 0,
          total: 0
        });
      }
      
      const user = activityMap.get(record.fromId);
      user[record.type]++;
      user.total++;
    });

    // Create nodes
    activityMap.forEach(user => {
      nodes.push({
        id: user.id,
        label: `${user.name} (${user.total})`,
        size: Math.max(10, user.total * 5),
        color: {
          background: user.id === currentAuthor._id ? '#e53e3e' : '#3182ce',
          border: user.id === currentAuthor._id ? '#c53030' : '#2c5282'
        }
      });
    });

    return { nodes, edges };
  }

  // Initialize network
  useEffect(() => {
    if (!networkRef.current || !processedData) return;

    const options = {
      nodes: {
        shape: 'dot',
        scaling: { min: 10, max: 50 }
      },
      edges: {
        smooth: { type: 'continuous' },
        arrows: networkSettings.showDirections ? { to: true } : undefined
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
        hover: true
      }
    };

    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    networkInstance.current = new Network(
      networkRef.current,
      processedData,
      options
    );

    // Add event listeners
    networkInstance.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        handleNodeClick(nodeId);
      } else {
        setSelectedNode(null);
        setNetworkInfo('');
      }
    });

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
      }
    };
  }, [processedData, networkSettings]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    
    const author = community.authors.find(a => a.id === nodeId);
    if (!author) return;

    const displayName = hideNames && nodeId !== currentAuthor._id 
      ? author.pseudoName 
      : `${author.firstName} ${author.lastName}`;

    if (analysisType === 'knowledge') {
      const connections = dummyKnowledgeData.filter(
        link => link.from === nodeId || link.to === nodeId
      );
      
      setNetworkInfo(`
        <strong>${displayName}</strong><br/>
        Knowledge Building Connections: ${connections.length}<br/>
        Click on connections to see detailed relationships.
      `);
    } else {
      const userActivities = dummyActivityData.filter(record => record.fromId === nodeId);
      const stats = {
        read: userActivities.filter(r => r.type === 'read').length,
        created: userActivities.filter(r => r.type === 'created').length,
        modified: userActivities.filter(r => r.type === 'modified').length
      };
      
      setNetworkInfo(`
        <strong>${displayName}</strong><br/>
        Total Activities: ${userActivities.length}<br/>
        Read: ${stats.read} | Created: ${stats.created} | Modified: ${stats.modified}
      `);
    }
  };

  // Filter activity records for table
  const filteredActivityRecords = React.useMemo(() => {
    let filtered = dummyActivityData;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [searchTerm]);

  // Paginate records
  const paginatedRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredActivityRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredActivityRecords, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(filteredActivityRecords.length / recordsPerPage);

  // Export functions
  const exportData = (format: 'csv' | 'json') => {
    const data = analysisType === 'knowledge' ? dummyKnowledgeData : dummyActivityData;
    const filename = `${analysisType}_data.${format}`;
    
    if (format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, filename, 'text/csv');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, filename, 'application/json');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAnalysisDescription = () => {
    if (analysisType === 'knowledge') {
      return {
        title: "Knowledge Building Network",
        description: "This network shows knowledge building relationships between authors based on their collaborative contributions.",
        info: [
          "Nodes: Authors with their contribution counts",
          "Edges: Knowledge building connections",
          "Hover: View detailed connection information",
          "Red: Current User",
          "Blue: Other Users"
        ],
        legend: [
          { color: "#e53e3e", label: "Current User" },
          { color: "#3182ce", label: "Other Users" },
          { color: "#38a169", label: "Strong Connections" }
        ]
      };
    } else {
      return {
        title: "Activity Analysis Network",
        description: "This network visualizes user activity patterns including reads, creations, and modifications.",
        info: [
          "Nodes: Users with activity counts",
          "Size: Total activity volume",
          "Hover: View activity breakdown",
          "Red: Current User",
          "Blue: Other Users"
        ],
        legend: [
          { color: "#e53e3e", label: "Current User" },
          { color: "#3182ce", label: "Other Users" },
          { color: "#805ad5", label: "High Activity" }
        ]
      };
    }
  };

  const analysisInfo = getAnalysisDescription();

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg={cardBg} shadow="sm">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="lg">Knowledge Forum Analytics</Heading>
              <HStack>
                <Text fontSize="sm" color="gray.600">Current User:</Text>
                <Badge colorScheme="blue">{currentAuthor.name}</Badge>
              </HStack>
            </Flex>
          </CardHeader>
        </Card>

        {/* Analysis Type Selection */}
        <Card bg={cardBg} shadow="sm">
          <CardBody>
            <FormControl>
              <FormLabel>Analysis Type</FormLabel>
              <ButtonGroup isAttached variant="outline">
                <Button
                  colorScheme={analysisType === 'knowledge' ? 'blue' : 'gray'}
                  onClick={() => setAnalysisType('knowledge')}
                  variant={analysisType === 'knowledge' ? 'solid' : 'outline'}
                >
                  Knowledge Building
                </Button>
                <Button
                  colorScheme={analysisType === 'activity' ? 'blue' : 'gray'}
                  onClick={() => setAnalysisType('activity')}
                  variant={analysisType === 'activity' ? 'solid' : 'outline'}
                >
                  Activity Analysis
                </Button>
              </ButtonGroup>
            </FormControl>
          </CardBody>
        </Card>

        {/* Main Content */}
        <Flex gap={6} align="stretch">
          {/* Network Visualization */}
          <Box flex="2">
            <Card bg={cardBg} shadow="sm" h="600px">
              <CardHeader>
                <Heading size="md">{analysisInfo.title}</Heading>
              </CardHeader>
              <CardBody>
                <Box
                  ref={networkRef}
                  w="100%"
                  h="500px"
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  bg="gray.50"
                />
              </CardBody>
            </Card>
          </Box>

          {/* Controls and Information */}
          <Box flex="1">
            <VStack spacing={4} align="stretch">
              {/* Filters */}
              <Card bg={cardBg} shadow="sm">
                <CardHeader>
                  <Heading size="sm">Filters</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Group</FormLabel>
                      <Select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        size="sm"
                      >
                        <option value="all">All Groups</option>
                        {community.groups?.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.title}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">View</FormLabel>
                      <Select
                        value={selectedView}
                        onChange={(e) => setSelectedView(e.target.value)}
                        size="sm"
                      >
                        <option value="all">All Views</option>
                        {community.views?.map(view => (
                          <option key={view.id} value={view.id}>
                            {view.title}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Author</FormLabel>
                      <Select
                        value={selectedAuthor}
                        onChange={(e) => setSelectedAuthor(e.target.value)}
                        size="sm"
                      >
                        <option value="all">All Authors</option>
                        {community.authors?.map(author => (
                          <option key={author.id} value={author.id}>
                            {hideNames && author.id !== currentAuthor._id 
                              ? author.pseudoName 
                              : `${author.firstName} ${author.lastName}`}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="hide-names" mb="0" fontSize="sm">
                        Hide Names
                      </FormLabel>
                      <Switch
                        id="hide-names"
                        isChecked={hideNames}
                        onChange={(e) => setHideNames(e.target.checked)}
                        size="sm"
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              {/* Network Settings */}
              <Card bg={cardBg} shadow="sm">
                <CardHeader>
                  <Heading size="sm">Network Settings</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Node Size</FormLabel>
                      <Slider
                        value={networkSettings.nodeSize}
                        onChange={(value) => setNetworkSettings(prev => ({ ...prev, nodeSize: value }))}
                        min={5}
                        max={30}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Edge Width</FormLabel>
                      <Slider
                        value={networkSettings.edgeWidth}
                        onChange={(value) => setNetworkSettings(prev => ({ ...prev, edgeWidth: value }))}
                        min={1}
                        max={10}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="show-directions" mb="0" fontSize="sm">
                        Show Directions
                      </FormLabel>
                      <Switch
                        id="show-directions"
                        isChecked={networkSettings.showDirections}
                        onChange={(e) => setNetworkSettings(prev => ({ ...prev, showDirections: e.target.checked }))}
                        size="sm"
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              {/* Network Information */}
              <Card bg={cardBg} shadow="sm">
                <CardHeader>
                  <Heading size="sm">Network Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      {analysisInfo.description}
                    </Text>
                    <Divider />
                    <VStack spacing={1} align="stretch">
                      {analysisInfo.info.map((info, index) => (
                        <Text key={index} fontSize="xs" color="gray.500">
                          • {info}
                        </Text>
                      ))}
                    </VStack>
                    {networkInfo && (
                      <>
                        <Divider />
                        <Box
                          p={3}
                          bg="blue.50"
                          borderRadius="md"
                          fontSize="sm"
                          dangerouslySetInnerHTML={{ __html: networkInfo }}
                        />
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Export Options */}
              <Card bg={cardBg} shadow="sm">
                <CardHeader>
                  <Heading size="sm">Export Data</Heading>
                </CardHeader>
                <CardBody>
                  <ButtonGroup size="sm" variant="outline">
                    <Button leftIcon={<DownloadIcon />} onClick={() => exportData('csv')}>
                      CSV
                    </Button>
                    <Button leftIcon={<DownloadIcon />} onClick={() => exportData('json')}>
                      JSON
                    </Button>
                  </ButtonGroup>
                </CardBody>
              </Card>
            </VStack>
          </Box>
        </Flex>

        {/* Activity Records Section */}
        {analysisType === 'activity' && (
          <Card bg={cardBg} shadow="sm">
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">Activity Records</Heading>
                <FormControl display="flex" alignItems="center" w="auto">
                  <FormLabel htmlFor="show-records" mb="0" fontSize="sm">
                    Show Activity Records
                  </FormLabel>
                  <Switch
                    id="show-records"
                    isChecked={showActivityRecords}
                    onChange={(e) => setShowActivityRecords(e.target.checked)}
                  />
                </FormControl>
              </Flex>
            </CardHeader>
            
            {showActivityRecords && (
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Search and Controls */}
                  <Flex justify="space-between" align="center" gap={4}>
                    <HStack>
                      <Text fontSize="sm">Show</Text>
                      <Select
                        value={recordsPerPage}
                        onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                        size="sm"
                        w="auto"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </Select>
                      <Text fontSize="sm">entries</Text>
                    </HStack>
                    
                    <HStack>
                      <Input
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="sm"
                        w="200px"
                      />
                      <ButtonGroup size="sm" variant="outline">
                        <Button leftIcon={<DownloadIcon />} onClick={() => exportData('csv')}>
                          Export CSV
                        </Button>
                      </ButtonGroup>
                    </HStack>
                  </Flex>

                  {/* Records Table */}
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Action</Th>
                          <Th>Title</Th>
                          <Th>User</Th>
                          <Th>View</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {paginatedRecords.map((record) => (
                          <Tr key={record.id}>
                            <Td>{record.date.toLocaleDateString()}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  record.type === 'created' ? 'green' :
                                  record.type === 'modified' ? 'yellow' : 'blue'
                                }
                              >
                                {record.type}
                              </Badge>
                            </Td>
                            <Td>{record.title}</Td>
                            <Td>
                              {hideNames && record.fromId !== currentAuthor._id 
                                ? record.fromPseudo 
                                : record.from}
                            </Td>
                            <Td>{record.view}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.600">
                        Showing {((currentPage - 1) * recordsPerPage) + 1} to{' '}
                        {Math.min(currentPage * recordsPerPage, filteredActivityRecords.length)} of{' '}
                        {filteredActivityRecords.length} entries
                      </Text>
                      
                      <HStack>
                        <IconButton
                          aria-label="Previous page"
                          icon={<ChevronLeftIcon />}
                          size="sm"
                          isDisabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              size="sm"
                              variant={currentPage === page ? 'solid' : 'outline'}
                              colorScheme={currentPage === page ? 'blue' : 'gray'}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        
                        <IconButton
                          aria-label="Next page"
                          icon={<ChevronRightIcon />}
                          size="sm"
                          isDisabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                      </HStack>
                    </Flex>
                  )}
                </VStack>
              </CardBody>
            )}
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default UnifiedDashboard;