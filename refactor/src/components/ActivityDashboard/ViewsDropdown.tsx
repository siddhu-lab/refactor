import React, { useState, useEffect, useRef } from 'react';

const ViewsDropdown = ({ views, onViewSelect, selectedView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredViews = views.filter(view =>
    view.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedViewData = views.find(view => view.key === selectedView);
  const displayText = selectedViewData ? `${selectedViewData.key} (${selectedViewData.value})` : 'Select all';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewSelect = (viewKey: string) => {
    onViewSelect(viewKey);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="anmember-select-container" ref={dropdownRef}>
      <div 
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayText}</span>
        <span className="caret"></span>
      </div>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search views..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="dropdown-scroll-area">
            <ul className="inner-scroll-list">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); handleViewSelect(''); }}>
                  <div>All Views</div>
                  <small>Show all records</small>
                </a>
              </li>
              {filteredViews.length > 0 ? (
                filteredViews.map((view) => (
                  <li key={view.key}>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleViewSelect(view.key); }}>
                      <div>{view.key}</div>
                      <small>{view.value} records</small>
                    </a>
                  </li>
                ))
              ) : (
                <li>
                  <div className="text-muted">No views found</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewsDropdown;