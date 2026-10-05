import { useState } from 'react';
import { X } from 'lucide-react';

// Free, royalty-free hotel/hospitality photography from Unsplash — swap these for your
// own property photos later; the structure (caption + url) stays the same.
const IMAGES = [
  { id: 1, caption: 'Grand Lobby', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80' },
  { id: 2, caption: 'Deluxe Suite', url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80' },
  { id: 3, caption: 'Infinity Pool', url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80' },
  { id: 4, caption: 'Fine Dining', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' },
  { id: 5, caption: 'Spa & Wellness', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80' },
  { id: 6, caption: 'Presidential Suite', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80' },
  { id: 7, caption: 'Garden View', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80' },
  { id: 8, caption: 'Rooftop Bar', url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80' },
  { id: 9, caption: 'Fitness Center', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80' },
  { id: 10, caption: 'Banquet Hall', url: 'https://images.unsplash.com/photo-1519167758481-83f29c8e8d6c?w=800&q=80' },
  { id: 11, caption: 'Sunset Terrace', url: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800&q=80' },
  { id: 12, caption: 'Executive Lounge', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80' },
];

export default function Gallery() {
  const [active, setActive] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12 animate-fade-in">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Take a Look Inside</p>
        <h1 className="font-display text-4xl mb-3">Gallery</h1>
        <p className="text-text-secondary">A glimpse into the GrandVista experience — every space designed for comfort and elegance</p>
      </div>

      <div className="columns-2 sm:columns-3 gap-4 space-y-4">
        {IMAGES.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(img)}
            style={{ animationDelay: `${i * 50}ms` }}
            className="w-full rounded-2xl overflow-hidden relative group break-inside-avoid animate-fade-in shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={img.url}
              alt={img.caption}
              loading="lazy"
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-sm font-medium">{img.caption}</span>
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActive(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-gold transition" onClick={() => setActive(null)}>
            <X size={28} />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={active.url.replace('w=800', 'w=1600')} alt={active.caption} className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
            <p className="text-white text-center mt-4 font-display text-lg">{active.caption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
