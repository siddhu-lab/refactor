import React from 'react';

// Create a default context with the structure expected by ActivityDashboard
const dashboardContext = React.createContext({
  community: {
    id: '',
    authors: [
      {
        id: 'author-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        pseudoName: 'JohnS',
        role: 'student'
      },
      {
        id: 'author-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        pseudoName: 'SarahJ',
        role: 'student'
      },
      {
        id: 'author-3',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike.wilson@example.com',
        pseudoName: 'MikeW',
        role: 'student'
      },
      {
        id: 'author-4',
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        pseudoName: 'AliceB',
        role: 'student'
      },
      {
        id: 'author-5',
        firstName: 'Bob',
        lastName: 'Davis',
        email: 'bob.davis@example.com',
        pseudoName: 'BobD',
        role: 'student'
      }
    ],
    author: { id: 'author-1' },
    groups: [
      {
        id: 'group-1',
        title: 'Science Group',
        members: ['author-1', 'author-2', 'author-5']
      },
      {
        id: 'group-2',
        title: 'Math Group',
        members: ['author-2', 'author-3', 'author-4']
      }
    ],
    views: [
      {
        id: 'view-1',
        title: 'Science Discussion'
      },
      {
        id: 'view-2',
        title: 'Math Problems'
      },
      {
        id: 'view-3',
        title: 'History Class'
      }
    ]
  },
  role: 'user',
  me: {
    firstName: 'John',
    lastName: 'Smith',
    pseudoName: 'JohnS'
  },
  baseURL: 'http://localhost:3000'
});

export default dashboardContext;