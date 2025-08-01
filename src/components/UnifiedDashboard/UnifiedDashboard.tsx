import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { Network } from 'vis-network';
import * as d3 from 'd3';
import { Building2, Activity, Eye, EyeOff } from 'lucide-react';
import StatisticsTable from '../ActivityDashboard/StatisticsTable.tsx';
import MainDataTable from '../ActivityDashboard/MainDataTable/MainDataTable.tsx';
import ViewsDropdown from '../ActivityDashboard/ViewsDropdown.tsx';
import dashboardContext from '../../context/dashboard.js';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import { exportCSV } from '../AuthorNetwork/ExportCSV.jsx';
import './UnifiedDashboard.css';

// Dummy data
const dummyBuildsonLinks = [
  {
    id: 'link-1',
    from: 'contrib-1',
    to: 'contrib-2',
    type: 'buildson',
    created: Date.now() - 86400000 * 3,
    _from: { authors: ['author-1'] },
    _to: { authors: ['author-2'] }
  },
  {
    id: 'link-2',
    from: 'contrib-2',
    to: 'contrib-3',
    type: 'buildson',
    created: Date.now() - 86400000 * 2,
    _from: { authors: ['author-2'] },
    _to: { authors: ['author-3'] }
  }
];

const dummyContributions = [
  {
    id: 'contrib-1',
    _id: 'contrib-1',
    title: 'Climate Change Discussion',
    created: Date.now() - 86400000 * 5,
    authors: ['author-1'],
    type: 'note',
    data: { body: 'This is a discussion about climate change and its impacts.' }
  },
  {
    id: 'contrib-2',
    _id: 'contrib-2',
    title: 'Mathematical Proof Analysis',
    created: Date.now() - 86400000 * 3,
    authors: ['author-2'],
    type: 'note',
    data: { body: 'Here is my analysis of the mathematical proof presented in class.' }
  },
  {
    id: 'contrib-3',
    _id: 'contrib-3',
    title: 'Literature Review Update',
    created: Date.now() - 86400000 * 2,
    authors: ['author-3'],
    type: 'note',
    data: { body: 'Updated the literature review with new sources and analysis.' }
  }
];

const dummySocialInteractions = [
  {
    id: '1',
    when: Date.now() - 86400000 * 5,
    type: 'read',
    from: 'John Smith',
    fromId: 'author-1',
    fromPseudo: 'JohnS',
    to: 'Sarah Johnson',
    toPseudo: 'SarahJ',
    title: 'Climate Change Discussion',
    view: 'Science Discussion',
    data: { body: '<p>This is a discussion about climate change and its impacts.</p>' },
    ID: 'contrib-1'
  },
  {
    id: '2',
    when: Date.now() - 86400000 * 3,
    type: 'created',
    from: 'Sarah Johnson',
    fromId: 'author-2',
    fromPseudo: 'SarahJ',
    to: 'Sarah Johnson',
    toPseudo: 'SarahJ',
    title: 'Mathematical Proof Analysis',
    view: 'Math Problems',
    data: { body: '<p>Here is my analysis of the mathematical proof presented in class.</p>' },
    ID: 'contrib-2'
  },
  {
    id: '3',
    when: Date.now() - 86400000 * 2,
    type: 'modified',
    from: 'Mike Wilson',
    fromId: 'author-3',
    fromPseudo: 'MikeW',
    to: 'Mike Wilson',
    toPseudo: 'MikeW',
    title: 'History Essay Update',
    view: 'History Class',
    data: { body: '<p>Updated my essay on World War II with additional sources.</p>' },
    ID: 'contrib-3'
  }
];

