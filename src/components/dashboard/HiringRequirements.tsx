
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Eye } from 'lucide-react';
import HiringForm from '../hiring/HiringForm';

const HiringRequirements = () => {
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
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Hiring Requirements</CardTitle>
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
          ) : requirements?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hiring requirements found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Position</th>
                    <th className="text-left py-2">Department</th>
                    <th className="text-left py-2">Openings</th>
                    <th className="text-left py-2">Urgency</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements?.map((requirement) => (
                    <tr key={requirement.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-gray-900">{requirement.position_name}</div>
                          <div className="text-sm text-gray-600">{requirement.experience_required}</div>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{requirement.department?.name}</td>
                      <td className="py-3 text-sm text-gray-600">{requirement.number_of_openings}</td>
                      <td className="py-3">
                        <Badge className={getUrgencyColor(requirement.urgency)}>
                          {requirement.urgency}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(requirement)}
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

      {showHiringForm && (
        <HiringForm 
          requirement={editingRequirement}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};

export default HiringRequirements;
