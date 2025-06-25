
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import HiringForm from './HiringForm';

const HiringTab = () => {
  const [showHiringForm, setShowHiringForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  const { data: requirements, isLoading, refetch } = useQuery({
    queryKey: ['hiring-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hiring_requirements')
        .select(`
          *,
          department:departments (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (requirement: any) => {
    setEditingRequirement(requirement);
    setShowHiringForm(true);
  };

  const handleCloseForm = () => {
    setShowHiringForm(false);
    setEditingRequirement(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Hiring Requirements</h2>
        <Button onClick={() => setShowHiringForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Requirement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requirements?.map((requirement) => (
          <Card key={requirement.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{requirement.position_name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{requirement.department?.name}</p>
                </div>
                <Badge className={getUrgencyColor(requirement.urgency)}>
                  {requirement.urgency}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Openings</p>
                    <p className="text-gray-900">{requirement.number_of_openings}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Experience</p>
                    <p className="text-gray-900">{requirement.experience_required}</p>
                  </div>
                </div>

                {requirement.job_description && (
                  <div>
                    <p className="font-medium text-gray-600 text-sm mb-1">Job Description</p>
                    <p className="text-gray-900 text-sm line-clamp-3">
                      {requirement.job_description}
                    </p>
                  </div>
                )}

                {requirement.job_document_url && (
                  <div className="flex items-center text-sm text-blue-600">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>Job Document Available</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(requirement)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {requirements?.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No hiring requirements found</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showHiringForm && (
        <HiringForm 
          requirement={editingRequirement}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default HiringTab;
