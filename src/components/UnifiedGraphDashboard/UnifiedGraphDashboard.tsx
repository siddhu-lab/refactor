import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
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
  RadioGroup,
  Radio,
  Stack,
  Flex,
  Tooltip,
  IconButton,
  useToast,
  Progress,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  useDisclosure,
  SliderMark
} from '@chakra-ui/react';
import { 
  InfoIcon, 
  SettingsIcon, 
  RepeatIcon, 
  ViewIcon, 
  ViewOffIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  CalendarIcon,
  DownloadIcon
} from '@chakra-ui/icons';
import { Network } from 'vis-network';
import dashboardContext from '../../context/dashboard.js';

// Types
interface UserActivity {
  reads: number;
  creates: number;
  modifies: number;
  buildons: number;
  activities: any[];
  buildsonConnections: Array<{
    target: string;
    strength: number;
    title: string;
    date: Date;
  }>;
  builtUponBy: Array<{
    source: string;
    strength: number;
    title: string;
    date: Date;
  }>;
}

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  borderWidth: number;
  interactions: number;
  isCurrentUser: boolean;
  font: { size: number; color: string };
  shadow: { enabled: boolean; color: string; size: number; x: number; y: number };
  userActivity?: UserActivity;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  width: number;
  color: string;
  arrows?: string;
  smooth: boolean | { type: string };
  interactions: any[];
  label?: string;
  font?: { size: number; color: string };
  title: string;
  shadow: { enabled: boolean; color: string; size: number; x: number; y: number };
}

interface NetworkStats {
  totalNodes: number;
  totalConnections: number;
  mostActiveUser: string;
  averageConnections: number;
  networkDensity: number;
}

type DataType = 'activity' | 'knowledge';
type GraphLayout = 'force' | 'hierarchical' | 'circular';
type DateRange = 'all' | 'week' | 'month' | '3months' | 'custom';

