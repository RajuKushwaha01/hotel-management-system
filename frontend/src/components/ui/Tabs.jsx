import { useState } from 'react';

export default function Tabs({ tabs, defaultTab }) {
  const [active, setActive] = useState(defaultTab || tabs[0].id);
  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div>
      <div className="flex gap-1 border-b border-border dark:border-darkBorder mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
              active === t.id
                ? 'border-gold text-gold'
                : 'border-transparent text-text-secondary hover:text-navy dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in">{activeTab?.content}</div>
    </div>
  );
}
