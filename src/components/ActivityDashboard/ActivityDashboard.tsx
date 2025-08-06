import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Select,
  Badge,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, InfoIcon, DownloadIcon } from '@chakra-ui/icons';
import { initializeCharts } from './chartUtils.ts';
import StatisticsTable from './StatisticsTable.tsx';
import MainDataTable from './MainDataTable/MainDataTable.tsx';
import ViewsDropdown from './ViewsDropdown.tsx';
import * as dc from 'dc';
import SocialNetworkSection from './SocialNetworkSection/SocialNetworkSection.tsx';
import dashboardContext from '../../context/dashboard.js';

// Dummy data for social interactions
const dummySocialInteractions = [
  {
    id: '1',
    when: Date.now() - 86400000 * 5, // 5 days ago
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
    when: Date.now() - 86400000 * 3, // 3 days ago
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
    when: Date.now() - 86400000 * 2, // 2 days ago
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
    when: Date.now() - 86400000 * 1, // 1 day ago
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
    when: Date.now() - 86400000 * 4, // 4 days ago
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
  },
  {
    id: '6',
    when: Date.now() - 86400000 * 6, // 6 days ago
    type: 'modified',
    from: 'Carol White',
    fromId: 'author-6',
    fromPseudo: 'CarolW',
    to: 'Carol White',
    toPseudo: 'CarolW',
    title: 'Literature Analysis',
    view: 'English Class',
    data: { body: '<p>Analysis of Shakespeare\'s Hamlet themes and characters.</p>' },
    ID: 'contrib-5'
  }
];

interface ActivityDashboardProps {}

