import { useEffect, useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryService } from '../../services/inventoryService';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import { Package, AlertTriangle, Ban, IndianRupee } from 'lucide-react';

const DEPARTMENTS = ['housekeeping', 'kitchen', 'maintenance'];
const STATUS_COLOR = { in_stock: 'bg-emerald-100 text-emerald-700', low_stock: 'bg-amber-100 text-amber-700', out_of_stock: 'bg-red-100 text-red-700' };

export default function Inventory() {
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState({});
  const [deptFilter, setDeptFilter] = useState('');
  const [showNewItem, setShowNewItem] = useState(false);
  const [movementTarget, setMovementTarget] = useState(null); // { item, type: 'in'|'out'|'waste' }
  const [movementForm, setMovementForm] = useState({ quantity: '', reason: '' });
  const [historyItem, setHistoryItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [itemForm, setItemForm] = useState({ name: '', department: 'housekeeping', category: '', unit: 'pcs', currentStock: 0, minimumStock: 10, costPerUnit: '' });

  const load = () => {
    inventoryService.getDashboard().then((res) => setDashboard(res.data.data));
    inventoryService.getItems({ department: deptFilter || undefined }).then((res) => setItems(res.data.data));
    inventoryService.getCategories().then((res) => setCategories(res.data.data));
  };
  useEffect(load, [deptFilter]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createItem({ ...itemForm, currentStock: Number(itemForm.currentStock), minimumStock: Number(itemForm.minimumStock), costPerUnit: Number(itemForm.costPerUnit) || 0 });
      toast.success('Item added');
      setShowNewItem(false);
      setItemForm({ name: '', department: 'housekeeping', category: '', unit: 'pcs', currentStock: 0, minimumStock: 10, costPerUnit: '' });
      load();
    } catch { toast.error('Failed to add item'); }
  };

  const submitMovement = async (e) => {
    e.preventDefault();
    const { item, type } = movementTarget;
    const payload = { itemId: item._id, quantity: Number(movementForm.quantity), reason: movementForm.reason };
    try {
      if (type === 'in') await inventoryService.stockIn(payload);
      if (type === 'out') await inventoryService.stockOut(payload);
      if (type === 'waste') await inventoryService.recordWastage(payload);
      toast.success('Stock updated');
      setMovementTarget(null);
      setMovementForm({ quantity: '', reason: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update stock'); }
  };

  const viewHistory = async (item) => {
    setHistoryItem(item);
    const res = await inventoryService.getItemHistory(item._id);
    setHistory(res.data.data);
  };

  const columns = [
    { key: 'name', label: 'Item' },
    { key: 'department', label: 'Dept', render: (r) => <span className="capitalize">{r.department}</span> },
    { key: 'category', label: 'Category' },
    { key: 'currentStock', label: 'Stock', render: (r) => `${r.currentStock} ${r.unit}` },
    { key: 'minimumStock', label: 'Min', render: (r) => `${r.minimumStock} ${r.unit}` },
    { key: 'status', label: 'Status', render: (r) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[r.status]}`}>{r.status.replace(/_/g, ' ')}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => setMovementTarget({ item: r, type: 'in' })} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-success" title="Stock In"><ArrowDownCircle size={16} /></button>
          <button onClick={() => setMovementTarget({ item: r, type: 'out' })} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-accentBlue" title="Stock Out"><ArrowUpCircle size={16} /></button>
          <button onClick={() => setMovementTarget({ item: r, type: 'waste' })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger" title="Wastage"><Trash2 size={16} /></button>
          <button onClick={() => viewHistory(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="History"><History size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Inventory Management</h1><p className="text-text-secondary text-sm">Housekeeping, kitchen and maintenance stock</p></div>
        <Button variant="gold" onClick={() => setShowNewItem(true)} className="flex items-center gap-2"><Plus size={18} /> Add Item</Button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Items" value={dashboard.totalItems} icon={Package} color="blue" />
          <StatCard label="Low Stock" value={dashboard.lowStock} icon={AlertTriangle} color="gold" />
          <StatCard label="Out of Stock" value={dashboard.outOfStock} icon={Ban} color="purple" />
          <StatCard label="Inventory Value" value={`₹${dashboard.totalValue.toLocaleString()}`} icon={IndianRupee} color="green" />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setDeptFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!deptFilter ? 'bg-navy text-white' : 'bg-black/5 dark:bg-white/5'}`}>All</button>
        {DEPARTMENTS.map((d) => (
          <button key={d} onClick={() => setDeptFilter(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${deptFilter === d ? 'bg-navy text-white' : 'bg-black/5 dark:bg-white/5'}`}>{d}</button>
        ))}
      </div>

      <Table columns={columns} data={items} emptyMessage="No inventory items" />

      <Modal open={showNewItem} onClose={() => setShowNewItem(false)} title="Add Inventory Item">
        <form onSubmit={handleCreateItem} className="space-y-3">
          <Input placeholder="Item name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
          <select value={itemForm.department} onChange={(e) => setItemForm({ ...itemForm, department: e.target.value, category: '' })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select category</option>
            {(categories[itemForm.department] || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Unit (kg/pcs/liters)" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
            <Input placeholder="Cost per unit (₹)" type="number" value={itemForm.costPerUnit} onChange={(e) => setItemForm({ ...itemForm, costPerUnit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Initial stock" type="number" value={itemForm.currentStock} onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })} />
            <Input placeholder="Minimum stock" type="number" value={itemForm.minimumStock} onChange={(e) => setItemForm({ ...itemForm, minimumStock: e.target.value })} />
          </div>
          <Button variant="gold" className="w-full">Add Item</Button>
        </form>
      </Modal>

      <Modal open={!!movementTarget} onClose={() => setMovementTarget(null)} title={`${movementTarget?.type === 'in' ? 'Stock In' : movementTarget?.type === 'out' ? 'Stock Out' : 'Record Wastage'} — ${movementTarget?.item?.name}`} size="sm">
        <form onSubmit={submitMovement} className="space-y-3">
          <Input placeholder={`Quantity (${movementTarget?.item?.unit})`} type="number" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required />
          <Input placeholder="Reason" value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })} required />
          <Button variant="gold" className="w-full">Confirm</Button>
        </form>
      </Modal>

      <Modal open={!!historyItem} onClose={() => setHistoryItem(null)} title={`History — ${historyItem?.name}`} size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((h) => (
            <div key={h._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
              <div>
                <p className="capitalize font-medium">{h.type.replace(/_/g, ' ')} — {h.quantity}</p>
                <p className="text-xs text-text-secondary">{h.reason} · {h.performedBy?.firstName} {h.performedBy?.lastName}</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-xs">{new Date(h.createdAt).toLocaleString()}</p>
                <p className="text-xs">Balance: {h.balanceAfter}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
