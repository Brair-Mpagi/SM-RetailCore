'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { promotionsAPI } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import { Plus, Tag } from 'lucide-react';

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionsAPI.getAll(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600 mt-1">Manage product promotions and discounts</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">Loading...</div>
        ) : !promotions?.data || promotions.data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No promotions found</p>
          </div>
        ) : (
          promotions.data.map((promo: any) => (
            <Card key={promo.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{promo.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{promo.description || 'No description'}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{promo.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">{promo.type === 'percentage' ? `${promo.value}%` : `UGX ${promo.value}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDateShort(promo.start_date)} - {formatDateShort(promo.end_date)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                  <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
