// Temporary diagnostic page — lists every reported-broken route as a plain HTML link
// (not a React Router NavLink, not inside the sidebar). Plain <a> tags force a full
// page reload when clicked, which bypasses any sidebar/JS click-handling issue entirely
// and tests only one thing: does this exact URL, typed directly, load correctly?
// This isolates whether the problem is (A) the sidebar's click handling,
// (B) the route definition, or (C) the page's own data-fetching code.

const ROUTES = [
  '/customer/bookings', '/customer/reviews', '/customer/loyalty',
  '/admin/services', '/admin/backup',
  '/manager/suppliers', '/manager/staff', '/manager/night-audit',
  '/receptionist/transport', '/receptionist/check-out',
  '/housekeeping/laundry',
  '/accountant/deposits',
  '/maintenance/equipment',
];

export default function Diagnostic() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>Route Diagnostic</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Click each link below (plain HTML link, full page reload). For each one, note:
        <br />• <b>Blank white page</b> → route/component problem
        <br />• <b>Red error text on screen</b> → copy that exact text
        <br />• <b>Page loads with a "failed to load" message</b> → API/backend problem
        <br />• <b>Page loads normally with data</b> → working fine
      </p>
      <ul style={{ lineHeight: 2.2 }}>
        {ROUTES.map((r) => (
          <li key={r}>
            <a href={r} style={{ color: '#2563EB' }}>{r}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
