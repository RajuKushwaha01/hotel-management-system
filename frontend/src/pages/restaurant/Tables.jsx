import { useEffect, useState } from 'react';
import { Plus, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { restaurantService } from '../../services/restaurantService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import QRCodeCard from '../../components/common/QRCodeCard';

const STATUS_STYLE = {
  available: 'bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10',
  occupied: 'bg-red-50 border-red-300 dark:bg-red-500/10',
  reserved: 'bg-amber-50 border-amber-300 dark:bg-amber-500/10',
  cleaning: 'bg-blue-50 border-blue-300 dark:bg-blue-500/10',
};
const STATUS_DOT = { available: 'bg-success', occupied: 'bg-danger', reserved: 'bg-warning', cleaning: 'bg-accentBlue' };

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [form, setForm] = useState({ tableNumber: '', capacity: 4 });

  const load = () => restaurantService.getTables().then((res) => setTables(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await restaurantService.createTable(form);
      toast.success('Table added');
      setShowNew(false);
      setForm({ tableNumber: '', capacity: 4 });
      load();
    } catch {
      toast.error('Failed to add table');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Table Management</h1><p className="text-text-secondary text-sm">Live floor layout</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Table</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div key={t._id} className={`p-5 rounded-2xl border-2 ${STATUS_STYLE[t.status]} transition-all hover:scale-105 duration-200`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[t.status]}`} />
              <span className="text-xs uppercase font-medium">{t.status}</span>
            </div>
            <p className="text-xl font-bold">Table {t.tableNumber}</p>
            <p className="text-text-secondary text-sm">{t.capacity} seats</p>
            <button onClick={() => setQrTable(t)} className="mt-2 flex items-center gap-1 text-xs text-navy dark:text-white/70 hover:text-gold transition">
              <QrCode size={13} /> Show QR
            </button>
          </div>
        ))}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Table">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Table number" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} required />
          <Input placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
          <Button variant="gold" className="w-full">Add Table</Button>
        </form>
      </Modal>

      <Modal open={!!qrTable} onClose={() => setQrTable(null)} title={`Table ${qrTable?.tableNumber} — QR Menu`} size="sm">
        {qrTable && (
          <QRCodeCard
            title={`Table ${qrTable.tableNumber}`}
            subtitle={`${window.location.origin}/qr-menu/${qrTable._id}`}
            value={`${window.location.origin}/qr-menu/${qrTable._id}`}
            filename={`table-${qrTable.tableNumber}-qr.png`}
          />
        )}
      </Modal>
    </div>
  );
}
