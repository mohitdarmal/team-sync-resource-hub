
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

interface ProjectFormProps {
  project?: any;
  onClose: () => void;
}

interface RoleAssignment {
  id: string;
  roleId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  lockType: 'hard' | 'soft';
  utilizationPercentage: number;
}

const ProjectForm = ({ project, onClose }: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    client_name: '',
    start_date: '',
    end_date: '',
    status: 'active',
    completion_percentage: 0,
    description: ''
  });

  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
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

  // Fetch available employees
  const { data: availableEmployees } = useQuery({
    queryKey: ['available-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments (name)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (project) {
      setFormData({
        project_id: project.project_id || '',
        name: project.name || '',
        client_name: project.client_name || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status || 'active',
        completion_percentage: project.completion_percentage || 0,
        description: project.description || ''
      });

      // Load existing role assignments properly
      if (project.project_assignments && project.project_assignments.length > 0) {
        const assignments = project.project_assignments.map((assignment: any, index: number) => ({
          id: assignment.id || `existing-${index}`,
          roleId: assignment.role_id || '',
          employeeId: assignment.employee_id || '',
          startDate: assignment.start_date || '',
          endDate: assignment.end_date || '',
          lockType: (assignment.lock_type || 'soft') as 'hard' | 'soft',
          utilizationPercentage: assignment.utilization_percentage || 100
        }));
        setRoleAssignments(assignments);
      }
    }
  }, [project]);

  const createProject = useMutation({
    mutationFn: async (data: any) => {
      // First create the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([data])
        .select()
        .single();
      
      if (projectError) throw projectError;

      // Then create role assignments
      if (roleAssignments.length > 0) {
        const assignmentData = roleAssignments.map(assignment => ({
          project_id: projectData.id,
          role_id: assignment.roleId,
          employee_id: assignment.employeeId,
          start_date: assignment.startDate,
          end_date: assignment.endDate,
          lock_type: assignment.lockType as 'hard' | 'soft',
          utilization_percentage: assignment.utilizationPercentage
        }));

        const { error: assignmentError } = await supabase
          .from('project_assignments')
          .insert(assignmentData);
        
        if (assignmentError) throw assignmentError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project created successfully",
        description: "The project has been added to your workspace.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: any) => {
      // Update project details
      const { error: projectError } = await supabase
        .from('projects')
        .update(data)
        .eq('id', project.id);
      
      if (projectError) throw projectError;

      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('project_assignments')
        .delete()
        .eq('project_id', project.id);
      
      if (deleteError) throw deleteError;

      // Create new assignments
      if (roleAssignments.length > 0) {
        const assignmentData = roleAssignments.map(assignment => ({
          project_id: project.id,
          role_id: assignment.roleId,
          employee_id: assignment.employeeId,
          start_date: assignment.startDate,
          end_date: assignment.endDate,
          lock_type: assignment.lockType as 'hard' | 'soft',
          utilization_percentage: assignment.utilizationPercentage
        }));

        const { error: assignmentError } = await supabase
          .from('project_assignments')
          .insert(assignmentData);
        
        if (assignmentError) throw assignmentError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project updated successfully",
        description: "The project has been updated.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (project) {
      updateProject.mutate(formData);
    } else {
      createProject.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRoleAssignment = () => {
    const newAssignment: RoleAssignment = {
      id: Date.now().toString(),
      roleId: '',
      employeeId: '',
      startDate: formData.start_date,
      endDate: formData.end_date,
      lockType: 'soft',
      utilizationPercentage: 100
    };
    setRoleAssignments([...roleAssignments, newAssignment]);
  };

  const removeRoleAssignment = (id: string) => {
    setRoleAssignments(roleAssignments.filter(assignment => assignment.id !== id));
  };

  const updateRoleAssignment = (id: string, field: string, value: any) => {
    setRoleAssignments(roleAssignments.map(assignment => 
      assignment.id === id ? { 
        ...assignment, 
        [field]: field === 'lockType' ? value as 'hard' | 'soft' : value 
      } : assignment
    ));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">
            {project ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <Label htmlFor="project_id">Project ID</Label>
              <Input
                id="project_id"
                value={formData.project_id}
                onChange={(e) => handleInputChange('project_id', e.target.value)}
                required
              />
            </div>
            <div className="text-left">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-left">
            <Label htmlFor="client_name">Client Name</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="text-left">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-left">
              <Label htmlFor="completion_percentage">Completion %</Label>
              <Input
                id="completion_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.completion_percentage}
                onChange={(e) => handleInputChange('completion_percentage', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="text-left">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Role Assignments Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Role Assignments</Label>
              <Button type="button" variant="outline" onClick={addRoleAssignment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>

            {roleAssignments.map((assignment, index) => (
              <div key={assignment.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Role Assignment #{index + 1}</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeRoleAssignment(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <Label>Select Role</Label>
                    <Select 
                      value={assignment.roleId} 
                      onValueChange={(value) => updateRoleAssignment(assignment.id, 'roleId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-left">
                    <Label>Select Employee</Label>
                    <Select 
                      value={assignment.employeeId} 
                      onValueChange={(value) => updateRoleAssignment(assignment.id, 'employeeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmployees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.designation} ({employee.departments?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-left">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={assignment.startDate}
                      onChange={(e) => updateRoleAssignment(assignment.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="text-left">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={assignment.endDate}
                      onChange={(e) => updateRoleAssignment(assignment.id, 'endDate', e.target.value)}
                    />
                  </div>
                  <div className="text-left">
                    <Label>Utilization %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={assignment.utilizationPercentage}
                      onChange={(e) => updateRoleAssignment(assignment.id, 'utilizationPercentage', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="text-left">
                  <Label>Lock Type</Label>
                  <Select 
                    value={assignment.lockType} 
                    onValueChange={(value) => updateRoleAssignment(assignment.id, 'lockType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">Soft Lock</SelectItem>
                      <SelectItem value="hard">Hard Lock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending || updateProject.isPending}>
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
