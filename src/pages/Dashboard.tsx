
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/layout/Header';
import TabNavigation from '@/components/layout/TabNavigation';
import DashboardTab from '@/components/dashboard/DashboardTab';
import ProjectsTab from '@/components/projects/ProjectsTab';
import ResourcesTab from '@/components/resources/ResourcesTab';
import EmployeesTab from '@/components/employees/EmployeesTab';
import HiringTab from '@/components/hiring/HiringTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', component: DashboardTab },
    { id: 'projects', label: 'Projects', component: ProjectsTab },
    { id: 'resources', label: 'Resources', component: ResourcesTab },
    { id: 'employees', label: 'Employee List', component: EmployeesTab },
    { id: 'hiring', label: 'Hiring', component: HiringTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DashboardTab;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="mt-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
