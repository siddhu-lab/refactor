import React, { useState, useEffect, useRef } from 'react';
import { Building2, Activity } from 'lucide-react';
import ActivityDashboard from './ActivityDashboard/ActivityDashboard.tsx';
import BuildonsPage from './AuthorNetwork/AuthorNetworkPage';
import './TabbedDashboard.css';

const TabbedDashboard = () => {
  const [activeTab, setActiveTab] = useState('activity-log');
  const [isScrolled, setIsScrolled] = useState(false);
  const tabHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Setting up scroll listeners...');
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      console.log('Window scroll detected:', scrollTop);
      const shouldBeScrolled = scrollTop > 50;
      console.log('Should be scrolled:', shouldBeScrolled);
      setIsScrolled(shouldBeScrolled);
    };

    // Window scroll
    window.addEventListener('scroll', handleScroll);
    
    // Check for scrollable containers
    const containers = ['.content', '.activity-container', '.dashboard-root', '.activity-dashboard'];
    const cleanupFunctions: (() => void)[] = [];
    
    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        console.log('Found scrollable container:', selector);
        const containerScrollHandler = () => {
          const scrollTop = container.scrollTop;
          console.log(`${selector} scroll detected:`, scrollTop);
          const shouldBeScrolled = scrollTop > 50;
          console.log('Should be scrolled:', shouldBeScrolled);
          setIsScrolled(shouldBeScrolled);
        };
        container.addEventListener('scroll', containerScrollHandler);
        cleanupFunctions.push(() => container.removeEventListener('scroll', containerScrollHandler));
      }
    });

    // Initial check
    handleScroll();
    
    return () => {
      console.log('Cleaning up scroll listeners...');
      window.removeEventListener('scroll', handleScroll);
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  console.log('Current isScrolled state:', isScrolled);
  const renderTabContent = () => {
    switch (activeTab) {
      case 'buildons':
        return <BuildonsPage />;
      case 'activity-log':
        return <ActivityDashboard />;
      default:
        return <ActivityDashboard />;
    }
  };

  return (
    <div className="tabbed-dashboard">
      <div ref={tabHeaderRef} className={`tab-header ${isScrolled ? 'scrolled' : ''}`}>
        <ul className="nav-tabs">
          <li className={activeTab === 'buildons' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('buildons'); }}>
              <Building2 size={18} />
              <span>Buildons</span>
            </a>
          </li>
          <li className={activeTab === 'activity-log' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('activity-log'); }}>
              <Activity size={18} />
              <span>Activity Log</span>
            </a>
          </li>
        </ul>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TabbedDashboard;