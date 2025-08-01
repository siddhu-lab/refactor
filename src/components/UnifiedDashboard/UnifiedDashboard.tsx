import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  SearchIcon,
  DownloadIcon,
  InfoIcon,
  ChevronDownIcon,
  ViewIcon,
  ViewOffIcon
} from '@chakra-ui/icons';
import { Network } from 'vis-network';
import * as d3 from 'd3';
import * as dc from 'dc';
import crossfilter from 'crossfilter2';

// Types
interface Author {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pseudoName: string;
  role: string;
}

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
  ID: string;
}

interface BuildsonLink {
  id: string;
  from: string;
  to: string;
  type: string;
  created: number;
  _from: { authors: string[] };
  _to: { authors: string[] };
}

interface Contribution {
  id: string;
  _id: string;
  title: string;
  created: number;
  authors: string[];
  type: string;
  data: { body: string };
}

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
    data: { body: '<p>This is a discussion about climate change and its impacts.</p>' },
    ID: 'contrib-1'
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
    data: { body: '<p>Here is my analysis of the mathematical proof presented in class.</p>' },
    ID: 'contrib-2'
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
    data: { body: '<p>Updated my essay on World War II with additional sources.</p>' },
    ID: 'contrib-3'
  }
];

const dummyBuildsonLinks: BuildsonLink[] = [
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

const dummyContributions: Contribution[] = [
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

const dummyAuthors: Author[] = [
  {
    id: 'author-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    pseudoName: 'JohnS',
    role: 'student'
  },
  {
    id: 'author-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    pseudoName: 'SarahJ',
    role: 'student'
  },
  {
    id: 'author-3',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@example.com',
    pseudoName: 'MikeW',
    role: 'student'
  }
];

const UnifiedDashboard: React.FC = () => {
  // State management
  const [analysisType, setAnalysisType] = useState<'knowledge' | 'activity'>('knowledge');
  const [showActivityRecords, setShowActivityRecords] = useState(false);
  const [hideNames, setHideNames] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [networkInfo, setNetworkInfo] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Refs
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');

  // Current user (mock)
  const currentUser = {
    id: 'author-1',
    name: 'John Smith',
    pseudoName: 'JohnS'
  };

  // Process data based on analysis type
  const processedData = useMemo(() => {
    if (analysisType === 'knowledge') {
      return processKnowledgeBuildingData();
    } else {
      return processActivityData();
    }
  }, [analysisType, hideNames, selectedGroup, selectedView, selectedAuthor]);

  function processKnowledgeBuildingData() {
    const authors: { [key: string]: any } = {};
    const buildsonkey: { [key: string]: any } = {};
    const buildson: any[] = [];

    // Process contributions to create author nodes
    dummyContributions.forEach(contrib => {
      contrib.authors.forEach(authorId => {
        const author = dummyAuthors.find(a => a.id === authorId);
        if (author) {
          const displayName = hideNames && authorId !== currentUser.id 
            ? author.pseudoName 
            : `${author.firstName} ${author.lastName}`;
          
          if (authors[displayName]) {
            authors[displayName].size++;
          } else {
            authors[displayName] = {
              id: authorId,
              name: displayName,
              size: 1,
              type: 'author'
            };
          }
        }
      });
    });

    // Process buildson links
    dummyBuildsonLinks.forEach(link => {
      link._from.authors.forEach(sourceId => {
        link._to.authors.forEach(targetId => {
          const sourceAuthor = dummyAuthors.find(a => a.id === sourceId);
          const targetAuthor = dummyAuthors.find(a => a.id === targetId);
          
          if (sourceAuthor && targetAuthor) {
            const sourceName = hideNames && sourceId !== currentUser.id 
              ? sourceAuthor.pseudoName 
              : `${sourceAuthor.firstName} ${sourceAuthor.lastName}`;
            const targetName = hideNames && targetId !== currentUser.id 
              ? targetAuthor.pseudoName 
              : `${targetAuthor.firstName} ${targetAuthor.lastName}`;
            
            const key = sourceName + targetName;
            if (buildsonkey[key]) {
              buildsonkey[key].weight++;
            } else {
              buildsonkey[key] = {
                source: sourceName,
                target: targetName,
                type: 'buildson',
                weight: 1
              };
            }
          }
        });
      });
    });

    for (const key in buildsonkey) {
      buildson.push(buildsonkey[key]);
    }

    return { nodes: authors, links: buildson };
  }

  function processActivityData() {
    const authors: { [key: string]: any } = {};
    const interactions: any[] = [];

    // Process activity data
    dummyActivityData.forEach(record => {
      const displayName = hideNames && record.fromId !== currentUser.id 
        ? record.fromPseudo 
        : record.from;
      
      if (authors[displayName]) {
        authors[displayName][record.type]++;
        authors[displayName].total++;
      } else {
        authors[displayName] = {
          id: record.fromId,
          name: displayName,
          read: record.type === 'read' ? 1 : 0,
          created: record.type === 'created' ? 1 : 0,
          modified: record.type === 'modified' ? 1 : 0,
          total: 1,
          type: 'author'
        };
      }

      // Create interaction links for reads
      if (record.type === 'read' && record.from !== record.to) {
        const targetName = hideNames && record.to !== currentUser.name 
          ? record.toPseudo 
          : record.to;
        
        interactions.push({
          source: displayName,
          target: targetName,
          type: 'read',
          weight: 1
        });
      }
    });

    return { nodes: authors, links: interactions };
  }

  // Initialize network visualization
  useEffect(() => {
    if (!networkRef.current || !processedData) return;

    const { nodes, links } = processedData;
    
    if (Object.keys(nodes).length === 0) {
      setNetworkInfo('No data to display');
      return;
    }

    // Clear previous network
    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    const nodeArray = Object.values(nodes).map((node: any) => ({
      id: node.name,
      label: node.name,
      size: analysisType === 'knowledge' ? node.size * 10 : node.total * 10,
      color: {
        background: node.id === currentUser.id ? '#e53e3e' : '#3182ce',
        border: node.id === currentUser.id ? '#c53030' : '#2c5aa0'
      },
      font: { size: 14, color: '#2d3748' },
      title: analysisType === 'knowledge' 
        ? `${node.name}\nContributions: ${node.size}`
        : `${node.name}\nTotal: ${node.total}\nRead: ${node.read}\nCreated: ${node.created}\nModified: ${node.modified}`
    }));

    const edgeArray = links.map((link: any, index: number) => ({
      id: index,
      from: link.source,
      to: link.target,
      width: link.weight * 2,
      color: { color: '#718096' },
      arrows: { to: { enabled: true, scaleFactor: 1 } }
    }));

    const data = {
      nodes: nodeArray,
      edges: edgeArray
    };

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
        hover: true
      }
    };

    networkInstance.current = new Network(networkRef.current, data, options);

    // Add click handler
    networkInstance.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodeArray.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
          setNetworkInfo(node.title || '');
        }
      } else {
        setSelectedNode(null);
        setNetworkInfo('');
      }
    });

  }, [processedData, analysisType]);

  // Filter activity records for table
  const filteredActivityRecords = useMemo(() => {
    let filtered = dummyActivityData;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [searchTerm]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredActivityRecords.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredActivityRecords, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredActivityRecords.length / entriesPerPage);

  // Export functions
  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    console.log(`Exporting data as ${format}`);
    // Implementation would go here
  };

  const getAnalysisInfo = () => {
    if (analysisType === 'knowledge') {
      return {
        title: 'Knowledge Building Network',
        description: 'This network shows the relationships between authors based on their knowledge building contributions.',
        nodeInfo: 'Nodes: Authors + Contribution Count',
        edgeInfo: 'Edges: Buildson relationships between contributions',
        hoverInfo: 'Hover: View detailed author information',
        colorInfo: [
          { color: '#e53e3e', label: 'Current User' },
          { color: '#3182ce', label: 'Other Users' }
        ],
        instructions: [
          'Click on a node to see detailed information about that author\'s contributions.',
          'Use the filters to focus on specific groups, views, or authors.',
          'Toggle name visibility using the privacy controls.'
        ]
      };
    } else {
      return {
        title: 'Activity Analysis Network',
        description: 'This network shows the reading and interaction patterns between users.',
        nodeInfo: 'Nodes: Users + Activity Count (Read/Created/Modified)',
        edgeInfo: 'Edges: Reading interactions between users',
        hoverInfo: 'Hover: View detailed activity statistics',
        colorInfo: [
          { color: '#e53e3e', label: 'Current User' },
          { color: '#3182ce', label: 'Other Users' }
        ],
        instructions: [
          'Click on a node to see detailed activity information.',
          'Enable "Show Activity Records" to view detailed interaction logs.',
          'Use filters to focus on specific time periods or user groups.'
        ]
      };
    }
  };

  const analysisInfo = getAnalysisInfo();

  return (
    <Box h="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex h="100%">
        {/* Left Side - Graph */}
        <Box flex="1" p={4}>
          <Card h="100%" bg={cardBg} borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="md" color={useColorModeValue('gray.700', 'gray.200')}>
                {analysisInfo.title}
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Box 
                ref={networkRef} 
                h="100%" 
                bg={useColorModeValue('gray.50', 'gray.800')}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              />
            </CardBody>
          </Card>
        </Box>

        {/* Right Side - Controls and Information */}
        <Box w="400px" p={4} bg={bgColor} borderLeft="1px solid" borderColor={borderColor}>
          <VStack spacing={4} h="100%" overflowY="auto">
            
            {/* Analysis Type Selection */}
            <Card w="100%" bg={cardBg}>
              <CardHeader pb={2}>
                <Heading size="sm">Analysis Type</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Select 
                  value={analysisType} 
                  onChange={(e) => setAnalysisType(e.target.value as 'knowledge' | 'activity')}
                >
                  <option value="knowledge">Knowledge Building</option>
                  <option value="activity">Activity Analysis</option>
                </Select>
              </CardBody>
            </Card>

            {/* Filters */}
            <Card w="100%" bg={cardBg}>
              <CardHeader pb={2}>
                <Heading size="sm">Filters</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Group</FormLabel>
                    <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                      <option value="all">All Groups</option>
                      <option value="science">Science Group</option>
                      <option value="math">Math Group</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">View</FormLabel>
                    <Select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                      <option value="all">All Views</option>
                      <option value="science">Science Discussion</option>
                      <option value="math">Math Problems</option>
                      <option value="history">History Class</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Author</FormLabel>
                    <Select value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}>
                      <option value="all">All Authors</option>
                      {dummyAuthors.map(author => (
                        <option key={author.id} value={author.id}>
                          {hideNames && author.id !== currentUser.id 
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
                    />
                  </FormControl>

                  {analysisType === 'activity' && (
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="show-records" mb="0" fontSize="sm">
                        Show Activity Records
                      </FormLabel>
                      <Switch 
                        id="show-records" 
                        isChecked={showActivityRecords} 
                        onChange={(e) => setShowActivityRecords(e.target.checked)} 
                      />
                    </FormControl>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Network Information */}
            <Card w="100%" bg={cardBg}>
              <CardHeader pb={2}>
                <HStack>
                  <InfoIcon color="blue.500" />
                  <Heading size="sm">Network Information</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    {analysisInfo.description}
                  </Text>
                  
                  <Divider />
                  
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="bold">Graph Elements:</Text>
                    <Text fontSize="xs">• {analysisInfo.nodeInfo}</Text>
                    <Text fontSize="xs">• {analysisInfo.edgeInfo}</Text>
                    <Text fontSize="xs">• {analysisInfo.hoverInfo}</Text>
                  </VStack>

                  <Divider />

                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="bold">Color Legend:</Text>
                    {analysisInfo.colorInfo.map((item, index) => (
                      <HStack key={index} spacing={2}>
                        <Box w={3} h={3} bg={item.color} borderRadius="full" />
                        <Text fontSize="xs">{item.label}</Text>
                      </HStack>
                    ))}
                  </VStack>

                  <Divider />

                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="bold">Instructions:</Text>
                    {analysisInfo.instructions.map((instruction, index) => (
                      <Text key={index} fontSize="xs">• {instruction}</Text>
                    ))}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Selected Node Info */}
            {selectedNode && (
              <Card w="100%" bg={cardBg} borderColor="blue.200">
                <CardHeader pb={2}>
                  <Heading size="sm" color="blue.600">Selected: {selectedNode.label}</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="sm" whiteSpace="pre-line">
                    {selectedNode.title}
                  </Text>
                </CardBody>
              </Card>
            )}

            {/* Export Options */}
            <Card w="100%" bg={cardBg}>
              <CardHeader pb={2}>
                <Heading size="sm">Export Data</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <HStack spacing={2}>
                  <Button size="sm" leftIcon={<DownloadIcon />} onClick={() => exportData('csv')}>
                    CSV
                  </Button>
                  <Button size="sm" leftIcon={<DownloadIcon />} onClick={() => exportData('excel')}>
                    Excel
                  </Button>
                  <Button size="sm" leftIcon={<DownloadIcon />} onClick={() => exportData('pdf')}>
                    PDF
                  </Button>
                </HStack>
              </CardBody>
            </Card>

          </VStack>
        </Box>
      </Flex>

      {/* Activity Records Table Modal/Overlay */}
      {analysisType === 'activity' && showActivityRecords && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex="overlay"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Card maxW="90vw" maxH="90vh" w="full" bg={cardBg}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Activity Records</Heading>
                <Button size="sm" onClick={() => setShowActivityRecords(false)}>
                  Close
                </Button>
              </HStack>
            </CardHeader>
            <CardBody overflowY="auto">
              <VStack spacing={4}>
                {/* Search and Controls */}
                <HStack w="full" justify="space-between">
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
                  
                  <HStack>
                    <Text fontSize="sm">Show:</Text>
                    <Select 
                      size="sm" 
                      w="auto" 
                      value={entriesPerPage}
                      onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </Select>
                    <Text fontSize="sm">entries</Text>
                  </HStack>
                </HStack>

                {/* Table */}
                <Box w="full" overflowX="auto">
                  <Table variant="simple" size="sm">
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
                                record.type === 'read' ? 'blue' : 
                                record.type === 'created' ? 'green' : 'orange'
                              }
                            >
                              {record.type}
                            </Badge>
                          </Td>
                          <Td>{record.title}</Td>
                          <Td>
                            {hideNames && record.fromId !== currentUser.id 
                              ? record.fromPseudo 
                              : record.from}
                          </Td>
                          <Td>{record.view}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Pagination */}
                {totalPages > 1 && (
                  <HStack spacing={2}>
                    <Button 
                      size="sm" 
                      isDisabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? "solid" : "outline"}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      size="sm" 
                      isDisabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default UnifiedDashboard;