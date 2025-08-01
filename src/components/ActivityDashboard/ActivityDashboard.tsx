import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Avatar,
  AvatarGroup,
  Progress,
  Divider,
  Icon,
  SimpleGrid,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Wrap,
  WrapItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react';
import {
  SearchIcon,
  CalendarIcon,
  ViewIcon,
  DownloadIcon,
  SettingsIcon,
  InfoIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  TimeIcon,
  EditIcon,
  AddIcon,
  StarIcon
} from '@chakra-ui/icons';
import { 
  FiActivity, 
  FiUsers, 
  FiEye, 
  FiEdit3, 
  FiPlus, 
  FiTrendingUp,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import dashboardContext from '../../context/dashboard.js';

// Dummy data
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

interface ActivityRecord {
  id: string;
  when: number;
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

const ActivityDashboard: React.FC = () => {
  const { community, role: loggedInPersonRole, me, baseURL } = useContext(dashboardContext);
  const members = community.authors || [];
  const [hideNames, setHideNames] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [timeRange, setTimeRange] = useState('7');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const isManager = loggedInPersonRole === 'manager';
  const currentAuthor = { 
    _id: community.author.id, 
    role: loggedInPersonRole, 
    name: me?.firstName + " " + me?.lastName, 
    pseudoName: me?.pseudoName 
  };

  // Process data
  const processedData = useMemo(() => {
    return dummySocialInteractions.map((d) => ({
      ...d,
      date: new Date(parseInt(d.when.toString()))
    }));
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = processedData;

    // Time range filter
    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(item => item.date >= cutoff);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.view.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // View filter
    if (selectedView !== 'all') {
      filtered = filtered.filter(item => item.view === selectedView);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [processedData, timeRange, searchTerm, selectedView, selectedType]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const reads = filteredData.filter(d => d.type === 'read').length;
    const created = filteredData.filter(d => d.type === 'created').length;
    const modified = filteredData.filter(d => d.type === 'modified').length;
    
    const uniqueUsers = new Set(filteredData.map(d => 
      hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from
    )).size;

    const views = new Set(filteredData.map(d => d.view)).size;

    return { total, reads, created, modified, uniqueUsers, views };
  }, [filteredData, hideNames, currentAuthor._id]);

  // Get unique views for filter
  const uniqueViews = useMemo(() => {
    return Array.from(new Set(processedData.map(d => d.view)));
  }, [processedData]);

  // Get activity by user
  const userActivity = useMemo(() => {
    const activity: { [key: string]: { reads: number; created: number; modified: number; total: number } } = {};
    
    filteredData.forEach(item => {
      const userName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
      if (!activity[userName]) {
        activity[userName] = { reads: 0, created: 0, modified: 0, total: 0 };
      }
      activity[userName][item.type as keyof typeof activity[userName]]++;
      activity[userName].total++;
    });

    return Object.entries(activity)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredData, hideNames, currentAuthor._id]);

  const getActionColor = (type: string) => {
    switch (type) {
      case 'read': return 'blue';
      case 'created': return 'green';
      case 'modified': return 'orange';
      default: return 'gray';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'read': return FiEye;
      case 'created': return FiPlus;
      case 'modified': return FiEdit3;
      default: return FiActivity;
    }
  };

  const handleRecordClick = (record: ActivityRecord) => {
    setSelectedRecord(record);
    onOpen();
  };

  const toggleNames = () => {
    if (isManager) {
      setHideNames(!hideNames);
      toast({
        title: hideNames ? "Names revealed" : "Names hidden",
        description: hideNames ? "Real names are now visible" : "Pseudonyms are now shown",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Access Restricted",
        description: "Only managers can view other users' names",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg={bgColor} p={6} overflowY="auto" maxH="100vh">
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Flex justify="space-between" align="center" mb={6}>
              <VStack align="start" spacing={2}>
                <Heading size="xl" color={textColor} fontWeight="bold">
                  Activity Dashboard
                </Heading>
                <Text color={mutedColor} fontSize="lg">
                  Real-time insights into community engagement
                </Text>
              </VStack>
              
              <HStack spacing={4}>
                <Badge colorScheme="blue" px={4} py={2} borderRadius="full" fontSize="sm">
                  <HStack spacing={2}>
                    <Avatar size="xs" name={currentAuthor.name} />
                    <Text fontWeight="medium">{currentAuthor.name}</Text>
                  </HStack>
                </Badge>
                
                <Tooltip label={isManager ? `${hideNames ? 'Show' : 'Hide'} real names` : "Only managers can view names"}>
                  <Button
                    leftIcon={<ViewIcon />}
                    colorScheme={isManager ? "purple" : "gray"}
                    variant={isManager ? "solid" : "outline"}
                    onClick={toggleNames}
                    isDisabled={!isManager}
                    size="md"
                  >
                    {hideNames ? 'Show' : 'Hide'} Names
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>

            {/* Stats Overview */}
            <SimpleGrid columns={{ base: 2, md: 6 }} spacing={6} mb={8}>
              <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor} fontSize="sm" fontWeight="medium">Total Activities</StatLabel>
                    <StatNumber color="blue.500" fontSize="2xl" fontWeight="bold">{stats.total}</StatNumber>
                    <StatHelpText color={mutedColor}>
                      <StatArrow type="increase" />
                      Last {timeRange} days
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor} fontSize="sm" fontWeight="medium">Reads</StatLabel>
                    <StatNumber color="blue.500" fontSize="2xl" fontWeight="bold">{stats.reads}</StatNumber>
                    <StatHelpText color={mutedColor}>
                      {((stats.reads / stats.total) * 100).toFixed(1)}% of total
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor} fontSize="sm" fontWeight="medium">Created</StatLabel>
                    <StatNumber color="green.500" fontSize="2xl" fontWeight="bold">{stats.created}</StatNumber>
                    <StatHelpText color={mutedColor}>
                      {((stats.created / stats.total) * 100).toFixed(1)}% of total
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor} fontSize="sm" fontWeight="medium">Modified</StatLabel>
                    <StatNumber color="orange.500" fontSize="2xl" fontWeight="bold">{stats.modified}</StatNumber>
                    <StatHelpText color={mutedColor}>
                      {((stats.modified / stats.total) * 100).toFixed(1)}% of total
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor} fontSize="sm" fontWeight="medium">Active Users</StatLabel>
                    <StatNumber color="purple.500" fontSize="2xl" fontWeight="bold">{stats.uniqueUsers}</StatNumber>
                    <StatHelpText color={mutedColor}>
                      Participating
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor} fontSize="sm" fontWeight="medium">Views</StatLabel>
                    <StatNumber color="teal.500" fontSize="2xl" fontWeight="bold">{stats.views}</StatNumber>
                    <StatHelpText color={mutedColor}>
                      Different contexts
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          {/* Main Content */}
          <Grid templateColumns={{ base: "1fr", lg: "1fr 350px" }} gap={8}>
            <GridItem>
              <VStack spacing={6} align="stretch">
                {/* Filters */}
                <Card bg={cardBg} shadow="lg" borderRadius="xl">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Flex justify="space-between" align="center">
                        <Heading size="md" color={textColor}>Filters & Search</Heading>
                        <Button
                          leftIcon={<Icon as={FiRefreshCw} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedView('all');
                            setSelectedType('all');
                            setTimeRange('7');
                          }}
                        >
                          Reset
                        </Button>
                      </Flex>
                      
                      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                        <InputGroup>
                          <InputLeftElement>
                            <SearchIcon color={mutedColor} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg="white"
                            borderColor={borderColor}
                          />
                        </InputGroup>

                        <Select
                          value={selectedView}
                          onChange={(e) => setSelectedView(e.target.value)}
                          bg="white"
                          borderColor={borderColor}
                        >
                          <option value="all">All Views</option>
                          {uniqueViews.map(view => (
                            <option key={view} value={view}>{view}</option>
                          ))}
                        </Select>

                        <Select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          bg="white"
                          borderColor={borderColor}
                        >
                          <option value="all">All Types</option>
                          <option value="read">Read</option>
                          <option value="created">Created</option>
                          <option value="modified">Modified</option>
                        </Select>

                        <Select
                          value={timeRange}
                          onChange={(e) => setTimeRange(e.target.value)}
                          bg="white"
                          borderColor={borderColor}
                        >
                          <option value="1">Last 24 hours</option>
                          <option value="7">Last 7 days</option>
                          <option value="30">Last 30 days</option>
                          <option value="90">Last 90 days</option>
                          <option value="all">All time</option>
                        </Select>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Activity Feed */}
                <Card bg={cardBg} shadow="lg" borderRadius="xl">
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={6}>
                      <Heading size="md" color={textColor}>Recent Activity</Heading>
                      <Text color={mutedColor} fontSize="sm">
                        {filteredData.length} activities found
                      </Text>
                    </Flex>

                    <VStack spacing={4} align="stretch" maxH="600px" overflowY="auto">
                      <VStack spacing={4} align="stretch">
                        {filteredData.length === 0 ? (
                          <Box textAlign="center" py={12}>
                            <Icon as={FiActivity} boxSize={12} color={mutedColor} mb={4} />
                            <Text color={mutedColor} fontSize="lg">No activities found</Text>
                            <Text color={mutedColor} fontSize="sm">Try adjusting your filters</Text>
                          </Box>
                        ) : (
                          filteredData.map((record) => {
                            const displayName = hideNames && record.fromId !== currentAuthor._id 
                              ? record.fromPseudo 
                              : record.from;
                            
                            return (
                              <Card
                                key={record.id}
                                variant="outline"
                                cursor="pointer"
                                onClick={() => handleRecordClick(record)}
                                _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                                borderRadius="lg"
                              >
                                <CardBody>
                                  <Flex align="center" justify="space-between">
                                    <HStack spacing={4} flex={1}>
                                      <Icon
                                        as={getActionIcon(record.type)}
                                        boxSize={5}
                                        color={`${getActionColor(record.type)}.500`}
                                      />
                                      
                                      <VStack align="start" spacing={1} flex={1}>
                                        <Text fontWeight="semibold" color={textColor} noOfLines={1}>
                                          {record.title}
                                        </Text>
                                        <HStack spacing={2}>
                                          <Avatar size="xs" name={displayName} />
                                          <Text fontSize="sm" color={mutedColor}>
                                            {displayName}
                                          </Text>
                                          <Badge colorScheme={getActionColor(record.type)} size="sm">
                                            {record.type}
                                          </Badge>
                                          <Badge variant="outline" size="sm">
                                            {record.view}
                                          </Badge>
                                        </HStack>
                                      </VStack>
                                    </HStack>
                                    
                                    <VStack align="end" spacing={1}>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {record.date.toLocaleDateString()}
                                      </Text>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {record.date.toLocaleTimeString()}
                                      </Text>
                                    </VStack>
                                  </Flex>
                                </CardBody>
                              </Card>
                            );
                          })
                        )}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </GridItem>

            {/* Sidebar */}
            <GridItem>
              <VStack spacing={6} align="stretch" maxH="calc(100vh - 200px)" overflowY="auto">
                {/* Top Users */}
                <Card bg={cardBg} shadow="lg" borderRadius="xl">
                  <CardBody>
                    <Heading size="md" color={textColor} mb={4}>Most Active Users</Heading>
                    <VStack spacing={3} align="stretch">
                      {userActivity.slice(0, 5).map((user, index) => (
                        <Flex key={user.name} align="center" justify="space-between">
                          <HStack spacing={3}>
                            <Badge
                              colorScheme={index === 0 ? "gold" : index === 1 ? "gray" : "orange"}
                              variant="solid"
                              borderRadius="full"
                              px={2}
                            >
                              {index + 1}
                            </Badge>
                            <Avatar size="sm" name={user.name} />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" fontSize="sm" color={textColor}>
                                {user.name}
                              </Text>
                              <Text fontSize="xs" color={mutedColor}>
                                {user.total} activities
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack spacing={1}>
                            <Badge colorScheme="blue" size="sm">{user.reads}</Badge>
                            <Badge colorScheme="green" size="sm">{user.created}</Badge>
                            <Badge colorScheme="orange" size="sm">{user.modified}</Badge>
                          </HStack>
                        </Flex>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Activity Distribution */}
                <Card bg={cardBg} shadow="lg" borderRadius="xl">
                  <CardBody>
                    <Heading size="md" color={textColor} mb={4}>Activity Distribution</Heading>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" color={mutedColor}>Reads</Text>
                          <Text fontSize="sm" fontWeight="medium" color="blue.500">
                            {stats.reads} ({((stats.reads / stats.total) * 100).toFixed(1)}%)
                          </Text>
                        </Flex>
                        <Progress
                          value={(stats.reads / stats.total) * 100}
                          colorScheme="blue"
                          borderRadius="full"
                          size="sm"
                        />
                      </Box>

                      <Box>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" color={mutedColor}>Created</Text>
                          <Text fontSize="sm" fontWeight="medium" color="green.500">
                            {stats.created} ({((stats.created / stats.total) * 100).toFixed(1)}%)
                          </Text>
                        </Flex>
                        <Progress
                          value={(stats.created / stats.total) * 100}
                          colorScheme="green"
                          borderRadius="full"
                          size="sm"
                        />
                      </Box>

                      <Box>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" color={mutedColor}>Modified</Text>
                          <Text fontSize="sm" fontWeight="medium" color="orange.500">
                            {stats.modified} ({((stats.modified / stats.total) * 100).toFixed(1)}%)
                          </Text>
                        </Flex>
                        <Progress
                          value={(stats.modified / stats.total) * 100}
                          colorScheme="orange"
                          borderRadius="full"
                          size="sm"
                        />
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Quick Actions */}
                <Card bg={cardBg} shadow="lg" borderRadius="xl">
                  <CardBody>
                    <Heading size="md" color={textColor} mb={4}>Quick Actions</Heading>
                    <VStack spacing={3} align="stretch">
                      <Button
                        leftIcon={<DownloadIcon />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Export Started",
                            description: "Your data is being prepared for download",
                            status: "info",
                            duration: 3000,
                            isClosable: true,
                          });
                        }}
                      >
                        Export Data
                      </Button>
                      
                      <Button
                        leftIcon={<Icon as={FiFilter} />}
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                      >
                        Advanced Filters
                      </Button>
                      
                      <Button
                        leftIcon={<Icon as={FiTrendingUp} />}
                        colorScheme="teal"
                        variant="outline"
                        size="sm"
                      >
                        View Analytics
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>

      {/* Activity Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <Text>{selectedRecord?.title}</Text>
              <HStack spacing={2}>
                <Badge colorScheme={getActionColor(selectedRecord?.type || '')}>
                  {selectedRecord?.type}
                </Badge>
                <Badge variant="outline">{selectedRecord?.view}</Badge>
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRecord && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color={mutedColor} mb={1}>Author</Text>
                    <HStack>
                      <Avatar 
                        size="sm" 
                        name={hideNames && selectedRecord.fromId !== currentAuthor._id 
                          ? selectedRecord.fromPseudo 
                          : selectedRecord.from
                        } 
                      />
                      <Text fontWeight="medium">
                        {hideNames && selectedRecord.fromId !== currentAuthor._id 
                          ? selectedRecord.fromPseudo 
                          : selectedRecord.from
                        }
                      </Text>
                    </HStack>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color={mutedColor} mb={1}>Date & Time</Text>
                    <Text fontWeight="medium">
                      {selectedRecord.date.toLocaleDateString()} at {selectedRecord.date.toLocaleTimeString()}
                    </Text>
                  </Box>
                </SimpleGrid>

                <Divider />

                <Box>
                  <Text fontSize="sm" color={mutedColor} mb={2}>Content</Text>
                  <Box
                    p={4}
                    bg="gray.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                    dangerouslySetInnerHTML={{ __html: selectedRecord.data.body }}
                  />
                </Box>

                <Button
                  as="a"
                  href={`${baseURL}/contribution/${selectedRecord.ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<ExternalLinkIcon />}
                  colorScheme="blue"
                  variant="outline"
                >
                  View Original
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ActivityDashboard;