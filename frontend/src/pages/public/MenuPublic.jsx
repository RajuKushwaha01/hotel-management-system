import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { publicService } from '../../services/publicService';

export default function MenuPublic() {
  const [menu, setMenu] = useState({});

  useEffect(() => {
    // Reuses the same restaurant menu items the QR menu shows — no separate public endpoint needed.
    import('../../services/qrService').then(({ qrService }) => {
      qrService.getRoomServiceMenu().then((res) => setMenu(res.data.data));
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="font-display text-4xl mb-3">Our Menu</h1>
        <p className="text-text-secondary">A taste of what awaits you at The Grand Table</p>
      </div>

      {Object.entries(menu).map(([category, items]) => (
        <div key={category} className="mb-10">
          <h2 className="font-display text-xl mb-4 pb-2 border-b border-gold/30">{category}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between gap-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {item.isVeg && <Leaf size={13} className="text-success" />}
                  </div>
                  <p className="text-text-secondary text-xs">{item.description}</p>
                </div>
                <span className="text-gold font-semibold shrink-0">₹{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
