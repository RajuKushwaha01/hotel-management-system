import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Leaf, ShoppingCart, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { qrService } from '../../services/qrService';

export default function QRMenu() {
  const { tableId } = useParams();
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState({});
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    qrService.getMenu(tableId)
      .then((res) => { setTable(res.data.data.table); setMenu(res.data.data.menu); })
      .catch(() => toast.error('This QR code is no longer valid'));
  }, [tableId]);

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((c) => c.menuItemId === item._id);
      if (found) return prev.map((c) => (c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
    toast.success(`Added ${item.name}`, { icon: '🛒' });
  };

  const changeQty = (id, delta) => {
    setCart((prev) => prev.map((c) => (c.menuItemId === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c)).filter((c) => c.quantity > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const res = await qrService.placeOrder(tableId, { guestName, guestPhone, items: cart });
      setConfirmed(res.data.data);
      setCart([]);
      setShowCart(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-success" />
          </div>
          <h1 className="text-2xl font-display text-white mb-2">Order Sent!</h1>
          <p className="text-white/70">Your order for Table {table?.tableNumber} has been sent to the kitchen. Total: ₹{confirmed.total}</p>
          <button onClick={() => setConfirmed(null)} className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold">Order More</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight dark:bg-darkBg pb-24">
      <header className="sticky top-0 z-20 bg-navy text-white px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-display text-lg">GrandVista <span className="text-gold">Dining</span></p>
          {table && <p className="text-xs text-white/60">Table {table.tableNumber}</p>}
        </div>
        <button onClick={() => setShowCart(true)} className="relative p-2 rounded-lg bg-white/10">
          <ShoppingCart size={20} />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-gold text-navy text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto">
        {Object.entries(menu).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="font-display text-lg mb-3">{category}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      {item.isVeg && <Leaf size={14} className="text-success shrink-0" />}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1">{item.description}</p>
                    <p className="text-gold font-semibold mt-1">₹{item.price}</p>
                  </div>
                  <button onClick={() => addToCart(item)} className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium shrink-0">Add</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && !showCart && (
        <button onClick={() => setShowCart(true)} className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto py-4 rounded-2xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold flex items-center justify-between px-6 shadow-2xl">
          <span>{cart.reduce((s, c) => s + c.quantity, 0)} items</span>
          <span>View Cart · ₹{total}</span>
        </button>
      )}

      {showCart && (
        <div className="fixed inset-0 z-30 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full bg-white dark:bg-darkCard rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">Your Order</h3>
              <button onClick={() => setShowCart(false)}><X size={20} /></button>
            </div>

            {cart.map((c) => (
              <div key={c.menuItemId} className="flex items-center justify-between py-2 border-b border-border dark:border-darkBorder">
                <span className="text-sm">{c.name}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => changeQty(c.menuItemId, -1)} className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10">−</button>
                  <span className="text-sm w-4 text-center">{c.quantity}</span>
                  <button onClick={() => changeQty(c.menuItemId, 1)} className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10">+</button>
                  <span className="text-sm w-14 text-right">₹{c.price * c.quantity}</span>
                </div>
              </div>
            ))}

            <div className="flex justify-between font-bold text-lg py-3">
              <span>Total</span><span>₹{total}</span>
            </div>

            <input placeholder="Your name (optional)" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full mb-2 px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-transparent" />
            <input placeholder="Phone (optional)" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full mb-4 px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-transparent" />

            <button onClick={placeOrder} disabled={placing} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold">
              {placing ? 'Placing Order...' : `Place Order · ₹${total}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
