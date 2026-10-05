import { useEffect, useState } from 'react';
import { Moon, Check, AlertTriangle, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { nightAuditService } from '../../services/nightAuditService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const STEPS = ['Check Bookings', 'Check Payments', 'Check Rooms', 'Calculate Revenue', 'Generate Report', 'Close Day'];

export default function NightAudit() {
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([]);
  const [reportView, setReportView] = useState(null);

  const loadHistory = () => nightAuditService.getHistory().then((res) => setHistory(res.data.data));
  useEffect(() => { loadHistory(); }, []);

  const runChecks = async () => {
    setLoading(true);
    try {
      const res = await nightAuditService.runChecks();
      setCheckResult(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run checks');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (forceClose = false) => {
    setClosing(true);
    try {
      await nightAuditService.closeBusinessDay({ notes, forceClose });
      toast.success('Business day closed successfully');
      setCheckResult(null);
      setNotes('');
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close business day');
    } finally {
      setClosing(false);
    }
  };

  const historyColumns = [
    { key: 'businessDate', label: 'Date', render: (r) => new Date(r.businessDate).toLocaleDateString() },
    { key: 'totalRevenue', label: 'Revenue', render: (r) => `₹${r.totalRevenue.toLocaleString()}` },
    { key: 'occupancyRate', label: 'Occupancy', render: (r) => `${r.occupancyRate}%` },
    { key: 'runBy', label: 'Closed By', render: (r) => `${r.runBy?.firstName} ${r.runBy?.lastName}` },
    { key: 'actions', label: '', render: (r) => <button onClick={() => setReportView(r)} className="text-sm text-gold hover:underline">View</button> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1 flex items-center gap-2"><Moon size={24} className="text-gold" /> Night Audit</h1>
      <p className="text-text-secondary text-sm mb-6">Verify, calculate, and close today's business day</p>

      {/* Workflow visual */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${checkResult ? 'bg-gold/20 text-gold' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="text-text-secondary">→</span>}
          </div>
        ))}
      </div>

      {!checkResult ? (
        <Card className="text-center py-12">
          <Moon size={40} className="mx-auto text-gold mb-4" />
          <h3 className="font-semibold mb-2">Ready to run tonight's audit?</h3>
          <p className="text-text-secondary text-sm mb-6">This will verify open bookings, unpaid folios, and room statuses before calculating revenue.</p>
          <Button variant="gold" onClick={runChecks} disabled={loading}>{loading ? 'Running Checks...' : 'Run Night Audit Checks'}</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Issues */}
          {(checkResult.openBookingsCount > 0 || checkResult.roomStatusIssues.length > 0) && (
            <Card className="border-danger/30 bg-danger/5">
              <div className="flex items-center gap-2 mb-3 text-danger font-medium"><AlertTriangle size={18} /> Issues Found</div>
              {checkResult.openBookingsCount > 0 && <p className="text-sm mb-1">• {checkResult.openBookingsCount} booking(s) still pending confirmation</p>}
              {checkResult.roomStatusIssues.length > 0 && <p className="text-sm">• {checkResult.roomStatusIssues.length} room(s) with status mismatches</p>}
            </Card>
          )}

          {checkResult.unpaidFoliosCount > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <p className="text-sm"><strong>{checkResult.unpaidFoliosCount}</strong> unpaid folio(s) totaling <strong>₹{checkResult.unpaidFoliosAmount.toLocaleString()}</strong></p>
            </Card>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center"><p className="text-xl font-bold text-gold">₹{checkResult.totalRevenue.toLocaleString()}</p><p className="text-xs text-text-secondary">Total Revenue</p></Card>
            <Card className="text-center"><p className="text-xl font-bold">₹{checkResult.taxCollected.toLocaleString()}</p><p className="text-xs text-text-secondary">Tax Collected</p></Card>
            <Card className="text-center"><p className="text-xl font-bold">{checkResult.occupancyRate}%</p><p className="text-xs text-text-secondary">Occupancy</p></Card>
            <Card className="text-center"><p className="text-xl font-bold">{checkResult.arrivals} / {checkResult.departures}</p><p className="text-xs text-text-secondary">Arrivals / Departures</p></Card>
          </div>

          <Card>
            <h3 className="font-semibold mb-3">Closing Notes (optional)</h3>
            <Input placeholder="Any remarks for today's audit..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Card>

          <div className="flex gap-3">
            {checkResult.canClose ? (
              <Button variant="gold" onClick={() => handleClose(false)} disabled={closing} className="flex items-center gap-2">
                <Check size={16} /> {closing ? 'Closing...' : 'Close Business Day'}
              </Button>
            ) : (
              <Button variant="gold" onClick={() => handleClose(true)} disabled={closing} className="flex items-center gap-2 !bg-danger !bg-none">
                <AlertTriangle size={16} /> {closing ? 'Closing...' : 'Force Close (Issues Present)'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setCheckResult(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><History size={18} /> Audit History</h3>
        <Table columns={historyColumns} data={history} emptyMessage="No completed audits yet" />
      </div>

      <Modal open={!!reportView} onClose={() => setReportView(null)} title={`Night Audit Report — ${reportView ? new Date(reportView.businessDate).toLocaleDateString() : ''}`} size="lg">
        {reportView && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-text-secondary text-xs">Room Revenue</p><p className="font-medium">₹{reportView.roomRevenue.toLocaleString()}</p></div>
              <div><p className="text-text-secondary text-xs">Restaurant Revenue</p><p className="font-medium">₹{reportView.restaurantRevenue.toLocaleString()}</p></div>
              <div><p className="text-text-secondary text-xs">Total Revenue</p><p className="font-medium">₹{reportView.totalRevenue.toLocaleString()}</p></div>
              <div><p className="text-text-secondary text-xs">Tax Collected</p><p className="font-medium">₹{reportView.taxCollected.toLocaleString()}</p></div>
              <div><p className="text-text-secondary text-xs">Occupancy</p><p className="font-medium">{reportView.occupiedRooms}/{reportView.totalRooms} ({reportView.occupancyRate}%)</p></div>
              <div><p className="text-text-secondary text-xs">Arrivals / Departures</p><p className="font-medium">{reportView.arrivals} / {reportView.departures}</p></div>
              <div><p className="text-text-secondary text-xs">No-Shows</p><p className="font-medium">{reportView.noShows}</p></div>
              <div><p className="text-text-secondary text-xs">Unpaid Folios</p><p className="font-medium">{reportView.unpaidFoliosCount} (₹{reportView.unpaidFoliosAmount.toLocaleString()})</p></div>
            </div>
            {reportView.notes && <div className="pt-3 border-t border-border dark:border-darkBorder"><p className="text-text-secondary text-xs mb-1">Notes</p><p>{reportView.notes}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
