import { useEffect, useState } from 'react';
import { Plus, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { restaurantService } from '../../services/restaurantService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Menu() {
  const [items, setItems] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Main Course', price: '', isVeg: true, description: '' });

  const load = () => restaurantService.getMenu().then((res) => setItems(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await restaurantService.createMenuItem({ ...form, price: Number(form.price) });
      toast.success('Menu item added');
      setShowNew(false);
      setForm({ name: '', category: 'Main Course', price: '', isVeg: true, description: '' });
      load();
    } catch {
      toast.error('Failed to add item');
    }
  };

  const grouped = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Menu</h1><p className="text-text-secondary text-sm">Manage food and beverage items</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Item</Button>
      </div>

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="mb-8">
          <h3 className="font-semibold mb-3">{category}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catItems.map((item) => (
              <Card key={item._id} hover>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.isVeg && <Leaf size={16} className="text-success shrink-0" />}
                </div>
                <p className="text-text-secondary text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gold">₹{item.price}</span>
                  <StatusBadge status={item.availability === 'available' ? 'clean' : item.availability === 'out_of_stock' ? 'cancelled' : 'pending'} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Menu Item">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            <option>Starters</option><option>Main Course</option><option>Desserts</option><option>Beverages</option>
          </select>
          <Input placeholder="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} /> Vegetarian
          </label>
          <Button variant="gold" className="w-full">Add Item</Button>
        </form>
      </Modal>
    </div>
  );
}
