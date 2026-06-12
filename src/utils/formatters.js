// Utility functions for formatting data

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDaysToExpiry = (expiryDate) => {
  if (!expiryDate || expiryDate === '0000-00-00') return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry - today;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// Constants
export const VAT_RATE = 0.18;

export const PAYMENT_LABELS = {
  cash: 'Cash',
  mtn_momo: 'MTN MoMo',
  airtel_money: 'Airtel Money'
};

export const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  voided: 'bg-gray-100 text-gray-800',
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800'
};

export const ROLE_COLORS = {
  admin:   'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30',
  manager: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30',
  cashier: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  stock:   'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30'
};
