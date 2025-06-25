
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Eye } from 'lucide-react';
import ProjectForm from '../projects/ProjectForm';

const ResourceUtilization = () => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const { data: assignments, isLoading, refetch } = useQuery({
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

  const handleEdit = (assignment: any) => {
    // For simplicity, we'll edit the project instead of individual assignment
    setEditingProject(assignment.project);
    setShowProjectForm(true);
  };

  const handleCloseForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    refetch();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Resource Utilization</CardTitle>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : assignments?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No assignments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Employee</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-left py-2">Project</th>
                    <th className="text-left py-2">Utilization</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments?.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-gray-900">{assignment.employee?.name}</div>
                          <div className="text-sm text-gray-600">{assignment.employee?.designation}</div>
                          <div className="text-xs text-gray-500">{assignment.employee?.departments?.name}</div>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{assignment.role?.name}</td>
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-gray-900">{assignment.project?.name}</div>
                          <div className="text-sm text-gray-600">ID: {assignment.project?.project_id}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={getUtilizationColor(assignment.utilization_percentage || 0)}>
                          {assignment.utilization_percentage}%
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(assignment)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showProjectForm && (
        <ProjectForm 
          project={editingProject}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};

export default ResourceUtilization;
