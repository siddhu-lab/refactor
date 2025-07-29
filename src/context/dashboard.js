import React from 'react';

// Create a default context with the structure expected by ActivityDashboard
const dashboardContext = React.createContext({
  community: {
    id: '',
    authors: [],
    author: { id: '' }
  },
  role: 'user',
  me: {
    firstName: '',
    lastName: '',
    pseudoName: ''
  },
  baseURL: ''
});

export default dashboardContext;