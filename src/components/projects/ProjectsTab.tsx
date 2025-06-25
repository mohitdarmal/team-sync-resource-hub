
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Users, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectForm from './ProjectForm';

const ProjectsTab = () => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments (
            id,
            employee_id,
            role_id,
            start_date,
            end_date,
            lock_type,
            utilization_percentage,
            employee:employees (
              id,
              name,
              designation,
              departments (name)
            ),
            role:roles (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project deleted successfully",
        description: "The project has been removed from your workspace.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
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

  const handleDelete = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject.mutate(projectId);
    }
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
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600">Manage your projects and team assignments</p>
        </div>
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
                <div className="text-left">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(project.id)}
                    disabled={deleteProject.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Timeline</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {project.project_assignments?.length || 0}
                  </p>
                </div>
                <div className="text-left">
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
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className="text-sm text-gray-900">{new Date(project.end_date).toLocaleDateString()}</p>
                </div>
              </div>

              {project.project_assignments?.length > 0 && (
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-3">Team Assignments</h4>
                  <div className="space-y-3">
                    {project.project_assignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium text-gray-900">{assignment.employee?.name}</p>
                              <p className="text-sm text-gray-600">{assignment.employee?.designation}</p>
                              <p className="text-xs text-gray-500">{assignment.employee?.departments?.name}</p>
                            </div>
                            <div>
                              <Badge variant="secondary" className="text-xs">
                                {assignment.role?.name}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Assignment: {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getLockTypeColor(assignment.lock_type)} variant="outline">
                            {assignment.lock_type === 'hard' ? (
                              <Lock className="h-3 w-3 mr-1" />
                            ) : (
                              <Unlock className="h-3 w-3 mr-1" />
                            )}
                            {assignment.lock_type} lock
                          </Badge>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {assignment.utilization_percentage}%
                            </span>
                            <p className="text-xs text-gray-500">utilization</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {project.description && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                  <p className="text-sm text-gray-900">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {projects?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No projects found</p>
              <Button className="mt-4" onClick={() => setShowProjectForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
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
