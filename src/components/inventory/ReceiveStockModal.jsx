import React, { useState } from 'react';
import { X, CheckCircle, Package } from 'lucide-react';

export default function ReceiveStockModal({ po, onClose, onReceive }) {
  // Initialize state with quantities currently ordered minus received
  const [items, setItems] = useState(
    po.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product?.name || `Product #${item.product_id}`,
      ordered: item.quantity_ordered,
      previously_received: item.quantity_received,
      receiving_now: item.quantity_ordered - item.quantity_received > 0 ? item.quantity_ordered - item.quantity_received : 0,
      cost_price: item.cost_price
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  const handleQtyChange = (index, value) => {
    const val = parseInt(value);
    const newItems = [...items];
    const max = newItems[index].ordered - newItems[index].previously_received;
    
    if (isNaN(val)) {
      newItems[index].receiving_now = '';
    } else {
      newItems[index].receiving_now = val > max ? max : val < 0 ? 0 : val;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        items: items
          .map(i => ({
            ...i,
            receiving_now: parseInt(i.receiving_now) || 0
          }))
          .filter(i => i.receiving_now > 0)
          .map(i => ({
            product_id: i.product_id,
            quantity_received: i.receiving_now
          }))
      };
      
      if (payload.items.length === 0) {
        alert('Please enter a quantity greater than 0 to receive.');
        setSubmitting(false);
        return;
      }
      
      await onReceive(po.id, payload);
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to receive stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Package size={18} className="text-emerald-500" /> Receive Stock for PO #{po.id}
          </h2>
          <button type="button" onClick={onClose} className="btn-secondary p-2"><X size={18} /></button>
        </div>
        
        <p className="text-sm text-muted mb-4">
          Supplier: <strong className="text-primary">{po.supplier?.name || `Supplier #${po.supplier_id}`}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="max-h-96 overflow-y-auto mb-4 border rounded-xl border-theme">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left font-bold text-muted">Product</th>
                  <th className="p-3 text-center font-bold text-muted">Ordered</th>
                  <th className="p-3 text-center font-bold text-muted">Received</th>
                  <th className="p-3 text-right font-bold text-muted">Receiving Now</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isFullyReceived = item.ordered === item.previously_received;
                  return (
                    <tr key={item.product_id} className="border-t border-theme">
                      <td className="p-3">
                        <p className="font-semibold text-primary">{item.product_name}</p>
                      </td>
                      <td className="p-3 text-center font-bold text-brand-500">{item.ordered}</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">{item.previously_received}</td>
                      <td className="p-3 text-right">
                        {isFullyReceived ? (
                          <span className="status-pill badge-success text-xs inline-block">Fully Received</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={item.ordered - item.previously_received}
                            className="input-field text-center w-24 ml-auto"
                            value={item.receiving_now}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              <CheckCircle size={16} /> {submitting ? 'Processing...' : 'Confirm Received Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
