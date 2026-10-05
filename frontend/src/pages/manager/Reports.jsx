import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  TrendingUp, IndianRupee, BedDouble, Calendar, AlertTriangle,
  UtensilsCrossed, Sparkles, Wrench, Package,
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';

const COLORS = ['#C9A227', '#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const [overview, setOverview] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [housekeeping, setHousekeeping] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = dateRange;
    Promise.all([
      reportsService.getOverview(params),
      reportsService.getHotel(params),
      reportsService.getFinancial(params),
      reportsService.getRestaurant(params),
      reportsService.getHousekeeping(params),
      reportsService.getMaintenance(params),
      reportsService.getInventory(params),
    ])
      .then(([ov, ht, fin, res, hk, mt, inv]) => {
        setOverview(ov.data.data);
        setHotel(ht.data.data);
        setFinancial(fin.data.data);
        setRestaurant(res.data.data);
        setHousekeeping(hk.data.data);
        setMaintenance(mt.data.data);
        setInventory(inv.data.data);
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [dateRange.from, dateRange.to]);

  if (loading || !overview) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-display mb-1">Reports & Analytics</h1><p className="text-text-secondary text-sm">Full performance overview across every department</p></div>
        <div className="flex gap-2">
          <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
          <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
        </div>
      </div>

      {/* OVERVIEW STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`₹${overview.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="gold" />
        <StatCard label="Total Expenses" value={`₹${overview.totalExpenses.toLocaleString()}`} icon={TrendingUp} color="purple" />
        <StatCard label="Net Profit" value={`₹${overview.profit.toLocaleString()}`} icon={TrendingUp} color="green" />
        <StatCard label="Bookings" value={overview.totalBookings} icon={Calendar} color="blue" />
        <StatCard label="Open Maintenance" value={overview.openMaintenanceTickets} icon={Wrench} color="gold" />
        <StatCard label="Low Stock Items" value={overview.lowStockItems} icon={AlertTriangle} color="purple" />
      </div>

      <Tabs
        tabs={[
          {
            id: 'hotel', label: 'Hotel',
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Occupancy Rate" value={`${hotel.occupancyRate}%`} icon={BedDouble} color="gold" />
                  <StatCard label="ADR" value={`₹${hotel.adr}`} icon={IndianRupee} color="blue" />
                  <StatCard label="RevPAR" value={`₹${hotel.revPAR}`} icon={TrendingUp} color="green" />
                  <StatCard label="Avg. Length of Stay" value={`${hotel.avgLengthOfStay} nights`} icon={Calendar} color="purple" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Arrivals" value={hotel.arrivals} icon={Calendar} color="green" />
                  <StatCard label="Departures" value={hotel.departures} icon={Calendar} color="blue" />
                  <StatCard label="Cancellations" value={hotel.cancellations} icon={AlertTriangle} color="gold" />
                  <StatCard label="No-Shows" value={hotel.noShows} icon={AlertTriangle} color="purple" />
                </div>
                <Card>
                  <h3 className="font-semibold mb-4">Booking Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={hotel.bookingTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bookings" stroke="#C9A227" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            ),
          },
          {
            id: 'financial', label: 'Financial',
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Revenue" value={`₹${financial.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="gold" />
                  <StatCard label="Room Revenue" value={`₹${financial.roomRevenue.toLocaleString()}`} icon={BedDouble} color="blue" />
                  <StatCard label="Restaurant Revenue" value={`₹${financial.restaurantRevenue.toLocaleString()}`} icon={UtensilsCrossed} color="purple" />
                  <StatCard label="Tax Collected" value={`₹${financial.totalTax.toLocaleString()}`} icon={TrendingUp} color="green" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Discounts Given" value={`₹${financial.totalDiscount.toLocaleString()}`} icon={AlertTriangle} color="gold" />
                  <StatCard label="Refunds" value={`₹${financial.totalRefunds.toLocaleString()}`} icon={AlertTriangle} color="purple" />
                  <StatCard label="Outstanding" value={`₹${financial.totalOutstanding.toLocaleString()}`} icon={AlertTriangle} color="blue" />
                  <StatCard label="Net Profit" value={`₹${financial.profit.toLocaleString()}`} icon={TrendingUp} color="green" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="font-semibold mb-4">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={financial.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card>
                    <h3 className="font-semibold mb-4">Expenses by Category</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={Object.entries(financial.expenseByCategory).map(([name, value]) => ({ name, value }))}
                          dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                          label={({ name }) => name}
                        >
                          {Object.entries(financial.expenseByCategory).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            id: 'restaurant', label: 'Restaurant',
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Sales" value={`₹${restaurant.totalSales.toLocaleString()}`} icon={IndianRupee} color="gold" />
                  <StatCard label="Total Orders" value={restaurant.totalOrders} icon={UtensilsCrossed} color="blue" />
                  <StatCard label="Cancelled Orders" value={restaurant.cancelledOrders} icon={AlertTriangle} color="purple" />
                  <StatCard label="Cancellation Rate" value={`${restaurant.cancellationRate}%`} icon={AlertTriangle} color="gold" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="font-semibold mb-4">Best-Selling Items</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={restaurant.bestSelling} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" fontSize={11} />
                        <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#7C3AED" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card>
                    <h3 className="font-semibold mb-4">Sales by Order Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={restaurant.salesByType} dataKey="revenue" nameKey="type" cx="50%" cy="50%" outerRadius={90} label>
                          {restaurant.salesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            id: 'housekeeping', label: 'Housekeeping',
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Rooms Cleaned" value={housekeeping.roomsCleaned} icon={Sparkles} color="green" />
                  <StatCard label="Pending Rooms" value={housekeeping.pendingRooms} icon={AlertTriangle} color="gold" />
                  <StatCard label="Avg. Cleaning Time" value={`${housekeeping.avgCleaningMinutes} min`} icon={Calendar} color="blue" />
                </div>
                <Card>
                  <h3 className="font-semibold mb-4">Cleaning Volume Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={housekeeping.cleaningTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="roomsCleaned" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            ),
          },
          {
            id: 'maintenance', label: 'Maintenance',
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Open Requests" value={maintenance.openRequests} icon={Wrench} color="gold" />
                  <StatCard label="Completed" value={maintenance.completedRequests} icon={Wrench} color="green" />
                  <StatCard label="Total Cost" value={`₹${maintenance.totalCost.toLocaleString()}`} icon={IndianRupee} color="purple" />
                </div>
                <Card>
                  <h3 className="font-semibold mb-4">Frequent Problem Categories</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={maintenance.frequentProblems}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="category" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            ),
          },
          {
            id: 'inventory', label: 'Inventory',
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Items" value={inventory.totalItems} icon={Package} color="blue" />
                  <StatCard label="Low Stock" value={inventory.lowStockCount} icon={AlertTriangle} color="gold" />
                  <StatCard label="Total Consumption" value={inventory.totalConsumption} icon={Package} color="purple" />
                  <StatCard label="Total Wastage" value={inventory.totalWastage} icon={AlertTriangle} color="green" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="font-semibold mb-4">Top Consumed Items</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={inventory.topConsumed} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" fontSize={11} />
                        <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#2563EB" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card>
                    <h3 className="font-semibold mb-4">Low Stock Items</h3>
                    <Table
                      columns={[
                        { key: 'name', label: 'Item' },
                        { key: 'currentStock', label: 'Current', render: (r) => `${r.currentStock} ${r.unit}` },
                        { key: 'minimumStock', label: 'Minimum', render: (r) => `${r.minimumStock} ${r.unit}` },
                      ]}
                      data={inventory.lowStockItems}
                      emptyMessage="No low stock items"
                    />
                  </Card>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
