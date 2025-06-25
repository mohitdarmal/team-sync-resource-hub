
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
  const [filterDepartment, setFilterDepartment] = useState('all');
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
            id,
            name, 
            designation, 
            employee_id,
            departments (
              id,
              name
            )
          ),
          project:projects (
            id,
            name, 
            project_id, 
            status,
            start_date,
            end_date,
            client_name
          ),
          role:roles (
            id,
            name
          )
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

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
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

  // Group assignments by employee to handle multiple project assignments
  const groupedAssignments = assignments?.reduce((acc: any, assignment) => {
    const employeeId = assignment.employee_id;
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee: assignment.employee,
        assignments: []
      };
    }
    acc[employeeId].assignments.push(assignment);
    return acc;
  }, {});

  const filteredGroupedAssignments = Object.values(groupedAssignments || {}).filter((group: any) => {
    const matchesRole = filterRole === 'all' || group.assignments.some((assignment: any) => assignment.role?.name === filterRole);
    const matchesDepartment = filterDepartment === 'all' || group.employee?.departments?.name === filterDepartment;
    return matchesRole && matchesDepartment;
  });

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
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map((department) => (
                <SelectItem key={department.id} value={department.name}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredGroupedAssignments?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No resource assignments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredGroupedAssignments?.map((group: any) => (
            <Card key={group.employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="text-left">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {group.employee.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{group.employee.designation}</p>
                    <p className="text-sm text-gray-500">{group.employee.departments?.name}</p>
                    <p className="text-xs text-gray-400">Employee ID: {group.employee.employee_id}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {group.assignments.length} Project{group.assignments.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.assignments.map((assignment: any) => (
                    <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
                        {/* Project Information */}
                        <div className="lg:col-span-2 text-left">
                          <h4 className="font-medium text-gray-900">{assignment.project?.name}</h4>
                          <p className="text-sm text-gray-600">ID: {assignment.project?.project_id}</p>
                          <p className="text-sm text-gray-600">Client: {assignment.project?.client_name}</p>
                          <Badge className={getStatusColor(assignment.project?.status || 'active')} variant="outline">
                            {assignment.project?.status?.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Role & Timeline */}
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-600">{assignment.role?.name}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            <p><strong>Assignment:</strong></p>
                            <p>{new Date(assignment.start_date).toLocaleDateString()}</p>
                            <p>to {new Date(assignment.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Project Timeline */}
                        <div className="text-left">
                          <p className="text-xs text-gray-500">
                            <strong>Project Timeline:</strong>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(assignment.project?.start_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            to {new Date(assignment.project?.end_date).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Utilization */}
                        <div className="text-left">
                          <p className="text-xs text-gray-500 mb-1">Utilization</p>
                          <div className={`font-medium ${getUtilizationColor(assignment.utilization_percentage || 0)}`}>
                            {assignment.utilization_percentage}%
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getLockTypeColor(assignment.lock_type)} variant="outline">
                              {assignment.lock_type === 'hard' ? (
                                <Lock className="h-3 w-3 mr-1" />
                              ) : (
                                <Unlock className="h-3 w-3 mr-1" />
                              )}
                              {assignment.lock_type}
                            </Badge>
                          </div>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReleaseResource(assignment.id)}
                            disabled={releaseResource.isPending}
                            className="text-xs"
                          >
                            <UserMinus className="h-3 w-3 mr-1" />
                            Release
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;
