import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Barcode, X, Loader2, Printer, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  current_stock: number;
  barcode?: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    base_price: '',
    current_stock: '',
    barcode: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    // Cast to any to bypass strict type locks if schema is out of sync
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Fetch error:', error.message);
    if (data) setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 150 } }, false);
      scanner.render((decodedText) => {
        if (showAddModal) {
          setFormData(prev => ({ ...prev, barcode: decodedText }));
        } else {
          setSearchQuery(decodedText);
        }
        setIsScanning(false);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [isScanning, showAddModal]);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      base_price: parseFloat(formData.base_price),
      current_stock: parseInt(formData.current_stock),
      // Ensure empty barcode is sent as null to satisfy unique constraints
      barcode: formData.barcode.trim() === '' ? null : formData.barcode.trim()
    };

    const { error } = await (supabase as any).from('products').insert([payload]);
    
    if (error) {
      alert(`Save failed: ${error.message}`);
    } else {
      setShowAddModal(false);
      setFormData({ name: '', category: 'General', base_price: '', current_stock: '', barcode: '' });
      fetchInventory();
    }
  }

  const printLabel = async (product: Product) => {
    if (!product.barcode) return alert("No barcode assigned to this product.");
    
    const qrDataUrl = await QRCode.toDataURL(product.barcode);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label - ${product.name}</title>
            <style>
              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .label-card { border: 2px solid black; padding: 20px; text-align: center; width: 200px; }
              .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
              .price { font-size: 24px; font-weight: bold; color: #000; margin-top: 10px; }
              img { width: 150px; height: 150px; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="label-card">
              <div class="name">${product.name}</div>
              <img src="${qrDataUrl}" />
              <div class="price">₹${Number(product.base_price).toFixed(2)}</div>
              <div style="font-size: 10px; margin-top: 5px;">${product.barcode}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <div className="flex flex-col gap-6 h-full p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-sm text-gray-400">Manage stock and print shelf labels in ₹</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text"
              placeholder="Search or Scan..."
              className="w-full glass-sm py-2 px-4 bg-transparent outline-none border-white/10 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
          </div>
          <button onClick={() => setIsScanning(true)} className="glass-sm p-2 text-accent-neon hover:bg-accent-cyan/10">
            <Barcode className="w-6 h-6" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-primary px-4 py-2 rounded-lg flex items-center gap-2 text-white font-semibold shadow-neon-primary">
            <Plus className="w-5 h-5" /> Add
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
            <div className="w-full max-w-md relative">
              <button onClick={() => setIsScanning(false)} className="absolute -top-12 right-0 p-2 text-white"><X className="w-8 h-8" /></button>
              <div className="glass border-primary/30 p-4">
                <div id="reader"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass flex-1 overflow-hidden flex flex-col mx-2">
        <div className="p-4 border-b border-white/5 bg-white/5 grid grid-cols-4 md:grid-cols-5 text-xs font-bold text-gray-500 uppercase">
          <span>Item</span>
          <span className="hidden md:block">Category</span>
          <span>Stock</span>
          <span>Price</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="p-4 border-b border-white/5 grid grid-cols-4 md:grid-cols-5 items-center hover:bg-white/5">
                <div className="flex flex-col">
                  <span className="text-white font-medium truncate">{p.name}</span>
                  <span className="text-[10px] text-accent-cyan font-mono">{p.barcode || 'NO BARCODE'}</span>
                </div>
                <span className="hidden md:block text-gray-400 text-sm">{p.category}</span>
                <span className={`text-sm ${p.current_stock < 10 ? 'text-danger-glow font-bold' : 'text-gray-300'}`}>{p.current_stock}</span>
                <span className="text-primary-glow font-bold">₹{Number(p.base_price).toFixed(2)}</span>
                <div className="text-right">
                  <button onClick={() => printLabel(p)} className="p-2 hover:text-primary-glow transition-colors" title="Print Shelf Label">
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <form onSubmit={handleAddProduct} className="glass w-full max-w-lg p-8 flex flex-col gap-4 relative">
               <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-500"><X /></button>
               <h2 className="text-2xl font-bold mb-2">New Product</h2>
               <input required placeholder="Item Name" className="w-full glass-sm p-4 bg-transparent outline-none border-white/10 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="0.01" placeholder="Price (₹)" className="glass-sm p-4 bg-transparent outline-none border-white/10 text-white" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} />
                  <input required type="number" placeholder="Stock" className="glass-sm p-4 bg-transparent outline-none border-white/10 text-white" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
               </div>
               <div className="flex gap-2">
                  <input placeholder="Barcode (Scan or Type)" className="glass-sm p-4 bg-transparent outline-none border-white/10 text-white flex-1" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  <button type="button" onClick={() => setIsScanning(true)} className="glass-sm px-4 text-accent-neon"><Barcode /></button>
               </div>
               <button type="submit" className="w-full bg-primary py-4 rounded-xl font-bold text-white shadow-neon-primary mt-4">Save Product</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}