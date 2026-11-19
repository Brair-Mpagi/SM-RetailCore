'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inventoryAPI, productsAPI } from '@/lib/api';
import { Search, Package, Plus, Minus, AlertCircle } from 'lucide-react';
import { Product } from '@/types';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll(),
  });

  const adjustStock = useMutation({
    mutationFn: (data: any) => inventoryAPI.updateStock(data.productId, data.quantity, data.type, data.reason),
    onSuccess: () => {
      toast.success('Stock updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProduct(null);
      setQuantity('');
      setReason('');
    },
    onError: () => {
      toast.error('Failed to update stock');
    },
  });

  const handleAdjustStock = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Please fill all fields');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    adjustStock.mutate({
      productId: selectedProduct.id,
      quantity: adjustmentType === 'out' ? -qty : qty,
      type: adjustmentType,
      reason,
    });
  };

  const filteredProducts = products?.data?.data?.filter((product: Product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const lowStockProducts = filteredProducts.filter((product: Product) =>
    (product.inventory?.quantity || 0) <= (product.inventory?.reorder_level || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Monitor and adjust stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{lowStockProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              UGX {filteredProducts.reduce((sum: number, p: Product) => 
                sum + (p.cost_price * (p.inventory?.quantity || 0)), 0
              ).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search inventory..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading inventory...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Reorder Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product: Product) => {
                        const stock = product.inventory?.quantity || 0;
                        const reorderLevel = product.inventory?.reorder_level || 0;
                        const isLowStock = stock <= reorderLevel;

                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {product.sku}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                {stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {reorderLevel}
                            </td>
                            <td className="px-6 py-4">
                              {isLowStock ? (
                                <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                                  <AlertCircle className="w-4 h-4" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="text-green-600 text-sm font-medium">In Stock</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                Adjust
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Adjustment Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Stock Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct ? (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Selected Product</p>
                    <p className="font-semibold text-gray-900 mt-1">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Current Stock: <span className="font-medium">{selectedProduct.inventory?.quantity || 0}</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Adjustment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={adjustmentType === 'in' ? 'default' : 'outline'}
                        className="flex items-center justify-center gap-2"
                        onClick={() => setAdjustmentType('in')}
                      >
                        <Plus className="w-4 h-4" />
                        Stock In
                      </Button>
                      <Button
                        variant={adjustmentType === 'out' ? 'destructive' : 'outline'}
                        className="flex items-center justify-center gap-2"
                        onClick={() => setAdjustmentType('out')}
                      >
                        <Minus className="w-4 h-4" />
                        Stock Out
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Reason</label>
                    <Input
                      placeholder="e.g., Received from supplier"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleAdjustStock}
                      disabled={adjustStock.isPending}
                    >
                      {adjustStock.isPending ? 'Updating...' : 'Update Stock'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(null);
                        setQuantity('');
                        setReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Select a product to adjust stock</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