const UnifiedDashboard: React.FC = () => {
  const { community, role: loggedInPersonRole, me, baseURL } = useContext(dashboardContext);
  const groups = community.groups || [];
  const allViews = community.views || [];
  const views = allViews.filter(view => view.title?.toLowerCase() !== 'riseabove:' && view.title?.toLowerCase() !== 'riseabove');
  const allAuthors = community.authors || [];
  const { RangePicker } = DatePicker;

  // Mode state
  const [mode, setMode] = useState<'buildson' | 'activity'>('buildson');
  
  // Common states
  const [selectedGroup, setSelectedGroup] = useState('allGroups');
  const [selectedView, setSelectedView] = useState('');
  const [selectedMember, setSelectedMember] = useState('allAuthors');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearchText, setMemberSearchText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hideNames, setHideNames] = useState(true);
  const [hideManagers, setHideManagers] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [networkInfo, setNetworkInfo] = useState('');

  // Activity mode specific states
  const [showStatisticsTable, setShowStatisticsTable] = useState(false);
  const [showMainDataTable, setShowMainDataTable] = useState(false);
  const [statisticsData, setStatisticsData] = useState<any[]>([]);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [viewsData, setViewsData] = useState<Array<{ key: string; value: number }>>([]);
  const [filteredActivityData, setFilteredActivityData] = useState<any[]>([]);

  // Buildson mode specific states
  const [exportOpts, setExportOpts] = useState({
    pseudonames: false,
    singleContribs: true
  });
  const [links, setLinks] = useState(dummyBuildsonLinks);
  const [contributions, setContributions] = useState(dummyContributions);
  const [boaip, setBoaip] = useState([]);
  const [bonip, setBonip] = useState([]);
  const [snitaip, setSnitaip] = useState({});

  // Network refs
  const networkRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [network, setNetwork] = useState<Network | null>(null);

  const currentAuthor = { _id: community.author.id, role: loggedInPersonRole, name: me?.firstName+" "+me?.lastName, pseudoName: me?.pseudoName };
  const isManager = loggedInPersonRole === 'manager';

  // Process activity data
  const processedActivityData = useMemo(() => {
    let parsed = dummySocialInteractions.map((d) => {
      const dCopy = { ...d }; 
      const date = new Date(parseInt(dCopy.when));
      dCopy.date = date;
      dCopy.year = new Date(date.getFullYear(), 0, 1);
      dCopy.month = new Date(date.getFullYear(), date.getMonth(), 1);
      dCopy.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dCopy.week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      dCopy.value = 1;
      dCopy.read = 0;
      dCopy.modify = 0;
      dCopy.buildson = 0;
      dCopy[dCopy.type] = 1;
      return dCopy;
    });

    // Apply filters
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      parsed = parsed.filter(item => item.date >= from && item.date <= to);
    }

    if (selectedView) {
      parsed = parsed.filter(item => item.view === selectedView);
    }

    return parsed;
  }, [fromDate, toDate, selectedView]);

  // Generate network data based on mode
  const networkData = useMemo(() => {
    if (mode === 'buildson') {
      return generateBuildsonNetworkData();
    } else {
      return generateActivityNetworkData();
    }
  }, [mode, processedActivityData, hideNames, currentAuthor, selectedGroup, selectedMember]);

  const generateBuildsonNetworkData = () => {
    const authors = {};
    const buildsonkey = {};
    const buildson = [];

    // Filter data based on date range
    let filteredContributions = contributions;
    let filteredLinks = links;

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      filteredContributions = contributions.filter(contrib => {
        const created = new Date(Number(contrib.created));
        return created >= from && created <= to;
      });

      filteredLinks = links.filter(link => {
        const created = new Date(Number(link.created));
        return created >= from && created <= to;
      });
    }

    // Process contributions
    filteredContributions.forEach(note => {
      note.authors.forEach(author => {
        if (authors[author]) {
          authors[author].size++;
        } else {
          const member = allAuthors.find(m => m.id === author);
          if (member) {
            authors[author] = {
              name: member.firstName + " " + member.lastName,
              pseudoName: member.pseudoName,
              size: 1
            };
          }
        }
      });
    });

    // Process links
    filteredLinks.forEach(link => {
      if (link.type === "buildson") {
        link._from.authors.forEach(source => {
          link._to.authors.forEach(target => {
            const key = source + target;
            if (buildsonkey[key]) {
              buildsonkey[key].weight++;
            } else {
              buildsonkey[key] = {
                source: source,
                target: target,
                type: "buildson",
                weight: 1
              };
            }
          });
        });
      }
    });

    for (const key in buildsonkey) {
      buildson.push(buildsonkey[key]);
    }

    return { nodes: authors, edges: buildson };
  };

  const generateActivityNetworkData = () => {
    const readData = processedActivityData.filter(d => d.type === 'read');
    
    // Build user info
    const userInfo: { [key: string]: { name: string; interactions: number; realName: string } } = {};
    
    readData.forEach(interaction => {
      const userId = interaction.fromId;
      const displayName = hideNames && userId !== currentAuthor._id
        ? interaction.fromPseudo
        : interaction.from;
      const realName = interaction.from;

      if (!userInfo[displayName]) {
        userInfo[displayName] = {
          name: displayName,
          interactions: 0,
          realName: realName
        };
      }
      userInfo[displayName].interactions++;
    });

    // Build edges
    const userConnections: { [fromUser: string]: { [toUser: string]: number } } = {};

    readData.forEach(interaction => {
      const fromUser = hideNames && interaction.fromId !== currentAuthor._id
        ? interaction.fromPseudo
        : interaction.from;
      const toUser = hideNames && interaction.to !== currentAuthor.name
        ? interaction.toPseudo
        : interaction.to;

      if (fromUser === toUser) return;

      if (!userConnections[fromUser]) userConnections[fromUser] = {};
      userConnections[fromUser][toUser] = (userConnections[fromUser][toUser] || 0) + 1;
    });

    // Create edges
    const edges: any[] = [];
    const edgeMap: { [key: string]: any } = {};

    Object.entries(userConnections).forEach(([fromUser, targets]) => {
      Object.entries(targets).forEach(([toUser, count]) => {
        if (fromUser === toUser) return;

        const [user1, user2] = [fromUser, toUser].sort();
        const key = `${user1}<->${user2}`;

        if (!edgeMap[key]) {
          edgeMap[key] = {
            id: key,
            from: user1,
            to: user2,
            value: 0,
            weight: 1,
            type: 'interaction'
          };
        }

        edgeMap[key].value += count;
        edgeMap[key].weight = Math.max(1, Math.min(edgeMap[key].value / 3, 15));
      });
    });

    edges.push(...Object.values(edgeMap));

    return { nodes: userInfo, edges };
  };

  // Render network based on mode
  const renderNetwork = () => {
    if (!networkRef.current) return;

    if (mode === 'buildson') {
      renderBuildsonNetwork();
    } else {
      renderActivityNetwork();
    }
  };

  const renderBuildsonNetwork = () => {
    const { nodes, edges } = networkData;
    
    // Clear previous network
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
    }
    
    if (Object.keys(nodes).length === 0) {
      setNetworkInfo('No data to display');
      return;
    }

    const width = networkRef.current?.offsetWidth || 600;
    const height = 600;

    // Calculate min/max values for normalization
    let minsize = null, maxsize = null, minweight = null, maxweight = null;
    
    Object.values(nodes).forEach((node: any) => {
      const s = node.size;
      minsize = minsize === null || s < minsize ? s : minsize;
      maxsize = maxsize === null || s > maxsize ? s : maxsize;
    });

    const cleanlinks = [];
    edges.forEach((link: any) => {
      if (nodes[link.source] && nodes[link.target]) {
        link.source = nodes[link.source];
        link.target = nodes[link.target];
        minweight = minweight === null || link.weight < minweight ? link.weight : minweight;
        maxweight = maxweight === null || link.weight > maxweight ? link.weight : maxweight;
        cleanlinks.push(link);
      }
    });

    const normalizeNodeSize = (s: number) => ((s - minsize) / (maxsize - minsize + 1) * 20) + 8;
    const normalizeLinkWidth = (w: number) => ((w - minweight) / (maxweight - minweight + 1) * 5) + 2;

    const force = d3.forceSimulation(Object.values(nodes))
      .force("link", d3.forceLink(cleanlinks).id((d: any) => d.name).distance(260))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => normalizeNodeSize(d.size) + 20).strength(0.9))
      .force("x", d3.forceX(width / 2).strength(0.02))
      .force("y", d3.forceY(height / 2).strength(0.02));

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const container = svg.append("g").attr("class", "zoom-handler");

    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.4, 20])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Add arrow markers
    const defs = container.append("defs");
    ["flechenoire", "flecherouge", "flecheverte", "flecheinactif"].forEach(id => {
      defs.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 -5 10 10")
        .attr("markerWidth", 16)
        .attr("markerHeight", 16)
        .attr("orient", "auto")
        .attr("markerUnits", "strokeWidth")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");
    });

    // Add links
    const linkGroup = container.append("g").attr("class", "links");
    const path = linkGroup.selectAll("path.link")
      .data(cleanlinks)
      .enter().append("path")
      .attr("class", (d: any) => "link " + d.type)
      .attr("stroke-width", (d: any) => normalizeLinkWidth(d.weight))
      .attr("name", (d: any) => d.source.name + d.target.name);

    // Add marker paths
    const markerGroup = container.append("g").attr("class", "markers");
    const markerPath = markerGroup.selectAll("path.marker")
      .data(cleanlinks)
      .enter().append("path")
      .attr("class", (d: any) => "marker_only " + d.type)
      .attr("name", (d: any) => d.source.name + d.target.name)
      .attr("marker-end", "url(#flechenoire)");

    // Add nodes
    const nodeGroup = container.append("g").attr("class", "nodes");
    const nodeGroups = nodeGroup.selectAll("g.node-group")
      .data(Object.values(nodes))
      .enter().append("g")
      .attr("class", "node-group")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    nodeGroups.append("circle")
      .attr("r", (d: any) => normalizeNodeSize(d.size))
      .attr("name", (d: any) => d.name)
      .attr("size", (d: any) => d.size)
      .on("click", showBuildsonNodeInfo);

    // Add text labels with shadow
    nodeGroups.append("text")
      .text((d: any) => d.name)
      .attr("class", "shadow")
      .attr("x", 12)
      .attr("y", 4);

    nodeGroups.append("text")
      .text((d: any) => d.name)
      .attr("x", 12)
      .attr("y", 4);

    force.on("tick", () => {
      path.attr("d", (d: any) => {
        const selfLink = d.source.name === d.target.name;
        if (!selfLink) {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        } else {
          return `M${d.source.x},${d.source.y}A20,40 270,1,1 ${d.target.x - 1},${d.target.y - 1}`;
        }
      });

      markerPath.attr("d", (d: any) => {
        const selfLink = d.source.name === d.target.name;
        if (selfLink) return;

        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        const endX = (d.target.x + d.source.x) / 2;
        const endY = (d.target.y + d.source.y) / 2;
        const len = dr - ((dr / 2) * Math.sqrt(3));

        const arrowX = endX + (dy * len / dr);
        const arrowY = endY + (-dx * len / dr);
        
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${arrowX},${arrowY}`;
      });

      nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) force.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) force.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function showBuildsonNodeInfo(event: any, d: any) {
      const currentFill = d3.select(event.target).style("fill");
      const isAlreadySelected = currentFill === "rgb(0, 0, 136)" || currentFill === "#008";

      svg.selectAll("path.link").style("stroke", "#666");
      svg.selectAll("path.marker_only").attr("marker-end", "url(#flechenoire)");
      svg.selectAll("circle").style("fill", "#ccc").style("stroke", "#333").style("stroke-width", "1.5px");

      if (isAlreadySelected) {
        setNetworkInfo('');
        return;
      }
      
      d3.select(event.target).style("fill", "#008").style("stroke", "#ccc");
      
      let infoText = `${d.name} wrote ${d.size} note${d.size > 1 ? 's' : ''}.<br>`;
      
      let buildsonOthers = 0;
      let othersBuildsOn = 0;
      let buildsonOthersText = "";
      let othersBuildsOnText = "";
      
      cleanlinks.forEach((link: any) => {
        if (link.source.name === d.name) {
          buildsonOthers += link.weight;
          buildsonOthersText += `<li>${link.weight} by ${link.target.name}</li>`;
          svg.select(`path.link[name="${link.source.name}${link.target.name}"]`).style("stroke", "#080");
          svg.select(`path.marker_only[name="${link.source.name}${link.target.name}"]`).attr("marker-end", "url(#flecheverte)");
        } else if (link.target.name === d.name) {
          othersBuildsOn += link.weight;
          othersBuildsOnText += `<li>${link.weight} by ${link.source.name}</li>`;
          svg.select(`circle[name="${link.source.name}"]`).style("stroke", "#000").style("stroke-width", "3px");
          svg.select(`path.link[name="${link.source.name}${link.target.name}"]`).style("stroke", "#800");
          svg.select(`path.marker_only[name="${link.source.name}${link.target.name}"]`).attr("marker-end", "url(#flecherouge)");
        }
      });
      
      if (buildsonOthers > 0) {
        infoText += `${d.name} built onto ${buildsonOthers} note${buildsonOthers > 1 ? 's' : ''}: <ul>${buildsonOthersText}</ul>`;
      }
      if (othersBuildsOn > 0) {
        infoText += `${othersBuildsOn} note${othersBuildsOn > 1 ? 's were built' : ' was built'} onto notes written by ${d.name}: <ul>${othersBuildsOnText}</ul>`;
      }

      setNetworkInfo(infoText);
    }
  };

  const renderActivityNetwork = () => {
    if (network) {
      network.destroy();
    }

    const { nodes, edges } = networkData;
    
    if (Object.keys(nodes).length === 0) {
      setNetworkInfo('No activity data to display');
      return;
    }

    // Convert to vis-network format
    const visNodes = Object.entries(nodes).map(([userId, info]: [string, any]) => {
      const isCurrentUser = userId === currentAuthor.name || userId === currentAuthor._id;
      const maxInteractions = Math.max(...Object.values(nodes).map((u: any) => u.interactions));
      const sizeRatio = info.interactions / maxInteractions;
      const nodeSize = 10 + (30 * sizeRatio);

      return {
        id: userId,
        label: userId,
        size: Math.min(nodeSize, 40),
        title: `${userId}\nReads: ${info.interactions}`,
        font: { size: 30, color: '#333333' },
        color: {
          background: isCurrentUser ? '#e74c3c' : '#3498db',
          border: isCurrentUser ? '#c0392b' : '#2980b9',
          highlight: {
            background: isCurrentUser ? '#e67e22' : '#5dade2',
            border: isCurrentUser ? '#d35400' : '#3498db'
          }
        },
        borderWidth: 2,
        shadow: true
      };
    });

    const visEdges = edges.map((edge: any) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      value: edge.value,
      width: Math.max(1, Math.min(edge.value * 2, 15)),
      color: {
        color: '#95a5a6',
        highlight: '#34495e',
        hover: '#34495e'
      },
      title: `${edge.from} ↔ ${edge.to}: ${edge.value} interactions`,
      smooth: { type: 'continuous' }
    }));

    const options = {
      nodes: {
        shape: 'dot',
        scaling: { min: 10, max: 50 }
      },
      edges: {
        smooth: { type: 'continuous' }
      },
      physics: {
        stabilization: { iterations: 200 },
        barnesHut: {
          gravitationalConstant: -80000,
          springConstant: 0.001,
          springLength: 200
        }
      },
      interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        hover: true
      }
    };

    const networkInstance = new Network(
      networkRef.current!,
      { nodes: visNodes, edges: visEdges },
      options
    );

    networkInstance.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = visNodes.find(n => n.id === nodeId);
        if (nodeData) {
          const interactionCount = nodes[nodeId]?.interactions || 0;
          setNetworkInfo(`
            <div><strong>${nodeData.label}</strong></div>
            <div>Reads performed: ${interactionCount}</div>
            <div>Click on other nodes to see their activity</div>
          `);
        }
      } else {
        setNetworkInfo('');
      }
    });

    setNetwork(networkInstance);

    // Update statistics and labels for activity mode
    const authorDimension = processedActivityData.reduce((acc: any, d: any) => {
      const displayName = hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from;
      if (!acc[displayName]) {
        acc[displayName] = { read: 0, modified: 0, created: 0, total: 0 };
      }
      acc[displayName][d.type] += 1;
      acc[displayName].total += 1;
      return acc;
    }, {});

    const newStatsData = Object.entries(authorDimension).map(([key, value]) => ({ key, value }));
    setStatisticsData(newStatsData);

    const newLabels: { [key: string]: string } = {};
    Object.keys(authorDimension).forEach(key => {
      newLabels[key] = key;
    });
    setLabels(newLabels);

    // Update views data
    const viewsGroupData = processedActivityData.reduce((acc: any, d: any) => {
      const view = d.view || 'Unknown';
      acc[view] = (acc[view] || 0) + 1;
      return acc;
    }, {});

    setViewsData(Object.entries(viewsGroupData).map(([key, value]) => ({ key, value: value as number })));
    setFilteredActivityData(processedActivityData);
  };

  // Effect to render network when mode or data changes
  useEffect(() => {
    renderNetwork();
  }, [mode, networkData, hideNames]);

  // Filter functions
  const filterMembers = () => {
    return allAuthors.filter(member => 
      member.firstName.toLowerCase().includes(memberSearchText.toLowerCase()) ||
      member.lastName.toLowerCase().includes(memberSearchText.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchText.toLowerCase())
    );
  };

  const getSelectedMemberName = () => {
    if (selectedMember === 'allAuthors') return 'All authors';
    if (typeof selectedMember === 'object') return selectedMember.firstName + ' ' + selectedMember.lastName;
    return 'All authors';
  };

  // Event handlers
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroup(e.target.value);
    setSelectedView('');
    setSelectedMember('allAuthors');
    setIsMemberDropdownOpen(false);
    setNetworkInfo("");
  };

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedView(e.target.value);
    setSelectedGroup('allGroups');
    setSelectedMember('allAuthors');
    setIsMemberDropdownOpen(false);
    setNetworkInfo("");
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setSelectedGroup('allGroups');
    setIsMemberDropdownOpen(false);
    if (member !== 'allAuthors') {
      setNetworkInfo('');
    }
  };

  const handleViewSelect = (viewKey: string) => {
    setSelectedView(viewKey);
  };

  const toggleNames = () => {
    if (isManager) {
      setHideNames(!hideNames);
      setSelectedView('');
    } else {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
  };

  const toggleManagers = () => {
    if (isManager) {
      setHideManagers(!hideManagers);
    }
  };

  const downloadCSV = () => {
    if (mode === 'buildson') {
      exportCSV({
        buildsonAuthorIdPairs: boaip,
        buildsonNoteIdPairs: bonip,
        singleNoteIdToAuthorIdsMap: snitaip,
        authors: allAuthors,
        notes: contributions,
        getObject: async (noteId: string) => contributions.find(contrib => contrib.id === noteId) || null,
        exportOpts
      });
    }
  };

  return (
    <div className="unified-dashboard">
      <div className="unified-header">
        <h1>Knowledge Forum Analytics Dashboard</h1>
        <div className="mode-switcher">
          <button 
            className={`mode-btn ${mode === 'buildson' ? 'active' : ''}`}
            onClick={() => setMode('buildson')}
          >
            <Building2 size={18} />
            Builds On
          </button>
          <button 
            className={`mode-btn ${mode === 'activity' ? 'active' : ''}`}
            onClick={() => setMode('activity')}
          >
            <Activity size={18} />
            Activity
          </button>
        </div>
      </div>

      <div className="unified-content">
        <div className="graph-section">
          <div className="graph-container" ref={networkRef}>
            {mode === 'buildson' && <svg ref={svgRef} className="network-svg"></svg>}
          </div>
          
          {mode === 'activity' && (
            <div className="activity-tables">
              <div className="table-toggles">
                <button 
                  className={`toggle-btn ${showStatisticsTable ? 'active' : ''}`}
                  onClick={() => setShowStatisticsTable(!showStatisticsTable)}
                >
                  <Eye size={16} />
                  {showStatisticsTable ? 'Hide' : 'Show'} Statistics Table
                </button>
                <button 
                  className={`toggle-btn ${showMainDataTable ? 'active' : ''}`}
                  onClick={() => setShowMainDataTable(!showMainDataTable)}
                >
                  <Eye size={16} />
                  {showMainDataTable ? 'Hide' : 'Show'} Activity Records
                </button>
              </div>

              {showStatisticsTable && (
                <StatisticsTable
                  data={statisticsData}
                  originalData={filteredActivityData}
                  members={allAuthors}
                  labels={labels}
                  hideManagers={hideManagers}
                  hideNames={hideNames}
                  selectedView={selectedView}
                  currentAuthor={currentAuthor}
                  isManager={isManager}
                  toggleManagers={toggleManagers}
                />
              )}

              {showMainDataTable && (
                <MainDataTable 
                  data={filteredActivityData} 
                  labels={labels} 
                  hideNames={hideNames} 
                  currentAuthor={currentAuthor} 
                  baseURL={baseURL}
                />
              )}
            </div>
          )}
        </div>

        <div className="controls-section">
          <div className="control-block">
            <h3>Filters</h3>
            
            <div className="control-group">
              <label>Groups</label>
              <select className="form-control" value={selectedGroup} onChange={handleGroupChange}>
                <option value="allGroups">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.title}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Views</label>
              {mode === 'activity' ? (
                <ViewsDropdown 
                  views={viewsData}
                  onViewSelect={handleViewSelect}
                  selectedView={selectedView}
                />
              ) : (
                <select className="form-control" value={selectedView} onChange={handleViewChange}>
                  <option value="">All Views</option>
                  {views.map(view => (
                    <option key={view.id} value={view.id}>{view.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="control-group">
              <label>Authors</label>
              <div className="member-dropdown">
                <button 
                  type="button"
                  className="form-control dropdown-toggle"
                  onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                >
                  {getSelectedMemberName()}
                  <span className="caret"></span>
                </button>
                
                {isMemberDropdownOpen && (
                  <ul className="dropdown-menu">
                    <li className="form-group">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Search members..."
                        value={memberSearchText}
                        onChange={(e) => setMemberSearchText(e.target.value)}
                      />
                    </li>
                    <li className="dropdown-scroll-area">
                      <ul className="inner-scroll-list">
                        <li>
                          <a href="#" onClick={(e) => { e.preventDefault(); handleMemberSelect('allAuthors'); }}>
                            <div>All authors</div>
                          </a>
                        </li>
                        {filterMembers().length === 0 && (
                          <li className="text-muted">
                            <div>No authors found</div>
                          </li>
                        )}
                        {filterMembers().map(member => (
                          <li key={member.id}>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMemberSelect(member); }}>
                              <div>{member.firstName + " " + member.lastName}</div>
                              <small>{member.email}</small>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            <div className="control-group">
              <label>Date Range</label>
              <RangePicker
                style={{ border: '1px solid #7c7c7c', height: '32px', borderRadius: '4px', width: '100%' }}
                format="YYYY-MM-DD"
                value={[
                  fromDate ? dayjs(fromDate) : null,
                  toDate ? dayjs(toDate) : null
                ]}
                onChange={(values) => {
                  if (values && values.length === 2) {
                    setFromDate(values[0].toISOString());
                    setToDate(values[1].toISOString());
                  } else {
                    setFromDate('');
                    setToDate('');
                  }
                }}
              />
            </div>

            {mode === 'activity' && (
              <div className="control-group">
                <div className="button-container">
                  <button 
                    className={`btn ${isManager ? 'btn-primary' : 'btn-disabled'}`}
                    onClick={toggleNames}
                  >
                    {hideNames ? 'Show' : 'Hide'} Names
                  </button>
                  {showTooltip && !isManager && (
                    <div className="tooltip-message">
                      Only managers can view other users' names
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {mode === 'buildson' && (
            <div className="control-block">
              <h3>Export</h3>
              <div className="export-options">
                <label>
                  <input 
                    type="checkbox" 
                    checked={exportOpts.pseudonames}
                    onChange={(e) => setExportOpts({...exportOpts, pseudonames: e.target.checked})}
                  />
                  Use pseudonames
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={exportOpts.singleContribs}
                    onChange={(e) => setExportOpts({...exportOpts, singleContribs: e.target.checked})}
                  />
                  Export single contributions
                </label>
              </div>
              <button className="btn btn-primary" onClick={downloadCSV}>
                Export CSV
              </button>
            </div>
          )}

          <div className="control-block">
            <h3>Graph Info</h3>
            <div className="graph-info" dangerouslySetInnerHTML={{ __html: networkInfo || 'Click on a node to see details' }}></div>
          </div>

          {mode === 'buildson' && (
            <div className="control-block">
              <h3>Legend</h3>
              <div className="legend">
                <p>This network shows relationships between authors based on their contributions.</p>
                <p>Click on a node to see detailed information about that author's connections.</p>
                <ul>
                  <li><span className="legend-dot selected"></span>Selected author</li>
                  <li><span className="legend-dot builds-on"></span>Authors who built on selected author's work</li>
                  <li><span className="legend-dot built-upon"></span>Authors whose work was built upon by selected author</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;