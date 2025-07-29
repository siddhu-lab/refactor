import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './AuthorNetwork.css';
import { useContext } from "react";
import dashboardContext from "../../context/dashboard.js";
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import { exportCSV } from './ExportCSV.jsx';

// Dummy data for buildson links
const dummyBuildsonLinks = [
  {
    id: 'link-1',
    from: 'contrib-1',
    to: 'contrib-2',
    type: 'buildson',
    created: Date.now() - 86400000 * 3,
    _from: {
      authors: ['author-1']
    },
    _to: {
      authors: ['author-2']
    }
  },
  {
    id: 'link-2',
    from: 'contrib-2',
    to: 'contrib-3',
    type: 'buildson',
    created: Date.now() - 86400000 * 2,
    _from: {
      authors: ['author-2']
    },
    _to: {
      authors: ['author-3']
    }
  }
];

// Dummy data for contributions
const dummyContributions = [
  {
    id: 'contrib-1',
    title: 'Climate Change Discussion',
    created: Date.now() - 86400000 * 5,
    authors: ['author-1'],
    data: { body: 'This is a discussion about climate change and its impacts.' }
  },
  {
    id: 'contrib-2',
    title: 'Mathematical Proof Analysis',
    created: Date.now() - 86400000 * 3,
    authors: ['author-2'],
    data: { body: 'Here is my analysis of the mathematical proof presented in class.' }
  },
  {
    id: 'contrib-3',
    title: 'Literature Review Update',
    created: Date.now() - 86400000 * 2,
    authors: ['author-3'],
    data: { body: 'Updated the literature review with new sources and analysis.' }
  },
  {
    id: 'contrib-4',
    title: 'Research Methodology',
    created: Date.now() - 86400000 * 1,
    authors: ['author-4'],
    data: { body: 'Exploring different research methodologies for our project.' }
  }
];


