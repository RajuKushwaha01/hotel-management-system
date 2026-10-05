import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, Receipt, AlertCircle, Wallet, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountantService } from '../../services/accountantService';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';

export default function AccountantDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    accountantService.getDashboard().then((res) => setData(res.data.data)).catch(() => toast.error('Failed to load'));
  }, []);

  if (!data) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(9)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const cards = [
    { label: "Today's Revenue", value: `₹${data.todayRevenue.toLocaleString()}`, icon: IndianRupee, color: 'gold' },
    { label: 'Monthly Revenue', value: `₹${data.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'green' },
    { label: 'Room Revenue', value: `₹${data.roomRevenue.toLocaleString()}`, icon: Receipt, color: 'blue' },
    { label: 'Restaurant Revenue', value: `₹${data.restaurantRevenue.toLocaleString()}`, icon: Receipt, color: 'purple' },
    { label: 'Monthly Expenses', value: `₹${data.expenses.toLocaleString()}`, icon: Wallet, color: 'gold' },
    { label: 'Tax (Est.)', value: `₹${data.tax.toLocaleString()}`, icon: PieChart, color: 'blue' },
    { label: 'Refunds', value: `₹${data.refunds.toLocaleString()}`, icon: AlertCircle, color: 'purple' },
    { label: 'Outstanding Balance', value: `₹${data.outstandingBalance.toLocaleString()}`, icon: AlertCircle, color: 'gold' },
    { label: 'Profit/Loss', value: `₹${data.profitLoss.toLocaleString()}`, icon: TrendingUp, color: data.profitLoss >= 0 ? 'green' : 'gold' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Financial Overview</h1>
      <p className="text-text-secondary text-sm mb-6">Revenue, expenses and outstanding balances</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}
