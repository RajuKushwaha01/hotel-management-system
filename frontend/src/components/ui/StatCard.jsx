export default function StatCard({ label, value, icon: Icon, trend, color = 'gold' }) {
  const colorMap = {
    gold: 'from-gold to-goldLight text-navy',
    blue: 'from-accentBlue to-cyan-400 text-white',
    purple: 'from-accentPurple to-purple-400 text-white',
    green: 'from-success to-emerald-400 text-white',
  };

  return (
    <div className="bg-white dark:bg-darkCard border border-border dark:border-darkBorder rounded-2xl p-5 hover:shadow-lg transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm">{label}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend && <p className="text-success text-xs mt-1">▲ {trend}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