const AuthorNetwork = () => {
  const { community } = useContext(dashboardContext);
  const groups = community.groups || [];
  const allViews = community.views || [];
  const views = allViews.filter(view => view.title?.toLowerCase() !== 'riseabove:' && view.title?.toLowerCase() !== 'riseabove');
  const allAuthors = community.authors || [];
  const { RangePicker } = DatePicker;
  const [linksData] = useState({ buildsonLinks: dummyBuildsonLinks });
  const [contribData] = useState({ searchContributions: dummyContributions });
  const [linksLoading] = useState(false);
  const [contribLoading] = useState(false);
  
  const [selectedGroup, setSelectedGroup] = useState('allGroups');
  const [selectedView, setSelectedView] = useState('allViews');
  const [selectedMember, setSelectedMember] = useState('allAuthors');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearchText, setMemberSearchText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exportOpts, setExportOpts] = useState({
    pseudonames: false,
    singleContribs: true
  });
  const [networkInfo, setNetworkInfo] = useState('');

  const networkRef = useRef();
  const svgRef = useRef();
  const [links, setLinks] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [boaip, setBoaip] = useState([]);
  const [bonip, setBonip] = useState([]);
  const [snitaip, setSnitaip] = useState({});
  var sm;

  useEffect(() => {
    if (linksData && contribData && !linksLoading && !contribLoading) {
      setLinks(linksData.buildsonLinks || []);
      setContributions(contribData.searchContributions || []);
      refreshView(linksData.buildsonLinks, contribData.searchContributions);
    }
  }, [linksData, contribData, linksLoading, contribLoading]);
  
  

  const filterMembers = () => {
    return allAuthors.filter(member => 
      member.firstName.toLowerCase().includes(memberSearchText.toLowerCase()) ||
      member.lastName.toLowerCase().includes(memberSearchText.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchText.toLowerCase())
    );
  };

  const processData = (notes, links, group, filters) => {
    const authors = {};
    const buildsonkey = {};
    const buildson = [];
    const buildsonAuthorIdPairs = [];
    const buildsonNoteIdPairs = [];

    var singleNoteIdToAuthorIdsMap = {};

    notes.forEach(note => {
      if (!filters || filters[note.id]) {
        singleNoteIdToAuthorIdsMap[note.id] = [];
        note.authors.forEach(author => {
          if (authors[author]) {
            authors[author].size++;
          } else {
            if ((group && group.members.includes(author)) || !group) {
              const member = allAuthors.find(m => m.id === author);
              if (member) {
                authors[author] = {
                  name: member.firstName+" "+member.lastName,
                  pseudoName: member.pseudoName,
                  size: 1
                };
              }
            }
          }
          singleNoteIdToAuthorIdsMap[note.id].push(author);
        });
      }
    });

    links.forEach(link => {
      if (!filters || (filters[link.from] && filters[link.to])) {
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
              if (authors[source] && authors[target]) {
                buildsonAuthorIdPairs.push([source, target]);
                buildsonNoteIdPairs.push([link.from, link.to]);
              }
            });
          });
          delete singleNoteIdToAuthorIdsMap[link.to];
          delete singleNoteIdToAuthorIdsMap[link.from];
        }
      }
    });

    for (const key in buildsonkey) {
      buildson.push(buildsonkey[key]);
    }
    setBoaip(buildsonAuthorIdPairs);
    setBonip(buildsonNoteIdPairs);
    setSnitaip(singleNoteIdToAuthorIdsMap);
    return [authors, buildson];
  };


  const refreshView = (filteredLinks = links, filteredContributions = contributions, group=null, filters=null) => {

    // Apply date filtering
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0); // Start of day
    
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of day
    
      filteredContributions = filteredContributions.filter(contrib => {
        const created = new Date(Number(contrib.created));
        return created >= from && created <= to;
      });
    
      filteredLinks = filteredLinks.filter(link => {
        const created = new Date(Number(link.created));
        return created >= from && created <= to;
      });
    }
    
    const data = processData(filteredContributions, filteredLinks, group, filters);
    renderNetwork(data);
  };

  const renderNetwork = (data) => {
    const [nodes, links] = data;
    
    // Clear previous network
    d3.select(svgRef.current).selectAll("*").remove();
    
    if (Object.keys(nodes).length === 0) {
      setNetworkInfo('No data to display');
      return;
    }

    const width = networkRef.current?.offsetWidth || 800;
    const height = 600;

    // Calculate min/max values for normalization
    let minsize = null, maxsize = null, minweight = null, maxweight = null;
    
    Object.values(nodes).forEach(node => {
      const s = node.size;
      minsize = minsize === null || s < minsize ? s : minsize;
      maxsize = maxsize === null || s > maxsize ? s : maxsize;
    });

    const cleanlinks = [];
    links.forEach(link => {
      if (nodes[link.source] && nodes[link.target]) {
        link.source = nodes[link.source];
        link.target = nodes[link.target];
        minweight = minweight === null || link.weight < minweight ? link.weight : minweight;
        maxweight = maxweight === null || link.weight > maxweight ? link.weight : maxweight;
        cleanlinks.push(link);
      }
    });

    const normalizeNodeSize = (s) => ((s - minsize) / (maxsize - minsize + 1) * 20) + 8;
    const normalizeLinkWidth = (w) => ((w - minweight) / (maxweight - minweight + 1) * 5) + 2;

    const force = d3.forceSimulation(Object.values(nodes))
    .force("link", d3.forceLink(cleanlinks).id(d => d.name).distance(260))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(d => normalizeNodeSize(d.size) + 20).strength(0.9)) 
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
      .attr("class", d => "link " + d.type)
      .attr("stroke-width", d => normalizeLinkWidth(d.weight))
      .attr("name", d => d.source.name + d.target.name);

    // Add marker paths
    const markerGroup = container.append("g").attr("class", "markers");
    const markerPath = markerGroup.selectAll("path.marker")
      .data(cleanlinks)
      .enter().append("path")
      .attr("class", d => "marker_only " + d.type)
      .attr("name", d => d.source.name + d.target.name)
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
      .attr("r", d => normalizeNodeSize(d.size))
      .attr("name", d => d.name)
      .attr("size", d => d.size)
      .on("click", showNodeInfo);

    // Add text labels with shadow
    nodeGroups.append("text")
      .text(d => d.name)
      .attr("class", "shadow")
      .attr("x", 12)
      .attr("y", 4);

    nodeGroups.append("text")
      .text(d => d.name)
      .attr("x", 12)
      .attr("y", 4);

    force.on("tick", () => {
      path.attr("d", d => {
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

      // Update marker paths 
      markerPath.attr("d", d => {
        const selfLink = d.source.name === d.target.name;
        if (selfLink) return;

        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate midpoint for arrow placement
        const endX = (d.target.x + d.source.x) / 2;
        const endY = (d.target.y + d.source.y) / 2;
        const len = dr - ((dr / 2) * Math.sqrt(3));

        const arrowX = endX + (dy * len / dr);
        const arrowY = endY + (-dx * len / dr);
        
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${arrowX},${arrowY}`;
      });

      nodeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) force.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) force.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function showNodeInfo(event, d) {
      setSelectedMember('allGroups');
      
      // Check if this node is already selected
      const currentFill = d3.select(event.target).style("fill");
      const isAlreadySelected = currentFill === "rgb(0, 0, 136)" || currentFill === "#008";
  
      // Reset all styles
      svg.selectAll("path.link").style("stroke", "#666");
     svg.selectAll("path.marker_only").attr("marker-end", "url(#flechenoire)");
      svg.selectAll("circle").style("fill", "#ccc").style("stroke", "#333").style("stroke-width", "1.5px");

      // If already selected, just clear info and return 
      if (isAlreadySelected) {
        setNetworkInfo('');
        return;
      }
      
      // Highlight selected node
      d3.select(event.target).style("fill", "#008").style("stroke", "#ccc");
      
      let infoText = `${d.name} wrote ${d.size} note${d.size > 1 ? 's' : ''}.<br>`;
      
      // Find connections
      let buildsonOthers = 0;
      let othersBuildsOn = 0;
      let buildsonOthersText = "";
      let othersBuildsOnText = "";
      
      cleanlinks.forEach(link => {
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

    if (sm && sm !== 'allAuthors') {
      setTimeout(() => {
        const fullName = sm.firstName + " " + sm.lastName;
        const circleNode = document.querySelector(`circle[name="${fullName}"]`);
        if (circleNode) {
          showNodeInfo({ target: circleNode }, { name: fullName, size: circleNode.getAttribute("size") });
        }
      }, 200);
    }
  };

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
    setSelectedView('allViews');
    setSelectedMember('allAuthors');
    setIsMemberDropdownOpen(false);
    setNetworkInfo("");
    if(e.target.value === 'allGroups'){
      refreshView(links, contributions);
      return;
    }
    for(var i = 0;i < groups.length;++i){
      if (groups[i].id === e.target.value) {
        refreshView(links,contributions,groups[i]);
        return;
     }
    }
  };

  const handleViewChange = async(e) => {
      const viewId = e.target.value;
      setIsMemberDropdownOpen(false);
      setSelectedView(viewId);
      setSelectedGroup('allGroups');
      setSelectedMember('allAuthors');
      setNetworkInfo("");
    
      if (viewId === 'allViews') {
        refreshView(links, contributions); 
        return;
      }
    
      try {
        // Mock data for view links
        const linksData = dummyBuildsonLinks.filter(link => 
          link.from === viewId || link.to === viewId
        );
    
        const authorsMap = {};
        const filters = {};
    
        linksData.forEach((link) => {
          filters[link.from] = 1;
          filters[link.to] = 1;
          link._to?.authors?.forEach((author) => {
            if (!authorsMap[author]) {
              authorsMap[author] = 1;
            }
          });
        });
    
        const group = { members: Object.keys(authorsMap) };
        refreshView(links, contributions, group, filters); 
    
      } catch (error) {
        console.log(`Get links for view: ${viewId} failed!`);
      }
    
  };

  const getLinksData = async() => {
        const linksData = dummyBuildsonLinks.filter(link => 
          link.from === selectedView || link.to === selectedView
        );
        var authors = {};
        var filters = {};
        linksData.forEach(function (link) {
            filters[link.from] = 1;
            filters[link.to] = 1;
            link._to.authors.forEach(function (author) {
                if (!authors[author]) {
                    authors[author] = 1;
                }
            });
        });
        var group = { members: [] };
        for (var authorId in authors) {
            if (authors.hasOwnProperty(authorId)) {
                group.members.push(authorId);
            }
        }
        refreshView(links, contributions, group, filters);
    }

  const handleMemberSelect = (member) => {
    sm=member;
    setSelectedMember(member);
    setSelectedGroup('allGroups');
    setIsMemberDropdownOpen(false);
    if(member == 'allAuthors'){
      setNetworkInfo('');
      if(selectedView !== 'allViews'){
        getLinksData();
      }
      else{
        refreshView(links, contributions); 
      }
    }
    else{
      if(selectedView !== 'allViews'){
        getLinksData();
      }
      else{
        refreshView(links, contributions); 
      }
    }
  };

  const fetchNoteByIdFromAPI = async (noteId) => {
    try {
      return dummyContributions.find(contrib => contrib.id === noteId) || null;
    } catch (err) {
      console.error("Failed to fetch note by ID:", noteId);
      return null;
    }
  };  

  const downloadCSV = () => {
    exportCSV({
      buildsonAuthorIdPairs: boaip,
      buildsonNoteIdPairs: bonip,
      singleNoteIdToAuthorIdsMap: snitaip,
      authors: allAuthors,
      notes: contributions,
      getObject: fetchNoteByIdFromAPI,
      exportOpts
    });
  };
  

  const getSelectedMemberName = () => {
    if (selectedMember === 'allAuthors') return 'All authors';
    if (typeof selectedMember === 'object') return selectedMember.firstName + ' ' + selectedMember.lastName;
    return 'All authors';
  };

  if (loading)
        return <div className='flex-center h-full'>Loading....</div>

  return (
    <div className="author-network-container">
      <div className="cd-content-width">
        <div className="author-network-grid">
          <div id="network" ref={networkRef}>
            <svg ref={svgRef} id="network_svg"></svg>
          </div>
          
          <div className="sidebar-container">
            <div className="author-network__side-block">
              <h5>Filter</h5>
              
              <div className="grid--auto-rows_2-col">
                <strong>Groups</strong>
                <select className="form-control" value={selectedGroup} onChange={handleGroupChange}>
                  <option value="allGroups">&nbsp;All Groups</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>&nbsp;{group.title}</option>
                  ))}
                </select>
                
                <strong>Views</strong>
                <select className="form-control" value={selectedView} onChange={handleViewChange}>
                  <option value="allViews">&nbsp;All Views</option>
                  {views.map(view => (
                    <option key={view.id} value={view.id}>&nbsp;{view.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid--auto-rows_2-col anmember-select-container">
                <strong>Authors</strong>
                <div className="anmember-select-container">
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
                                <div>{member.firstName+" "+member.lastName}</div>
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

              <div className="grid--auto-rows_2-col">
                <strong>Date Range:</strong>
                <RangePicker
                  style={{border:'1px solid #7c7c7c', height:'24px', borderRadius:'4px'}}
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

                <div style={{ gridColumn: '1 / span 2', justifySelf: 'end', marginTop:'4px' }}>
                <button className="btn btn-primary" onClick={() => refreshView(links, contributions)}>
                    Filter by time
                  </button>
                </div>
            </div>

            </div>

            <div className="author-network__side-block">
              <h5>Export section</h5>
              <div>
                <div className="export-options">
                  <div>Options:</div>
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
                
                <div>
                    <button 
                      type="button" 
                      className="btn btn-light dropdown-button text-left" 
                      onClick={downloadCSV}
                    >
                      CSV
                    </button>
                </div>
              </div>
            </div>

            <div className="author-network__side-block">
              <h5>Graph Infos</h5>
              <div id="infos" dangerouslySetInnerHTML={{__html: networkInfo}}></div>
            </div>

            <div id="legendes">
              <p>This network shows the relationships between authors based on their contributions.</p>
              <p>Click on a node to see detailed information about that author's connections.</p>
              <p>Use the filters above to focus on specific groups, views, or time periods.</p>
              <ul>
                <li><span style={{background: '#008'}}></span>Selected author</li>
                <li><span style={{background: '#080'}}></span>Authors who built on selected author's work</li>
                <li><span style={{background: '#800'}}></span>Authors whose work was built upon by selected author</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorNetwork;