import { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffService } from '../../services/staffService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

const DEPARTMENTS = ['front_office', 'housekeeping', 'fnb', 'kitchen', 'accounts', 'maintenance', 'administration'];
const ROLES = ['receptionist', 'housekeeping', 'fnb_staff', 'chef', 'accountant', 'maintenance', 'hotel_manager'];

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', password: '', role: 'receptionist',
  department: 'front_office', designation: '', joiningDate: '', address: '',
  emergencyName: '', emergencyRelation: '', emergencyPhone: '', salary: '',
};

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => staffService.getAll().then((res) => setStaff(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await staffService.create({
        firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone,
        password: form.password, role: form.role, department: form.department, designation: form.designation,
        joiningDate: form.joiningDate, address: form.address, salary: Number(form.salary) || undefined,
        emergencyContact: { name: form.emergencyName, relation: form.emergencyRelation, phone: form.emergencyPhone },
      });
      toast.success('Employee added');
      setShowNew(false);
      setForm(emptyForm);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add employee'); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => `${r.user?.firstName} ${r.user?.lastName}` },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department', render: (r) => <span className="capitalize">{r.department.replace(/_/g, ' ')}</span> },
    { key: 'joiningDate', label: 'Joined', render: (r) => new Date(r.joiningDate).toLocaleDateString() },
    { key: 'employmentStatus', label: 'Status', render: (r) => <StatusBadge status={r.employmentStatus === 'active' ? 'clean' : r.employmentStatus === 'terminated' ? 'cancelled' : 'pending'} /> },
    { key: 'actions', label: '', render: (r) => <button onClick={() => setProfile(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><Eye size={16} /></button> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Staff Management</h1><p className="text-text-secondary text-sm">Employee profiles, departments and records</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Employee</Button>
      </div>

      <Table columns={columns} data={staff} emptyMessage="No employees added yet" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Employee" size="lg">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <Input type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <div className="grid grid-cols-2 gap-3">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
            </select>
          </div>

          <Input placeholder="Designation (e.g. Senior Receptionist)" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} required />
            <Input placeholder="Salary (₹, optional)" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
          <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <p className="text-sm font-medium pt-2">Emergency Contact</p>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Name" value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} required />
            <Input placeholder="Relation" value={form.emergencyRelation} onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} required />
            <Input placeholder="Phone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} required />
          </div>

          <Button variant="gold" className="w-full">Add Employee</Button>
        </form>
      </Modal>

      <Modal open={!!profile} onClose={() => setProfile(null)} title={`${profile?.user?.firstName} ${profile?.user?.lastName}`}>
        {profile && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-text-secondary text-xs">Email</p><p>{profile.user?.email}</p></div>
              <div><p className="text-text-secondary text-xs">Phone</p><p>{profile.user?.phone}</p></div>
              <div><p className="text-text-secondary text-xs">Department</p><p className="capitalize">{profile.department.replace(/_/g, ' ')}</p></div>
              <div><p className="text-text-secondary text-xs">Designation</p><p>{profile.designation}</p></div>
              <div><p className="text-text-secondary text-xs">Joined</p><p>{new Date(profile.joiningDate).toLocaleDateString()}</p></div>
              <div><p className="text-text-secondary text-xs">Status</p><StatusBadge status={profile.employmentStatus === 'active' ? 'clean' : 'pending'} /></div>
            </div>
            {profile.emergencyContact?.name && (
              <div className="pt-3 border-t border-border dark:border-darkBorder">
                <p className="font-medium mb-1">Emergency Contact</p>
                <p>{profile.emergencyContact.name} ({profile.emergencyContact.relation}) — {profile.emergencyContact.phone}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
