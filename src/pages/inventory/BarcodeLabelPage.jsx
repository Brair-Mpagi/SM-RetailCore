import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Search, Package, Plus, Minus, CheckCircle, Barcode } from 'lucide-react';
import InventoryNav from '../../components/inventory/InventoryNav';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { productsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

function BarcodePreview({ barcode, name, price, copies }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!svgRef.current || !barcode) return;
    try {
      JsBarcode(svgRef.current, barcode, {
        format: 'CODE128', width: 1.5, height: 40,
        displayValue: true, fontSize: 10, margin: 4,
        background: '#ffffff', lineColor: '#000000'
      });
    } catch (e) { console.warn('Barcode render error', e); }
  }, [barcode]);

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '8px 12px', margin: 4, width: 160, boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#1e293b', textAlign: 'center', lineHeight: 1.3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
      <svg ref={svgRef} />
      <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{formatCurrency(price)}</p>
      {copies > 1 && <p style={{ margin: '2px 0 0', fontSize: 9, color: '#64748b' }}>×{copies} copies</p>}
    </div>
  );
}

export default function BarcodeLabelPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({}); // { id: copies }
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    productsAPI.getAll().then(r => {
      setProducts(r.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const selectedProducts = products.filter(p => selected[p.id] > 0);

  const toggleSelect = (p) => {
    setSelected(prev => prev[p.id] ? { ...prev, [p.id]: undefined } : { ...prev, [p.id]: 1 });
  };

  const setCopies = (id, delta) => {
    setSelected(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
  };

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Barcode Labels</title>
      <style>
        body { margin: 0; padding: 8px; font-family: Arial, sans-serif; background: #fff; }
        .label { display: inline-flex; flex-direction: column; align-items: center;
          border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px;
          margin: 4px; width: 155px; vertical-align: top; background: #fff; }
        .label p { margin: 0; }
        .name { font-size: 10px; font-weight: 700; color: #1e293b; text-align: center;
          max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
        .price { font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 4px; }
        @media print { body { margin: 0; padding: 4px; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      <script>window.onload=()=>{ window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (selectedProducts.length === 0) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const labelW = 55, labelH = 32, cols = 3, rows = 8;
      const startX = 10, startY = 10, gapX = 5, gapY = 4;
      let col = 0, row = 0;

      const allLabels = [];
      selectedProducts.forEach(p => {
        const copies = selected[p.id] || 1;
        for (let i = 0; i < copies; i++) allLabels.push(p);
      });

      for (let i = 0; i < allLabels.length; i++) {
        const p = allLabels[i];
        if (i > 0 && col === 0 && row === 0) doc.addPage();
        const x = startX + col * (labelW + gapX);
        const y = startY + row * (labelH + gapY);

        doc.setDrawColor(200);
        doc.roundedRect(x, y, labelW, labelH, 2, 2);

        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        const name = p.name.length > 22 ? p.name.substring(0, 22) + '…' : p.name;
        doc.text(name, x + labelW / 2, y + 5, { align: 'center' });

        // Generate barcode as SVG then as image
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        try {
          JsBarcode(svgEl, p.barcode || p.sku || String(p.id), {
            format: 'CODE128', width: 1.2, height: 25, displayValue: true,
            fontSize: 8, margin: 2, background: '#ffffff', lineColor: '#000000'
          });
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const canvas = document.createElement('canvas');
          canvas.width = 200; canvas.height = 60;
          const ctx2d = canvas.getContext('2d');
          const img = new Image();
          await new Promise(resolve => {
            img.onload = () => { ctx2d.drawImage(img, 0, 0, 200, 60); resolve(); };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
          });
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', x + 2, y + 7, labelW - 4, 18);
        } catch {}

        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(p.unit_price), x + labelW / 2, y + labelH - 2, { align: 'center' });

        col++;
        if (col >= cols) { col = 0; row++; }
        if (row >= rows) { col = 0; row = 0; }
      }

      doc.save(`barcode-labels-${Date.now()}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF generation failed. Try printing instead.');
    } finally { setGenerating(false); }
  }, [selected, selectedProducts]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted">Loading products…</p></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-5">
      <InventoryNav activeTab="Barcode Labels" />
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary p-2"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Barcode size={22} className="text-brand-500"/> Barcode Label Generator
          </h1>
          <p className="text-sm text-muted mt-0.5">Select products → set copies → print or export PDF</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} disabled={selectedProducts.length === 0} className="btn-secondary gap-2">
            <Printer size={16}/> Print
          </button>
          <button onClick={handleExportPDF} disabled={selectedProducts.length === 0 || generating} className="btn-primary gap-2">
            <Download size={16}/> {generating ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Product selector */}
        <div className="glass-card p-4">
          <h3 className="font-black text-primary mb-3 flex items-center gap-2"><Package size={15} className="text-brand-500"/> Select Products</h3>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input className="input-field pl-9" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {filtered.map(p => {
              const isSel = !!selected[p.id];
              return (
                <div key={p.id} onClick={() => toggleSelect(p)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSel ? 'border-brand-500/50 bg-brand-500/10' : 'border-theme hover:bg-surface-2'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 ${isSel ? 'bg-brand-500 border-brand-500' : 'border-theme'}`}>
                    {isSel && <CheckCircle size={12} className="text-white"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                    <p className="text-xs text-muted font-mono">{p.barcode || p.sku}</p>
                  </div>
                  <p className="text-sm font-bold text-primary flex-shrink-0">{formatCurrency(p.unit_price)}</p>
                  {isSel && (
                    <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setCopies(p.id, -1)} className="w-6 h-6 rounded bg-surface-2 border border-theme flex items-center justify-center"><Minus size={10}/></button>
                      <span className="w-6 text-center text-xs font-bold">{selected[p.id]}</span>
                      <button onClick={() => setCopies(p.id, 1)} className="w-6 h-6 rounded bg-surface-2 border border-theme flex items-center justify-center"><Plus size={10}/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview pane */}
        <div className="glass-card p-4">
          <h3 className="font-black text-primary mb-3">Preview ({selectedProducts.reduce((s, p) => s + (selected[p.id] || 1), 0)} labels)</h3>
          {selectedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted">
              <Barcode size={40} className="mb-3 opacity-20"/>
              <p className="text-sm opacity-50">Select products to preview labels</p>
            </div>
          ) : (
            <div ref={printRef} style={{ background: '#f8fafc', borderRadius: 8, padding: 8, maxHeight: 460, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {selectedProducts.map(p =>
                Array.from({ length: selected[p.id] || 1 }).map((_, i) => (
                  <BarcodePreview key={`${p.id}-${i}`} barcode={p.barcode || p.sku || String(p.id)} name={p.name} price={p.unit_price} copies={selected[p.id]}/>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
