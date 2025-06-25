
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Users, UserCheck, Briefcase } from 'lucide-react';

const SummaryCards = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [projectsResult, employeesResult, assignmentsResult, hiringResult] = await Promise.all([
        supabase.from('projects').select('id, status').eq('status', 'active'),
        supabase.from('employees').select('id'),
        supabase.from('project_assignments').select('id, utilization_percentage'),
        supabase.from('hiring_requirements').select('id, urgency, number_of_openings')
      ]);

      const activeProjects = projectsResult.data?.length || 0;
      const totalEmployees = employeesResult.data?.length || 0;
      
      // Calculate team utilization
      const assignments = assignmentsResult.data || [];
      const avgUtilization = assignments.length > 0 
        ? Math.round(assignments.reduce((sum, a) => sum + (a.utilization_percentage || 0), 0) / assignments.length)
        : 0;
      
      // Calculate hiring stats
      const hiringReqs = hiringResult.data || [];
      const totalPositions = hiringReqs.reduce((sum, req) => sum + req.number_of_openings, 0);
      const urgentPositions = hiringReqs.filter(req => req.urgency === 'urgent').length;
      const mediumPositions = hiringReqs.filter(req => req.urgency === 'medium').length;
      const normalPositions = hiringReqs.filter(req => req.urgency === 'normal').length;

      return {
        activeProjects,
        totalEmployees,
        avgUtilization,
        totalPositions,
        urgentPositions,
        mediumPositions,
        normalPositions,
        availableResources: Math.max(0, totalEmployees - assignments.length)
      };
    },
  });

  const cards = [
    {
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Team Utilization',
      value: `${stats?.avgUtilization || 0}%`,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Available Resources',
      value: `${stats?.availableResources || 0} of ${stats?.totalEmployees || 0}`,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Hiring Needs',
      value: `${stats?.totalPositions || 0} positions`,
      subtitle: `${stats?.urgentPositions || 0} urgent, ${stats?.mediumPositions || 0} medium, ${stats?.normalPositions || 0} normal`,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SummaryCards;
