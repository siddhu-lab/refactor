import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import UnifiedDashboard from './components/UnifiedDashboard/UnifiedDashboard.tsx';

function App() {
  return (
    <ChakraProvider>
      <UnifiedDashboard />
    </ChakraProvider>
  );
}

export default App;