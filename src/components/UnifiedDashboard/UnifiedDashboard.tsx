import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useColorModeValue,
  Icon,
  Tooltip,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  CalendarIcon,
  SettingsIcon,
  BarChart3,
  Network,
  Activity,
  Users,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import ActivityDashboard from '../ActivityDashboard/ActivityDashboard.tsx';
import AuthorNetworkPage from '../AuthorNetwork/AuthorNetworkPage';
import dashboardContext from '../../context/dashboard.js';

type ViewType = 'activity' | 'network';
type TimeRange = 'all' | '7d' | '30d' | '90d' | 'custom';

interface FilterState {
  viewType: ViewType;
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

const UnifiedDashboard: React.FC = () => {
  const { community, role, me } = useContext(dashboardContext);
  const { isOpen: isFiltersOpen, onToggle: toggleFilters } = useDisclosure({ defaultIsOpen: true });
  
  const [filters, setFilters] = useState<FilterState>({
    viewType: 'activity',
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

  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalInteractions: 0,
    activeUsers: 0,
    totalNotes: 0,
    connections: 0,
  });

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Mock data for stats
  useEffect(() => {
    setStats({
      totalInteractions: 156,
      activeUsers: community?.authors?.length || 0,
      totalNotes: 89,
      connections: 23,
    });
  }, [community]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting data with filters:', filters);
  };

  const resetFilters = () => {
    setFilters({
      viewType: filters.viewType, // Keep the current view type
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
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case 'custom': return 'Custom range';
      default: return 'All time';
    }
  };

  const getViewTypeIcon = (type: ViewType) => {
    return type === 'activity' ? Activity : Network;
  };

  const renderVisualization = () => {
    if (filters.viewType === 'activity') {
      return <ActivityDashboard />;
    } else {
      return <AuthorNetworkPage />;
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
          <CardHeader pb={4}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color={textColor}>
                  Knowledge Forum Analytics
                </Heading>
                <Text color={mutedColor} fontSize="sm">
                  Comprehensive view of community interactions and network analysis
                </Text>
              </VStack>
              
              <HStack spacing={3}>
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
                
                <Tooltip label="Export data">
                  <Button
                    leftIcon={<Icon as={Download} />}
                    colorScheme="blue"
                    size="sm"
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <Flex wrap="wrap" gap={4}>
          <Card bg={cardBg} shadow="sm" borderColor={borderColor} flex="1" minW="200px">
            <CardBody>
              <HStack>
                <Icon as={Activity} color="blue.500" boxSize={5} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {stats.totalInteractions}
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    Total Interactions
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm" borderColor={borderColor} flex="1" minW="200px">
            <CardBody>
              <HStack>
                <Icon as={Users} color="green.500" boxSize={5} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {stats.activeUsers}
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    Active Users
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm" borderColor={borderColor} flex="1" minW="200px">
            <CardBody>
              <HStack>
                <Icon as={BarChart3} color="purple.500" boxSize={5} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {stats.totalNotes}
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    Total Notes
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm" borderColor={borderColor} flex="1" minW="200px">
            <CardBody>
              <HStack>
                <Icon as={Network} color="orange.500" boxSize={5} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {stats.connections}
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    Network Connections
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </Flex>

        {/* Control Panel */}
        <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Flex justify="space-between" align="center">
              <HStack>
                <Icon as={Filter} color="blue.500" />
                <Heading size="md" color={textColor}>
                  Filters & Controls
                </Heading>
                <Badge colorScheme="blue" variant="subtle">
                  {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== false && v !== 'activity').length} active
                </Badge>
              </HStack>
              
              <HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetFilters}
                  color={mutedColor}
                >
                  Reset All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFilters}
                  rightIcon={<Icon as={isFiltersOpen ? ChevronUpIcon : ChevronDownIcon} />}
                >
                  {isFiltersOpen ? 'Hide' : 'Show'} Filters
                </Button>
              </HStack>
            </Flex>
          </CardHeader>

          <Collapse in={isFiltersOpen}>
            <CardBody pt={2}>
              <VStack spacing={6} align="stretch">
                {/* Primary Controls */}
                <Flex wrap="wrap" gap={6}>
                  <FormControl minW="200px">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                      Visualization Type
                    </FormLabel>
                    <ButtonGroup size="sm" isAttached variant="outline">
                      <Button
                        leftIcon={<Icon as={Activity} />}
                        colorScheme={filters.viewType === 'activity' ? 'blue' : 'gray'}
                        variant={filters.viewType === 'activity' ? 'solid' : 'outline'}
                        onClick={() => handleFilterChange('viewType', 'activity')}
                      >
                        Activity Dashboard
                      </Button>
                      <Button
                        leftIcon={<Icon as={Network} />}
                        colorScheme={filters.viewType === 'network' ? 'blue' : 'gray'}
                        variant={filters.viewType === 'network' ? 'solid' : 'outline'}
                        onClick={() => handleFilterChange('viewType', 'network')}
                      >
                        Network Analysis
                      </Button>
                    </ButtonGroup>
                  </FormControl>

                  <FormControl minW="180px">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                      Time Range
                    </FormLabel>
                    <Select
                      size="sm"
                      value={filters.timeRange}
                      onChange={(e) => handleFilterChange('timeRange', e.target.value as TimeRange)}
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
                      <FormControl minW="150px">
                        <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                          From Date
                        </FormLabel>
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

                      <FormControl minW="150px">
                        <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                          To Date
                        </FormLabel>
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
                </Flex>

                <Divider />

                {/* Secondary Filters */}
                <Flex wrap="wrap" gap={6}>
                  <FormControl minW="180px">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                      Group
                    </FormLabel>
                    <Select
                      size="sm"
                      value={filters.selectedGroup}
                      onChange={(e) => handleFilterChange('selectedGroup', e.target.value)}
                    >
                      <option value="all">All Groups</option>
                      {community?.groups?.map((group: any) => (
                        <option key={group.id} value={group.id}>
                          {group.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl minW="180px">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                      View
                    </FormLabel>
                    <Select
                      size="sm"
                      value={filters.selectedView}
                      onChange={(e) => handleFilterChange('selectedView', e.target.value)}
                    >
                      <option value="all">All Views</option>
                      {community?.views?.map((view: any) => (
                        <option key={view.id} value={view.id}>
                          {view.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl minW="180px">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                      Author
                    </FormLabel>
                    <Select
                      size="sm"
                      value={filters.selectedAuthor}
                      onChange={(e) => handleFilterChange('selectedAuthor', e.target.value)}
                    >
                      <option value="all">All Authors</option>
                      {community?.authors?.map((author: any) => (
                        <option key={author.id} value={author.id}>
                          {author.firstName} {author.lastName}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl minW="200px">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor}>
                      Search
                    </FormLabel>
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
                </Flex>

                <Divider />

                {/* Privacy & Display Options */}
                <Flex wrap="wrap" gap={8}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor} mb={0}>
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
                    <FormControl display="flex" alignItems="center">
                      <FormLabel fontSize="sm" fontWeight="semibold" color={textColor} mb={0}>
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
                </Flex>
              </VStack>
            </CardBody>
          </Collapse>
        </Card>

        {/* Main Visualization */}
        <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
          <CardHeader pb={4}>
            <Flex justify="space-between" align="center">
              <HStack>
                <Icon as={getViewTypeIcon(filters.viewType)} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={textColor}>
                    {filters.viewType === 'activity' ? 'Activity Dashboard' : 'Network Analysis'}
                  </Heading>
                  <Text fontSize="sm" color={mutedColor}>
                    {getTimeRangeLabel(filters.timeRange)}
                    {filters.selectedGroup !== 'all' && ` • ${community?.groups?.find((g: any) => g.id === filters.selectedGroup)?.title}`}
                    {filters.selectedView !== 'all' && ` • ${community?.views?.find((v: any) => v.id === filters.selectedView)?.title}`}
                  </Text>
                </VStack>
              </HStack>

              <Badge
                colorScheme={filters.viewType === 'activity' ? 'blue' : 'purple'}
                variant="subtle"
                px={3}
                py={1}
              >
                {filters.viewType === 'activity' ? 'Interactive Charts' : 'Network Graph'}
              </Badge>
            </Flex>
          </CardHeader>

          <CardBody pt={0}>
            <Box
              minH="600px"
              bg={useColorModeValue('gray.50', 'gray.900')}
              borderRadius="md"
              p={1}
              position="relative"
            >
              {renderVisualization()}
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default UnifiedDashboard;