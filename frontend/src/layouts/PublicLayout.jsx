import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function PublicLayout() {
  const [mobileMenu, setMobileMenu] = useState(false);

  const links = [
    { to: '/rooms', label: 'Rooms' },
    { to: '/dining', label: 'Dining' },
    { to: '/facilities', label: 'Facilities' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bgLight dark:bg-darkBg transition-colors duration-300">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 dark:bg-navy/70 border-b border-border dark:border-darkBorder">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
          <Link to="/" className="font-display text-2xl text-navy dark:text-white">
            Grand<span className="text-gold">Vista</span>
          </Link>

          <div className="hidden md:flex gap-8 text-sm font-medium">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-gold transition">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-gold transition">
              Sign In
            </Link>
            <Link
              to="/booking"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-gold to-goldLight text-navy text-sm font-semibold hover:shadow-lg hover:shadow-gold/30 transition"
            >
              Book Now
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenu((o) => !o)}>
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileMenu && (
          <div className="md:hidden flex flex-col gap-1 px-4 pb-4 border-t border-border dark:border-darkBorder bg-white dark:bg-navy animate-fade-in">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileMenu(false)}
                className="py-2.5 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenu(false)}
              className="py-2.5 text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/booking"
              onClick={() => setMobileMenu(false)}
              className="mt-2 text-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-gold to-goldLight text-navy text-sm font-semibold"
            >
              Book Now
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy text-white/70 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <p className="font-display text-xl text-white mb-3">
              Grand<span className="text-gold">Vista</span>
            </p>
            <p className="text-sm">123 Beachfront Avenue, Goa, India</p>
          </div>
          <div>
            <p className="text-white font-medium text-sm mb-3">Explore</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/rooms" className="hover:text-gold transition">Rooms</Link>
              <Link to="/dining" className="hover:text-gold transition">Dining</Link>
              <Link to="/menu" className="hover:text-gold transition">Menu</Link>
              <Link to="/facilities" className="hover:text-gold transition">Facilities</Link>
              <Link to="/gallery" className="hover:text-gold transition">Gallery</Link>
              <Link to="/offers" className="hover:text-gold transition">Offers</Link>
              <Link to="/events" className="hover:text-gold transition">Events</Link>
            </div>
          </div>
          <div>
            <p className="text-white font-medium text-sm mb-3">Company</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/about" className="hover:text-gold transition">About</Link>
              <Link to="/contact" className="hover:text-gold transition">Contact</Link>
              <Link to="/faq" className="hover:text-gold transition">FAQ</Link>
              <Link to="/policies" className="hover:text-gold transition">Policies</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 text-center text-xs py-5">
          © {new Date().getFullYear()} GrandVista Hotel. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
