import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Flex, 
  Tab, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Tabs,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { Building2, Activity } from 'lucide-react';
import ActivityDashboard from './ActivityDashboard/ActivityDashboard.tsx';
import BuildonsPage from './AuthorNetwork/AuthorNetworkPage';

const TabbedDashboard = () => {
  const [tabIndex, setTabIndex] = useState(1); // Start with Activity Log (index 1)
  const [isScrolled, setIsScrolled] = useState(false);
  const tabHeaderRef = useRef<HTMLDivElement>(null);

  // Chakra UI color mode values
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tabColor = useColorModeValue('gray.600', 'gray.300');
  const activeTabColor = useColorModeValue('#1976d2', 'blue.300');
  const hoverBg = useColorModeValue('rgba(25, 118, 210, 0.04)', 'rgba(66, 153, 225, 0.12)');

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      const shouldBeScrolled = scrollTop > 50;
      setIsScrolled(shouldBeScrolled);
    };

    // Window scroll
    window.addEventListener('scroll', handleScroll);
    
    // Check for scrollable containers
    const containers = ['.content', '.activity-container', '.dashboard-root', '.activity-dashboard'];
    const cleanupFunctions: (() => void)[] = [];
    
    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        const containerScrollHandler = () => {
          const scrollTop = container.scrollTop;
          const shouldBeScrolled = scrollTop > 50;
          setIsScrolled(shouldBeScrolled);
        };
        container.addEventListener('scroll', containerScrollHandler);
        cleanupFunctions.push(() => container.removeEventListener('scroll', containerScrollHandler));
      }
    });

    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  return (
    <Box height="100vh" display="flex" flexDirection="column" bg="gray.50" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif">
      <Box
        ref={tabHeaderRef}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        boxShadow={isScrolled ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "0 2px 4px rgba(0, 0, 0, 0.05)"}
        flexShrink={0}
        zIndex={100}
        position="sticky"
        top={0}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        px={{ base: 4, md: 8 }}
      >
        <Tabs 
          index={tabIndex} 
          onChange={setTabIndex}
          variant="unstyled"
        >
          <TabList 
            borderBottom="1px solid" 
            borderColor={borderColor}
            mb={0}
            fontSize={isScrolled ? "xs" : "sm"}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <Tab
              minW={{ base: "80px", md: isScrolled ? "80px" : "120px" }}
              py={isScrolled ? { base: "6px", md: "6px" } : { base: "8px", md: "10px" }}
              px={isScrolled ? { base: "12px", md: "16px" } : { base: "16px", md: "24px" }}
              color={tabColor}
              borderBottom="2px solid transparent"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={{ base: "0.375rem", md: "0.5rem" }}
              textDecoration="none"
              cursor="pointer"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _selected={{
                color: activeTabColor,
                borderBottom: "2px solid",
                borderColor: activeTabColor,
                bg: "transparent"
              }}
              _hover={{
                color: activeTabColor,
                bg: hoverBg
              }}
            >
              <Icon 
                as={Building2} 
                boxSize={isScrolled ? { base: "14px", md: "16px" } : "18px"}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                flexShrink={0}
              />
              <Box 
                as="span"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                whiteSpace="nowrap"
                display={{ base: "none", md: "block" }}
              >
                Buildons
              </Box>
            </Tab>
            
            <Tab
              minW={{ base: "80px", md: isScrolled ? "80px" : "120px" }}
              py={isScrolled ? { base: "6px", md: "6px" } : { base: "8px", md: "10px" }}
              px={isScrolled ? { base: "12px", md: "16px" } : { base: "16px", md: "24px" }}
              color={tabColor}
              borderBottom="2px solid transparent"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={{ base: "0.375rem", md: "0.5rem" }}
              textDecoration="none"
              cursor="pointer"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _selected={{
                color: activeTabColor,
                borderBottom: "2px solid",
                borderColor: activeTabColor,
                bg: "transparent"
              }}
              _hover={{
                color: activeTabColor,
                bg: hoverBg
              }}
            >
              <Icon 
                as={Activity} 
                boxSize={isScrolled ? { base: "14px", md: "16px" } : "18px"}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                flexShrink={0}
              />
              <Box 
                as="span"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                whiteSpace="nowrap"
                display={{ base: "none", md: "block" }}
              >
                Activity Log
              </Box>
            </Tab>
          </TabList>
          
          <TabPanels 
            flex={1} 
            overflow="hidden" 
            display="flex" 
            flexDirection="column" 
            bg="white"
            height="calc(100vh - 60px)" // Adjust based on header height
          >
            <TabPanel p={0} height="100%" overflow="hidden">
              <BuildonsPage />
            </TabPanel>
            <TabPanel p={0} height="100%" overflow="hidden">
              <ActivityDashboard />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default TabbedDashboard;