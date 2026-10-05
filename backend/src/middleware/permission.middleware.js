const ApiError = require('../utils/ApiError');
const { getLevel } = require('../config/permissionMatrix');

// requirePermission('rooms', 'full', 'operational') -> passes if the user's level for
// the 'rooms' module is 'full', OR is in the listed allowed set. 'full' always satisfies
// any check for its module (it is the superset), so routes never need to list it explicitly.
const requirePermission = (module, ...allowedLevels) => {
  return (req, res, next) => {
    const level = getLevel(req.user.role, module);

    if (level === 'none') {
      return next(new ApiError(403, `Your role has no access to ${module.replace(/_/g, ' ')}`));
    }
    if (level !== 'full' && !allowedLevels.includes(level)) {
      return next(new ApiError(403, `Your role's '${level}' access to ${module.replace(/_/g, ' ')} does not permit this action`));
    }

    req.permissionLevel = level; // controllers use this to scope queries (see helpers below)
    next();
  };
};

// For 'own'-level roles: forces a Mongoose filter to the current user's own records.
// Managers/admin (who have 'manage'/'full') are left unrestricted.
const scopeToOwn = (req, filter, ownField = 'staff') => {
  if (req.permissionLevel === 'own') {
    return { ...filter, [ownField]: req.user._id };
  }
  return filter;
};

// For 'limited' guest/document access: strips fields that should not reach that role.
const limitGuestFields = (guestObj, level) => {
  if (level !== 'limited') return guestObj;
  const { firstName, lastName, phone, preferences, membershipLevel } = guestObj;
  return { _id: guestObj._id, firstName, lastName, phone, preferences, membershipLevel };
};

module.exports = { requirePermission, scopeToOwn, limitGuestFields };