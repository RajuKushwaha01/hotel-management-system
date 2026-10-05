const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const settingsRoutes = require('./routes/settings.routes');
const managerRoutes = require('./routes/manager.routes');
const receptionistRoutes = require('./routes/receptionist.routes');
const guestRoutes = require('./routes/guest.routes');
const serviceRequestRoutes = require('./routes/serviceRequest.routes');
const housekeepingRoutes = require('./routes/housekeeping.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const kitchenRoutes = require('./routes/kitchen.routes');
const accountantRoutes = require('./routes/accountant.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const customerRoutes = require('./routes/customer.routes');
const publicRoutes = require('./routes/public.routes');
const roomRoutes = require('./routes/room.routes');
const rateManagementRoutes = require('./routes/rateManagement.routes');
const folioRoutes = require('./routes/folio.routes');
const depositRoutes = require('./routes/deposit.routes');
const laundryRoutes = require('./routes/laundry.routes');
const transportRoutes = require('./routes/transport.routes');
const eventRoutes = require('./routes/event.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const procurementRoutes = require('./routes/procurement.routes');
const staffRoutes = require('./routes/staff.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const crmRoutes = require('./routes/crm.routes');
const reviewComplaintRoutes = require('./routes/reviewComplaint.routes');
const reportsRoutes = require('./routes/reports.routes');
const nightAuditRoutes = require('./routes/nightAudit.routes');
const notificationRoutes = require('./routes/notification.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const documentRoutes = require('./routes/document.routes');
const qrRoutes = require('./routes/qr.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const backupRoutes = require('./routes/backup.routes');
const permissionsRoutes = require('./routes/permissions.routes');
const workflowRoutes = require('./routes/workflow.routes');
const serviceCatalogRoutes = require('./routes/serviceCatalog.routes');
const schemaRoutes = require('./routes/schema.routes');
const loyaltyRoutes = require('./routes/loyalty.routes');


const { errorHandler, notFound } = require('./middleware/error.middleware');
const { sanitizeInput } = require('./middleware/sanitize.middleware');
const { getCsrfToken } = require('./middleware/csrf.middleware');

const app = express();
app.set('trust proxy', 1);

// ---------- SECURITY HEADERS ----------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ---------- CORS (with credentials for secure cookies) ----------
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' })); // caps request body size against payload-flood attacks
app.use(cookieParser());

// ---------- INPUT SANITIZATION (NoSQL injection protection) ----------
app.use(sanitizeInput);

// ---------- CSRF TOKEN ENDPOINT ----------
app.get('/api/csrf-token', getCsrfToken);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Hotel Management API is running 🏨' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rates', rateManagementRoutes);
app.use('/api/folios', folioRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/review-complaints', reviewComplaintRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/night-audit', nightAuditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/services', serviceCatalogRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/laundry', laundryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;