// Single source of truth for who can touch which document type.
const DOC_TYPES = {
  guest_id: {
    label: 'Guest Identification',
    sensitive: true,
    roles: ['receptionist', 'hotel_manager', 'super_admin'],
  },
  staff_document: {
    label: 'Staff Document',
    sensitive: true,
    roles: ['hotel_manager', 'super_admin'],
  },
  supplier_document: {
    label: 'Supplier Document',
    sensitive: false,
    roles: ['accountant', 'hotel_manager', 'super_admin'],
  },
  invoice: {
    label: 'Invoice',
    sensitive: false,
    roles: ['accountant', 'receptionist', 'hotel_manager', 'super_admin'],
  },
  maintenance_document: {
    label: 'Maintenance Document',
    sensitive: false,
    roles: ['maintenance', 'hotel_manager', 'super_admin'],
  },
};

const DELETE_ROLES = ['hotel_manager', 'super_admin'];

const canAccess = (role, docType) => !!DOC_TYPES[docType]?.roles.includes(role);
const typesForRole = (role) => Object.keys(DOC_TYPES).filter((t) => DOC_TYPES[t].roles.includes(role));

module.exports = { DOC_TYPES, DELETE_ROLES, canAccess, typesForRole };