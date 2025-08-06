import React, { useState, useMemo } from 'react';
import { ActivityRecord } from '../types.ts';
import Modal from './Modal.tsx';

interface MainDataTableProps {
  data: ActivityRecord[];
  labels: { [key: string]: string };
  hideNames: boolean;
  currentAuthor: { _id: string; role: string; name: string };
  baseURL: string;
}

const MainDataTable: React.FC<MainDataTableProps> = ({ data, labels, hideNames, currentAuthor, baseURL }) => {
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log(data);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => {
      const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
      return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, hideNames, currentAuthor._id]);

  // Sort data by date (most recent first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData]);

  // Group data by year/month
  const groupedData = useMemo(() => {
    const groups: { [key: string]: ActivityRecord[] } = {};
    
    sortedData.forEach(item => {
      const format = (num: number) => num.toString().padStart(2, '0');
      const groupKey = `${item.date.getFullYear()}/${format(item.date.getMonth() + 1)}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  }, [sortedData]);

  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / entriesPerPage);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, entriesPerPage]);


  const displayData = useMemo(() => {
    const grouped: { [key: string]: ActivityRecord[] } = {};
    
    paginatedRecords.forEach(item => {
      const format = (num: number) => num.toString().padStart(2, '0');
      const groupKey = `${item.date.getFullYear()}/${format(item.date.getMonth() + 1)}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });

    const flattened: (ActivityRecord | { isGroupHeader: true; groupKey: string })[] = [];
    
    Object.entries(grouped).forEach(([groupKey, items]) => {
      flattened.push({ isGroupHeader: true, groupKey });
      flattened.push(...items);
    });
    
    return flattened;
  }, [paginatedRecords]);

  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalRecords);

  // Export functions
  const exportToCSV = () => {
    const headers = ['Date', 'Action', 'Title', 'User'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(item => {
        const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
        return [
          `"${item.date.toLocaleDateString()}"`,
          `"${item.type}"`,
          `"${item.title}"`,
          `"${displayName}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRecordClick = (record: ActivityRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const exportToExcel = () => {
    const headers = ['Date', 'Action', 'Title', 'User'];
    const csvContent = [
      headers.join('\t'),
      ...sortedData.map(item => {
        const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
        return [
          item.date.toLocaleDateString(),
          item.type,
          item.title,
          displayName
        ].join('\t');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_records.xls');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Activity Records</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .group-header { background-color: #e9ecef; font-weight: bold; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Activity Records</h1>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Title</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(groupedData).map(([groupKey, items]) => `
                  <tr class="group-header">
                    <td colspan="4">${groupKey}</td>
                  </tr>
                  ${items.map(item => {
                    const displayName = hideNames && item.fromId !== currentAuthor._id ? item.fromPseudo : item.from;
                    return `
                      <tr>
                        <td>${item.date.toLocaleDateString()}</td>
                        <td>${item.type}</td>
                        <td>${item.title}</td>
                        <td>${displayName}</td>
                      </tr>
                    `;
                  }).join('')}
                `).join('')}
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
    <div className="main-data-table-section">
      <div className="table-header">
        <h3>Activity Records</h3>
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
            placeholder="Search records..."
          />
        </div>
        
        <div className="export-controls">
          <button className="btn btn-export" onClick={exportToCSV}>CSV</button>
          <button className="btn btn-export" onClick={exportToExcel}>Excel</button>
          <button className="btn btn-export" onClick={exportToPDF}>PDF</button>
        </div>
      </div>

      <div className="table-info">
        Showing {startEntry} to {endEntry} of {totalRecords} entries
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Action</th>
              <th>Title</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((item, index) => {
              if ('isGroupHeader' in item && item.isGroupHeader) {
                return (
                  <tr key={`group-${item.groupKey}`} className="group-header">
                    <td colSpan={4}>
                      {item.groupKey}
                    </td>
                  </tr>
                );
              } else {
                const record = item as ActivityRecord;
                const displayName = hideNames && record.fromId !== currentAuthor._id ? record.fromPseudo : record.from;
                return (
                  <tr key={`${record.id}-${index}`}>
                    <td>{record.date.toLocaleDateString()}</td>
                    <td>
                      <span className={`action-badge action-${record.type}`}>
                        {record.type}
                      </span>
                    </td>
                    <td>
                      <a
                        className="title-link"
                        href={`${baseURL}/contribution/${record.ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {record.title}
                      </a>
                    </td>

                    <td>{displayName}</td>
                  </tr>
                );
              }
            })}
          </tbody>
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
            
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let page;
              if (totalPages <= 10) {
                page = i + 1;
              } else if (currentPage <= 5) {
                page = i + 1;
              } else if (currentPage >= totalPages - 4) {
                page = totalPages - 9 + i;
              } else {
                page = currentPage - 4 + i;
              }
              
              return (
                <button 
                  key={page} 
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            
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
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRecord?.title || 'Record Details'}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <strong>Date:</strong> {selectedRecord.date.toLocaleDateString()}
                </div>
                <div>
                  <strong>Action:</strong> <span className={`action-badge action-${selectedRecord.type}`}>{selectedRecord.type}</span>
                </div>
                <div>
                  <strong>Author:</strong> {hideNames && selectedRecord.fromId !== currentAuthor._id ? selectedRecord.fromPseudo : selectedRecord.from}
                </div>
                <div>
                  <strong>View:</strong> {selectedRecord.view}
                </div>
              </div>
            </div>
            <div 
              dangerouslySetInnerHTML={{ __html: selectedRecord.data.body }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MainDataTable;