import { Award, Users, Calendar, Star } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero Banner Section */}
      <div className="relative h-[40vh] -mx-4 md:-mx-8 mb-14 overflow-hidden rounded-2xl">
        <img
          src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80"
          alt="GrandVista Hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-navy/10" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 animate-fade-in">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Our Story</p>
          <h1 className="font-display text-4xl text-white">About GrandVista Hotel</h1>
        </div>
      </div>

      <p className="text-text-secondary max-w-2xl mx-auto text-center mb-14">
        For over 15 years, GrandVista has welcomed travelers seeking comfort, elegance, and genuine hospitality.
        Every room, every meal, every interaction is designed around one goal — making your stay unforgettable.
      </p>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {[
          { icon: Users, value: '500+', label: 'Happy Guests' },
          { icon: Calendar, value: '15+', label: 'Years of Service' },
          { icon: Award, value: '25+', label: 'Awards Won' },
          { icon: Star, value: '4.8', label: 'Average Rating' },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="text-center p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder animate-slide-up"
          >
            <Icon className="mx-auto text-gold mb-3" size={26} />
            <p className="text-2xl font-display">{value}</p>
            <p className="text-text-secondary text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Our Philosophy Section */}
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="h-72 rounded-2xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80"
            alt="GrandVista lobby"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-display text-2xl mb-4">Our Philosophy</h2>
          <p className="text-text-secondary mb-4">
            We believe luxury isn't just about thread counts and marble lobbies — it's about being seen, understood, and cared for.
            Our team is trained to anticipate needs before they're spoken.
          </p>
          <p className="text-text-secondary">
            From our locally-sourced restaurant menu to our carbon-conscious housekeeping practices, every detail reflects our commitment
            to sustainable, thoughtful hospitality.
          </p>
        </div>
      </div>
    </div>
  );
}
