import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, QrCode, BedDouble } from 'lucide-react';
import toast from 'react-hot-toast';
import { roomManagementService } from '../../services/roomManagementService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/ui/StatCard';
import QRCodeCard from '../../components/common/QRCodeCard';

const ROOM_TYPES = ['single', 'double', 'twin', 'deluxe', 'suite', 'family', 'executive', 'presidential'];
const ROOM_STATUSES = ['available', 'reserved', 'occupied', 'dirty', 'cleaning', 'inspection', 'maintenance', 'out_of_order', 'blocked'];

const STATUS_COLOR = {
  available: 'bg-emerald-100 text-emerald-700', reserved: 'bg-blue-100 text-blue-700',
  occupied: 'bg-red-100 text-red-700', dirty: 'bg-orange-100 text-orange-700',
  cleaning: 'bg-amber-100 text-amber-700', inspection: 'bg-purple-100 text-purple-700',
  maintenance: 'bg-slate-100 text-slate-700', out_of_order: 'bg-red-200 text-red-800',
  blocked: 'bg-gray-200 text-gray-800',
};

const emptyForm = { roomNumber: '', floor: 1, roomType: 'double', capacity: 2, bedType: 'King', pricePerNight: '', sizeSqm: '', description: '' };

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrRoom, setQrRoom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([roomManagementService.getAll({ status: filterStatus || undefined }), roomManagementService.getOverview()])
      .then(([r, o]) => { setRooms(r.data.data); setOverview(o.data.data); })
      .catch(() => toast.error('Failed to load rooms'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, pricePerNight: Number(form.pricePerNight), floor: Number(form.floor), capacity: Number(form.capacity), sizeSqm: Number(form.sizeSqm) };
      if (editTarget) {
        await roomManagementService.update(editTarget, payload);
        toast.success('Room updated');
      } else {
        await roomManagementService.create(payload);
        toast.success('Room created');
      }
      setShowNew(false);
      setEditTarget(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    }
  };

  const openEdit = (room) => {
    setForm({ ...room, pricePerNight: room.pricePerNight, sizeSqm: room.sizeSqm || '' });
    setEditTarget(room._id);
    setShowNew(true);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await roomManagementService.updateStatus(id, { status });
      toast.success('Room status updated');
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await roomManagementService.delete(deleteTarget);
      toast.success('Room deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const columns = [
    { key: 'roomNumber', label: 'Room #' },
    { key: 'floor', label: 'Floor' },
    { key: 'roomType', label: 'Type', render: (r) => <span className="capitalize">{r.roomType}</span> },
    { key: 'capacity', label: 'Capacity' },
    { key: 'pricePerNight', label: 'Price', render: (r) => `₹${r.pricePerNight}` },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleStatusChange(r._id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full border-0 capitalize font-medium ${STATUS_COLOR[r.status]}`}
        >
          {ROOM_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      ),
    },
    {
      key: 'qr', label: 'QR',
      render: (r) => <button onClick={() => setQrRoom(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="Show QR Code"><QrCode size={16} /></button>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><Edit2 size={16} /></button>
          <button onClick={() => setDeleteTarget(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Room Management</h1><p className="text-text-secondary text-sm">Full room inventory across all types and floors</p></div>
        <Button variant="gold" onClick={() => { setForm(emptyForm); setEditTarget(null); setShowNew(true); }} className="flex items-center gap-2"><Plus size={18} /> Add Room</Button>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Rooms" value={overview.total} icon={BedDouble} color="gold" />
          <StatCard label="Available" value={overview.byStatus.available || 0} icon={BedDouble} color="green" />
          <StatCard label="Occupied" value={overview.byStatus.occupied || 0} icon={BedDouble} color="blue" />
          <StatCard label="Out of Order" value={overview.byStatus.out_of_order || 0} icon={BedDouble} color="purple" />
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterStatus('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterStatus ? 'bg-navy text-white' : 'bg-black/5 dark:bg-white/5'}`}>All</button>
        {ROOM_STATUSES.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filterStatus === s ? 'bg-navy text-white' : 'bg-black/5 dark:bg-white/5'}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <Table columns={columns} data={rooms} loading={loading} emptyMessage="No rooms found" />

      <Modal open={showNew} onClose={() => { setShowNew(false); setEditTarget(null); }} title={editTarget ? 'Edit Room' : 'Add Room'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Room number" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required />
            <Input placeholder="Floor" type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} required />
          </div>
          <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
            {ROOM_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <Input placeholder="Bed type" value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })} />
            <Input placeholder="Size (m²)" type="number" value={form.sizeSqm} onChange={(e) => setForm({ ...form, sizeSqm: e.target.value })} />
          </div>
          <Input placeholder="Price per night (₹)" type="number" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} required />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button variant="gold" className="w-full">{editTarget ? 'Update Room' : 'Create Room'}</Button>
        </form>
      </Modal>

      <Modal open={!!qrRoom} onClose={() => setQrRoom(null)} title={`Room ${qrRoom?.roomNumber} — QR Room Portal`} size="sm">
        {qrRoom && (
          <QRCodeCard
            title={`Room ${qrRoom.roomNumber}`}
            subtitle={`${window.location.origin}/qr-room/${qrRoom.roomNumber}`}
            value={`${window.location.origin}/qr-room/${qrRoom.roomNumber}`}
            filename={`room-${qrRoom.roomNumber}-qr.png`}
          />
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete this room?" message="This cannot be undone. Rooms with active bookings cannot be deleted." />
    </div>
  );
}
