import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import StaffLayout from '../layouts/StaffLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRedirect from './RoleRedirect';
import { ROLES } from '../constants/roles';
import { useAuth } from '../context/AuthContext';

// ---------- AUTH ----------
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';

// ---------- PUBLIC ----------
import Home from '../pages/public/Home';
import RoomsPublic from '../pages/public/Rooms';
import RoomDetails from '../pages/public/RoomDetails';
import About from '../pages/public/About';
import Facilities from '../pages/public/Facilities';
import Dining from '../pages/public/Dining';
import MenuPublic from '../pages/public/MenuPublic';
import Gallery from '../pages/public/Gallery';
import Offers from '../pages/public/Offers';
import EventsPublic from '../pages/public/EventsPublic';
import Contact from '../pages/public/Contact';
import FAQ from '../pages/public/FAQ';
import Policies from '../pages/public/Policies';
import QRMenu from '../pages/public/QRMenu';
import QRRoom from '../pages/public/QRRoom';
import QRRoomService from '../pages/public/QRRoomService';
import VerifyInvoice from '../pages/public/VerifyInvoice';

// ---------- CUSTOMER ----------
import CustomerDashboard from '../pages/customer/Dashboard';
import BookingWizard from '../pages/customer/BookingWizard';
import BookingConfirmation from '../pages/customer/BookingConfirmation';
import Payment from '../pages/customer/Payment';
import PaymentResult from '../pages/customer/PaymentResult';
import MyBookings from '../pages/customer/MyBookings';
import CustomerServices from '../pages/customer/Services';       // ALIASED — distinct from admin ServicesAdmin below
import Invoices from '../pages/customer/Invoices';
import Reviews from '../pages/customer/Reviews';
import Loyalty from '../pages/customer/Loyalty';
import Profile from '../pages/customer/Profile';

// ---------- SUPER ADMIN ----------
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminRooms from '../pages/admin/Rooms';
import RoomTypes from '../pages/admin/RoomTypes';
import SettingsPage from '../pages/admin/SettingsPage';
import Permissions from '../pages/admin/Permissions';
import ServicesAdmin from '../pages/admin/Services';              // ALIASED — Service Catalog, distinct from CustomerServices
import Backup from '../pages/admin/Backup';
import DatabaseSchema from '../pages/admin/DatabaseSchema';
import WorkflowTrace from '../pages/admin/WorkflowTrace';
import AuditLogs from '../pages/admin/AuditLogs';

// ---------- SHARED (Documents, Room Status Board) ----------
import Documents from '../pages/shared/Documents';
import RoomStatusBoard from '../pages/shared/RoomStatusBoard';

// ---------- HOTEL MANAGER ----------
import ManagerDashboard from '../pages/manager/Dashboard';
import ManagerReservations from '../pages/manager/Reservations';
import ReservationCalendar from '../pages/manager/ReservationCalendar';
import RoomRates from '../pages/manager/RoomRates';
import InventoryPage from '../pages/manager/Inventory';
import Suppliers from '../pages/manager/Suppliers';
import Procurement from '../pages/manager/Procurement';
import StaffPage from '../pages/manager/Staff';
import Attendance from '../pages/manager/Attendance';
import Events from '../pages/manager/Events';
import CRM from '../pages/manager/CRM';
import ReviewsComplaints from '../pages/manager/ReviewsComplaints';
import Reports from '../pages/manager/Reports';
import NightAudit from '../pages/manager/NightAudit';

// ---------- RECEPTIONIST ----------
import ReceptionistDashboard from '../pages/receptionist/Dashboard';
import Reservations from '../pages/receptionist/Reservations';
import CheckIn from '../pages/receptionist/CheckIn';
import CheckOut from '../pages/receptionist/CheckOut';
import Guests from '../pages/receptionist/Guests';
import FrontDeskServices from '../pages/receptionist/FrontDeskServices';
import Transport from '../pages/receptionist/Transport';
import FolioDetail from '../pages/receptionist/FolioDetail';

// ---------- HOUSEKEEPING ----------
import HousekeepingDashboard from '../pages/housekeeping/Dashboard';
import LostFound from '../pages/housekeeping/LostFound';
import Laundry from '../pages/housekeeping/Laundry';

// ---------- F&B / KITCHEN ----------
import Tables from '../pages/restaurant/Tables';
import RestaurantMenu from '../pages/restaurant/Menu';
import Orders from '../pages/restaurant/Orders';
import KitchenDashboard from '../pages/kitchen/Dashboard';

// ---------- ACCOUNTANT ----------
import AccountantDashboard from '../pages/accountant/Dashboard';
import Payments from '../pages/accountant/Payments';
import Expenses from '../pages/accountant/Expenses';
import Deposits from '../pages/accountant/Deposits';

// ---------- MAINTENANCE ----------
import MaintenanceDashboard from '../pages/maintenance/Dashboard';
import Equipment from '../pages/maintenance/Equipment';
import Diagnostic from '../pages/Diagnostic';


