// Dummy context for backward compatibility
import React from 'react';

const dashboardContext = React.createContext({
  community: {
    id: 'community1',
    title: 'Environmental Science Community',
    author: { id: 'user1', name: 'John Smith' },
    authors: [
      { id: 'user1', firstName: 'John', lastName: 'Smith', pseudoName: 'JohnS', role: 'manager' },
      { id: 'user2', firstName: 'Sarah', lastName: 'Johnson', pseudoName: 'SarahJ', role: 'student' }
    ]
  },
  role: 'manager',
  me: {
    firstName: 'John',
    lastName: 'Smith',
    pseudoName: 'JohnS'
  },
  baseURL: 'https://example.com'
});

export default dashboardContext;