import * as d3 from 'd3';
import * as dc from 'dc';
import crossfilter from 'crossfilter2';
import { ActivityRecord } from './types';

if (typeof dc !== 'undefined' && typeof d3 !== 'undefined') {
  dc.config.defaultColors(d3.schemeCategory10);
  // Register the nester function for D3 v6 compatibility
  // DC.js expects d3.nest() but D3 v6 uses d3.group()
  if (!dc.utils.nester) {
    dc.utils.nester = function() {
      return {
        key: function(keyFunc) {
          this._key = keyFunc;
          return this;
        },
        entries: function(data) {
          if (!this._key) return data;
          const grouped = d3.group(data, this._key);
          return Array.from(grouped, ([key, values]) => ({ key, values }));
        }
      };
    };
  }
}

export const initializeCharts = (data: ActivityRecord[], hideNames: boolean, currentAuthor: { _id: string; role: string }) => {
  dc.deregisterAllCharts();

  const ndx = crossfilter(data);
  const all = ndx.groupAll();

  // Dimensions
  const dateDimension = ndx.dimension((d: ActivityRecord) => d.date);
  const dayDimension = ndx.dimension((d: ActivityRecord) => d.day);
  const typeDimension = ndx.dimension((d: ActivityRecord) => d.type);
  const authorDimension = ndx.dimension((d: ActivityRecord) => {
    const res = hideNames && d.fromId !== currentAuthor._id ? d.fromPseudo : d.from;
    return res;
  });
  const viewDimension = ndx.dimension((d: ActivityRecord) => {
    return d.view === undefined ? "Deleted" : d.view;
  });

  // Groups
  const readGroup = dayDimension.group().reduceSum((d: ActivityRecord) => d.read);
  const modifyGroup = dayDimension.group().reduceSum((d: ActivityRecord) => d.modified || 0);
  const typeGroup = typeDimension.group().reduceSum((d: ActivityRecord) => d.value);
  const authorGroup = authorDimension.group().reduceSum((d: ActivityRecord) => d.value);
  const viewGroup = viewDimension.group().reduceSum((d: ActivityRecord) => d.value);

  const blueColorScheme = [
    '#3b82f6', // blue
    '#60a5fa', // light blue
    '#93c5fd', // lighter blue
  ];

  // Color array for other charts
  const colorArrList = [
    '#e6550d', '#c75d44', '#f88098', '#ff9900', '#dc8a94',
    '#ffcc00', '#f4c81e', '#f6d44f', '#fae698', '#31a354'
  ];

  // Labels
  const labels: { [key: string]: string } = {};
  authorGroup.all().forEach((d: any) => {
    labels[d.key] = d.key;
  });

  // Views data for dropdown
  const viewsGroupData = viewGroup.all().map((d: any) => ({
    key: d.key,
    value: d.value
  }));

  // Date range
  const minDate = dateDimension.bottom(1)[0]?.date;
  const maxDate = dateDimension.top(1)[0]?.date;
  const domain = [minDate, maxDate];

  // Color scaling
  const maxAuthor = authorGroup.top(1)[0].value;
  const quantize = d3.scaleQuantile().domain([0, maxAuthor]).range(d3.range(10));

  // Charts
  const typeChart = dc.pieChart('#type-chart');
  const authorChart = dc.rowChart('#author-chart');
  const lineChart = dc.lineChart('#line-chart');
  const rangeChart = dc.barChart('#range-chart');
  const recordCount = dc.dataCount('.dc-data-count');

  // Type Chart Configuration with blue colors
  typeChart
    .width(200)
    .height(200)
    .radius(90)
    .innerRadius(0)
    .dimension(typeDimension)
    .group(typeGroup)
    .colors(d3.scaleOrdinal().range(blueColorScheme))
    .label((d: any) => {
      let label = d.key;
      if (typeChart.hasFilter() && !typeChart.hasFilter(label)) {
        return label + '(0)';
      }
      if (all.value()) {
        label += "(" + d.value + ")";
      }
      return label;
    })
    .on('renderlet', function(chart) {
      // Add selection feedback styling
      chart.selectAll('g.pie-slice')
        .style('opacity', function(d: any) {
          // If there are filters and this slice is not selected, make it semi-transparent
          if (chart.hasFilter() && !chart.hasFilter(d.data.key)) {
            return 0.3;
          }
          return 1.0;
        })
        .style('stroke-width', function(d: any) {
          // Add thicker border for selected slices
          if (chart.hasFilter() && chart.hasFilter(d.data.key)) {
            return '3px';
          }
          return '1px';
        })
        .style('stroke', function(d: any) {
          // Change border color for selected slices
          if (chart.hasFilter() && chart.hasFilter(d.data.key)) {
            return '#ffffff';
          }
          return '#ffffff';
        });
      
      // Add hover effects
      chart.selectAll('g.pie-slice')
        .on('mouseover', function(event: any, d: any) {
          d3.select(this)
            .style('opacity', 0.8)
            .style('cursor', 'pointer');
        })
        .on('mouseout', function(event: any, d: any) {
          d3.select(this)
            .style('opacity', function() {
              // Restore original opacity based on filter state
              if (chart.hasFilter() && !chart.hasFilter(d.data.key)) {
                return 0.3;
              }
              return 1.0;
            })
            .style('cursor', 'default');
        });
    });

  // Author Chart Configuration
  let heightRowChart = (authorGroup.all().length) * 25;
  if (heightRowChart <= 125) {
    heightRowChart = (authorGroup.all().length) * 50;
  }
  
  authorChart
    .width(600)
    .height(heightRowChart)
    .margins({ top: 20, left: 0, right: 0, bottom: 20 })
    .dimension(authorDimension)
    .group(authorGroup)
    .label((d: any) => labels[d.key] + ' (' + d.value + ')')
    .elasticX(true)
    .colors((d: any) => colorArrList[d])
    .colorAccessor((d: any) => quantize(d.value));

  // Configure x-axis separately
  authorChart.xAxis().ticks(4);

  // Add event listener to the chart object
  authorChart.on('renderlet', function(chart) {
    chart.selectAll('g.row')
      .style('opacity', function(d: any) {
        if (chart.hasFilter() && !chart.hasFilter(d.key)) {
          return 0.6;
        }
        return 1.0;
      });
    
    chart.selectAll('g.row rect')
      .style('opacity', function(d: any) {
        if (chart.hasFilter() && !chart.hasFilter(d.key)) {
          return 0.6;
        }
        return 1.0;
      })
      
      
      .style('filter', function(d: any) {
        if (chart.hasFilter() && chart.hasFilter(d.key)) {
          return 'drop-shadow(0 0 3px rgba(102, 102, 102, 0.5))';
        }
        return 'none';
      });
  
    chart.selectAll('g.row text')
      .style('opacity', function(d: any) {
        if (chart.hasFilter() && !chart.hasFilter(d.key)) {
          return 0.6; 
        }
        return 1.0;
      })
      .style('font-weight', function(d: any) {
        if (chart.hasFilter() && chart.hasFilter(d.key)) {
          return '600'; 
        }
        return 'normal';
      });
    
    // Add hover effects
    chart.selectAll('g.row')
      .on('mouseover', function(event: any, d: any) {
        d3.select(this)
          .style('opacity', 0.85)
          .style('cursor', 'pointer');
        
        d3.select(this).select('rect')
          .style('filter', 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))');
      })
      .on('mouseout', function(event: any, d: any) {
        d3.select(this)
          .style('opacity', function() {
            if (chart.hasFilter() && !chart.hasFilter(d.key)) {
              return 0.6;
            }
            return 1.0;
          })
          .style('cursor', 'default');
        
        d3.select(this).select('rect')
          .style('filter', function() {
            if (chart.hasFilter() && chart.hasFilter(d.key)) {
              return 'drop-shadow(0 0 3px rgba(102, 102, 102, 0.5))';
            }
            return 'none';
          });
      });
  });

  // Line Chart Configuration
  lineChart
    .renderArea(true)
    .width(900)
    .height(180)
    .transitionDuration(1000)
    .margins({ top: 30, right: 50, bottom: 25, left: 40 })
    .dimension(dayDimension)
    .group(modifyGroup, 'Modify')
    .valueAccessor((d: any) => d.value)
    .stack(readGroup, 'Read')
    .title((d: any) => {
      const value = isNaN(d.value) ? 0 : d.value;
      return d.key + '\n' + value;
    })
    .mouseZoomable(true)
    .rangeChart(rangeChart)
    .x(d3.scaleTime().domain(domain))
    .round(d3.timeMonth.round)
    .xUnits(d3.timeMonths)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .legend(dc.legend().x(800).y(30).itemHeight(13).gap(1))
    .brushOn(false)

  // Range Chart Configuration
  rangeChart
    .width(900)
    .height(40)
    .margins({ top: 0, right: 50, bottom: 20, left: 40 })
    .dimension(dayDimension)
    .group(readGroup)
    .centerBar(true)
    .gap(1)
    .x(d3.scaleTime().domain(domain))
    .round(d3.timeDay.round)
    .alwaysUseRounding(true)
    .xUnits(d3.timeDays)
    .yAxis().ticks(0);

  // Statistics calculations
  const groupedDimension = authorDimension.group().reduce(
    (p: any, v: ActivityRecord) => {
      p[v.type] += 1;
      p.total += 1;
      return p;
    },
    (p: any, v: ActivityRecord) => {
      p[v.type] -= 1;
      p.total -= 1;
      return p;
    },
    () => ({ read: 0, modified: 0, created: 0, total: 0 })
  );

  const statsData = groupedDimension.all().filter((d: any) => d.value.total > 0);
// const statsData = rawStatsData.map((d: any) => {
//   const isCurrentUserKey = data.some(record => {
//     const displayName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;
//     return displayName === d.key && record.fromId === currentAuthor._id;
//   });
  
//   if (isCurrentUserKey) {
//     const currentUserRecord = data.find(record => record.fromId === currentAuthor._id);
//     return {
//       ...d,
//       key: currentUserRecord ? currentUserRecord.from : d.key
//     };
//   }
  
//   return d;
// });


  // Record Count Configuration
  recordCount
    .dimension(ndx)
    .group(all);


  dc.renderAll();

  return { statsData, labelsData: labels, viewsGroupData, viewDim: viewDimension, ndx };
};