'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, transactionsAPI, cashSessionsAPI } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { Product } from '@/types';

export default function POSPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getVATAmount,
    getTotal,
    getItemCount,
  } = useCartStore();

  // Fetch cash session
  const { data: cashSession } = useQuery({
    queryKey: ['cash-session'],
    queryFn: () => cashSessionsAPI.getCurrent(),
  });

  // Search products
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['products-search', searchQuery],
    queryFn: () => productsAPI.search(searchQuery),
    enabled: searchQuery.length > 2,
  });

  // Get all products
  const { data: allProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll({ limit: 50 }),
  });

  // Create transaction mutation
  const createTransaction = useMutation({
    mutationFn: (data: any) => transactionsAPI.create(data),
    onSuccess: (response) => {
      toast.success(`Transaction completed! Receipt: ${response.data.receipt_number}`);
      clearCart();
      setAmountPaid('');
      setCustomerName('');
      setCustomerPhone('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Transaction failed');
    },
  });

  const handleAddToCart = (product: Product) => {
    if (!product.inventory || product.inventory.quantity < 1) {
      toast.error('Product out of stock');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!cashSession?.data) {
      toast.error('No active cash session. Please open a session first.');
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    const total = getTotal();

    if (paymentMethod === 'cash' && paid < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    const transactionData = {
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.unit_price,
      })),
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'cash' ? paid : total,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
    };

    createTransaction.mutate(transactionData);
  };

  const displayProducts = searchQuery.length > 2
    ? searchResults?.data || []
    : allProducts?.data?.data || [];

  const subtotal = getSubtotal();
  const vatAmount = getVATAmount();
  const total = getTotal();
  const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(amountPaid || '0') - total) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
        <div className="text-sm text-gray-600">
          Cashier: <span className="font-medium">{user?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search products by name, SKU, or scan barcode..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {searchLoading ? (
                  <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
                ) : displayProducts.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    {searchQuery ? 'No products found' : 'No products available'}
                  </div>
                ) : (
                  displayProducts.map((product: Product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                      disabled={!product.inventory || product.inventory.quantity < 1}
                    >
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="text-lg font-bold text-blue-600 mt-1">
                        {formatCurrency(product.unit_price)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Stock: {product.inventory?.quantity || 0}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout Section */}
        <div className="space-y-4">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({getItemCount()} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Cart is empty</p>
                ) : (
                  items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(item.product.unit_price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-semibold text-sm">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <>
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">VAT (18%):</span>
                      <span className="font-medium">{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full"
                    size="sm"
                    onClick={() => clearCart()}
                  >
                    Clear Cart
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className="flex-col h-auto py-3"
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <Banknote className="h-5 w-5 mb-1" />
                      <span className="text-xs">Cash</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                      className="flex-col h-auto py-3"
                      onClick={() => setPaymentMethod('mpesa')}
                    >
                      <Smartphone className="h-5 w-5 mb-1" />
                      <span className="text-xs">M-Pesa</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className="flex-col h-auto py-3"
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Card</span>
                    </Button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Amount Paid</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                      />
                    </div>
                    {amountPaid && parseFloat(amountPaid) >= total && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700 font-medium">Change:</span>
                          <span className="text-green-700 font-bold">
                            {formatCurrency(change)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Customer Name (Optional)</label>
                  <Input
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone (Optional)</label>
                  <Input
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={createTransaction.isPending}
                >
                  {createTransaction.isPending ? 'Processing...' : `Complete Sale - ${formatCurrency(total)}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
