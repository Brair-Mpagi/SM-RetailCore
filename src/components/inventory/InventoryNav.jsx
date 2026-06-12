import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = ['Overview', 'Products', 'Purchase Requests', 'Purchase Orders', 'Categories', 'Suppliers', 'Shelf Tags', 'Barcode Labels'];

export default function InventoryNav({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (t) => {
    if (t === 'Shelf Tags') {
      navigate('/dashboard/inventory/print-tags');
    } else if (t === 'Barcode Labels') {
      navigate('/dashboard/inventory/barcode-labels');
    } else if (t === 'Categories') {
      navigate('/dashboard/inventory/categories');
    } else if (t === 'Suppliers') {
      navigate('/dashboard/inventory/suppliers');
    } else {
      // It's Overview, Products, Purchase Requests, or Purchase Orders
      if (location.pathname === '/dashboard/inventory') {
        if (onTabChange) onTabChange(t);
      } else {
        navigate('/dashboard/inventory', { state: { tab: t } });
      }
    }
  };

  return (
    <div className="flex gap-2 border-b border-theme dark:border-white/10 pb-2 mb-5 overflow-x-auto">
      {TABS.map(t => (
        <button key={t} onClick={() => handleTabClick(t)}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === t ? 'bg-brand-600 text-white shadow-md' : 'text-muted hover:bg-surface-2 hover:text-primary'
          }`}>
          {t}
        </button>
      ))}
    </div>
  );
}
