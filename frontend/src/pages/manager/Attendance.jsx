import { useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { adminService } from '../../services/adminService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';

const SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night'];
const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave', 'half_day'];

const STATUS_COLOR = {
  present: 'bg-emerald-100 text-emerald-700', absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700', leave: 'bg-blue-100 text-blue-700', half_day: 'bg-purple-100 text-purple-700',
};

export default function Attendance() {
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [report, setReport] = useState([]);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [markForm, setMarkForm] = useState({ staffId: '', date: new Date().toISOString().slice(0, 10), status: 'present' });
  const [shiftForm, setShiftForm] = useState({ staffId: '', shiftType: 'morning', date: new Date().toISOString().slice(0, 10) });

  const load = () => {
    adminService.getUsers({ limit: 100 }).then((res) => setStaffList(res.data.data.filter((u) => u.role !== 'customer')));
    attendanceService.getAttendance().then((res) => setAttendance(res.data.data));
    attendanceService.getShifts().then((res) => setShifts(res.data.data));
    attendanceService.getLeaveRequests().then((res) => setLeaveRequests(res.data.data));
    attendanceService.getReport().then((res) => setReport(res.data.data));
  };
  useEffect(() => { load(); }, []);

  const submitMark = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.markAttendance(markForm);
      toast.success('Attendance marked');
      setShowMarkModal(false);
      load();
    } catch { toast.error('Failed to mark attendance'); }
  };

  const submitShift = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.assignShift(shiftForm);
      toast.success('Shift assigned');
      setShowShiftModal(false);
      load();
    } catch { toast.error('Failed to assign shift'); }
  };

  const handleLeaveAction = async (id, action) => {
    try {
      if (action === 'approve') await attendanceService.approveLeave(id);
      else await attendanceService.rejectLeave(id, 'Not approved');
      toast.success(`Leave ${action}d`);
      load();
    } catch { toast.error('Action failed'); }
  };

  const attendanceColumns = [
    { key: 'staff', label: 'Employee', render: (r) => `${r.staff?.firstName} ${r.staff?.lastName}` },
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLOR[r.status]}`}>{r.status.replace('_', ' ')}</span> },
  ];

  const shiftColumns = [
    { key: 'staff', label: 'Employee', render: (r) => `${r.staff?.firstName} ${r.staff?.lastName}` },
    { key: 'shiftType', label: 'Shift', render: (r) => <span className="capitalize">{r.shiftType}</span> },
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
  ];

  const leaveColumns = [
    { key: 'staff', label: 'Employee', render: (r) => `${r.staff?.firstName} ${r.staff?.lastName}` },
    { key: 'leaveType', label: 'Type', render: (r) => <span className="capitalize">{r.leaveType}</span> },
    { key: 'dates', label: 'Dates', render: (r) => `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}` },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'approved' ? 'confirmed' : r.status === 'rejected' ? 'cancelled' : 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => r.status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => handleLeaveAction(r._id, 'approve')} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20"><Check size={16} /></button>
          <button onClick={() => handleLeaveAction(r._id, 'reject')} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20"><X size={16} /></button>
        </div>
      ),
    },
  ];

  const reportColumns = [
    { key: 'staff', label: 'Employee', render: (r) => r.staff.name },
    { key: 'present', label: 'Present' },
    { key: 'absent', label: 'Absent' },
    { key: 'late', label: 'Late' },
    { key: 'leave', label: 'Leave' },
    { key: 'half_day', label: 'Half Day' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Attendance & Shifts</h1><p className="text-text-secondary text-sm">Staff scheduling and attendance tracking</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowShiftModal(true)} className="flex items-center gap-2"><Plus size={16} /> Assign Shift</Button>
          <Button variant="gold" onClick={() => setShowMarkModal(true)} className="flex items-center gap-2"><Plus size={16} /> Mark Attendance</Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'attendance', label: 'Attendance', content: <Table columns={attendanceColumns} data={attendance} emptyMessage="No attendance records" /> },
          { id: 'shifts', label: 'Shifts', content: <Table columns={shiftColumns} data={shifts} emptyMessage="No shifts assigned" /> },
          { id: 'leave', label: 'Leave Requests', content: <Table columns={leaveColumns} data={leaveRequests} emptyMessage="No leave requests" /> },
          { id: 'report', label: 'Reports', content: <Table columns={reportColumns} data={report} emptyMessage="No data" /> },
        ]}
      />

      <Modal open={showMarkModal} onClose={() => setShowMarkModal(false)} title="Mark Attendance" size="sm">
        <form onSubmit={submitMark} className="space-y-3">
          <select value={markForm.staffId} onChange={(e) => setMarkForm({ ...markForm, staffId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select employee</option>
            {staffList.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
          </select>
          <Input label="Date" type="date" value={markForm.date} onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })} required />
          <select value={markForm.status} onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
            {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <Button variant="gold" className="w-full">Mark Attendance</Button>
        </form>
      </Modal>

      <Modal open={showShiftModal} onClose={() => setShowShiftModal(false)} title="Assign Shift" size="sm">
        <form onSubmit={submitShift} className="space-y-3">
          <select value={shiftForm.staffId} onChange={(e) => setShiftForm({ ...shiftForm, staffId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select employee</option>
            {staffList.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
          </select>
          <select value={shiftForm.shiftType} onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
            {SHIFT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Input label="Date" type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} required />
          <Button variant="gold" className="w-full">Assign Shift</Button>
        </form>
      </Modal>
    </div>
  );
}
