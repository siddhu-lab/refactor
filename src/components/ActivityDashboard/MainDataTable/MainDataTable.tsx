import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
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
  Link,
  Tooltip,
  Grid
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { ActivityRecord } from '../types.ts';
import Modal from './Modal.tsx';

interface MainDataTableProps {
  data: ActivityRecord[];
  labels: { [key: string]: string };
  hideNames: boolean;
  currentAuthor: { _id: string; role: string; name: string };
  baseURL: string;
}

const MainDataTable: React.FC<MainDataTableProps> = ({ data, labels, hideNames, currentAuthor, baseURL }) => {
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => {
      const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
      return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, hideNames, currentAuthor._id]);

  // Sort data by date (most recent first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData]);

  // Group data by year/month
  const groupedData = useMemo(() => {
    const groups: { [key: string]: ActivityRecord[] } = {};
    
    sortedData.forEach(item => {
      const format = (num: number) => num.toString().padStart(2, '0');
      const groupKey = `${item.date.getFullYear()}/${format(item.date.getMonth() + 1)}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  }, [sortedData]);

  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / entriesPerPage);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, entriesPerPage]);

  const displayData = useMemo(() => {
    const grouped: { [key: string]: ActivityRecord[] } = {};
    
    paginatedRecords.forEach(item => {
      const format = (num: number) => num.toString().padStart(2, '0');
      const groupKey = `${item.date.getFullYear()}/${format(item.date.getMonth() + 1)}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });

    const flattened: (ActivityRecord | { isGroupHeader: true; groupKey: string })[] = [];
    
    Object.entries(grouped).forEach(([groupKey, items]) => {
      flattened.push({ isGroupHeader: true, groupKey });
      flattened.push(...items);
    });
    
    return flattened;
  }, [paginatedRecords]);

  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalRecords);

  // Export functions
  const exportToCSV = () => {
    const headers = ['Date', 'Action', 'Title', 'User'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(item => {
        const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
        return [
          `"${item.date.toLocaleDateString()}"`,
          `"${item.type}"`,
          `"${item.title}"`,
          `"${displayName}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRecordClick = (record: ActivityRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const exportToExcel = () => {
    const headers = ['Date', 'Action', 'Title', 'User'];
    const csvContent = [
      headers.join('\t'),
      ...sortedData.map(item => {
        const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
        return [
          item.date.toLocaleDateString(),
          item.type,
          item.title,
          displayName
        ].join('\t');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_records.xls');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Activity Records</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .group-header { background-color: #e9ecef; font-weight: bold; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Activity Records</h1>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Title</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(groupedData).map(([groupKey, items]) => `
                  <tr class="group-header">
                    <td colspan="4">${groupKey}</td>
                  </tr>
                  ${items.map(item => {
                    const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
                    return `
                      <tr>
                        <td>${item.date.toLocaleDateString()}</td>
                        <td>${item.type}</td>
                        <td>${item.title}</td>
                        <td>${displayName}</td>
                      </tr>
                    `;
                  }).join('')}
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'read': return 'blue';
      case 'modified': return 'orange';
      case 'created': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
      <CardHeader>
        <VStack align="stretch" spacing={3}>
          <Heading size="md" color="gray.700">Activity Records</Heading>
          
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
              
              <InputGroup size="sm" maxW="250px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </InputGroup>
            </HStack>
            
            <ButtonGroup size="sm" variant="outline">
              <Button leftIcon={<DownloadIcon />} onClick={exportToCSV}>CSV</Button>
              <Button leftIcon={<DownloadIcon />} onClick={exportToExcel}>Excel</Button>
              <Button leftIcon={<DownloadIcon />} onClick={exportToPDF}>PDF</Button>
            </ButtonGroup>
          </Flex>
          
          <Text fontSize="sm" color="gray.500">
            Showing {startEntry} to {endEntry} of {totalRecords} entries
          </Text>
        </VStack>
      </CardHeader>

      <CardBody pt={0}>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th>Date</Th>
                <Th>Action</Th>
                <Th>Title</Th>
                <Th>User</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayData.map((item, index) => {
                if ('isGroupHeader' in item && item.isGroupHeader) {
                  return (
                    <Tr key={`group-${item.groupKey}`} bg="gray.100">
                      <Td colSpan={4} textAlign="center" fontWeight="bold" color="gray.700">
                        {item.groupKey}
                      </Td>
                    </Tr>
                  );
                } else {
                  const record = item as ActivityRecord;
                  const displayName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;
                  return (
                    <Tr key={`${record.id}-${index}`} _hover={{ bg: 'gray.50' }}>
                      <Td fontSize="sm">{record.date.toLocaleDateString()}</Td>
                      <Td>
                        <Badge 
                          colorScheme={getActionColor(record.type)} 
                          variant="subtle"
                          textTransform="capitalize"
                        >
                          {record.type}
                        </Badge>
                      </Td>
                      <Td>
                        <Tooltip label="Click to view details">
                          <Link
                            color="blue.500"
                            fontWeight="medium"
                            _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                            onClick={() => handleRecordClick(record)}
                            cursor="pointer"
                          >
                            {record.title}
                          </Link>
                        </Tooltip>
                      </Td>
                      <Td fontSize="sm" fontWeight="medium">{displayName}</Td>
                    </Tr>
                  );
                }
              })}
            </Tbody>
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
              
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                let page;
                if (totalPages <= 10) {
                  page = i + 1;
                } else if (currentPage <= 5) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 4) {
                  page = totalPages - 9 + i;
                } else {
                  page = currentPage - 4 + i;
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRecord?.title || 'Record Details'}
      >
        {selectedRecord && (
          <VStack spacing={4} align="stretch">
            <Card variant="outline">
              <CardBody>
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="gray.600">Date</Text>
                    <Text fontWeight="medium">{selectedRecord.date.toLocaleDateString()}</Text>
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="gray.600">Action</Text>
                    <Badge 
                      colorScheme={getActionColor(selectedRecord.type)} 
                      variant="subtle"
                      textTransform="capitalize"
                    >
                      {selectedRecord.type}
                    </Badge>
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="gray.600">Author</Text>
                    <Text fontWeight="medium">
                      {hideNames && selectedRecord.fromId !== currentAuthor._id ? selectedRecord.fromPseudo : selectedRecord.from}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="gray.600">View</Text>
                    <Text fontWeight="medium">{selectedRecord.view}</Text>
                  </VStack>
                </Grid>
              </CardBody>
            </Card>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>Content</Text>
              <Box 
                p={4} 
                bg="gray.50" 
                borderRadius="md" 
                border="1px solid" 
                borderColor="gray.200"
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
              size="sm"
            >
              View Original
            </Button>
          </VStack>
        )}
      </Modal>
    </Card>
  );
};

export default MainDataTable;