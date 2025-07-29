import { initializeCharts } from './chartUtils.ts';
import StatisticsTable from './StatisticsTable.tsx';
import MainDataTable from './MainDataTable/MainDataTable.tsx';
import ViewsDropdown from './ViewsDropdown.tsx';
import * as dc from 'dc';
import './ActivityDashboard.css';
import './dc.css';
import SocialNetworkSection from './SocialNetworkSection/SocialNetworkSection.tsx';

// Dummy data for social interactions
const dummySocialInteractions = [
  {
    id: '1',
    when: Date.now() - 86400000 * 5, // 5 days ago
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
    when: Date.now() - 86400000 * 3, // 3 days ago
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
    when: Date.now() - 86400000 * 2, // 2 days ago
    type: 'modified',
    from: 'Mike Wilson',
    fromId: 'author-3',
    fromPseudo: 'MikeW',
    to: 'Mike Wilson',
    toPseudo: 'MikeW',
    title: 'Literature Review Update',
    view: 'Literature Review',
    data: { body: '<p>Updated the literature review with new sources and analysis.</p>' },
    ID: 'contrib-3'
  },
  {
    id: '4',
    when: Date.now() - 86400000 * 1, // 1 day ago
    type: 'read',
    from: 'Emily Davis',
    fromId: 'author-4',
    fromPseudo: 'EmilyD',
    to: 'John Smith',
    toPseudo: 'JohnS',
    title: 'Research Methodology',
    view: 'Science Discussion',
    data: { body: '<p>Exploring different research methodologies for our project.</p>' },
    ID: 'contrib-4'
  },
  {
    id: '5',
    when: Date.now() - 86400000 * 4, // 4 days ago
    type: 'created',
    from: 'John Smith',
    fromId: 'author-1',
    fromPseudo: 'JohnS',
    to: 'John Smith',
    toPseudo: 'JohnS',
    title: 'Project Guidelines',
    view: 'Science Discussion',
    data: { body: '<p>Here are the guidelines for our upcoming research project.</p>' },
    ID: 'contrib-5'
  },
  {
    id: '6',
    when: Date.now() - 86400000 * 6, // 6 days ago
    type: 'read',
    from: 'Sarah Johnson',
    fromId: 'author-2',
    fromPseudo: 'SarahJ',
    to: 'Mike Wilson',
    toPseudo: 'MikeW',
    title: 'Statistical Analysis',
    view: 'Math Problems',
    data: { body: '<p>Statistical analysis of the collected data shows interesting patterns.</p>' },
    ID: 'contrib-6'
  }
];

