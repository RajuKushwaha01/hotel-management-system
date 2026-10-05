export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOTEL_MANAGER: 'hotel_manager',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  FNB_STAFF: 'fnb_staff',
  CHEF: 'chef',
  ACCOUNTANT: 'accountant',
  MAINTENANCE: 'maintenance',
  CUSTOMER: 'customer',
};

export const STAFF_ROLES = [
  ROLES.SUPER_ADMIN, ROLES.HOTEL_MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING,
  ROLES.FNB_STAFF, ROLES.CHEF, ROLES.ACCOUNTANT, ROLES.MAINTENANCE,
];

// The single mapping every login redirects through. One role -> exactly one home screen.
// This is the "control system": whichever account logs in, this table decides where they land.
export const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
  [ROLES.HOTEL_MANAGER]: '/manager/dashboard',
  [ROLES.RECEPTIONIST]: '/receptionist/dashboard',
  [ROLES.HOUSEKEEPING]: '/housekeeping/dashboard',
  [ROLES.FNB_STAFF]: '/restaurant/tables',
  [ROLES.CHEF]: '/kitchen/dashboard',
  [ROLES.ACCOUNTANT]: '/accountant/dashboard',
  [ROLES.MAINTENANCE]: '/maintenance/dashboard',
  [ROLES.CUSTOMER]: '/customer/dashboard',
};

// Human-readable label + layout variant for each role, used by the navbar badge and
// by StaffLayout to pick the correct sidebar link set (built in Parts 2–15).
export const ROLE_META = {
  [ROLES.SUPER_ADMIN]: { label: 'Super Admin', variant: 'admin', color: 'gold' },
  [ROLES.HOTEL_MANAGER]: { label: 'Hotel Manager', variant: 'staff', color: 'blue' },
  [ROLES.RECEPTIONIST]: { label: 'Receptionist', variant: 'staff', color: 'blue' },
  [ROLES.HOUSEKEEPING]: { label: 'Housekeeping', variant: 'staff', color: 'purple' },
  [ROLES.FNB_STAFF]: { label: 'F&B Staff', variant: 'staff', color: 'purple' },
  [ROLES.CHEF]: { label: 'Chef', variant: 'staff', color: 'gold' },
  [ROLES.ACCOUNTANT]: { label: 'Accountant', variant: 'staff', color: 'green' },
  [ROLES.MAINTENANCE]: { label: 'Maintenance', variant: 'staff', color: 'purple' },
  [ROLES.CUSTOMER]: { label: 'Guest', variant: 'customer', color: 'gold' },
};

export const homeFor = (role) => ROLE_HOME[role] || '/login';