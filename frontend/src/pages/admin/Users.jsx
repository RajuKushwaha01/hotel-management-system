import { useEffect, useState } from 'react';
import { Plus, KeyRound, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';

const ROLE_OPTIONS = [
  'hotel_manager', 'receptionist', 'housekeeping', 'fnb_staff',
  'chef', 'accountant', 'maintenance',
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'receptionist',
  });

  const loadUsers = () => {
    setLoading(true);
    adminService
      .getUsers()
      .then((res) => setUsers(res.data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(form);
      toast.success('Staff user created');
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'receptionist' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminService.toggleStatus(id);
      toast.success('Status updated');
      loadUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword) return;
    try {
      await adminService.resetPassword(id, newPassword);
      toast.success('Password reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteUser(deleteTarget);
      toast.success('User deleted');
      loadUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <StatusBadge status={r.role} /> },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive ? 'confirmed' : 'cancelled'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => handleToggle(r._id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="Toggle active">
            <Power size={16} />
          </button>
          <button onClick={() => handleResetPassword(r._id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="Reset password">
            <KeyRound size={16} />
          </button>
          <button onClick={() => setDeleteTarget(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1">User Management</h1>
          <p className="text-text-secondary text-sm">Create and manage staff accounts</p>
        </div>
        <Button variant="gold" onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus size={18} /> New Staff
        </Button>
      </div>

      <Table columns={columns} data={users} loading={loading} emptyMessage="No staff users yet" />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Staff User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r.replace('_', ' ')}</option>
            ))}
          </select>
          <Button variant="gold" className="w-full">Create User</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this user?"
        message="This action cannot be undone. The user will lose all access immediately."
      />
    </div>
  );
}
