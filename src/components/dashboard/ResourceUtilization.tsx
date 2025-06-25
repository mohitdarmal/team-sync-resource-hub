
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Eye } from 'lucide-react';

const ResourceUtilization = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['resource-utilization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          employee:employees (name, designation, departments (name)),
          project:projects (name, project_id),
          role:roles (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-100 text-red-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Resource Utilization</CardTitle>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : assignments?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No assignments found</p>
        ) : (
          assignments?.map((assignment) => (
            <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{assignment.employee?.name}</h4>
                  <p className="text-sm text-gray-600">{assignment.employee?.designation}</p>
                  <p className="text-xs text-gray-500">{assignment.employee?.departments?.name}</p>
                </div>
                <Badge className={getUtilizationColor(assignment.utilization_percentage || 0)}>
                  {assignment.utilization_percentage}%
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <p><strong>Project:</strong> {assignment.project?.name}</p>
                <p><strong>Role:</strong> {assignment.role?.name}</p>
                <p><strong>Timeline:</strong> {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}</p>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceUtilization;
