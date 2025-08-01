import React, { useState } from 'react';
import { Home, BookOpen, TrendingUp, MessageSquare, Lightbulb, Activity, Layers } from 'lucide-react';
import TabbedDashboard from './TabbedDashboard.tsx';


const MainDashboard = () => {
  const [active, setActive] = useState('Dashboard');
  
  // Mock data for demo purposes
  const community = { title: 'Knowledge Forum Community' };
  const role = 'manager';
  const studentsResult = [
    { id: '1', firstName: 'John', lastName: 'Smith' },
    { id: '2', firstName: 'Sarah', lastName: 'Johnson' },
    { id: '3', firstName: 'Mike', lastName: 'Wilson' }
  ];

  const getDictionary = (event) => {
    console.log('Selected student:', event.target.value);
  };

  const renderContent = () => {
    
    switch (active) {
      case 'Activity':
        return <TabbedDashboard />;
      case 'Dictionary':
        return <div className="content-placeholder">Word Dictionary Component</div>;
      case 'Progress':
        return <div className="content-placeholder">Weekly Progress Component</div>;
      case 'Ideas':
        return <div className="content-placeholder">Ideas Building Component</div>;
      case 'History':
        return <div className="content-placeholder">Chat History Component</div>;
      default:
        return <div className="content-placeholder">Main Dashboard Component</div>;
    }
  };

  return (
    <div className="dashboard-root">
      <div className="header">
        <h1>{community ? community.title : 'Loading Community...'}</h1>
        {role === 'writer' ? (
          <h4>Student Name</h4>
        ) : (
          active !== 'Ideas' && active !== 'History' && (
            <select id='student-select' onChange={getDictionary}>
              <option value="">Select a student...</option>
              {studentsResult?.map((student, index) => (
                <option key={index} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          )
        )}
      </div>
      
      <div className="main">
        <div className='sidebar'>
          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'Dashboard' ? '#9B80BC' : '', 
              color: active === 'Dashboard' ? '#ffffff' : '#333333' 
            }} 
            onClick={() => {
              setActive('Dashboard');
            }}
          >
            <Home />
            <span>Dashboard</span>
          </div>
          
          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'Dictionary' ? '#9B80BC' : '', 
              color: active === 'Dictionary' ? '#ffffff' : '#333333' 
            }} 
            onClick={() => {
              setActive('Dictionary');
            }}
          >
            <BookOpen />
            <span>Word Dictionary</span>
          </div>
          
          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'Progress' ? '#9B80BC' : '', 
              color: active === 'Progress' ? '#ffffff' : '#333333' 
            }} 
            onClick={() => {
              setActive('Progress');
            }}
          >
            <TrendingUp />
            <span>Weekly Progress</span>
          </div>
          
          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'Ideas' ? '#9B80BC' : '', 
              color: active === 'Ideas' ? '#ffffff' : '#333333' 
            }} 
            onClick={() => {
              setActive('Ideas');
            }}
          >
            <Lightbulb />
            <span>Ideas Building</span>
          </div>

          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'History' ? '#9B80BC' : '', 
              color: active === 'History' ? '#ffffff' : '#333333', 
              margin: '15px 0' 
            }} 
            onClick={() => {
              setActive('History');
            }}
          >
            <MessageSquare />
            <span>Chat History</span>
          </div>
          
          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'Activity' ? '#9B80BC' : '', 
              color: active === 'Activity' ? '#ffffff' : '#333333', 
              margin: '15px 0' 
            }} 
            onClick={() => {
              setActive('Activity');
            }}
          >
            <Activity />
            <span>Activity Dashboard</span>
          </div>
          
          <div 
            className='main-sidebar' 
            style={{ 
              backgroundColor: active === 'Scaffold' ? '#9B80BC' : '', 
              color: active === 'Scaffold' ? '#ffffff' : '#333333', 
              margin: '15px 0' 
            }} 
            onClick={() => {
              setActive('Scaffold');
            }}
          >
            <Layers />
            <span>Scaffold Diversity</span>
          </div>
        </div>
        
        <div className="content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;