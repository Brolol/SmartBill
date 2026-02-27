import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Barcode, X, Loader2, Printer, Search, Trash2, AlertCircle } from 'lucide-react';
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
  
  // State for the custom delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);

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
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Fetch error:', error.message);
    if (data) setProducts(data);
    setLoading(false);
  }

  // Scanner Logic
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

  async function handleDelete() {
    if (!deleteConfirm) return;

    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      alert(`Delete failed: ${error.message}`);
    } else {
      setProducts(products.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory</h1>
          <p className="text-sm text-gray-400">Manage stock levels and generate labels</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <input 
              type="text"
              placeholder="Search items..."
              className="w-full glass-sm py-2.5 px-4 bg-white/5 outline-none border-white/10 text-white focus:border-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          </div>
          <button onClick={() => setIsScanning(true)} className="glass-sm p-2.5 text-accent-neon hover:bg-accent-cyan/10 transition-colors">
            <Barcode className="w-5 h-5" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-white font-bold shadow-neon-primary hover:opacity-90 transition-all">
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass flex-1 overflow-hidden flex flex-col mx-2 border-white/5 shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] grid grid-cols-4 md:grid-cols-5 text-[11px] font-black text-gray-500 uppercase tracking-widest">
          <span>Item Details</span>
          <span className="hidden md:block">Category</span>
          <span>In Stock</span>
          <span>Unit Price</span>
          <span className="text-right">Manage</span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : (
            filteredProducts.map(p => (
              <motion.div 
                layout
                key={p.id} 
                className="p-4 border-b border-white/5 grid grid-cols-4 md:grid-cols-5 items-center hover:bg-white/[0.03] transition-colors group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-white font-semibold truncate text-sm">{p.name}</span>
                  <span className="text-[10px] text-accent-cyan font-mono opacity-70 truncate">{p.barcode || 'NO BARCODE'}</span>
                </div>
                <span className="hidden md:block text-gray-400 text-xs font-medium uppercase tracking-tight">{p.category}</span>
                <div className="flex items-center gap-2">
                   <span className={`text-sm font-bold ${p.current_stock < 10 ? 'text-red-400' : 'text-gray-300'}`}>
                    {p.current_stock}
                  </span>
                  {p.current_stock < 10 && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                </div>
                <span className="text-primary-glow font-bold text-sm">₹{Number(p.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => printLabel(p)} className="p-2 hover:bg-white/10 rounded-lg hover:text-primary-glow transition-all" title="Print Label">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm({id: p.id, name: p.name})} className="p-2 hover:bg-red-500/10 rounded-lg hover:text-red-400 transition-all text-gray-500" title="Delete Item">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* MODALS SECTION */}
      <AnimatePresence>
        {/* Scanner Modal */}
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
            <div className="w-full max-w-md relative">
              <button onClick={() => setIsScanning(false)} className="absolute -top-16 right-0 p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
              <div className="glass border-primary/30 p-4 overflow-hidden">
                <div id="reader" className="rounded-lg overflow-hidden"></div>
                <p className="text-center text-xs text-gray-400 mt-4 font-mono">POINT CAMERA AT BARCODE</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onSubmit={handleAddProduct} 
              className="glass w-full max-w-lg p-8 flex flex-col gap-4 relative border-white/10"
            >
               <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
               <div className="mb-2">
                 <h2 className="text-2xl font-bold text-white">New Product</h2>
                 <p className="text-xs text-gray-500">Register a new item in the smart database</p>
               </div>
               
               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 tracking-widest">Item Name</label>
                 <input required placeholder="e.g. Wireless Mouse" className="w-full glass-sm p-3.5 bg-white/5 outline-none border-white/10 text-white focus:border-primary/50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 tracking-widest">Price (₹)</label>
                   <input required type="number" step="0.01" placeholder="0.00" className="w-full glass-sm p-3.5 bg-white/5 outline-none border-white/10 text-white focus:border-primary/50" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 tracking-widest">Initial Stock</label>
                   <input required type="number" placeholder="0" className="w-full glass-sm p-3.5 bg-white/5 outline-none border-white/10 text-white focus:border-primary/50" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 tracking-widest">Barcode ID</label>
                 <div className="flex gap-2">
                    <input placeholder="Scan or type ID..." className="glass-sm p-3.5 bg-white/5 outline-none border-white/10 text-white flex-1 focus:border-primary/50" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                    <button type="button" onClick={() => setIsScanning(true)} className="glass-sm px-4 text-accent-neon hover:bg-accent-neon/10 transition-colors"><Barcode /></button>
                 </div>
               </div>
               
               <button type="submit" className="w-full bg-gradient-to-r from-primary to-accent-neon py-4 rounded-xl font-bold text-white shadow-neon-primary mt-4 hover:brightness-110 active:scale-[0.98] transition-all">
                 Save to Inventory
               </button>
            </motion.form>
          </motion.div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass border-red-500/20 max-w-sm w-full p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Item?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to remove <span className="text-white font-semibold">"{deleteConfirm.name}"</span>? 
                This will delete it permanently from the database.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="flex-1 glass-sm py-3 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 bg-red-600 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-900/20 hover:bg-red-500 transition-all"
                >
                  Delete Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}