const ActivityDashboard: React.FC<ActivityDashboardProps> = () => {
  const { community, role: loggedInPersonRole, me, baseURL } = useContext(dashboardContext);
  const members = community.authors || [];
  const [hideNames, setHideNames] = useState(true);
  const [hideManagers, setHideManagers] = useState(false);
  const [dailyActivityVisible, setDailyActivityVisible] = useState(false);
  const [statisticsData, setStatisticsData] = useState<any[]>([]);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [viewsData, setViewsData] = useState<Array<{ key: string; value: number }>>([]);
  const [selectedView, setSelectedView] = useState('');
  const [viewDimension, setViewDimension] = useState<any>(null);
  const [rangeFilterActive, setRangeFilterActive] = useState(false);
  const [dateRange, setDateRange] = useState<string>('');
  const [currentAuthor] = useState({ _id: community.author.id, role: loggedInPersonRole, name: me?.firstName+" "+me?.lastName, pseudoName: me?.pseudoName });
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [crossfilterInstance, setCrossfilterInstance] = useState<any>(null);
  const toast = useToast();

  const isManager = loggedInPersonRole === 'manager';
  const chartsInitialized = useRef(false);

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Simulate data loading
  const data = { getSocialInteractions: dummySocialInteractions };
  const loading = false;
  const error = null;

  useEffect(() => {
    if (data && data.getSocialInteractions && data.getSocialInteractions.length > 0 && !chartsInitialized.current) {
      chartsInitialized.current = true;
      
      let parsed = data.getSocialInteractions.map((d) => {
        const dCopy = { ...d }; 
        const date = new Date(parseInt(dCopy.when));
        dCopy.date = date;
        dCopy.year = new Date(date.getFullYear(), 0, 1);
        dCopy.month = new Date(date.getFullYear(), date.getMonth(), 1);
        dCopy.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        dCopy.week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        dCopy.value = 1;
        dCopy.read = 0;
        dCopy.modify = 0;
        dCopy.buildson = 0;
        dCopy[dCopy.type] = 1;
        return dCopy;
      });

      setTimeout(() => {
        const { statsData, labelsData, viewsGroupData, viewDim, ndx} = initializeCharts(parsed, hideNames, currentAuthor);
        setStatisticsData(statsData);
        setLabels(labelsData);
        setViewDimension(viewDim);
        setViewsData(viewsGroupData || []);

        setCrossfilterInstance(ndx);
        const updateFilteredData = () => {
          if (ndx) {
            const allFiltered = ndx.allFiltered();
            setFilteredData(allFiltered);
            
            const authorDimension = ndx.dimension((d: any) => {
              return hideNames && d.fromId !== currentAuthor?._id ? d.fromPseudo : d.from;
            });
            
            const groupedDimension = authorDimension.group().reduce(
              (p: any, v: any) => {
                p[v.type] += 1;
                p.total += 1;
                return p;
              },
              (p: any, v: any) => {
                p[v.type] -= 1;
                p.total -= 1;
                return p;
              },
              () => ({ read: 0, modified: 0, created: 0, total: 0 })
            );
            
            const newStatsData = groupedDimension.all().filter((d: any) => d.value.total > 0);
            setStatisticsData(newStatsData);
          }
        };

        const lineChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#line-chart');
        const rangeChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#range-chart');
        const typeChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#type-chart');
        const authorChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#author-chart');
        
        if (lineChart && rangeChart) {
          const updateRangeDisplay = () => {
            const hasLineFilter = lineChart.hasFilter();
            const hasRangeFilter = rangeChart.hasFilter();
            const hasFilter = hasLineFilter || hasRangeFilter;
            
            setRangeFilterActive(hasFilter);
            
            if (hasFilter) {
              let filter = null;
              if (hasLineFilter) {
                filter = lineChart.filter();
              } else if (hasRangeFilter) {
                filter = rangeChart.filter();
              }
              
              if (filter && Array.isArray(filter) && filter.length === 2) {
                const startDate = new Date(filter[0]);
                const endDate = new Date(filter[1]);
                const formatDate = (date: Date) => {
                  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
                };
                setDateRange(`${formatDate(startDate)} → ${formatDate(endDate)}`);
              }
            } else {
              setDateRange('');
            }
            updateFilteredData();
          };

          lineChart.on('filtered', null);
          rangeChart.on('filtered', null);

          lineChart.on('filtered', updateRangeDisplay);
          rangeChart.on('filtered', updateRangeDisplay);
        }

        if (typeChart) {
          typeChart.on('filtered', () => {
            updateFilteredData();
          });
        }
        if (authorChart) {
          authorChart.on('filtered', () => {
            updateFilteredData();
          });
        }
        updateFilteredData();

      }, 100);
    }
  }, [data, hideNames, currentAuthor]);

  useEffect(() => {
    if (chartsInitialized.current && crossfilterInstance) {
      const parsed = data.getSocialInteractions.map((d) => {
        const dCopy = { ...d }; 
        const date = new Date(parseInt(dCopy.when));
        dCopy.date = date;
        dCopy.year = new Date(date.getFullYear(), 0, 1);
        dCopy.month = new Date(date.getFullYear(), date.getMonth(), 1);
        dCopy.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        dCopy.week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        dCopy.value = 1;
        dCopy.read = 0;
        dCopy.modify = 0;
        dCopy.buildson = 0;
        dCopy[dCopy.type] = 1;
        return dCopy;
      });

      setTimeout(() => {
        const { statsData, labelsData } = initializeCharts(parsed, hideNames, currentAuthor);
        setStatisticsData(statsData);
        setLabels(labelsData);
      }, 100);
    }
  }, [hideNames, crossfilterInstance, currentAuthor, data.getSocialInteractions]);

  const toggleNames = () => {
    if (isManager) {
      setHideNames(!hideNames);
      setSelectedView('');
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

  const toggleManagers = () => {
    if (isManager) {
      setHideManagers(!hideManagers);
    } 
  };

  const toggleDailyActivity = () => {
    setDailyActivityVisible(!dailyActivityVisible);
  };

  const resetFilters = () => {
    setFilteredData(data.getSocialInteractions);
    dc.filterAll();
    dc.renderAll();
    if (viewDimension) {
      viewDimension.filterAll();
      dc.redrawAll();
    }
    setSelectedView('');
    setRangeFilterActive(false);
    setDateRange('');
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const resetRangeFilter = () => {
    const lineChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#line-chart');
    const rangeChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#range-chart');
    if (lineChart) {
      lineChart.filterAll();
    }
    if (rangeChart) {
      rangeChart.filterAll();
    }
    dc.redrawAll();
    setRangeFilterActive(false);
    setDateRange('');
  };

  const handleViewSelect = (viewKey: string) => {
    setSelectedView(viewKey);
    if (viewDimension) {
      if (viewKey === '') {
        viewDimension.filterAll();
      } else {
        viewDimension.filter(viewKey);
      }
      dc.redrawAll();
      if (crossfilterInstance) {
        const allFiltered = crossfilterInstance.allFiltered();
        setFilteredData(allFiltered);
        
        const authorDimension = crossfilterInstance.dimension((d: any) => {
          return hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from;
        });
        
        const groupedDimension = authorDimension.group().reduce(
          (p: any, v: any) => {
            p[v.type] += 1;
            p.total += 1;
            return p;
          },
          (p: any, v: any) => {
            p[v.type] -= 1;
            p.total -= 1;
            return p;
          },
          () => ({ read: 0, modified: 0, created: 0, total: 0 })
        );
        
        const newStatsData = groupedDimension.all().filter((d: any) => d.value.total > 0);
        setStatisticsData(newStatsData);
      }
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">Loading activity data...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Error loading activity data. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color="gray.700">
                    Knowledge Forum Activity Dashboard
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    Real-time insights into community engagement and collaboration
                  </Text>
                </VStack>
                
                <HStack spacing={3} wrap="wrap">
                  <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="medium">Current User:</Text>
                      <Text fontSize="xs" fontWeight="bold">{currentAuthor.name}</Text>
                    </HStack>
                  </Badge>
                  
                  <Tooltip 
                    label={isManager ? `${hideNames ? 'Show' : 'Hide'} real names` : "Only managers can view other users' names"}
                    hasArrow
                  >
                    <Button
                      size="sm"
                      colorScheme={isManager ? "blue" : "gray"}
                      variant={isManager ? "solid" : "outline"}
                      onClick={toggleNames}
                      isDisabled={!isManager}
                      leftIcon={<InfoIcon />}
                    >
                      {hideNames ? 'Show' : 'Hide'} Names
                    </Button>
                  </Tooltip>
                </HStack>
              </Flex>
            </CardHeader>
          </Card>

          {/* Main Dashboard */}
          <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", lg: "200px 200px 1fr" }} gap={6} alignItems="start">
                <GridItem>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                        Activity Types
                      </Text>
                      <Box id="type-chart" minH="200px" />
                    </Box>
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                        Views Filter
                      </Text>
                      <ViewsDropdown 
                        views={viewsData}
                        onViewSelect={handleViewSelect}
                        selectedView={selectedView}
                      />
                    </Box>
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                        Authors Activity
                      </Text>
                      <Box id="author-chart" minH="250px" />
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>

          {/* Timeline Section */}
          <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Heading size="md" color="gray.700">Daily Activity Timeline</Heading>
                  {rangeFilterActive && (
                    <Badge colorScheme="orange" variant="subtle">
                      <HStack spacing={2}>
                        <Text fontSize="xs">Range: {dateRange}</Text>
                        <Button size="xs" variant="ghost" onClick={resetRangeFilter}>
                          ×
                        </Button>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                
                <IconButton
                  aria-label={dailyActivityVisible ? 'Hide timeline' : 'Show timeline'}
                  icon={dailyActivityVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={toggleDailyActivity}
                />
              </Flex>
            </CardHeader>
            
            <Collapse in={dailyActivityVisible}>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  <Box bg="gray.50" p={4} borderRadius="md">
                    <Box id="line-chart" minH="180px" />
                  </Box>
                  
                  <Box bg="gray.50" p={2} borderRadius="md">
                    <Box id="range-chart" minH="40px" />
                  </Box>
                  
                  <Text fontSize="xs" color="gray.500" textAlign="center" fontStyle="italic">
                    💡 Drag on the timeline to select a time range for detailed analysis
                  </Text>
                </VStack>
              </CardBody>
            </Collapse>
          </Card>

          {/* Data Count and Reset */}
          <Card bg="blue.50" borderColor="blue.200" shadow="sm">
            <CardBody>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <HStack spacing={4}>
                  <Text fontSize="sm" color="blue.700">
                    <Text as="span" fontWeight="bold" className="filter-count"></Text> selected out of{' '}
                    <Text as="span" fontWeight="bold" className="total-count"></Text> records
                  </Text>
                </HStack>
                
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  onClick={resetFilters}
                  leftIcon={<DownloadIcon />}
                >
                  Reset All Filters
                </Button>
              </Flex>
            </CardBody>
          </Card>

          {/* Social Network Analysis */}
          <SocialNetworkSection 
            data={filteredData} 
            hideNames={hideNames} 
            currentAuthor={currentAuthor} 
          />

          {/* Statistics Table */}
          <StatisticsTable
            data={statisticsData}
            originalData={data?.getSocialInteractions || []}
            members={members}
            labels={labels}
            hideManagers={hideManagers}
            hideNames={hideNames}
            selectedView={selectedView}
            currentAuthor={currentAuthor}
            isManager={isManager}
            toggleManagers={toggleManagers}
          />

          {/* Main Data Table */}
          <MainDataTable 
            data={filteredData} 
            labels={labels} 
            hideNames={hideNames} 
            currentAuthor={currentAuthor} 
            baseURL={baseURL}
          />
        </VStack>
      </Container>
    </Box>
  );
};

export default ActivityDashboard;