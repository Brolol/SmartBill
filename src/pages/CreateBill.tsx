import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, QrCode, CheckCircle2, X, Loader2, Barcode } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  base_price: number;
  current_stock: number;
  barcode?: string;
}

interface BillItemInsert {
  product_id: string;
  quantity: number;
  subtotal: number;
}

export default function CreateBill() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'generating' | 'qr' | 'success'>('idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, base_price, current_stock, barcode')
      .order('name');
    
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader-bill", { fps: 10, qrbox: 250 }, false);
      scanner.render((decodedText) => {
        const found = products.find(p => p.barcode === decodedText);
        if (found) {
          addItem({ id: found.id, name: found.name, price: Number(found.base_price) });
        }
        setIsScanning(false);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [isScanning, products, addItem]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const total = getTotal();

  const handleCheckout = async () => {
    setPaymentState('generating');
    try {
      const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrString = `PAYMENT://INVOICE/${invoiceId}/AMOUNT/${total.toFixed(2)}`;
      const url = await QRCode.toDataURL(qrString, {
        width: 300,
        color: { dark: '#6366F1', light: '#0B0F19' }
      });
      setQrCodeDataUrl(url);
      const transactionItems: BillItemInsert[] = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));
      const { error } = await supabase.from('bill_items').insert(transactionItems as any);
      if (error) throw error;
      setPaymentState('qr');
    } catch (err) {
      console.error('Checkout failed:', err);
      setPaymentState('idle');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentState('success');
    setTimeout(() => {
      clearCart();
      setPaymentState('idle');
    }, 2000);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full min-h-[calc(100vh-6rem)] pb-20 lg:pb-0">
      
      {/* 1. PRODUCT SECTION - Appears 2nd on Mobile, 1st on PC */}
      <div className="flex-1 flex flex-col gap-4 order-2 lg:order-1 px-2 lg:px-0">
        <div className="glass p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <Search className="text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Search name or barcode..."
            className="bg-transparent border-none outline-none flex-1 text-white text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsScanning(true)}
            className="p-2 glass-sm text-accent-neon hover:bg-accent-cyan/10 shrink-0"
          >
            <Barcode className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex-1 glass p-3 md:p-4 overflow-y-auto max-h-[50vh] lg:max-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {filteredProducts.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addItem({ id: p.id, name: p.name, price: Number(p.base_price) })}
                className="glass-sm p-3 md:p-4 cursor-pointer hover:border-primary/50 group"
              >
                <h3 className="font-medium text-gray-100 text-sm md:text-base truncate">{p.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-primary-glow font-bold text-sm md:text-base">${Number(p.base_price).toFixed(2)}</span>
                  <span className="text-[9px] md:text-[10px] text-accent-cyan font-mono bg-accent-cyan/5 px-1 rounded">{p.barcode || 'NO SKU'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SCANNER MODAL - Responsive Width */}
      <AnimatePresence>
        {isScanning && (
          <motion.div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-6 backdrop-blur-md">
            <div className="w-full max-w-md glass p-4 relative">
              <button onClick={() => setIsScanning(false)} className="absolute -top-10 right-0 text-white p-2"><X className="w-8 h-8"/></button>
              <div id="reader-bill" className="rounded-xl overflow-hidden shadow-2xl"></div>
              <p className="text-center text-gray-400 mt-4 text-xs">Align barcode within the frame</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CART SECTION - Appears 1st on Mobile, 2nd on PC */}
      <div className="w-full lg:w-96 glass flex flex-col relative overflow-hidden order-1 lg:order-2 max-h-[40vh] lg:max-h-full">
        <div className="p-3 md:p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-semibold text-gradient">Billing Cart</h2>
          <span className="lg:hidden text-xs bg-primary/20 text-primary-glow px-2 py-1 rounded-full">{items.length} items</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-2 md:gap-3">
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs md:text-sm">Empty cart</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="glass-sm p-2 md:p-3">
                <div className="flex justify-between text-xs md:text-sm mb-1">
                  <span className="truncate pr-4">{item.name}</span>
                  <button onClick={() => removeItem(item.id)} className="shrink-0"><Trash2 className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-glow font-bold text-xs md:text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs min-w-[1rem] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white/10 rounded"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-white/5 bg-background/50">
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-2xl md:text-4xl font-bold tracking-tight">${total.toFixed(2)}</span>
          </div>
          <button
            disabled={items.length === 0 || paymentState !== 'idle'}
            onClick={handleCheckout}
            className="w-full py-3 md:py-4 rounded-xl bg-primary text-white font-bold shadow-neon-primary flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {paymentState === 'generating' ? <Loader2 className="animate-spin" /> : <><QrCode className="w-5 h-5" /> Pay & Sync AI</>}
          </button>
        </div>

        {/* Payment Overlay - Mobile Safe */}
        <AnimatePresence>
          {(paymentState === 'qr' || paymentState === 'success') && (
            <motion.div className="fixed lg:absolute inset-0 bg-background/95 backdrop-blur-xl z-50 lg:z-20 flex flex-col items-center justify-center p-6 text-center">
              {paymentState === 'qr' ? (
                <>
                  <div className="bg-white p-2 rounded-2xl shadow-2xl mb-6">
                    <img src={qrCodeDataUrl} className="w-48 h-48 md:w-64 md:h-64 cursor-pointer" onClick={handlePaymentSuccess} alt="Payment QR" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Scan to Pay</h3>
                  <p className="text-gray-400 mt-2 text-sm">Click QR to simulate success</p>
                  <button onClick={() => setPaymentState('idle')} className="mt-8 text-gray-500 underline text-sm">Cancel</button>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                    <CheckCircle2 className="w-20 h-20 text-success mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white">Payment Success!</h3>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}