// Dummy data for social interactions
const dummySocialInteractions = [
  {
    id: '1',
    when: Date.now() - 86400000 * 5, // 5 days ago
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
    when: Date.now() - 86400000 * 3, // 3 days ago
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
    when: Date.now() - 86400000 * 2, // 2 days ago
    type: 'modified',
    from: 'Mike Wilson',
    fromId: 'author-3',
    fromPseudo: 'MikeW',
    to: 'Mike Wilson',
    toPseudo: 'MikeW',
interface ActivityDashboardProps {}

const ActivityDashboard: React.FC<ActivityDashboardProps> = () => {
  const { community, role: loggedInPersonRole, me, baseURL } = useContext(dashboardContext);
  const members = community.authors || [];
  const [hideNames, setHideNames] = useState(true);
  const [hideManagers, setHideManagers] = useState(false);
  const [dailyActivityVisible, setDailyActivityVisible] = useState(false);
  const [statisticsData, setStatisticsData] = useState<any[]>([]);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [viewsData, setViewsData] = useState<Array<{ key: string; value: number }>>([]);
  const [selectedView, setSelectedView] = useState('');
  const [viewDimension, setViewDimension] = useState<any>(null);
  const [rangeFilterActive, setRangeFilterActive] = useState(false);
  const [dateRange, setDateRange] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentAuthor] = useState({ _id: community.author.id, role: loggedInPersonRole, name: me?.firstName+" "+me?.lastName, pseudoName: me?.pseudoName });
  const [data] = useState({ getSocialInteractions: dummySocialInteractions });
  const [loading] = useState(false);
const [filteredData, setFilteredData] = useState<any[]>([]);
const isManager = loggedInPersonRole === 'manager';
const [crossfilterInstance, setCrossfilterInstance] = useState<any>(null);
const [selectedAuthor, setSelectedAuthor] = useState<string>('');

useEffect(() => {
  if (data && data.getSocialInteractions && data.getSocialInteractions.length > 0) {
    let parsed = data.getSocialInteractions.map((d) => {
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


    setTimeout(() => {
      const { statsData, labelsData, viewsGroupData, viewDim, ndx} = initializeCharts(parsed, hideNames, currentAuthor);
      setStatisticsData(statsData);
      setLabels(labelsData);
      setViewDimension(viewDim);
      setViewsData(viewsGroupData || []);

      setCrossfilterInstance(ndx);
      const updateFilteredData = () => {
        if (ndx) {
          const allFiltered = ndx.allFiltered();
          setFilteredData(allFiltered);
          
          // Update statistics data based on filtered data
          const authorDimension = ndx.dimension((d: any) => {
            return hideNames && d.fromId !== currentAuthor?._id ? d.fromPseudo : d.from;
          });
          
          const groupedDimension = authorDimension.group().reduce(
            (p: any, v: any) => {
              p[v.type] += 1;
              p.total += 1;
              return p;
            },
            (p: any, v: any) => {
              p[v.type] -= 1;
              p.total -= 1;
              return p;
            },
            () => ({ read: 0, modified: 0, created: 0, total: 0 })
          );
          
          const newStatsData = groupedDimension.all().filter((d: any) => d.value.total > 0);
          setStatisticsData(newStatsData);
        }
      };

      const updateSelectedAuthor = () => {
        const authorChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#author-chart');
        if (authorChart && authorChart.hasFilter()) {
          const authorFilters = authorChart.filters();
          if (authorFilters.length > 0) {
            setSelectedAuthor(authorFilters[0]);
          }
        } else {
          setSelectedAuthor('');
        }
      };

      const lineChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#line-chart');
      const rangeChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#range-chart');
      const typeChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#type-chart');
      const authorChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#author-chart');
      if (lineChart && rangeChart) {
        const updateRangeDisplay = () => {
          const hasLineFilter = lineChart.hasFilter();
          const hasRangeFilter = rangeChart.hasFilter();
          const hasFilter = hasLineFilter || hasRangeFilter;
          
          setRangeFilterActive(hasFilter);
          
          if (hasFilter) {
            let filter = null;
            if (hasLineFilter) {
              filter = lineChart.filter();
            } else if (hasRangeFilter) {
              filter = rangeChart.filter();
            }
            
            if (filter && Array.isArray(filter) && filter.length === 2) {
              const startDate = new Date(filter[0]);
              const endDate = new Date(filter[1]);
              const formatDate = (date: Date) => {
                return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
              };
              setDateRange(`[${formatDate(startDate)} -> ${formatDate(endDate)}]`);
            }
          } else {
            setDateRange('');
          }
          updateFilteredData();
        };

        lineChart.on('filtered', null);
        rangeChart.on('filtered', null);

        lineChart.on('filtered', updateRangeDisplay);
        rangeChart.on('filtered', updateRangeDisplay);
      }

      if (typeChart) {
        typeChart.on('filtered', () => {
          updateFilteredData();
          updateSelectedAuthor();
        });
      }
      if (authorChart) {
        authorChart.on('filtered', () => {
          updateFilteredData();
          updateSelectedAuthor();
        });
      }
      updateFilteredData();
      updateSelectedAuthor();

    }, 100);
  }
}, [data, hideNames, currentAuthor._id]);

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

  const toggleDailyActivity = () => {
    setDailyActivityVisible(!dailyActivityVisible);
  };

  const resetFilters = () => {
    setFilteredData(data);
    dc.filterAll();
    dc.renderAll();
    if (viewDimension) {
      viewDimension.filterAll();
      dc.redrawAll();
    }
    setSelectedView('');
    setRangeFilterActive(false);
    setDateRange('');
    setSelectedAuthor('');
  };

  const resetRangeFilter = () => {
    const lineChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#line-chart');
    const rangeChart = dc.chartRegistry.list().find(chart => chart.anchor() === '#range-chart');
    if (lineChart) {
      lineChart.filterAll();
    }
    if (rangeChart) {
      rangeChart.filterAll();
    }
    dc.redrawAll();
    setRangeFilterActive(false);
    setDateRange('');
  };

  const handleViewSelect = (viewKey: string) => {
    setSelectedView(viewKey);
      if (viewDimension) {
        if (viewKey === '') {
          viewDimension.filterAll();
        } else {
          viewDimension.filter(viewKey);
        }
      dc.redrawAll();
      if (crossfilterInstance) {
        const allFiltered = crossfilterInstance.allFiltered();
        setFilteredData(allFiltered);
        
        const authorDimension = crossfilterInstance.dimension((d: any) => {
          return hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from;
        });
        
        const groupedDimension = authorDimension.group().reduce(
          (p: any, v: any) => {
            p[v.type] += 1;
            p.total += 1;
            return p;
          },
          (p: any, v: any) => {
            p[v.type] -= 1;
            p.total -= 1;
            return p;
          },
          () => ({ read: 0, modified: 0, created: 0, total: 0 })
        );
        
        const newStatsData = groupedDimension.all().filter((d: any) => d.value.total > 0);
        setStatisticsData(newStatsData);
      }
    }
  };

  return (
    <div className="activity-dashboard">
      <div className="activity-container">
        <div className="activity-header">
          <h1>Knowledge Forum Activity Dashboard</h1>
          <div className="header-controls">
            <div className="current-user-info">
              <span className="current-user-label">Current User: </span>
              <span className="current-user-name">{currentAuthor.name}</span>
            </div>
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
        </div>
        
        <div className="unified-dashboard-box">
          <div className="dashboard-section">
            <h3>Types</h3>
            <div id="type-chart"></div>
          </div>
          
          <div className="dashboard-section">
            <h3>Views</h3>
            <ViewsDropdown 
              views={viewsData}
              onViewSelect={handleViewSelect}
              selectedView={selectedView}
            />
          </div>
          
          <div className="dashboard-section authors-section">
            <h3>Authors</h3>
            <div id="author-chart"></div>
          </div>
        </div>

        <div className="timeline-section">
          <div className="timeline-header">
            <h3>Daily Activity Timeline</h3>
            <button 
              className="btn btn-secondary"
              onClick={toggleDailyActivity}
            >
              {dailyActivityVisible ? 'Hide' : 'Show'} Timeline
            </button>
          </div>
          
          <div 
            className={`timeline-content ${dailyActivityVisible ? 'visible' : 'hidden'}`}
          >
            <div className="chart-box">
              <div className="reset-controls" style={{ display: rangeFilterActive ? 'block' : 'none' }}>
                range: <span className="filter">{dateRange}</span>
                <a className="reset-link" style={{cursor:'pointer'}} onClick={resetRangeFilter}>reset</a>

              </div>
              <div style={{width:'300px'}} id="line-chart"></div>
            </div>

            <div className="chart-box">
              <div id="range-chart"></div>
            </div>
            <p className="timeline-hint">
              Pinch to select a time range to zoom in
            </p>
          </div>
        </div>

        <div className="data-section">
        <SocialNetworkSection 
            data={filteredData} 
            hideNames={hideNames} 
            currentAuthor={currentAuthor} 
          />
          <StatisticsTable
            data={statisticsData}
            originalData={data?.getSocialInteractions || []}
            members={members}
            labels={labels}
            hideManagers={hideManagers}
            hideNames={hideNames}
            selectedView={selectedView}
            currentAuthor={currentAuthor}
            isManager={isManager}
            toggleManagers={toggleManagers}
          />
          <div className="data-count-section">
            <div className="dc-data-count">
              <span className="filter-count"></span> selected out of{' '}
              <span className="total-count"></span> records |{' '}
              <a href="javascript:void(0)" onClick={resetFilters} className="reset-all-link">
                Reset All
              </a>
            </div>
          </div>

          <MainDataTable data={filteredData} labels={labels} hideNames={hideNames} currentAuthor={currentAuthor} baseURL={baseURL}/>
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;