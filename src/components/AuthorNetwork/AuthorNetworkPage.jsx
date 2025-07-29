@@ .. @@
 import React, { useState, useEffect, useRef } from 'react';
 import * as d3 from 'd3';
 import './AuthorNetwork.css';
-import { useContext } from "react";
-import dashboardContext from "../../context/dashboard.js";
-import { useLazyQuery, useQuery } from '@apollo/client';
-import Dictionary from "../../Queries/Dictionary.js";
 import { DatePicker } from 'antd';
 import dayjs from 'dayjs';
 import 'antd/dist/reset.css';
 import { exportCSV } from './ExportCSV.jsx';

+// Dummy data for demonstration
+const dummyCommunity = {
+  id: 'community1',
+  groups: [
+    { id: 'group1', title: 'Science Group', members: ['user1', 'user2', 'user3'] },
+    { id: 'group2', title: 'Research Group', members: ['user2', 'user4', 'user5'] }
+  ],
+  views: [
+    { id: 'view1', title: 'Science Discussion' },
+    { id: 'view2', title: 'Environmental Studies' },
+    { id: 'view3', title: 'Biology Forum' },
+    { id: 'view4', title: 'Agriculture Hub' }
+  ],
+  authors: [
+    { id: 'user1', firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', pseudoName: 'JohnS' },
+    { id: 'user2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@example.com', pseudoName: 'SarahJ' },
+    { id: 'user3', firstName: 'Mike', lastName: 'Wilson', email: 'mike.wilson@example.com', pseudoName: 'MikeW' },
+    { id: 'user4', firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@example.com', pseudoName: 'EmilyD' },
+    { id: 'user5', firstName: 'Alex', lastName: 'Brown', email: 'alex.brown@example.com', pseudoName: 'AlexB' }
+  ]
+};

+const dummyLinksData = {
+  buildsonLinks: [
+    {
+      id: 'link1',
+      from: 'contrib1',
+      to: 'contrib2',
+      type: 'buildson',
+      created: '1704067200000',
+      _from: { authors: ['user1'] },
+      _to: { authors: ['user2'] }
+    },
+    {
+      id: 'link2',
+      from: 'contrib2',
+      to: 'contrib3',
+      type: 'buildson',
+      created: '1704153600000',
+      _from: { authors: ['user2'] },
+      _to: { authors: ['user3'] }
+    },
+    {
+      id: 'link3',
+      from: 'contrib3',
+      to: 'contrib4',
+      type: 'buildson',
+      created: '1704240000000',
+      _from: { authors: ['user3'] },
+      _to: { authors: ['user4'] }
+    }
+  ]
+};

+const dummyContribData = {
+  searchContributions: [
+    {
+      id: 'contrib1',
+      title: 'Understanding Climate Change',
+      created: '1704067200000',
+      type: 'note',
+      authors: ['user1'],
+      data: { body: 'This is a comprehensive discussion about climate change.' }
+    },
+    {
+      id: 'contrib2',
+      title: 'Renewable Energy Solutions',
+      created: '1704153600000',
+      type: 'note',
+      authors: ['user2'],
+      data: { body: 'Exploring various renewable energy solutions.' }
+    },
+    {
+      id: 'contrib3',
+      title: 'Water Conservation Methods',
+      created: '1704240000000',
+      type: 'note',
+      authors: ['user3'],
+      data: { body: 'Updated information on effective water conservation methods.' }
+    },
+    {
+      id: 'contrib4',
+      title: 'Biodiversity and Ecosystems',
+      created: '1704326400000',
+      type: 'note',
+      authors: ['user4'],
+      data: { body: 'An in-depth analysis of biodiversity loss.' }
+    },
+    {
+      id: 'contrib5',
+      title: 'Sustainable Agriculture Practices',
+      created: '1704412800000',
+      type: 'note',
+      authors: ['user5'],
+      data: { body: 'Discussing modern sustainable agriculture practices.' }
+    }
+  ]
+};

 const AuthorNetwork = () => {
-  const { community } = useContext(dashboardContext);
+  // Use dummy data instead of context
+  const community = dummyCommunity;
   const groups = community.groups || [];
@@ .. @@
   const allAuthors = community.authors || [];
   const { RangePicker } = DatePicker;
-  const [getLinksFromId] = useLazyQuery(Dictionary.getLinksFromId);
-  const [getKObjectById] = useLazyQuery(Dictionary.getKObjectById);
-  const { data: linksData, loading: linksLoading } = useQuery(Dictionary.buildsonLinks, {
-    variables: { communityId: community.id },
-  });
   
-  const { data: contribData, loading: contribLoading } = useQuery(Dictionary.searchContributions, {
-    variables: {
-      query: {
-        communityId: community.id,
-        status: "active",
-        pagesize: 10000,
-      },
-    },
-  });
+  // Mock functions for lazy queries
+  const getLinksFromId = async ({ variables }) => {
+    // Return filtered links based on viewId
+    return { data: { getLinksFromId: dummyLinksData.buildsonLinks } };
+  };
+  
+  const getKObjectById = async ({ variables }) => {
+    // Return a contribution by ID
+    const contrib = dummyContribData.searchContributions.find(c => c.id === variables.id);
+    return { data: { getKObjectById: contrib } };
+  };
+  
+  // Use dummy data instead of GraphQL queries
+  const linksData = dummyLinksData;
+  const contribData = dummyContribData;
+  const linksLoading = false;
+  const contribLoading = false;
   
   const [selectedGroup, setSelectedGroup] = useState('allGroups');
@@ .. @@
   const [snitaip, setSnitaip] = useState({});
   var sm;

   useEffect(() => {
-    if (linksData && contribData) {
-      setLinks(linksData.buildsonLinks || []);
-      setContributions(contribData.searchContributions || []);
-      refreshView(linksData.buildsonLinks, contribData.searchContributions);
-    }
-  }, [linksData, contribData]);
+    // Use dummy data
+    setLinks(dummyLinksData.buildsonLinks || []);
+    setContributions(dummyContribData.searchContributions || []);
+    refreshView(dummyLinksData.buildsonLinks, dummyContribData.searchContributions);
+  }, []);
   
   

@@ .. @@
   const handleViewChange = async(e) => {
       const viewId = e.target.value;
@@ .. @@
       }
     
       try {
-        const { data } = await getLinksFromId({ variables: { fromId: viewId } }); 
-        const linksData = data?.getLinksFromId || [];
+        const result = await getLinksFromId({ variables: { fromId: viewId } }); 
+        const linksData = result.data?.getLinksFromId || [];
     
@@ .. @@
   };

   const getLinksData = async() => {
-    const { data } = await getLinksFromId({ variables: { fromId: selectedView } }); 
-        const linksData = data?.getLinksFromId || [];
+    const result = await getLinksFromId({ variables: { fromId: selectedView } }); 
+        const linksData = result.data?.getLinksFromId || [];
         var authors = {};
@@ .. @@
   const fetchNoteByIdFromAPI = async (noteId) => {
     try {
-      const { data } = await getKObjectById({ variables: { id: noteId } });
-      return data?.getKObjectById || null;
+      const result = await getKObjectById({ variables: { id: noteId } });
+      return result.data?.getKObjectById || null;
     } catch (err) {