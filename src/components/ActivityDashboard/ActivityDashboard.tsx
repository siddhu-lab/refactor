@@ .. @@
 import React, { useContext, useEffect, useState } from 'react';
-import { useQuery } from '@apollo/client';
 import { initializeCharts } from './chartUtils.ts';
 import StatisticsTable from './StatisticsTable.tsx';
 import MainDataTable from './MainDataTable/MainDataTable.tsx';
@@ .. @@
 import * as dc from 'dc';
 import './ActivityDashboard.css';
 import './dc.css';
-import dashboardContext from "../../context/dashboard.js";
-import Dictionary from "../../Queries/Dictionary.js";
 import SocialNetworkSection from './SocialNetworkSection/SocialNetworkSection.tsx';

+// Dummy data for demonstration
+const dummyData = {
+  getSocialInteractions: [
+    {
+      id: '1',
+      type: 'read',
+      from: 'John Smith',
+      fromId: 'user1',
+      fromPseudo: 'JohnS',
+      to: 'Sarah Johnson',
+      toPseudo: 'SarahJ',
+      title: 'Understanding Climate Change',
+      when: '1704067200000', // Jan 1, 2024
+      view: 'Science Discussion',
+      ID: 'contrib1',
+      data: {
+        body: '<p>This is a comprehensive discussion about climate change and its impacts on our environment.</p>'
+      }
+    },
+    {
+      id: '2',
+      type: 'created',
+      from: 'Sarah Johnson',
+      fromId: 'user2',
+      fromPseudo: 'SarahJ',
+      to: 'Sarah Johnson',
+      toPseudo: 'SarahJ',
+      title: 'Renewable Energy Solutions',
+      when: '1704153600000', // Jan 2, 2024
+      view: 'Science Discussion',
+      ID: 'contrib2',
+      data: {
+        body: '<p>Exploring various renewable energy solutions including solar, wind, and hydroelectric power.</p>'
+      }
+    },
+    {
+      id: '3',
+      type: 'modified',
+      from: 'Mike Wilson',
+      fromId: 'user3',
+      fromPseudo: 'MikeW',
+      to: 'Mike Wilson',
+      toPseudo: 'MikeW',
+      title: 'Water Conservation Methods',
+      when: '1704240000000', // Jan 3, 2024
+      view: 'Environmental Studies',
+      ID: 'contrib3',
+      data: {
+        body: '<p>Updated information on effective water conservation methods for households and industries.</p>'
+      }
+    },
+    {
+      id: '4',
+      type: 'read',
+      from: 'Emily Davis',
+      fromId: 'user4',
+      fromPseudo: 'EmilyD',
+      to: 'John Smith',
+      toPseudo: 'JohnS',
+      title: 'Biodiversity and Ecosystems',
+      when: '1704326400000', // Jan 4, 2024
+      view: 'Biology Forum',
+      ID: 'contrib4',
+      data: {
+        body: '<p>An in-depth analysis of biodiversity loss and its impact on global ecosystems.</p>'
+      }
+    },
+    {
+      id: '5',
+      type: 'created',
+      from: 'Alex Brown',
+      fromId: 'user5',
+      fromPseudo: 'AlexB',
+      to: 'Alex Brown',
+      toPseudo: 'AlexB',
+      title: 'Sustainable Agriculture Practices',
+      when: '1704412800000', // Jan 5, 2024
+      view: 'Agriculture Hub',
+      ID: 'contrib5',
+      data: {
+        body: '<p>Discussing modern sustainable agriculture practices that can help reduce environmental impact.</p>'
+      }
+    }
+  ]
+};
+
+const dummyCommunity = {
+  id: 'community1',
+  title: 'Environmental Science Community',
+  author: { id: 'user1', name: 'John Smith' },
+  authors: [
+    { id: 'user1', firstName: 'John', lastName: 'Smith', pseudoName: 'JohnS', role: 'manager' },
+    { id: 'user2', firstName: 'Sarah', lastName: 'Johnson', pseudoName: 'SarahJ', role: 'student' },
+    { id: 'user3', firstName: 'Mike', lastName: 'Wilson', pseudoName: 'MikeW', role: 'student' },
+    { id: 'user4', firstName: 'Emily', lastName: 'Davis', pseudoName: 'EmilyD', role: 'student' },
+    { id: 'user5', firstName: 'Alex', lastName: 'Brown', pseudoName: 'AlexB', role: 'student' }
+  ]
+};
+
+const dummyMe = {
+  firstName: 'John',
+  lastName: 'Smith',
+  pseudoName: 'JohnS'
+};
+
 interface ActivityDashboardProps {}

 const ActivityDashboard: React.FC<ActivityDashboardProps> = () => {
-  const { community, role: loggedInPersonRole, me, baseURL } = useContext(dashboardContext);
-  const members = community.authors || [];
+  // Use dummy data instead of context
+  const community = dummyCommunity;
+  const loggedInPersonRole = 'manager';
+  const me = dummyMe;
+  const baseURL = 'https://example.com';
+  const members = community.authors || [];
+  
   const [hideNames, setHideNames] = useState(true);
@@ .. @@
   const [currentAuthor] = useState({ _id: community.author.id, role: loggedInPersonRole, name: me?.firstName+" "+me?.lastName, pseudoName: me?.pseudoName });
-  const { data, loading, error } = useQuery(Dictionary.getSocialInteractions, {
-  variables: { communityId: community.id }
-});
+  
+  // Use dummy data instead of GraphQL query
+  const data = dummyData;
+  const loading = false;
+  const error = null;
+  
 const [filteredData, setFilteredData] = useState<any[]>([]);