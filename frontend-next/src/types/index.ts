// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'manager' | 'cashier' | 'stock' | 'admin';
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  unit_price: number;
  cost_price: number;
  vat_rate: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  inventory?: Inventory;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Inventory Types
export interface Inventory {
  id: number;
  product_id: number;
  quantity: number;
  reorder_level: number;
  expiry_date?: string;
  batch_number?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

// Transaction Types
export interface Transaction {
  id: number;
  receipt_number: string;
  user_id: number;
  cash_session_id: number;
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: 'cash' | 'mpesa' | 'card' | 'bank';
  payment_reference?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  items?: TransactionItem[];
  user?: User;
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total: number;
  product?: Product;
}

// Cash Session Types
export interface CashSession {
  id: number;
  user_id: number;
  opening_amount: number;
  closing_amount?: number;
  expected_amount?: number;
  variance?: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  user?: User;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Purchase Order Types
export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'received' | 'cancelled';
  order_date: string;
  expected_date?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  user?: User;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  product?: Product;
}

// Alert Types
export interface Alert {
  id: number;
  type: 'low_stock' | 'expiry' | 'system' | 'security';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  related_type?: string;
  related_id?: number;
  created_at: string;
}

// Promotion Types
export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Stocktake Types
export interface Stocktake {
  id: number;
  reference_number: string;
  user_id: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  notes?: string;
  user?: User;
  items?: StocktakeItem[];
}

export interface StocktakeItem {
  id: number;
  stocktake_id: number;
  product_id: number;
  system_quantity: number;
  actual_quantity: number;
  variance: number;
  product?: Product;
}

// Cart Types (for POS)
export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
}

// Report Types
export interface SalesSummary {
  total_sales: number;
  total_transactions: number;
  average_transaction: number;
  total_vat: number;
  total_discount: number;
  period_start: string;
  period_end: string;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface CategoryPerformance {
  category_id: number;
  category_name: string;
  total_sales: number;
  total_quantity: number;
  percentage: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
