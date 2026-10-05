import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { accountantService } from '../../services/accountantService';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Tabs from '../../components/ui/Tabs';

export default function Reports() {
  const [revenue, setRevenue] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [outstanding, setOutstanding] = useState([]);

  useEffect(() => {
    accountantService.getRevenueReport({ period: 'daily' }).then((res) => setRevenue(res.data.data)).catch(() => toast.error('Failed to load revenue'));
    accountantService.getProfitLossReport().then((res) => setPnl(res.data.data)).catch(() => {});
    accountantService.getOutstandingReport().then((res) => setOutstanding(res.data.data)).catch(() => {});
  }, []);

  const outstandingColumns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'room', label: 'Room', render: (r) => r.room?.roomNumber },
    { key: 'balance', label: 'Balance Due', render: (r) => `₹${r.balance.toLocaleString()}` },
  ];

  const expenseChartData = pnl ? Object.entries(pnl.expenseByCategory).map(([category, amount]) => ({ category, amount })) : [];

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Reports & Analytics</h1>

      <Tabs
        tabs={[
          {
            id: 'revenue', label: 'Revenue',
            content: (
              <Card>
                <h3 className="font-semibold mb-4">Daily Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            ),
          },
          {
            id: 'pnl', label: 'Profit & Loss',
            content: pnl && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="text-center"><p className="text-2xl font-bold text-success">₹{pnl.revenue.toLocaleString()}</p><p className="text-xs text-text-secondary">Revenue</p></Card>
                  <Card className="text-center"><p className="text-2xl font-bold text-danger">₹{pnl.totalExpenses.toLocaleString()}</p><p className="text-xs text-text-secondary">Expenses</p></Card>
                  <Card className="text-center"><p className="text-2xl font-bold text-gold">₹{pnl.profit.toLocaleString()}</p><p className="text-xs text-text-secondary">Net Profit</p></Card>
                </div>
                <Card>
                  <h3 className="font-semibold mb-4">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={expenseChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="category" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            ),
          },
          {
            id: 'outstanding', label: 'Outstanding',
            content: <Table columns={outstandingColumns} data={outstanding} emptyMessage="No outstanding balances" />,
          },
        ]}
      />
    </div>
  );
}
