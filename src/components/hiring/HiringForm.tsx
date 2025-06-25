
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

interface HiringFormProps {
  requirement?: any;
  onClose: () => void;
}

const HiringForm = ({ requirement, onClose }: HiringFormProps) => {
  const [formData, setFormData] = useState({
    position_name: '',
    number_of_openings: 1,
    urgency: 'normal',
    experience_required: '',
    job_description: '',
    department_id: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (requirement) {
      setFormData({
        position_name: requirement.position_name || '',
        number_of_openings: requirement.number_of_openings || 1,
        urgency: requirement.urgency || 'normal',
        experience_required: requirement.experience_required || '',
        job_description: requirement.job_description || '',
        department_id: requirement.department_id || ''
      });
    }
  }, [requirement]);

  const createRequirement = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('hiring_requirements')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring-requirements'] });
      toast({
        title: "Hiring requirement created successfully",
        description: "The requirement has been added to your workspace.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating requirement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('hiring_requirements')
        .update(data)
        .eq('id', requirement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring-requirements'] });
      toast({
        title: "Hiring requirement updated successfully",
        description: "The requirement has been updated.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating requirement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      department_id: formData.department_id || null
    };
    
    if (requirement) {
      updateRequirement.mutate(submitData);
    } else {
      createRequirement.mutate(submitData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {requirement ? 'Edit Hiring Requirement' : 'Add New Hiring Requirement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="position_name">Position Name</Label>
            <Input
              id="position_name"
              value={formData.position_name}
              onChange={(e) => handleInputChange('position_name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number_of_openings">Number of Openings</Label>
              <Input
                id="number_of_openings"
                type="number"
                min="1"
                value={formData.number_of_openings}
                onChange={(e) => handleInputChange('number_of_openings', parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience_required">Experience Required</Label>
              <Input
                id="experience_required"
                value={formData.experience_required}
                onChange={(e) => handleInputChange('experience_required', e.target.value)}
                placeholder="e.g., 2-5 years"
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department_id} onValueChange={(value) => handleInputChange('department_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              value={formData.job_description}
              onChange={(e) => handleInputChange('job_description', e.target.value)}
              rows={4}
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequirement.isPending || updateRequirement.isPending}>
              {requirement ? 'Update Requirement' : 'Create Requirement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HiringForm;
