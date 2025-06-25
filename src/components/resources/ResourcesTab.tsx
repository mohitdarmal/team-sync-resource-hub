
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Lock, Unlock } from 'lucide-react';

const ResourcesTab = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['resource-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          employee:employees (name, designation, departments (name)),
          project:projects (name, project_id, status),
          role:roles (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLockTypeColor = (lockType: string) => {
    return lockType === 'hard' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Resource Tracker</h2>
        <div className="flex items-center space-x-4">
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles?.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {assignments?.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Employee Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{assignment.employee?.name}</h3>
                    <p className="text-sm text-gray-600">{assignment.employee?.designation}</p>
                    <p className="text-xs text-gray-500">{assignment.employee?.departments?.name}</p>
                  </div>

                  {/* Project Info */}
                  <div>
                    <p className="font-medium text-gray-900">{assignment.project?.name}</p>
                    <p className="text-sm text-gray-600">ID: {assignment.project?.project_id}</p>
                    <Badge className={getStatusColor(assignment.project?.status || 'active')}>
                      {assignment.project?.status?.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Assignment Details */}
                  <div>
                    <p className="font-medium text-gray-900">{assignment.role?.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                    </p>
                    <p className={`text-sm font-medium ${getUtilizationColor(assignment.utilization_percentage || 0)}`}>
                      Utilization: {assignment.utilization_percentage}%
                    </p>
                  </div>

                  {/* Lock Status */}
                  <div className="flex flex-col items-end">
                    <Badge className={getLockTypeColor(assignment.lock_type)}>
                      {assignment.lock_type === 'hard' ? (
                        <Lock className="h-3 w-3 mr-1" />
                      ) : (
                        <Unlock className="h-3 w-3 mr-1" />
                      )}
                      {assignment.lock_type} lock
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    Release
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No resource assignments found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;
