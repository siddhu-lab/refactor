import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Flex,
  HStack,
  VStack,
  Heading,
  Badge,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Switch,
  Divider,
  Collapse,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  CalendarIcon,
  Filter,
  Activity,
  Network,
} from 'lucide-react';
import { FilterState } from '../hooks/useFilters';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  isOpen: boolean;
  onToggle: () => void;
  community: any;
  role: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  isOpen,
  onToggle,
  community,
  role,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
      <CardHeader pb={2}>
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon as={Filter} color="blue.500" />
            <Heading size="md" color={textColor}>
              Filters & Controls
            </Heading>
            {activeFilterCount > 0 && (
              <Badge colorScheme="blue" variant="subtle">
                {activeFilterCount} active
              </Badge>
            )}
          </HStack>
          
          <HStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={onResetFilters}
              color={mutedColor}
            >
              Reset All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggle}
              rightIcon={<Icon as={isOpen ? ChevronUpIcon : ChevronDownIcon} />}
            >
              {isOpen ? 'Hide' : 'Show'} Filters
            </Button>
          </HStack>
        </Flex>
      </CardHeader>

      <Collapse in={isOpen}>
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
                    onClick={() => onFilterChange('viewType', 'activity')}
                  >
                    Activity Dashboard
                  </Button>
                  <Button
                    leftIcon={<Icon as={Network} />}
                    colorScheme={filters.viewType === 'network' ? 'blue' : 'gray'}
                    variant={filters.viewType === 'network' ? 'solid' : 'outline'}
                    onClick={() => onFilterChange('viewType', 'network')}
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
                  onChange={(e) => onFilterChange('timeRange', e.target.value as any)}
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
                        onChange={(e) => onFilterChange('customDateFrom', e.target.value)}
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
                        onChange={(e) => onFilterChange('customDateTo', e.target.value)}
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
                  onChange={(e) => onFilterChange('selectedGroup', e.target.value)}
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
                  onChange={(e) => onFilterChange('selectedView', e.target.value)}
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
                  onChange={(e) => onFilterChange('selectedAuthor', e.target.value)}
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
                    onChange={(e) => onFilterChange('searchTerm', e.target.value)}
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
                  onChange={(e) => onFilterChange('hideNames', e.target.checked)}
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
                    onChange={(e) => onFilterChange('hideManagers', e.target.checked)}
                  />
                </FormControl>
              )}
            </Flex>
          </VStack>
        </CardBody>
      </Collapse>
    </Card>
  );
};