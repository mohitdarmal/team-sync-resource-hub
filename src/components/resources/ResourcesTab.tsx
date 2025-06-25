import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Lock, Unlock, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResourcesTab = () => {
  const [filterRole, setFilterRole] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['resource-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          employee:employees (
            name, 
            designation, 
            departments (name)
          ),
          project:projects (
            name, 
            project_id, 
            status,
            start_date,
            end_date
          ),
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

  const updateLockType = useMutation({
    mutationFn: async ({ assignmentId, lockType }: { assignmentId: string, lockType: 'hard' | 'soft' }) => {
      const { error } = await supabase
        .from('project_assignments')
        .update({ lock_type: lockType })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-assignments'] });
      toast({
        title: "Lock type updated successfully",
        description: "The resource lock type has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating lock type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const releaseResource = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-assignments'] });
      toast({
        title: "Resource released successfully",
        description: "The resource has been released from the project.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error releasing resource",
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

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleLockTypeChange = (assignmentId: string, newLockType: string) => {
    updateLockType.mutate({ assignmentId, lockType: newLockType as 'hard' | 'soft' });
  };

  const handleReleaseResource = (assignmentId: string) => {
    if (window.confirm('Are you sure you want to release this resource from the project?')) {
      releaseResource.mutate(assignmentId);
    }
  };

  const filteredAssignments = assignments?.filter(assignment => 
    filterRole === 'all' || assignment.role?.name === filterRole
  );

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
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-900">Resource Tracker</h2>
          <p className="text-gray-600">Track all assigned resources and their project allocations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={filterRole} onValueChange={setFilterRole}>
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

      <Card>
        <CardHeader>
          <CardTitle>Resource Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No resource assignments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Resource Details</th>
                    <th className="text-left py-3 px-2">Project Information</th>
                    <th className="text-left py-3 px-2">Assignment Timeline</th>
                    <th className="text-left py-3 px-2">Utilization</th>
                    <th className="text-left py-3 px-2">Lock Status</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments?.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-semibold text-gray-900">{assignment.employee?.name}</div>
                          <div className="text-sm text-gray-600">{assignment.employee?.designation}</div>
                          <div className="text-sm text-gray-500">{assignment.employee?.departments?.name}</div>
                          <div className="text-sm font-medium text-blue-600">{assignment.role?.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-medium text-gray-900">{assignment.project?.name}</div>
                          <div className="text-sm text-gray-600">ID: {assignment.project?.project_id}</div>
                          <Badge className={getStatusColor(assignment.project?.status || 'active')}>
                            {assignment.project?.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-sm">
                          <div><strong>Assignment:</strong></div>
                          <div>{new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}</div>
                          <div className="mt-1"><strong>Project:</strong></div>
                          <div>{new Date(assignment.project?.start_date).toLocaleDateString()} - {new Date(assignment.project?.end_date).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className={`font-medium ${getUtilizationColor(assignment.utilization_percentage || 0)}`}>
                          {assignment.utilization_percentage}%
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="space-y-2">
                          <Badge className={getLockTypeColor(assignment.lock_type)}>
                            {assignment.lock_type === 'hard' ? (
                              <Lock className="h-3 w-3 mr-1" />
                            ) : (
                              <Unlock className="h-3 w-3 mr-1" />
                            )}
                            {assignment.lock_type} lock
                          </Badge>
                          <Select 
                            value={assignment.lock_type} 
                            onValueChange={(value) => handleLockTypeChange(assignment.id, value)}
                          >
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="soft">Soft</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReleaseResource(assignment.id)}
                            disabled={releaseResource.isPending}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Release
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
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
    </div>
  );
};

export default ResourcesTab;
