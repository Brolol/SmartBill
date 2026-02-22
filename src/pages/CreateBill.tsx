import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, CheckCircle2, X, Loader2, Barcode, ShieldCheck, Coins, IndianRupee } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCartStore } from '../store/useCartStore';
import { supabase, decrementStock, addLoyaltyPoints, generateExitPass } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  base_price: number;
  current_stock: number;
  barcode?: string;
}

export default function CreateBill() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'generating' | 'qr' | 'success'>('idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [exitPassQrUrl, setExitPassQrUrl] = useState('');
  const [earnedPoints, setEarnedPoints] = useState(0);
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
      // 1. Create the main Bill record in Supabase
      const { data: billData, error: billError } = await (supabase as any)
        .from('bills')
        .insert([{ total_amount: total }])
        .select()
        .single();

      if (billError) throw billError;

      // 2. Insert individual items linked to that Bill ID
      const transactionItems = items.map(item => ({
        bill_id: billData.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));
      
      const { error: itemsError } = await (supabase as any)
        .from('bill_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // 3. Generate Payment QR
      const qrString = `PAYMENT://BILL/${billData.id}/TOTAL/INR${total.toFixed(2)}`;
      const url = await QRCode.toDataURL(qrString, {
        width: 300,
        color: { dark: '#6366F1', light: '#0B0F19' }
      });
      setQrCodeDataUrl(url);
      setPaymentState('qr');
    } catch (err: any) {
      console.error('Checkout failed:', err);
      alert(`Checkout Failed: ${err.message || 'Ensure bills and bill_items tables exist in Supabase.'}`);
      setPaymentState('idle');
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // 1. Deduct Stock for all items
      for (const item of items) {
        await decrementStock(item.id, item.quantity);
      }

      // 2. Add Loyalty Points (Ratio 1:30)
      const points = await addLoyaltyPoints('guest-user', total);
      setEarnedPoints(points);

      // 3. Generate Exit Pass for the Security Gate
      const passId = await generateExitPass(`BILL-${Date.now()}`);
      if (passId) {
        const passUrl = await QRCode.toDataURL(passId, {
          width: 300,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setExitPassQrUrl(passUrl);
      }

      setPaymentState('success');
      
      // Auto-clear and reset after delay to allow viewing the pass
      setTimeout(() => {
        clearCart();
        setPaymentState('idle');
        setExitPassQrUrl('');
      }, 15000); 
    } catch (err) {
      console.error('Finalizing transaction failed:', err);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full min-h-[calc(100vh-6rem)] pb-20 lg:pb-0">
      
      {/* 1. PRODUCT SECTION */}
      <div className="flex-1 flex flex-col gap-4 order-2 lg:order-1 px-2 lg:px-0">
        <div className="glass p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <Search className="text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Search items..."
            className="bg-transparent border-none outline-none flex-1 text-white text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={() => setIsScanning(true)} className="p-2 glass-sm text-accent-neon shrink-0">
            <Barcode className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex-1 glass p-3 md:p-4 overflow-y-auto max-h-[50vh] lg:max-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {filteredProducts.map((p) => (
              <motion.div
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addItem({ id: p.id, name: p.name, price: Number(p.base_price) })}
                className="glass-sm p-3 md:p-4 cursor-pointer hover:border-primary/50 group"
              >
                <h3 className="font-medium text-gray-100 text-sm md:text-base truncate">{p.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-primary-glow font-bold text-sm md:text-base">₹{Number(p.base_price).toFixed(2)}</span>
                  <span className="text-[10px] text-accent-cyan font-mono bg-accent-cyan/5 px-1 rounded">{p.barcode || 'SKU'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SCANNER MODAL */}
      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <div className="w-full max-w-md glass p-4 relative">
              <button onClick={() => setIsScanning(false)} className="absolute -top-10 right-0 text-white"><X className="w-8 h-8"/></button>
              <div id="reader-bill" className="rounded-xl overflow-hidden"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CART SECTION */}
      <div className="w-full lg:w-96 glass flex flex-col relative overflow-hidden order-1 lg:order-2 max-h-[40vh] lg:max-h-full">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-gradient">Checkout Cart</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="glass-sm p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate pr-4">{item.name}</span>
                <button onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-glow font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></button>
                  <span className="text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 bg-background/50">
          <div className="flex justify-between items-end mb-6">
            <span className="text-gray-400 text-sm">Amount Due</span>
            <span className="text-4xl font-bold tracking-tight">₹{total.toFixed(2)}</span>
          </div>
          <button
            disabled={items.length === 0 || paymentState !== 'idle'}
            onClick={handleCheckout}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-neon-primary flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {paymentState === 'generating' ? <Loader2 className="animate-spin" /> : <><IndianRupee className="w-5 h-5" /> Pay & Generate Pass</>}
          </button>
        </div>

        {/* Success / Pass Overlay */}
        <AnimatePresence>
          {(paymentState === 'qr' || paymentState === 'success') && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed lg:absolute inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center">
              {paymentState === 'qr' ? (
                <>
                  <div className="bg-white p-2 rounded-2xl shadow-2xl mb-6">
                    <img src={qrCodeDataUrl} className="w-64 h-64 cursor-pointer" onClick={handlePaymentSuccess} alt="Payment QR" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Scan to Pay</h3>
                  <p className="text-gray-400 mt-2">Click the QR to simulate payment success</p>
                  <button onClick={() => setPaymentState('idle')} className="mt-8 text-gray-500 underline">Cancel</button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle2 className="w-16 h-16 text-success" />
                  <h3 className="text-2xl font-bold text-white">Payment Received</h3>
                  <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-500 font-bold">+{earnedPoints} Points Earned</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl mt-4">
                    <p className="text-black font-black text-xs uppercase mb-2">Security Gate Pass</p>
                    {exitPassQrUrl ? <img src={exitPassQrUrl} className="w-40 h-40" alt="Exit Pass" /> : <Loader2 className="animate-spin text-black" />}
                  </div>
                  <div className="flex items-center gap-2 text-primary-glow mt-4 animate-pulse">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-medium">Valid for Exit</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}