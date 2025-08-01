import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Heading,
  Text,
  Button,
  Select,
  Input,
  HStack,
  VStack,
  Flex,
  Badge,
  ButtonGroup,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { ActivityRecord } from './types';

interface StatisticsData {
  key: string;
  value: {
    read: number;
    modified: number;
    created: number;
    total: number;
  };
}

interface StatisticsTableProps {
  data: StatisticsData[];
  originalData: ActivityRecord[];
  members: [];
  labels: { [key: string]: string };
  hideManagers: boolean;
  hideNames: boolean;
  selectedView: string;
  currentAuthor: { _id: string; role: string; name: string };
  isManager: boolean;
  toggleManagers: () => void;
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({ 
  data, 
  originalData = [], 
  members, 
  labels, 
  hideManagers, 
  hideNames, 
  selectedView, 
  currentAuthor, 
  isManager, 
  toggleManagers 
}) => {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const managerNames = members
    .filter((author: any) => author.role === 'manager')
    .flatMap((author: any) => [
      `${author.firstName} ${author.lastName}`,
      author.pseudoName
    ])
    .filter(Boolean);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    let res = data;
    if (hideManagers) {
      res = res.filter(d => !managerNames.includes(d.key));
    }
    if (searchTerm) {
      res = res.filter(item => 
        labels[item.key]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return res;
  }, [data, searchTerm, labels, hideManagers, managerNames]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, entriesPerPage]);

