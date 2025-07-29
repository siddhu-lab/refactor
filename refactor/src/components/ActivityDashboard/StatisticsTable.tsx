import React, { useState, useMemo } from 'react';
import { ActivityRecord } from './types';

interface StatisticsData {
  key: string;
  value: {
    read: number;
    modified: number;
    created: number;
    total: number;
  };
}

interface StatisticsTableProps {
  data: StatisticsData[];
  originalData: ActivityRecord[];
  members:[];
  labels: { [key: string]: string };
  hideManagers: boolean;
  hideNames: boolean;
  selectedView: string;
  currentAuthor: { _id: string; role: string; name: string };
  isManager: boolean;
  toggleManagers: () => void;
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({ data, originalData = [], members, labels, hideManagers, hideNames, selectedView, currentAuthor, isManager, toggleManagers }) => {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const managerNames = members
        .filter((author: any) => author.role === 'manager')
        .flatMap((author: any) => [
          `${author.firstName} ${author.lastName}`,
          author.pseudoName
        ])
        .filter(Boolean); 

  // Filter data based on search term
  const filteredData = useMemo(() => {
    let res = data;
    if (hideManagers) {
      res = res.filter(d =>
        !managerNames.includes(d.key)
      );
    }
    if (searchTerm) {
      res = res.filter(item => 
        labels[item.key]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return res;
  }, [data, searchTerm, labels, hideManagers]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, entriesPerPage]);

  // Calculate totals and averages
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        read: acc.read + item.value.read,
        modified: acc.modified + item.value.modified,
        created: acc.created + item.value.created,
        total: acc.total + item.value.total,
      }),
      { read: 0, modified: 0, created: 0, total: 0 }
    );
  }, [filteredData]);

  const classAverages = useMemo(() => {
    const allUserStats: { [key: string]: { read: number; modified: number; created: number; total: number } } = {};
    
    originalData.forEach(record => {
      const userName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;

      if (hideManagers && managerNames.includes(userName)) return;
      
      if (!allUserStats[userName]) {
        allUserStats[userName] = { read: 0, modified: 0, created: 0, total: 0 };
      }
      
      allUserStats[userName][record.type as keyof typeof allUserStats[userName]] += 1;
      allUserStats[userName].total += 1;
    });

    const allUserTotals = Object.values(allUserStats).reduce(
      (acc, userStats) => ({
        read: acc.read + userStats.read,
        modified: acc.modified + userStats.modified,
        created: acc.created + userStats.created,
        total: acc.total + userStats.total,
      }),
      { read: 0, modified: 0, created: 0, total: 0 }
    );
    const userCount = Object.keys(allUserStats).length || 1;
    return {
      read: (allUserTotals.read / userCount).toFixed(2),
      modified: (allUserTotals.modified / userCount).toFixed(2),
      created: (allUserTotals.created / userCount).toFixed(2),
      total: (allUserTotals.total / userCount).toFixed(2),
    };
  }, [originalData, currentAuthor._id, hideNames, hideManagers]);

  const viewAverages = useMemo(() => {
    if (!selectedView) return null;

    const viewData = originalData.filter(record => {
      const recordView = record.view === undefined ? "Deleted" : record.view;
      return recordView === selectedView;
    });

    if (viewData.length === 0) return null;

    const viewUserStats: { [key: string]: { read: number; modified: number; created: number; total: number } } = {};
    
    viewData.forEach(record => {
      const userName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;

      if (hideManagers && managerNames.includes(userName)) return;
      
      if (!viewUserStats[userName]) {
        viewUserStats[userName] = { read: 0, modified: 0, created: 0, total: 0 };
      }
      
      viewUserStats[userName][record.type as keyof typeof viewUserStats[userName]] += 1;
      viewUserStats[userName].total += 1;
    });

    const viewUserTotals = Object.values(viewUserStats).reduce(
      (acc, userStats) => ({
        read: acc.read + userStats.read,
        modified: acc.modified + userStats.modified,
        created: acc.created + userStats.created,
        total: acc.total + userStats.total,
      }),
      { read: 0, modified: 0, created: 0, total: 0 }
    );

    const viewUserCount = Object.keys(viewUserStats).length || 1;
    return {
      read: (viewUserTotals.read / viewUserCount).toFixed(2),
      modified: (viewUserTotals.modified / viewUserCount).toFixed(2),
      created: (viewUserTotals.created / viewUserCount).toFixed(2),
      total: (viewUserTotals.total / viewUserCount).toFixed(2),
    };
  }, [originalData, selectedView, currentAuthor._id, hideNames, hideManagers]);


  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, filteredData.length);

  // Export functions
  const exportToCSV = () => {
    const headers = ['User', 'Read', 'Modified', 'Created', 'Total'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${labels[item.key]}"`,
        item.value.read,
        item.value.modified,
        item.value.created,
        item.value.total
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_activity_statistics.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const headers = ['User', 'Read', 'Modified', 'Created', 'Total'];
    const csvContent = [
      headers.join('\t'),
      ...filteredData.map(item => [
        labels[item.key],
        item.value.read,
        item.value.modified,
        item.value.created,
        item.value.total
      ].join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_activity_statistics.xls');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewAveragesRow = viewAverages ? `
  <tr class="totals">
    <td>${selectedView} Average</td>
    <td>${viewAverages.read}</td>
    <td>${viewAverages.modified}</td>
    <td>${viewAverages.created}</td>
    <td>${viewAverages.total}</td>
  </tr>
` : '';


  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>User Activity Statistics</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .totals { background-color: #f8f9fa; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>User Activity Statistics</h1>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Read</th>
                  <th>Modified</th>
                  <th>Created</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(item => `
                  <tr>
                    <td>${labels[item.key]}</td>
                    <td>${item.value.read}</td>
                    <td>${item.value.modified}</td>
                    <td>${item.value.created}</td>
                    <td>${item.value.total}</td>
                  </tr>
                `).join('')}
                <tr class="totals">
                  <td>Selected total</td>
                  <td>${totals.read}</td>
                  <td>${totals.modified}</td>
                  <td>${totals.created}</td>
                  <td>${totals.total}</td>
                </tr>
                ${viewAveragesRow}
                <tr class="totals">
                  <td>Class Average</td>
                  <td>${classAverages.read}</td>
                  <td>${classAverages.modified}</td>
                  <td>${classAverages.created}</td>
                  <td>${classAverages.total}</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="statistics-table-section">
      <div className="table-header">
        <h3>User Activity Statistics</h3>
        {selectedView && (
          <div style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic', marginTop: '0.25rem' }}>
            View filter active: <strong>{selectedView}</strong>
          </div>
        )}
      </div>
      
      <div className="table-controls">
        <div className="control-group">
          <label>Show</label>
          <select 
            className="entries-select"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
        
        <div className="control-group">
          <label>Search:</label>
          <input
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search users..."
          />
        </div>
        
        <div className="export-controls">
          <button 
                className={`btn ${isManager ? 'btn-export' : 'btn-disabled'}`}
                onClick={toggleManagers}
              >
                {hideManagers ? 'Include' : 'Exclude'} Managers
          </button>
          <button className="btn btn-export" onClick={exportToCSV}>CSV</button>
          <button className="btn btn-export" onClick={exportToExcel}>Excel</button>
          <button className="btn btn-export" onClick={exportToPDF}>PDF</button>
        </div>
      </div>

      <div className="table-info">
        Showing {startEntry} to {endEntry} of {filteredData.length} entries
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Read</th>
              <th>Modified</th>
              <th>Created</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={item.key}>
                <td>{labels[item.key]}</td>
                <td>{item.value.read}</td>
                <td>{item.value.modified}</td>
                <td>{item.value.created}</td>
                <td>{item.value.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <th>Selected total</th>
              <th>{totals.read}</th>
              <th>{totals.modified}</th>
              <th>{totals.created}</th>
              <th>{totals.total}</th>
            </tr>
            {viewAverages && (
              <tr className="totals-row" style={{ backgroundColor: '#e3f2fd' }}>
                <th>{selectedView} View Average</th>
                <th>{viewAverages.read}</th>
                <th>{viewAverages.modified}</th>
                <th>{viewAverages.created}</th>
                <th>{viewAverages.total}</th>
              </tr>
            )}
            <tr className="totals-row">
              <th>Class Average</th>
              <th>{classAverages.read}</th>
              <th>{classAverages.modified}</th>
              <th>{classAverages.created}</th>
              <th>{classAverages.total}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <div className="pagination">
            <button 
              className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹ Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsTable;