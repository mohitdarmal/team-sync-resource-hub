
import React from 'react';
import SummaryCards from './SummaryCards';
import RecentProjects from './RecentProjects';
import ResourceUtilization from './ResourceUtilization';
import HiringRequirements from './HiringRequirements';

const DashboardTab = () => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards />
      
      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecentProjects />
        </div>
        <div className="lg:col-span-1">
          <ResourceUtilization />
        </div>
        <div className="lg:col-span-1">
          <HiringRequirements />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
