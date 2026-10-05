const AuditLog = require('../models/AuditLog');

// Values that must never be written to the log in clear text
const REDACTED_KEYS = ['password', 'passwordResetToken', 'emailVerificationToken', 'idNumber'];

const MODULE_BY_TARGET = {
  User: 'users', Room: 'rooms', RoomRate: 'rates', RatePlan: 'rates', Booking: 'bookings',
  Folio: 'billing', Deposit: 'billing', Setting: 'settings', Document: 'documents',
  Staff: 'staff', InventoryItem: 'inventory', MaintenanceTicket: 'maintenance',
};

const same = (a, b) => {
  if (a && b && typeof a === 'object' && typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return String(a) === String(b);
};

// Compare before/after for the given fields; returns only what actually changed
const buildChanges = (before, after, fields) => {
  const oldValue = {};
  const newValue = {};
  fields.forEach((f) => {
    if (after[f] === undefined) return;
    if (same(before[f], after[f])) return;
    const redact = REDACTED_KEYS.includes(f);
    oldValue[f] = redact ? '[redacted]' : before[f];
    newValue[f] = redact ? '[redacted]' : after[f];
  });
  return { oldValue, newValue, changed: Object.keys(newValue).length > 0 };
};

// Never throws and never blocks the response
const logAction = async ({
  userId, user, action, module, description,
  targetType, targetId, targetLabel,
  oldValue, newValue, details, sessionId, req,
}) => {
  try {
    const actor = user || req?.user;
    await AuditLog.create({
      user: userId || actor?._id,
      userName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      userRole: actor?.role,
      action,
      module: module || MODULE_BY_TARGET[targetType] || 'system',
      description,
      targetType,
      targetId,
      targetLabel,
      oldValue,
      newValue,
      details,
      ipAddress: req?.ip,
      sessionId: sessionId || req?.sessionId,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { logAction, buildChanges };