// Logged-in users skip the marketing homepage and go straight to their dashboard.
function HomeGate() {
  const { user } = useAuth();
  return user ? <RoleRedirect /> : <Home />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC ===== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomeGate />} />
        <Route path="/rooms" element={<RoomsPublic />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/dining" element={<Dining />} />
        <Route path="/menu" element={<MenuPublic />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/events" element={<EventsPublic />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/policies" element={<Policies />} />
      </Route>

      {/* ===== AUTH ===== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/unauthorized" element={<div className="p-10 text-center">🚫 Access Denied</div>} />

      {/* ===== GENERIC ENTRY ===== */}
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* ===== QR / STANDALONE GUEST FLOWS (no login) ===== */}
      <Route path="/qr-menu/:tableId" element={<QRMenu />} />
      <Route path="/qr-room/:roomNumber" element={<QRRoom />} />
      <Route path="/qr-room/:roomNumber/room-service" element={<QRRoomService />} />
      <Route path="/verify-invoice/:code" element={<VerifyInvoice />} />
      <Route path="/booking" element={<BookingWizard />} />
      <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
      <Route path="/payment/:bookingId" element={<Payment />} />
      <Route path="/payment/:bookingId/result" element={<PaymentResult />} />

      {/* ===== SUPER ADMIN ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/room-types" element={<RoomTypes />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/permissions" element={<Permissions />} />
          <Route path="/admin/services" element={<ServicesAdmin />} />
          <Route path="/admin/backup" element={<Backup />} />
          <Route path="/admin/database-schema" element={<DatabaseSchema />} />
          <Route path="/admin/workflow" element={<WorkflowTrace />} />
        </Route>
      </Route>

      {/* ===== AUDIT LOGS (Admin full, Manager view) ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.HOTEL_MANAGER]} />}>
        <Route element={<StaffLayout variant="admin" />}>
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
      </Route>

      {/* ===== DOCUMENTS (Admin, Manager, Reception, Accountant, Maintenance) ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.HOTEL_MANAGER, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT, ROLES.MAINTENANCE]} />}>
        <Route element={<StaffLayout variant="admin" />}>
          <Route path="/documents" element={<Documents />} />
        </Route>
      </Route>

      {/* ===== ROOM STATUS BOARD (Admin, Manager, Reception, Housekeeping) ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.HOTEL_MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING]} />}>
        <Route element={<StaffLayout variant="admin" />}>
          <Route path="/room-status-board" element={<RoomStatusBoard />} />
        </Route>
      </Route>

      {/* ===== HOTEL MANAGER ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="manager" />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/reservations" element={<ManagerReservations />} />
          <Route path="/manager/calendar" element={<ReservationCalendar />} />
          <Route path="/manager/room-rates" element={<RoomRates />} />
          <Route path="/manager/inventory" element={<InventoryPage />} />
          <Route path="/manager/suppliers" element={<Suppliers />} />
          <Route path="/manager/procurement" element={<Procurement />} />
          <Route path="/manager/staff" element={<StaffPage />} />
          <Route path="/manager/attendance" element={<Attendance />} />
          <Route path="/manager/events" element={<Events />} />
          <Route path="/manager/crm" element={<CRM />} />
          <Route path="/manager/reviews-complaints" element={<ReviewsComplaints />} />
          <Route path="/manager/reports" element={<Reports />} />
          <Route path="/manager/night-audit" element={<NightAudit />} />
        </Route>
      </Route>

      {/* ===== RECEPTIONIST ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST, ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="receptionist" />}>
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/reservations" element={<Reservations />} />
          <Route path="/receptionist/check-in" element={<CheckIn />} />
          <Route path="/receptionist/check-out" element={<CheckOut />} />
          <Route path="/receptionist/guests" element={<Guests />} />
          <Route path="/receptionist/services" element={<FrontDeskServices />} />
          <Route path="/receptionist/transport" element={<Transport />} />
          <Route path="/receptionist/folio/:bookingId" element={<FolioDetail />} />
        </Route>
      </Route>

      {/* ===== HOUSEKEEPING ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.HOUSEKEEPING, ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="housekeeping" />}>
          <Route path="/housekeeping/dashboard" element={<HousekeepingDashboard />} />
          <Route path="/housekeeping/lost-found" element={<LostFound />} />
          <Route path="/housekeeping/laundry" element={<Laundry />} />
        </Route>
      </Route>

      {/* ===== F&B STAFF ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.FNB_STAFF, ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="fnb_staff" />}>
          <Route path="/restaurant/tables" element={<Tables />} />
          <Route path="/restaurant/menu" element={<RestaurantMenu />} />
          <Route path="/restaurant/orders" element={<Orders />} />
        </Route>
      </Route>

      {/* ===== CHEF ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CHEF, ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="chef" />}>
          <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
        </Route>
      </Route>

      {/* ===== ACCOUNTANT ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT, ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="accountant" />}>
          <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
          <Route path="/accountant/payments" element={<Payments />} />
          <Route path="/accountant/expenses" element={<Expenses />} />
          <Route path="/accountant/deposits" element={<Deposits />} />
        </Route>
      </Route>

      {/* ===== MAINTENANCE ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.MAINTENANCE, ROLES.HOTEL_MANAGER, ROLES.SUPER_ADMIN]} />}>
        <Route element={<StaffLayout variant="maintenance" />}>
          <Route path="/maintenance/dashboard" element={<MaintenanceDashboard />} />
          <Route path="/maintenance/equipment" element={<Equipment />} />
        </Route>
      </Route>

      {/* ===== CUSTOMER ===== */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/bookings" element={<MyBookings />} />
          <Route path="/customer/services" element={<CustomerServices />} />
          <Route path="/customer/invoices" element={<Invoices />} />
          <Route path="/customer/reviews" element={<Reviews />} />
          <Route path="/customer/loyalty" element={<Loyalty />} />
          <Route path="/customer/profile" element={<Profile />} />
        </Route>
      </Route>
      
      <Route path="/diagnostic" element={<Diagnostic />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
