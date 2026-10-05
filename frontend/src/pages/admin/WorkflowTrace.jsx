import { useEffect, useState } from 'react';
import { Check, Circle, Search, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { workflowService } from '../../services/workflowService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

export default function WorkflowTrace() {
  const [health, setHealth] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    workflowService.getHealth().then((res) => setHealth(res.data.data)).catch(() => {});
  }, []);

  const handleTrace = async (e) => {
    e.preventDefault();
    if (!bookingId.trim()) return;
    setLoading(true);
    try {
      const res = await workflowService.traceBooking(bookingId.trim());
      setTrace(res.data.data);
    } catch {
      toast.error('Booking not found');
      setTrace(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-1 flex items-center gap-2"><Activity className="text-gold" size={24} /> System Workflow</h1>
      <p className="text-text-secondary text-sm mb-6">Live proof that every module in the pipeline is actually connected — not just diagrammed</p>

      {health ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Inventory → Restaurant" value={health.inventoryToRestaurant} icon={Activity} color="gold" />
          <StatCard label="Inventory → Housekeeping" value={health.inventoryToHousekeeping} icon={Activity} color="blue" />
          <StatCard label="Inventory → Maintenance" value={health.inventoryToMaintenance} icon={Activity} color="purple" />
          <StatCard label="Total Stock Deductions (7d)" value={health.totalStockDeductions7d} icon={Activity} color="green" />
          <StatCard label="Staff → Attendance (7d)" value={health.staffToAttendance7d} icon={Activity} color="gold" />
          <StatCard label="All Actions → Audit Log (7d)" value={health.allActionsToAuditLog7d} icon={Activity} color="blue" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      )}

      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Trace a Booking End-to-End</h3>
        <form onSubmit={handleTrace} className="flex gap-3 max-w-lg">
          <Input placeholder="Paste a Booking ID..." icon={Search} value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
          <Button variant="gold" disabled={loading}>{loading ? 'Tracing...' : 'Trace'}</Button>
        </form>
      </Card>

      {trace && (
        <Card className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">{trace.booking.guest} — Room {trace.booking.room}</h3>
              <p className="text-xs text-text-secondary">Booking status: <span className="capitalize">{trace.booking.status}</span></p>
            </div>
          </div>

          <div className="space-y-0 mb-6">
            {trace.steps.map((s, i) => (
              <div key={s.stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-success text-white' : 'bg-black/10 dark:bg-white/10 text-text-secondary'}`}>
                    {s.done ? <Check size={13} /> : <Circle size={8} />}
                  </div>
                  {i < trace.steps.length - 1 && <div className={`w-0.5 flex-1 my-1 ${s.done ? 'bg-success' : 'bg-black/10 dark:bg-white/10'}`} style={{ minHeight: 24 }} />}
                </div>
                <div className="pb-5">
                  <p className={`text-sm font-medium ${s.done ? '' : 'text-text-secondary'}`}>{s.stage}</p>
                  {s.at && <p className="text-xs text-text-secondary">{new Date(s.at).toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>

          {trace.folioBreakdown && (
            <div className="p-4 rounded-xl bg-bgLight dark:bg-darkBg mb-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-text-secondary">Total Charges</span><span>₹{trace.folioBreakdown.totalCharges.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Total Paid</span><span>₹{trace.folioBreakdown.totalPaid.toLocaleString()}</span></div>
              <div className="flex justify-between font-medium"><span>Balance</span><span>₹{trace.folioBreakdown.balance.toLocaleString()}</span></div>
            </div>
          )}

          <h4 className="text-sm font-medium mb-2">Audit Trail</h4>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {trace.auditTrail.map((a, i) => (
              <div key={i} className="flex justify-between text-xs border-b border-border dark:border-darkBorder pb-1.5">
                <span>{a.description || a.action}</span>
                <span className="text-text-secondary shrink-0 ml-3">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {trace.auditTrail.length === 0 && <p className="text-xs text-text-secondary">No audit events recorded for this booking yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
