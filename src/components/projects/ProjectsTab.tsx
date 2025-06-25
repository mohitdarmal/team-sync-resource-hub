
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import ProjectForm from './ProjectForm';

const ProjectsTab = () => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments (
            id,
            employee:employees (name),
            role:roles (name),
            start_date,
            end_date,
            lock_type,
            utilization_percentage
          )
        `)
        .order('created_at', { ascending: false });
      
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

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleCloseForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <Button onClick={() => setShowProjectForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Project
        </Button>
      </div>

      <div className="grid gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <p className="text-gray-600 mt-1">{project.client_name}</p>
                  <p className="text-sm text-gray-500 mt-1">Project ID: {project.project_id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Timeline</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {project.project_assignments?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${project.completion_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{project.completion_percentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className="text-sm text-gray-900">{new Date(project.end_date).toLocaleDateString()}</p>
                </div>
              </div>

              {project.project_assignments?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Team Assignments</h4>
                  <div className="space-y-2">
                    {project.project_assignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{assignment.employee?.name}</p>
                          <p className="text-sm text-gray-600">{assignment.role?.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getLockTypeColor(assignment.lock_type)}>
                            {assignment.lock_type} lock
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {assignment.utilization_percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showProjectForm && (
        <ProjectForm 
          project={editingProject}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default ProjectsTab;