const UnifiedDashboard: React.FC = () => {
  const { community, role, me } = useContext(dashboardContext);
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<Network | null>(null);
  const toast = useToast();
  
  // Color theme with better contrast
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const mainBgColor = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // Enhanced state management
  const [rawData, setRawData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [networkReady, setNetworkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Core filters
  const [dataType, setDataType] = useState<DataType>('activity');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Display options
  const [hideNames, setHideNames] = useState(role !== 'manager');
  
  // Advanced graph settings
  const [graphLayout, setGraphLayout] = useState<GraphLayout>('force');
  const [nodeSize, setNodeSize] = useState(25);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [nodeSpacing, setNodeSpacing] = useState(200);
  const [showDirections, setShowDirections] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [clusterByType, setClusterByType] = useState(false);
  const [edgeSmoothing, setEdgeSmoothing] = useState(true);
  const [enablePhysics, setEnablePhysics] = useState(true);
  const [stabilizationIterations, setStabilizationIterations] = useState(200);
  
  // UI state
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<any>(null);
  const [hoveredEdgeInfo, setHoveredEdgeInfo] = useState<any>(null);
  const { isOpen: isSettingsOpen, onToggle: toggleSettings } = useDisclosure({ defaultIsOpen: true });
  const { isOpen: isFiltersOpen, onToggle: toggleFilters } = useDisclosure({ defaultIsOpen: true });

  const isManager = role === 'manager';
  const currentUserName = `${me?.firstName} ${me?.lastName}`;
  const currentUserId = community?.author?.id;

  // Enhanced dummy data with more realistic patterns
  const dummyData = useMemo(() => [
    // Activity data - more realistic interaction patterns
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
    // Additional activity data for richer patterns
    {
      id: '11', when: Date.now() - 86400000 * 2, type: 'read',
      from: 'John Smith', fromId: 'author-1', fromPseudo: 'JohnS',
      to: 'Mike Wilson', toPseudo: 'MikeW',
      title: 'History Essay Update', view: 'History Class',
      data: { body: '<p>Reading Mike\'s history essay.</p>' },
      ID: 'contrib-3'
    },
    {
      id: '12', when: Date.now() - 86400000 * 1, type: 'read',
      from: 'Sarah Johnson', fromId: 'author-2', fromPseudo: 'SarahJ',
      to: 'Alice Brown', toPseudo: 'AliceB',
      title: 'Science Research', view: 'Science Discussion',
      data: { body: '<p>Reading Alice\'s research.</p>' },
      ID: 'contrib-8'
    },
    // Knowledge building data with more complex relationships
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
    },
    // More buildson relationships for richer network
    {
      id: '13', when: Date.now() - 86400000 * 2, type: 'buildson',
      from: 'Mike Wilson', fromId: 'author-3', fromPseudo: 'MikeW',
      to: 'Alice Brown', toPseudo: 'AliceB',
      title: 'Historical Context for Science', view: 'Science Discussion',
      data: { body: '<p>Adding historical context to the climate discussion.</p>' },
      ID: 'contrib-9', strength: 2
    },
    {
      id: '14', when: Date.now() - 86400000 * 5, type: 'buildson',
      from: 'Carol White', fromId: 'author-6', fromPseudo: 'CarolW',
      to: 'Bob Davis', toPseudo: 'BobD',
      title: 'Mathematical Applications', view: 'Math Problems',
      data: { body: '<p>Applying mathematical concepts to real-world problems.</p>' },
      ID: 'contrib-10', strength: 1
    }
  ], []);

  // Initialize data with error handling
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const processedData = dummyData.map((d) => {
          const dCopy = { ...d };
          const date = new Date(parseInt(dCopy.when));
          dCopy.date = date;
          dCopy.value = 1;
          return dCopy;
        });
        
        setRawData(processedData);
        
        toast({
          title: "Data loaded successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        setError('Failed to load data. Please try again.');
        toast({
          title: "Error loading data",
          description: "Please refresh the page and try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [dummyData, toast]);

  // Enhanced filter application with search and date range
  const applyFilters = useCallback((data: any[]) => {
    let filtered = [...data];

    try {
      // Filter by data type first
      if (dataType === 'activity') {
        filtered = filtered.filter(d => ['read', 'created', 'modified'].includes(d.type));
      } else {
        filtered = filtered.filter(d => d.type === 'buildson');
      }

      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(d => 
          d.title?.toLowerCase().includes(searchLower) ||
          d.from?.toLowerCase().includes(searchLower) ||
          d.to?.toLowerCase().includes(searchLower) ||
          d.view?.toLowerCase().includes(searchLower)
        );
      }

      // View filter
      if (selectedView !== 'all') {
        filtered = filtered.filter(d => d.view === selectedView);
      }

      // Group filter
      if (selectedGroup !== 'all') {
        const group = community?.groups?.find(g => g.id === selectedGroup);
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
        let rangeMs: number;
        
        if (dateRange === 'custom' && customDateFrom && customDateTo) {
          const fromDate = new Date(customDateFrom).getTime();
          const toDate = new Date(customDateTo).getTime() + 86400000; // Include end date
          filtered = filtered.filter(d => {
            const itemTime = new Date(d.when).getTime();
            return itemTime >= fromDate && itemTime <= toDate;
          });
        } else {
          const ranges = {
            'week': 7 * 24 * 60 * 60 * 1000,
            'month': 30 * 24 * 60 * 60 * 1000,
            '3months': 90 * 24 * 60 * 60 * 1000
          };
          rangeMs = ranges[dateRange as keyof typeof ranges];
          if (rangeMs) {
            filtered = filtered.filter(d => (now - new Date(d.when).getTime()) <= rangeMs);
          }
        }
      }

      return filtered;
    } catch (err) {
      console.error('Error applying filters:', err);
      return data;
    }
  }, [dataType, searchTerm, selectedView, selectedGroup, selectedAuthor, dateRange, customDateFrom, customDateTo, community]);

  // Update filtered data when filters change
  useEffect(() => {
    const filtered = applyFilters(rawData);
    setFilteredData(filtered);
    setSelectedNodeInfo(null);
    setHoveredEdgeInfo(null);
  }, [rawData, applyFilters]);

  // Enhanced network data processing with better statistics
  const networkData = useMemo(() => {
    const nodes = new Map<string, NetworkNode>();
    const edges: NetworkEdge[] = [];
    const edgeMap = new Map<string, any>();
    
    // Build comprehensive user activity summary
    const userActivities = new Map<string, UserActivity>();
    
    filteredData.forEach((item: any) => {
      const fromName = hideNames && item.fromId !== currentUserId ? item.fromPseudo : item.from;
      const toName = item.to ? (hideNames && item.to !== currentUserName ? item.toPseudo : item.to) : fromName;
      
      // Initialize user activity tracking
      if (!userActivities.has(fromName)) {
        userActivities.set(fromName, {
          reads: 0, creates: 0, modifies: 0, buildons: 0,
          activities: [], buildsonConnections: [], builtUponBy: []
        });
      }
      
      const userActivity = userActivities.get(fromName)!;
      userActivity.activities.push(item);
      
      // Track activity types
      switch (item.type) {
        case 'read':
          userActivity.reads++;
          break;
        case 'created':
          userActivity.creates++;
          break;
        case 'modified':
          userActivity.modifies++;
          break;
        case 'buildson':
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
          userActivities.get(toName)!.builtUponBy.push({
            source: fromName,
            strength: item.strength || 1,
            title: item.title,
            date: item.date
          });
          break;
      }
      
      // Create or update nodes
      const isCurrentUser = item.fromId === currentUserId;
      
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
        const node = nodes.get(fromName)!;
        node.interactions += 1;
        // Dynamic node sizing based on activity
        node.size = Math.max(nodeSize, Math.min(nodeSize * 2.5, nodeSize + (node.interactions * 3)));
      }
      
      // Create target node if different and exists
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
      
      // Create edges with enhanced information
      if (fromName !== toName && item.to) {
        const edgeKey = `${fromName}-${toName}`;
        
        if (edgeMap.has(edgeKey)) {
          const existingEdge = edgeMap.get(edgeKey);
          existingEdge.weight += 1;
          existingEdge.width = Math.max(edgeWidth, Math.min(edgeWidth * 4, existingEdge.weight * edgeWidth));
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
            label: showEdgeLabels ? getEdgeLabel(item.type) : undefined,
            font: showEdgeLabels ? { size: 10, color: '#666666' } : undefined,
            title: getEdgeTitle(item, fromName, toName),
            shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 3, x: 1, y: 1 }
          };
          
          edgeMap.set(edgeKey, newEdge);
        }
      }
    });
    
    // Update edge titles for combined edges and convert to array
    edgeMap.forEach((edge) => {
      if (edge.interactions.length > 1) {
        if (dataType === 'activity') {
          const types = [...new Set(edge.interactions.map((i: any) => i.type))];
          edge.title = `${edge.from} → ${edge.to}\n${edge.interactions.length} interactions\nTypes: ${types.join(', ')}`;
          edge.label = showEdgeLabels ? `${edge.interactions.length}` : undefined;
        } else {
          const totalStrength = edge.interactions.reduce((sum: number, i: any) => sum + (i.strength || 1), 0);
          edge.title = `${edge.from} built on ${edge.to}'s work\n${edge.interactions.length} times\nTotal strength: ${totalStrength}`;
          edge.label = showEdgeLabels ? `${totalStrength}` : undefined;
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

    // Calculate enhanced statistics
    const nodeArray = Array.from(nodes.values());
    const totalConnections = edges.length;
    const totalNodes = nodeArray.length;
    const averageConnections = totalNodes > 0 ? totalConnections / totalNodes : 0;
    const maxPossibleConnections = totalNodes * (totalNodes - 1);
    const networkDensity = maxPossibleConnections > 0 ? (totalConnections / maxPossibleConnections) * 100 : 0;
    
    const mostActiveUser = nodeArray.length > 0 ? 
      nodeArray.reduce((prev, current) => 
        (prev.interactions > current.interactions) ? prev : current
      ).label : 'None';

    function getEdgeColor(type: string): string {
      if (dataType === 'activity') {
        switch (type) {
          case 'read': return '#38a169';
          case 'modified': return '#d69e2e';
          case 'created': return '#805ad5';
          default: return '#718096';
        }
      } else {
        return '#e53e3e';
      }
    }
    
    function getEdgeLabel(type: string): string {
      if (dataType === 'activity') {
        switch (type) {
          case 'read': return 'R';
          case 'modified': return 'M';
          case 'created': return 'C';
          default: return '?';
        }
      } else {
        return 'B';
      }
    }
    
    function getEdgeTitle(item: any, fromName: string, toName: string): string {
      if (item.type === 'buildson') {
        return `${fromName} built on ${toName}'s work${item.strength ? ` (strength: ${item.strength})` : ''}\nTitle: ${item.title}`;
      } else {
        return `${fromName} ${item.type} ${toName}'s content\nTitle: ${item.title}`;
      }
    }

    return {
      nodes: nodeArray,
      edges,
      stats: {
        totalNodes,
        totalConnections,
        mostActiveUser,
        averageConnections: Math.round(averageConnections * 10) / 10,
        networkDensity: Math.round(networkDensity * 10) / 10
      } as NetworkStats
    };
  }, [filteredData, hideNames, nodeSize, edgeWidth, showDirections, showNodeLabels, showEdgeLabels, edgeSmoothing, dataType, currentUserId, currentUserName]);

  // Enhanced network visualization with better error handling
  useEffect(() => {
    if (!networkRef.current || !networkData.nodes.length) {
      setNetworkReady(false);
      return;
    }

    try {
      // Destroy existing network
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      }

      const getLayoutOptions = () => {
        const basePhysics = {
          enabled: enablePhysics,
          stabilization: { 
            iterations: stabilizationIterations,
            updateInterval: 25
          }
        };

        switch (graphLayout) {
          case 'hierarchical':
            return {
              layout: {
                hierarchical: {
                  enabled: true,
                  direction: 'UD',
                  sortMethod: 'directed',
                  nodeSpacing: nodeSpacing,
                  levelSeparation: nodeSpacing * 1.5,
                  treeSpacing: nodeSpacing * 0.8
                }
              },
              physics: { ...basePhysics, enabled: false }
            };
          case 'circular':
            return {
              layout: { randomSeed: 42 },
              physics: {
                ...basePhysics,
                barnesHut: {
                  gravitationalConstant: -2000,
                  centralGravity: 0.1,
                  springLength: nodeSpacing,
                  springConstant: 0.04,
                  damping: 0.09,
                  avoidOverlap: 0.5
                }
              }
            };
          default: // force
            return {
              physics: {
                ...basePhysics,
                barnesHut: {
                  gravitationalConstant: -80000,
                  springConstant: 0.001,
                  springLength: nodeSpacing,
                  centralGravity: 0.3,
                  damping: 0.09,
                  avoidOverlap: 0.8
                },
                maxVelocity: 50,
                minVelocity: 0.1,
                solver: 'barnesHut',
                timestep: 0.35
              }
            };
        }
      };

      const options = {
        nodes: {
          shape: 'dot',
          scaling: { 
            min: 15, 
            max: 80,
            label: {
              enabled: showNodeLabels,
              min: 12,
              max: 18
            }
          },
          font: { 
            size: 12, 
            color: textColor,
            strokeWidth: 2,
            strokeColor: bgColor
          },
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            size: 5,
            x: 2,
            y: 2
          }
        },
        edges: {
          smooth: edgeSmoothing ? { 
            type: 'continuous',
            forceDirection: 'none',
            roundness: 0.5
          } : false,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.1)',
            size: 3,
            x: 1,
            y: 1
          },
          font: {
            size: 10,
            color: mutedTextColor,
            strokeWidth: 1,
            strokeColor: bgColor
          }
        },
        interaction: {
          tooltipDelay: 150,
          hideEdgesOnDrag: true,
          hover: true,
          selectConnectedEdges: true,
          hoverConnectedEdges: true,
          zoomView: true,
          dragView: true,
          dragNodes: true,
          multiselect: false,
          navigationButtons: false,
          keyboard: {
            enabled: true,
            speed: { x: 10, y: 10, zoom: 0.02 },
            bindToWindow: false
          }
        },
        ...getLayoutOptions()
      };

      const networkInstance = new Network(
        networkRef.current,
        { nodes: networkData.nodes, edges: networkData.edges },
        options
      );

      // Enhanced event handlers
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
                interactions: e.interactions,
                type: e.from === nodeId ? 'outgoing' : 'incoming'
              }))
            });
          }
        } else {
          setSelectedNodeInfo(null);
        }
      });

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

      networkInstance.on('stabilizationProgress', (params) => {
        const progress = Math.round((params.iterations / params.total) * 100);
        // Could show progress bar here
      });

      networkInstance.on('stabilizationIterationsDone', () => {
        setNetworkReady(true);
        toast({
          title: "Network visualization ready",
          status: "success",
          duration: 1500,
          isClosable: true,
        });
      });

      networkInstance.on('animationFinished', () => {
        setNetworkReady(true);
      });

      networkInstanceRef.current = networkInstance;

    } catch (err) {
      console.error('Error creating network:', err);
      setError('Failed to create network visualization');
      toast({
        title: "Visualization Error",
        description: "Failed to create network. Please try refreshing.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    return () => {
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      }
    };
  }, [networkData, graphLayout, nodeSpacing, edgeSmoothing, enablePhysics, stabilizationIterations, showNodeLabels, textColor, bgColor, mutedTextColor, toast]);

  // Enhanced reset function
  const resetAllFilters = useCallback(() => {
    setSelectedView('all');
    setSelectedGroup('all');
    setSelectedAuthor('all');
    setDateRange('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSearchTerm('');
    setSelectedNodeInfo(null);
    setHoveredEdgeInfo(null);
    
    toast({
      title: "Filters reset",
      status: "info",
      duration: 1500,
      isClosable: true,
    });
  }, [toast]);

  // Export functionality
  const exportData = useCallback(() => {
    try {
      const exportData = {
        metadata: {
          dataType,
          filters: {
            view: selectedView,
            group: selectedGroup,
            author: selectedAuthor,
            dateRange,
            searchTerm
          },
          exportDate: new Date().toISOString(),
          totalRecords: filteredData.length
        },
        networkStats: networkData.stats,
        nodes: networkData.nodes.map(node => ({
          id: node.id,
          label: node.label,
          interactions: node.interactions,
          isCurrentUser: node.isCurrentUser,
          userActivity: node.userActivity
        })),
        edges: networkData.edges.map(edge => ({
          from: edge.from,
          to: edge.to,
          weight: edge.weight,
          interactions: edge.interactions.length,
          type: edge.interactions[0]?.type
        })),
        rawData: filteredData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-forum-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [dataType, selectedView, selectedGroup, selectedAuthor, dateRange, searchTerm, filteredData, networkData, toast]);

  // Get dynamic legend based on data type
  const getLegendContent = useCallback(() => {
    if (dataType === 'activity') {
      return {
        title: "Activity Network",
        description: "Shows how users interact with content through reading, creating, and modifying",
        nodeInfo: "Node size = total activity count",
        edgeInfo: "Edge width = interaction frequency",
        hoverInfo: "Click nodes for details, hover edges for activity info",
        nodeColors: [
          { color: "red.500", label: "Current User" },
          { color: "blue.500", label: "Other Users" }
        ],
        edgeColors: [
          { color: "green.500", label: "Read Activity" },
          { color: "yellow.500", label: "Modify Activity" },
          { color: "purple.500", label: "Create Activity" }
        ]
      };
    } else {
      return {
        title: "Knowledge Building Network",
        description: "Shows how ideas build upon each other through buildson relationships",
        nodeInfo: "Node size = buildson activity count",
        edgeInfo: "Edge width = knowledge building strength",
        hoverInfo: "Click nodes for buildson details, hover edges for connection info",
        nodeColors: [
          { color: "red.500", label: "Current User" },
          { color: "blue.500", label: "Other Users" }
        ],
        edgeColors: [
          { color: "red.500", label: "Buildson Connection" }
        ]
      };
    }
  }, [dataType]);

  const legendContent = getLegendContent();

  // Loading state
  if (loading) {
    return (
      <Center h="100vh" bg={mainBgColor}>
        <VStack spacing={6}>
          <Spinner size="xl" color={accentColor} thickness="4px" />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="semibold" color={textColor}>
              Loading Knowledge Forum Dashboard
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              Preparing your data visualization...
            </Text>
          </VStack>
          <Progress size="sm" isIndeterminate colorScheme="blue" w="200px" />
        </VStack>
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Center h="100vh" bg={mainBgColor}>
        <VStack spacing={4}>
          <Alert status="error" borderRadius="md" maxW="400px">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} colorScheme="blue">
            Refresh Page
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box bg={mainBgColor} h="100vh" overflow="hidden">
      <Grid templateColumns="1fr 420px" h="100%">
        {/* Main Graph Area */}
        <GridItem bg={bgColor} position="relative" borderRight="1px" borderColor={borderColor}>
          {/* Enhanced Graph Header */}
          <Box p={4} borderBottom="1px" borderColor={borderColor} bg={bgColor} shadow="sm">
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Heading size="md" color={accentColor}>
                    {legendContent.title}
                  </Heading>
                  <Badge colorScheme={dataType === 'activity' ? 'blue' : 'purple'} variant="subtle">
                    {filteredData.length} records
                  </Badge>
                  {!networkReady && (
                    <Badge colorScheme="yellow" variant="subtle">
                      Rendering...
                    </Badge>
                  )}
                </HStack>
                
                <Text fontSize="sm" color={mutedTextColor} maxW="600px">
                  {legendContent.description}
                </Text>
                
                <HStack spacing={6} fontSize="sm" color={mutedTextColor}>
                  <HStack>
                    <Badge colorScheme="blue" variant="outline">{networkData.stats.totalNodes}</Badge>
                    <Text>Users</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="green" variant="outline">{networkData.stats.totalConnections}</Badge>
                    <Text>Connections</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="purple" variant="outline">{networkData.stats.averageConnections}</Badge>
                    <Text>Avg Connections</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="orange" variant="outline">{networkData.stats.networkDensity}%</Badge>
                    <Text>Density</Text>
                  </HStack>
                </HStack>
              </VStack>
              
              <HStack spacing={2}>
                <Tooltip label="Export network data">
                  <IconButton
                    aria-label="Export data"
                    icon={<DownloadIcon />}
                    size="sm"
                    variant="outline"
                    onClick={exportData}
                  />
                </Tooltip>
                <Tooltip label="Reset all filters">
                  <Button 
                    size="sm" 
                    onClick={resetAllFilters} 
                    colorScheme="red" 
                    variant="outline"
                    leftIcon={<RepeatIcon />}
                  >
                    Reset
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>
          </Box>

          {/* Graph Container */}
          <Box h="calc(100vh - 120px)" position="relative">
            {!networkReady && networkData.nodes.length > 0 && (
              <Center position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={10}>
                <VStack spacing={3}>
                  <Spinner size="lg" color={accentColor} />
                  <Text fontSize="sm" color={mutedTextColor}>Rendering network...</Text>
                </VStack>
              </Center>
            )}
            
            <Box 
              ref={networkRef} 
              w="100%" 
              h="100%" 
              opacity={networkReady ? 1 : 0.3}
              transition="opacity 0.3s ease"
            />
            
            {/* Enhanced Hover Edge Info Overlay */}
            {hoveredEdgeInfo && (
              <Box
                position="absolute"
                top={4}
                left={4}
                bg="blackAlpha.900"
                color="white"
                p={4}
                borderRadius="lg"
                fontSize="sm"
                maxW="350px"
                zIndex={1000}
                shadow="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
              >
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold" fontSize="md">
                    {hoveredEdgeInfo.from} → {hoveredEdgeInfo.to}
                  </Text>
                  <HStack>
                    <Badge colorScheme="blue" size="sm">
                      {hoveredEdgeInfo.interactions.length} interactions
                    </Badge>
                    <Badge colorScheme="green" size="sm">
                      Weight: {hoveredEdgeInfo.weight}
                    </Badge>
                  </HStack>
                  <Divider borderColor="whiteAlpha.300" />
                  <VStack align="start" spacing={1} maxH="120px" overflowY="auto" w="full">
                    {hoveredEdgeInfo.interactions.slice(0, 4).map((interaction: any, idx: number) => (
                      <Text key={idx} fontSize="xs" color="gray.300">
                        • {interaction.type}: {interaction.title}
                      </Text>
                    ))}
                    {hoveredEdgeInfo.interactions.length > 4 && (
                      <Text fontSize="xs" color="gray.400" fontStyle="italic">
                        ...and {hoveredEdgeInfo.interactions.length - 4} more
                      </Text>
                    )}
                  </VStack>
                </VStack>
              </Box>
            )}

            {/* Network Stats Overlay */}
            {networkReady && (
              <Box
                position="absolute"
                bottom={4}
                right={4}
                bg="whiteAlpha.900"
                backdropFilter="blur(10px)"
                p={3}
                borderRadius="md"
                fontSize="xs"
                color={textColor}
                shadow="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Most Active: {networkData.stats.mostActiveUser}</Text>
                  <Text>Network Density: {networkData.stats.networkDensity}%</Text>
                </VStack>
              </Box>
            )}
          </Box>
        </GridItem>

        {/* Enhanced Right Sidebar */}
        <GridItem bg={sidebarBg} overflowY="auto" shadow="lg">
          <VStack spacing={4} p={4} align="stretch">
            {/* Data Type Selection - Enhanced */}
            <Card shadow="sm" border="1px solid" borderColor={borderColor}>
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <Heading size="sm" color={textColor}>Data Type</Heading>
                  <Badge colorScheme={dataType === 'activity' ? 'blue' : 'purple'}>
                    {dataType === 'activity' ? 'Activity' : 'Knowledge'}
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <RadioGroup 
                  value={dataType} 
                  onChange={(value) => setDataType(value as DataType)}
                  colorScheme="blue"
                >
                  <Stack spacing={4}>
                    <Radio value="activity" size="md">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                          Activity Analysis
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor}>
                          Reading, creating, modifying content interactions
                        </Text>
                      </VStack>
                    </Radio>
                    <Radio value="knowledge" size="md">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                          Knowledge Building
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor}>
                          Ideas building upon each other through buildson links
                        </Text>
                      </VStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </CardBody>
            </Card>

            {/* Enhanced Filters */}
            <Card shadow="sm" border="1px solid" borderColor={borderColor}>
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <Heading size="sm" color={textColor}>Filters</Heading>
                  <HStack>
                    <Badge colorScheme="blue" variant="outline">
                      {[selectedView, selectedGroup, selectedAuthor, dateRange, searchTerm].filter(f => f !== 'all' && f !== '').length} active
                    </Badge>
                    <IconButton
                      aria-label="Toggle filters"
                      icon={isFiltersOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      size="xs"
                      variant="ghost"
                      onClick={toggleFilters}
                    />
                  </HStack>
                </HStack>
              </CardHeader>
              <Collapse in={isFiltersOpen}>
                <CardBody pt={0}>
                  <VStack spacing={4}>
                    {/* Search Filter */}
                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>Search</FormLabel>
                      <InputGroup size="sm">
                        <InputLeftElement>
                          <SearchIcon color={mutedTextColor} />
                        </InputLeftElement>
                        <Input
                          placeholder="Search titles, users, views..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          bg={bgColor}
                          borderColor={borderColor}
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                        />
                      </InputGroup>
                    </FormControl>

                    {/* Date Range Filter */}
                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>Time Range</FormLabel>
                      <Select 
                        size="sm" 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value as DateRange)}
                        bg={bgColor}
                        borderColor={borderColor}
                      >
                        <option value="all">All Time</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="custom">Custom Range</option>
                      </Select>
                    </FormControl>

                    {/* Custom Date Range */}
                    {dateRange === 'custom' && (
                      <VStack spacing={2} w="full">
                        <FormControl>
                          <FormLabel fontSize="xs" color={mutedTextColor}>From Date</FormLabel>
                          <InputGroup size="sm">
                            <InputLeftElement>
                              <CalendarIcon color={mutedTextColor} />
                            </InputLeftElement>
                            <Input
                              type="date"
                              value={customDateFrom}
                              onChange={(e) => setCustomDateFrom(e.target.value)}
                              bg={bgColor}
                              borderColor={borderColor}
                            />
                          </InputGroup>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" color={mutedTextColor}>To Date</FormLabel>
                          <InputGroup size="sm">
                            <InputLeftElement>
                              <CalendarIcon color={mutedTextColor} />
                            </InputLeftElement>
                            <Input
                              type="date"
                              value={customDateTo}
                              onChange={(e) => setCustomDateTo(e.target.value)}
                              bg={bgColor}
                              borderColor={borderColor}
                            />
                          </InputGroup>
                        </FormControl>
                      </VStack>
                    )}

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>View</FormLabel>
                      <Select 
                        size="sm" 
                        value={selectedView} 
                        onChange={(e) => setSelectedView(e.target.value)}
                        bg={bgColor}
                        borderColor={borderColor}
                      >
                        <option value="all">All Views</option>
                        <option value="Science Discussion">Science Discussion</option>
                        <option value="Math Problems">Math Problems</option>
                        <option value="History Class">History Class</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>Group</FormLabel>
                      <Select 
                        size="sm" 
                        value={selectedGroup} 
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        bg={bgColor}
                        borderColor={borderColor}
                      >
                        <option value="all">All Groups</option>
                        {community?.groups?.map((group: any) => (
                          <option key={group.id} value={group.id}>{group.title}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>Author</FormLabel>
                      <Select 
                        size="sm" 
                        value={selectedAuthor} 
                        onChange={(e) => setSelectedAuthor(e.target.value)}
                        bg={bgColor}
                        borderColor={borderColor}
                      >
                        <option value="all">All Authors</option>
                        {community?.authors?.map((author: any) => (
                          <option key={author.id} value={author.id}>
                            {hideNames ? author.pseudoName : `${author.firstName} ${author.lastName}`}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Collapse>
            </Card>

            {/* Enhanced Graph Settings */}
            <Card shadow="sm" border="1px solid" borderColor={borderColor}>
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={SettingsIcon} color={accentColor} />
                    <Heading size="sm" color={textColor}>Graph Settings</Heading>
                  </HStack>
                  <IconButton
                    aria-label="Toggle settings"
                    icon={isSettingsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={toggleSettings}
                  />
                </HStack>
              </CardHeader>
              <Collapse in={isSettingsOpen}>
                <CardBody pt={0}>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>Layout Algorithm</FormLabel>
                      <Select 
                        size="sm" 
                        value={graphLayout} 
                        onChange={(e) => setGraphLayout(e.target.value as GraphLayout)}
                        bg={bgColor}
                        borderColor={borderColor}
                      >
                        <option value="force">Force-Directed (Dynamic)</option>
                        <option value="hierarchical">Hierarchical (Structured)</option>
                        <option value="circular">Circular (Balanced)</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>
                        Node Size: {nodeSize}px
                      </FormLabel>
                      <Slider 
                        value={nodeSize} 
                        onChange={setNodeSize} 
                        min={15} 
                        max={50} 
                        step={5}
                        colorScheme="blue"
                      >
                        <SliderMark value={15} mt="2" ml="-2" fontSize="xs" color={mutedTextColor}>15</SliderMark>
                        <SliderMark value={50} mt="2" ml="-2" fontSize="xs" color={mutedTextColor}>50</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>
                        Connection Width: {edgeWidth}px
                      </FormLabel>
                      <Slider 
                        value={edgeWidth} 
                        onChange={setEdgeWidth} 
                        min={1} 
                        max={8}
                        colorScheme="blue"
                      >
                        <SliderMark value={1} mt="2" ml="-1" fontSize="xs" color={mutedTextColor}>1</SliderMark>
                        <SliderMark value={8} mt="2" ml="-1" fontSize="xs" color={mutedTextColor}>8</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>
                        Node Spacing: {nodeSpacing}px
                      </FormLabel>
                      <Slider 
                        value={nodeSpacing} 
                        onChange={setNodeSpacing} 
                        min={100} 
                        max={400} 
                        step={50}
                        colorScheme="blue"
                      >
                        <SliderMark value={100} mt="2" ml="-3" fontSize="xs" color={mutedTextColor}>100</SliderMark>
                        <SliderMark value={400} mt="2" ml="-3" fontSize="xs" color={mutedTextColor}>400</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" color={textColor}>
                        Stabilization Iterations: {stabilizationIterations}
                      </FormLabel>
                      <Slider 
                        value={stabilizationIterations} 
                        onChange={setStabilizationIterations} 
                        min={50} 
                        max={500} 
                        step={50}
                        colorScheme="blue"
                      >
                        <SliderMark value={50} mt="2" ml="-2" fontSize="xs" color={mutedTextColor}>50</SliderMark>
                        <SliderMark value={500} mt="2" ml="-3" fontSize="xs" color={mutedTextColor}>500</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>

                    <SimpleGrid columns={2} spacing={3} w="full">
                      <Tooltip label={!isManager ? "Only managers can show real names" : ""}>
                        <FormControl display="flex" alignItems="center" flexDirection="column">
                          <FormLabel mb="2" fontSize="xs" color={textColor} textAlign="center">
                            Show Names
                          </FormLabel>
                          <Switch 
                            size="sm"
                            colorScheme="blue"
                            isChecked={!hideNames} 
                            onChange={(e) => setHideNames(!e.target.checked)}
                            isDisabled={!isManager}
                          />
                        </FormControl>
                      </Tooltip>

                      <FormControl display="flex" alignItems="center" flexDirection="column">
                        <FormLabel mb="2" fontSize="xs" color={textColor} textAlign="center">
                          Directions
                        </FormLabel>
                        <Switch 
                          size="sm"
                          colorScheme="blue"
                          isChecked={showDirections} 
                          onChange={(e) => setShowDirections(e.target.checked)}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" flexDirection="column">
                        <FormLabel mb="2" fontSize="xs" color={textColor} textAlign="center">
                          Node Labels
                        </FormLabel>
                        <Switch 
                          size="sm"
                          colorScheme="blue"
                          isChecked={showNodeLabels} 
                          onChange={(e) => setShowNodeLabels(e.target.checked)}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" flexDirection="column">
                        <FormLabel mb="2" fontSize="xs" color={textColor} textAlign="center">
                          Edge Labels
                        </FormLabel>
                        <Switch 
                          size="sm"
                          colorScheme="blue"
                          isChecked={showEdgeLabels} 
                          onChange={(e) => setShowEdgeLabels(e.target.checked)}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" flexDirection="column">
                        <FormLabel mb="2" fontSize="xs" color={textColor} textAlign="center">
                          Smooth Edges
                        </FormLabel>
                        <Switch 
                          size="sm"
                          colorScheme="blue"
                          isChecked={edgeSmoothing} 
                          onChange={(e) => setEdgeSmoothing(e.target.checked)}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" flexDirection="column">
                        <FormLabel mb="2" fontSize="xs" color={textColor} textAlign="center">
                          Physics
                        </FormLabel>
                        <Switch 
                          size="sm"
                          colorScheme="blue"
                          isChecked={enablePhysics} 
                          onChange={(e) => setEnablePhysics(e.target.checked)}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Collapse>
            </Card>

            {/* Enhanced Selected Node Info */}
            {selectedNodeInfo && (
              <Card shadow="md" border="1px solid" borderColor={borderColor} bg={hoverBg}>
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={InfoIcon} color="green.500" />
                    <Heading size="sm" color={textColor}>Selected User</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="start" spacing={4}>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg" color={textColor}>
                          {selectedNodeInfo.label}
                        </Text>
                        <Badge colorScheme={selectedNodeInfo.isCurrentUser ? 'red' : 'blue'} variant="solid">
                          {selectedNodeInfo.isCurrentUser ? 'You' : 'Peer'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color={mutedTextColor}>
                        {selectedNodeInfo.interactions} total interactions
                      </Text>
                    </VStack>

                    <Divider borderColor={borderColor} />

                    {dataType === 'activity' && selectedNodeInfo.userActivity && (
                      <>
                        <VStack align="start" spacing={3} w="full">
                          <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                            Activity Breakdown
                          </Text>
                          <SimpleGrid columns={2} spacing={3} w="full" fontSize="sm">
                            <VStack>
                              <Text fontWeight="bold" color="green.500">
                                {selectedNodeInfo.userActivity.reads}
                              </Text>
                              <Text fontSize="xs" color={mutedTextColor}>Reads</Text>
                            </VStack>
                            <VStack>
                              <Text fontWeight="bold" color="purple.500">
                                {selectedNodeInfo.userActivity.creates}
                              </Text>
                              <Text fontSize="xs" color={mutedTextColor}>Creates</Text>
                            </VStack>
                            <VStack>
                              <Text fontWeight="bold" color="yellow.500">
                                {selectedNodeInfo.userActivity.modifies}
                              </Text>
                              <Text fontSize="xs" color={mutedTextColor}>Modifies</Text>
                            </VStack>
                            <VStack>
                              <Text fontWeight="bold" color="blue.500">
                                {selectedNodeInfo.connectedEdges}
                              </Text>
                              <Text fontSize="xs" color={mutedTextColor}>Connections</Text>
                            </VStack>
                          </SimpleGrid>
                        </VStack>
                        <Divider borderColor={borderColor} />
                      </>
                    )}

                    {dataType === 'knowledge' && selectedNodeInfo.userActivity && (
                      <>
                        <VStack align="start" spacing={3} w="full">
                          <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                            Knowledge Building Activity
                          </Text>
                          
                          <SimpleGrid columns={2} spacing={3} w="full">
                            <Stat size="sm">
                              <StatLabel fontSize="xs" color={mutedTextColor}>Notes Created</StatLabel>
                              <StatNumber fontSize="lg" color="purple.500">
                                {selectedNodeInfo.userActivity.creates || 0}
                              </StatNumber>
                            </Stat>
                            <Stat size="sm">
                              <StatLabel fontSize="xs" color={mutedTextColor}>Buildson Links</StatLabel>
                              <StatNumber fontSize="lg" color="red.500">
                                {selectedNodeInfo.userActivity.buildons || 0}
                              </StatNumber>
                            </Stat>
                          </SimpleGrid>
                          
                          {selectedNodeInfo.userActivity.buildsonConnections?.length > 0 && (
                            <>
                              <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                Built onto {selectedNodeInfo.userActivity.buildsonConnections.length} notes:
                              </Text>
                              <VStack align="start" spacing={1} maxH="100px" overflowY="auto" w="full">
                                {selectedNodeInfo.userActivity.buildsonConnections.map((conn: any, idx: number) => (
                                  <HStack key={idx} fontSize="xs" w="full">
                                    <Badge colorScheme="blue" size="sm">{conn.strength}</Badge>
                                    <Text color={mutedTextColor} noOfLines={1}>
                                      {conn.target}
                                    </Text>
                                  </HStack>
                                ))}
                              </VStack>
                            </>
                          )}

                          {selectedNodeInfo.userActivity.builtUponBy?.length > 0 && (
                            <>
                              <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                {selectedNodeInfo.userActivity.builtUponBy.length} notes built upon by:
                              </Text>
                              <VStack align="start" spacing={1} maxH="100px" overflowY="auto" w="full">
                                {selectedNodeInfo.userActivity.builtUponBy.map((conn: any, idx: number) => (
                                  <HStack key={idx} fontSize="xs" w="full">
                                    <Badge colorScheme="green" size="sm">{conn.strength}</Badge>
                                    <Text color={mutedTextColor} noOfLines={1}>
                                      {conn.source}
                                    </Text>
                                  </HStack>
                                ))}
                              </VStack>
                            </>
                          )}
                        </VStack>
                        <Divider borderColor={borderColor} />
                      </>
                    )}

                    {/* Connection Details */}
                    {selectedNodeInfo.connections?.length > 0 && (
                      <VStack align="start" spacing={2} w="full">
                        <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                          Top Connections
                        </Text>
                        <VStack align="start" spacing={1} maxH="120px" overflowY="auto" w="full">
                          {selectedNodeInfo.connections
                            .sort((a: any, b: any) => b.weight - a.weight)
                            .slice(0, 5)
                            .map((conn: any, idx: number) => (
                            <HStack key={idx} justify="space-between" w="full" fontSize="xs">
                              <Text color={textColor} noOfLines={1} flex="1">
                                {conn.target}
                              </Text>
                              <HStack>
                                <Badge 
                                  colorScheme={conn.type === 'outgoing' ? 'blue' : 'green'} 
                                  size="sm"
                                >
                                  {conn.weight}
                                </Badge>
                                <Text color={mutedTextColor} fontSize="xs">
                                  {conn.type === 'outgoing' ? '→' : '←'}
                                </Text>
                              </HStack>
                            </HStack>
                          ))}
                        </VStack>
                      </VStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Enhanced Legend */}
            <Card shadow="sm" border="1px solid" borderColor={borderColor}>
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>Legend & Guide</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={3} fontSize="xs">
                  <VStack align="start" spacing={1} w="full">
                    <Text fontWeight="bold" color={textColor}>{legendContent.nodeInfo}</Text>
                    <Text fontWeight="bold" color={textColor}>{legendContent.edgeInfo}</Text>
                    <Text fontWeight="bold" color={textColor}>{legendContent.hoverInfo}</Text>
                  </VStack>
                  
                  <Divider borderColor={borderColor} />
                  
                  <VStack align="start" spacing={2} w="full">
                    <Text fontWeight="bold" color={textColor}>Node Colors:</Text>
                    {legendContent.nodeColors.map((item, idx) => (
                      <HStack key={idx}>
                        <Box w={3} h={3} bg={item.color} borderRadius="full" />
                        <Text color={textColor}>{item.label}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  
                  <Divider borderColor={borderColor} />
                  
                  <VStack align="start" spacing={2} w="full">
                    <Text fontWeight="bold" color={textColor}>Edge Colors:</Text>
                    {legendContent.edgeColors.map((item, idx) => (
                      <HStack key={idx}>
                        <Box w={4} h={0.5} bg={item.color} borderRadius="sm" />
                        <Text color={textColor}>{item.label}</Text>
                      </HStack>
                    ))}
                  </VStack>

                  <Alert status="info" size="sm" mt={3} borderRadius="md">
                    <AlertIcon />
                    <AlertDescription fontSize="xs" color={textColor}>
                      <strong>Interaction Tips:</strong><br />
                      • Click nodes for detailed user information<br />
                      • Hover edges to see connection details<br />
                      • Larger nodes indicate more activity<br />
                      • Drag to pan, scroll to zoom
                    </AlertDescription>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default UnifiedDashboard;