import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { qrService } from '../../services/qrService';

export default function QRRoomService() {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState({});
  const [cart, setCart] = useState([]);
  const [confirmed, setConfirmed] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    qrService.getRoomServiceMenu().then((res) => setMenu(res.data.data));
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((c) => c.menuItemId === item._id);
      if (found) return prev.map((c) => (c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Add at least one item');
    setPlacing(true);
    try {
      const res = await qrService.orderRoomService(roomNumber, cart);
      setConfirmed(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4 text-center">
        <div className="animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-success" /></div>
          <h1 className="text-2xl font-display text-white mb-2">Order Placed!</h1>
          <p className="text-white/70">Room {roomNumber} — ₹{confirmed.total} will be added to your folio.</p>
          <button onClick={() => navigate(`/qr-room/${roomNumber}`)} className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold">Back to Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight dark:bg-darkBg pb-28">
      <header className="sticky top-0 z-20 bg-navy text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/qr-room/${roomNumber}`)}><ArrowLeft size={20} /></button>
        <div>
          <p className="font-display">Room Service</p>
          <p className="text-xs text-white/60">Room {roomNumber}</p>
        </div>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto">
        {Object.entries(menu).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="font-display text-lg mb-3">{category}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-medium">{item.name}</p>{item.isVeg && <Leaf size={14} className="text-success" />}</div>
                    <p className="text-gold font-semibold mt-1">₹{item.price}</p>
                  </div>
                  <button onClick={() => addToCart(item)} className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium">Add</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <button onClick={placeOrder} disabled={placing} className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto py-4 rounded-2xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold flex items-center justify-between px-6 shadow-2xl">
          <span>{cart.reduce((s, c) => s + c.quantity, 0)} items</span>
          <span>{placing ? 'Placing...' : `Order · ₹${total}`}</span>
        </button>
      )}
    </div>
  );
}
