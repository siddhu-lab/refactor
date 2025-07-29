import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import MainDashboard from './components/MainDashboard.tsx';

function App() {
  return (
    <ChakraProvider>
      <MainDashboard />
    </ChakraProvider>
  );
}

export default App;