  // Calculate totals and averages
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        read: acc.read + item.value.read,
        modified: acc.modified + item.value.modified,
        created: acc.created + item.value.created,
        total: acc.total + item.value.total,
      }),
      { read: 0, modified: 0, created: 0, total: 0 }
    );
  }, [filteredData]);

  const classAverages = useMemo(() => {
    const allUserStats: { [key: string]: { read: number; modified: number; created: number; total: number } } = {};
    
    originalData.forEach(record => {
      const userName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;

      if (hideManagers && managerNames.includes(userName)) return;
      
      if (!allUserStats[userName]) {
        allUserStats[userName] = { read: 0, modified: 0, created: 0, total: 0 };
      }
      
      allUserStats[userName][record.type as keyof typeof allUserStats[userName]] += 1;
      allUserStats[userName].total += 1;
    });

    const allUserTotals = Object.values(allUserStats).reduce(
      (acc, userStats) => ({
        read: acc.read + userStats.read,
        modified: acc.modified + userStats.modified,
        created: acc.created + userStats.created,
        total: acc.total + userStats.total,
      }),
      { read: 0, modified: 0, created: 0, total: 0 }
    );
    const userCount = Object.keys(allUserStats).length || 1;
    return {
      read: (allUserTotals.read / userCount).toFixed(2),
      modified: (allUserTotals.modified / userCount).toFixed(2),
      created: (allUserTotals.created / userCount).toFixed(2),
      total: (allUserTotals.total / userCount).toFixed(2),
    };
  }, [originalData, currentAuthor._id, hideNames, hideManagers, managerNames]);

  const viewAverages = useMemo(() => {
    if (!selectedView) return null;

    const viewData = originalData.filter(record => {
      const recordView = record.view === undefined ? "Deleted" : record.view;
      return recordView === selectedView;
    });

    if (viewData.length === 0) return null;

    const viewUserStats: { [key: string]: { read: number; modified: number; created: number; total: number } } = {};
    
    viewData.forEach(record => {
      const userName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;

      if (hideManagers && managerNames.includes(userName)) return;
      
      if (!viewUserStats[userName]) {
        viewUserStats[userName] = { read: 0, modified: 0, created: 0, total: 0 };
      }
      
      viewUserStats[userName][record.type as keyof typeof viewUserStats[userName]] += 1;
      viewUserStats[userName].total += 1;
    });

    const viewUserTotals = Object.values(viewUserStats).reduce(
      (acc, userStats) => ({
        read: acc.read + userStats.read,
        modified: acc.modified + userStats.modified,
        created: acc.created + userStats.created,
        total: acc.total + userStats.total,
      }),
      { read: 0, modified: 0, created: 0, total: 0 }
    );

    const viewUserCount = Object.keys(viewUserStats).length || 1;
    return {
      read: (viewUserTotals.read / viewUserCount).toFixed(2),
      modified: (viewUserTotals.modified / viewUserCount).toFixed(2),
      created: (viewUserTotals.created / viewUserCount).toFixed(2),
      total: (viewUserTotals.total / viewUserCount).toFixed(2),
    };
  }, [originalData, selectedView, currentAuthor._id, hideNames, hideManagers, managerNames]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, filteredData.length);

  // Export functions
  const exportToCSV = () => {
    const headers = ['User', 'Read', 'Modified', 'Created', 'Total'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${labels[item.key]}"`,
        item.value.read,
        item.value.modified,
        item.value.created,
        item.value.total
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_activity_statistics.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const headers = ['User', 'Read', 'Modified', 'Created', 'Total'];
    const csvContent = [
      headers.join('\t'),
      ...filteredData.map(item => [
        labels[item.key],
        item.value.read,
        item.value.modified,
        item.value.created,
        item.value.total
      ].join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_activity_statistics.xls');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const viewAveragesRow = viewAverages ? `
        <tr style="background-color: #e3f2fd;">
          <td style="font-weight: bold;">${selectedView} Average</td>
          <td>${viewAverages.read}</td>
          <td>${viewAverages.modified}</td>
          <td>${viewAverages.created}</td>
          <td>${viewAverages.total}</td>
        </tr>
      ` : '';

      printWindow.document.write(`
        <html>
          <head>
            <title>User Activity Statistics</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .totals { background-color: #f8f9fa; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>User Activity Statistics</h1>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Read</th>
                  <th>Modified</th>
                  <th>Created</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(item => `
                  <tr>
                    <td>${labels[item.key]}</td>
                    <td>${item.value.read}</td>
                    <td>${item.value.modified}</td>
                    <td>${item.value.created}</td>
                    <td>${item.value.total}</td>
                  </tr>
                `).join('')}
                <tr class="totals">
                  <td>Selected total</td>
                  <td>${totals.read}</td>
                  <td>${totals.modified}</td>
                  <td>${totals.created}</td>
                  <td>${totals.total}</td>
                </tr>
                ${viewAveragesRow}
                <tr class="totals">
                  <td>Class Average</td>
                  <td>${classAverages.read}</td>
                  <td>${classAverages.modified}</td>
                  <td>${classAverages.created}</td>
                  <td>${classAverages.total}</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
      <CardHeader>
        <VStack align="stretch" spacing={3}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={1}>
              <Heading size="md" color="gray.700">User Activity Statistics</Heading>
              {selectedView && (
                <Badge colorScheme="blue" variant="subtle">
                  View filter: {selectedView}
                </Badge>
              )}
            </VStack>
          </Flex>
          
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <HStack spacing={4} wrap="wrap">
              <HStack>
                <Text fontSize="sm" color="gray.600">Show</Text>
                <Select 
                  size="sm"
                  w="auto"
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
                <Text fontSize="sm" color="gray.600">entries</Text>
              </HStack>
              
              <InputGroup size="sm" maxW="200px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </InputGroup>
            </HStack>
            
            <HStack spacing={2} wrap="wrap">
              <Tooltip label={hideManagers ? 'Include managers in results' : 'Exclude managers from results'}>
                <IconButton
                  aria-label={hideManagers ? 'Include managers' : 'Exclude managers'}
                  icon={hideManagers ? <ViewIcon /> : <ViewOffIcon />}
                  size="sm"
                  colorScheme={isManager ? "orange" : "gray"}
                  variant="outline"
                  onClick={toggleManagers}
                  isDisabled={!isManager}
                />
              </Tooltip>
              
              <ButtonGroup size="sm" variant="outline">
                <Button leftIcon={<DownloadIcon />} onClick={exportToCSV}>CSV</Button>
                <Button leftIcon={<DownloadIcon />} onClick={exportToExcel}>Excel</Button>
                <Button leftIcon={<DownloadIcon />} onClick={exportToPDF}>PDF</Button>
              </ButtonGroup>
            </HStack>
          </Flex>
          
          <Text fontSize="sm" color="gray.500">
            Showing {startEntry} to {endEntry} of {filteredData.length} entries
          </Text>
        </VStack>
      </CardHeader>

      <CardBody pt={0}>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th>User</Th>
                <Th isNumeric>Read</Th>
                <Th isNumeric>Modified</Th>
                <Th isNumeric>Created</Th>
                <Th isNumeric>Total</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedData.map((item, index) => (
                <Tr key={item.key} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="medium">{labels[item.key]}</Td>
                  <Td isNumeric>
                    <Badge colorScheme="blue" variant="subtle">{item.value.read}</Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="orange" variant="subtle">{item.value.modified}</Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="green" variant="subtle">{item.value.created}</Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="purple" variant="subtle">{item.value.total}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
            <Tfoot bg={headerBg}>
              <Tr fontWeight="bold">
                <Th>Selected Total</Th>
                <Th isNumeric>{totals.read}</Th>
                <Th isNumeric>{totals.modified}</Th>
                <Th isNumeric>{totals.created}</Th>
                <Th isNumeric>{totals.total}</Th>
              </Tr>
              {viewAverages && (
                <Tr fontWeight="bold" bg="blue.50">
                  <Th>{selectedView} View Average</Th>
                  <Th isNumeric>{viewAverages.read}</Th>
                  <Th isNumeric>{viewAverages.modified}</Th>
                  <Th isNumeric>{viewAverages.created}</Th>
                  <Th isNumeric>{viewAverages.total}</Th>
                </Tr>
              )}
              <Tr fontWeight="bold">
                <Th>Class Average</Th>
                <Th isNumeric>{classAverages.read}</Th>
                <Th isNumeric>{classAverages.modified}</Th>
                <Th isNumeric>{classAverages.created}</Th>
                <Th isNumeric>{classAverages.total}</Th>
              </Tr>
            </Tfoot>
          </Table>
        </Box>

        {totalPages > 1 && (
          <Flex justify="center" mt={6}>
            <ButtonGroup size="sm" variant="outline">
              <Button 
                onClick={() => setCurrentPage(currentPage - 1)}
                isDisabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <Button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    colorScheme={currentPage === page ? "blue" : "gray"}
                    variant={currentPage === page ? "solid" : "outline"}
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button 
                onClick={() => setCurrentPage(currentPage + 1)}
                isDisabled={currentPage === totalPages}
              >
                Next
              </Button>
            </ButtonGroup>
          </Flex>
        )}
      </CardBody>
    </Card>
  );
};

export default StatisticsTable;