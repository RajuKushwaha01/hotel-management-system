const { PERMISSION_MATRIX, ALL_STAFF_ROLES, ALL_MODULES, getLevel } = require('../config/permissionMatrix');

// Full matrix — used by the admin-facing Permissions page so the UI can never drift from
// what the backend actually enforces.
const getMatrix = (req, res) => {
  res.status(200).json({ success: true, data: { roles: ALL_STAFF_ROLES, modules: ALL_MODULES, matrix: PERMISSION_MATRIX } });
};

// What can *I* do — used by the frontend to hide/show buttons that match backend rules
const getMyPermissions = (req, res) => {
  const my = {};
  ALL_MODULES.forEach((m) => { my[m] = getLevel(req.user.role, m); });
  res.status(200).json({ success: true, data: my });
};

module.exports = { getMatrix, getMyPermissions };