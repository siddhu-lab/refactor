import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Collapse,
  HStack,
  Badge
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@chakra-ui/icons';

interface ViewsDropdownProps {
  views: Array<{ key: string; value: number }>;
  onViewSelect: (viewKey: string) => void;
  selectedView: string;
}

const ViewsDropdown: React.FC<ViewsDropdownProps> = ({ views, onViewSelect, selectedView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const filteredViews = views.filter(view =>
    view.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedViewData = views.find(view => view.key === selectedView);
  const displayText = selectedViewData ? selectedViewData.key : 'All Views';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewSelect = (viewKey: string) => {
    onViewSelect(viewKey);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <Box ref={dropdownRef} position="relative" w="full">
      <Button
        w="full"
        justifyContent="space-between"
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        bg={bgColor}
        borderColor={borderColor}
        _hover={{ bg: hoverBg }}
      >
        <HStack spacing={2} flex={1} justify="space-between">
          <Text fontSize="sm" isTruncated>
            {displayText}
          </Text>
          {selectedViewData && (
            <Badge colorScheme="blue" size="sm">
              {selectedViewData.value}
            </Badge>
          )}
        </HStack>
      </Button>
      
      <Collapse in={isOpen}>
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          shadow="lg"
          mt={1}
          maxH="300px"
          overflow="hidden"
        >
          <Box p={3} borderBottom="1px solid" borderColor={borderColor}>
            <InputGroup size="sm">
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search views..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </InputGroup>
          </Box>
          
          <VStack spacing={0} align="stretch" maxH="250px" overflowY="auto">
            <Button
              variant="ghost"
              justifyContent="flex-start"
              size="sm"
              onClick={() => handleViewSelect('')}
              bg={selectedView === '' ? 'blue.50' : 'transparent'}
              color={selectedView === '' ? 'blue.600' : 'gray.700'}
              _hover={{ bg: selectedView === '' ? 'blue.100' : hoverBg }}
              borderRadius={0}
            >
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="medium">All Views</Text>
                <Text fontSize="xs" color="gray.500">Show all records</Text>
              </VStack>
            </Button>
            
            {filteredViews.length > 0 ? (
              filteredViews.map((view) => (
                <Button
                  key={view.key}
                  variant="ghost"
                  justifyContent="flex-start"
                  size="sm"
                  onClick={() => handleViewSelect(view.key)}
                  bg={selectedView === view.key ? 'blue.50' : 'transparent'}
                  color={selectedView === view.key ? 'blue.600' : 'gray.700'}
                  _hover={{ bg: selectedView === view.key ? 'blue.100' : hoverBg }}
                  borderRadius={0}
                >
                  <HStack justify="space-between" w="full">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="medium" isTruncated>
                        {view.key}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {view.value} records
                      </Text>
                    </VStack>
                    <Badge colorScheme="blue" size="sm">
                      {view.value}
                    </Badge>
                  </HStack>
                </Button>
              ))
            ) : (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                  No views found
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ViewsDropdown;