// Exact mirror of the Final Permission Matrix. Every route in the system checks against THIS file —
// there is no second copy anywhere. Change access here and it takes effect everywhere immediately.

const ROLES = {
  ADMIN: 'super_admin',
  MANAGER: 'hotel_manager',
  RECEPTION: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  FNB: 'fnb_staff',
  CHEF: 'chef',
  ACCOUNTANT: 'accountant',
  MAINTENANCE: 'maintenance',
};

// Level meanings (used by requirePermission() to decide pass/fail):
//   full      -> unrestricted create/read/update/delete
//   limited   -> read-only, reduced field set (sensitive fields stripped)
//   operational -> day-to-day actions, no destructive/config changes
//   status    -> may change status only, nothing else
//   view      -> read-only, full fields
//   create    -> may create new records, cannot edit/delete others'
//   collect   -> may record payments/transactions, cannot edit billing config
//   report    -> may file/raise an issue, cannot manage the queue
//   request   -> may submit a request for approval, cannot approve
//   approve   -> may approve/reject requests raised by others
//   manage    -> full day-to-day management, not full admin config
//   own       -> sees/acts on only their own records
//   kitchen    -> full control within the kitchen/KOT workflow specifically
//   fnb        -> full control within F&B inventory specifically
//   maintenance -> full control within maintenance module specifically
//   front_desk / financial / hotel_level -> scoped report/settings access
//   none      -> no access at all (the '—' cells)

const PERMISSION_MATRIX = {
  system:        { [ROLES.ADMIN]: 'full' },
  users:         { [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'limited' },
  roles:         { [ROLES.ADMIN]: 'full' },

  rooms: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'operational',
    [ROLES.HOUSEKEEPING]: 'status', [ROLES.ACCOUNTANT]: 'view', [ROLES.MAINTENANCE]: 'maintenance',
  },
  reservations: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'full', [ROLES.ACCOUNTANT]: 'view',
  },
  guests: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'full',
    [ROLES.HOUSEKEEPING]: 'limited', [ROLES.FNB]: 'limited', [ROLES.ACCOUNTANT]: 'limited',
  },
  checkinout: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'full', [ROLES.ACCOUNTANT]: 'view',
  },
  housekeeping: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'view',
    [ROLES.HOUSEKEEPING]: 'full', [ROLES.MAINTENANCE]: 'report',
  },
  restaurant: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'view',
    [ROLES.FNB]: 'full', [ROLES.CHEF]: 'kitchen', [ROLES.ACCOUNTANT]: 'view',
  },
  kot: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'view', [ROLES.FNB]: 'create', [ROLES.CHEF]: 'full',
  },
  billing: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'view', [ROLES.RECEPTION]: 'create',
    [ROLES.FNB]: 'create', [ROLES.ACCOUNTANT]: 'full',
  },
  payments: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'view', [ROLES.RECEPTION]: 'collect',
    [ROLES.FNB]: 'collect', [ROLES.ACCOUNTANT]: 'full',
  },
  expenses: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'approve', [ROLES.FNB]: 'request',
    [ROLES.CHEF]: 'request', [ROLES.ACCOUNTANT]: 'full', [ROLES.MAINTENANCE]: 'request',
  },
  inventory: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.HOUSEKEEPING]: 'own_dept',
    [ROLES.FNB]: 'fnb', [ROLES.CHEF]: 'kitchen', [ROLES.ACCOUNTANT]: 'view', [ROLES.MAINTENANCE]: 'maintenance',
  },
  suppliers: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'manage', [ROLES.FNB]: 'request',
    [ROLES.CHEF]: 'request', [ROLES.ACCOUNTANT]: 'view', [ROLES.MAINTENANCE]: 'request',
  },
  staff:      { [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'manage' },
  attendance: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'manage', [ROLES.RECEPTION]: 'own', [ROLES.HOUSEKEEPING]: 'own',
    [ROLES.FNB]: 'own', [ROLES.CHEF]: 'own', [ROLES.ACCOUNTANT]: 'own', [ROLES.MAINTENANCE]: 'own',
  },
  maintenance: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'report', [ROLES.HOUSEKEEPING]: 'report',
    [ROLES.FNB]: 'report', [ROLES.CHEF]: 'report', [ROLES.MAINTENANCE]: 'full',
  },
  laundry: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'manage', [ROLES.RECEPTION]: 'request',
    [ROLES.HOUSEKEEPING]: 'manage', [ROLES.FNB]: 'request', [ROLES.ACCOUNTANT]: 'view',
  },
  transport: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'manage', [ROLES.RECEPTION]: 'create', [ROLES.ACCOUNTANT]: 'view',
  },
  events: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'create',
    [ROLES.FNB]: 'support', [ROLES.CHEF]: 'support', [ROLES.ACCOUNTANT]: 'billing',
  },
  reports: {
    [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'full', [ROLES.RECEPTION]: 'front_desk',
    [ROLES.HOUSEKEEPING]: 'own', [ROLES.FNB]: 'fnb', [ROLES.CHEF]: 'kitchen',
    [ROLES.ACCOUNTANT]: 'financial', [ROLES.MAINTENANCE]: 'maintenance',
  },
  audit_logs: { [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'view' },
  settings:   { [ROLES.ADMIN]: 'full', [ROLES.MANAGER]: 'hotel_level' },
};

const ALL_STAFF_ROLES = Object.values(ROLES);
const ALL_MODULES = Object.keys(PERMISSION_MATRIX);

const getLevel = (role, module) => PERMISSION_MATRIX[module]?.[role] || 'none';

module.exports = { ROLES, PERMISSION_MATRIX, ALL_STAFF_ROLES, ALL_MODULES, getLevel };