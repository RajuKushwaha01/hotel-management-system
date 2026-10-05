// Recursively strips any key starting with '$' or containing '.' — the classic NoSQL
// injection vectors (e.g. { email: { "$ne": null } }). Mutates objects in place rather
// than reassigning req.query/req.body/req.params, because req.query is a getter-only
// property in current Express/Node and reassigning it throws
// "Cannot set property query of #<IncomingMessage> which has only a getter".
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
};

const sanitizeInput = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query); // mutated in place — never reassigned
  next();
};

module.exports = { sanitizeInput };