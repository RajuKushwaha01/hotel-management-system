export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'px-6 py-3 rounded-xl font-medium transition-all duration-300 active:scale-95';
  const variants = {
    primary:
      'bg-gradient-to-r from-navy to-deepNavy text-white hover:shadow-lg hover:shadow-navy/30',
    gold: 'bg-gradient-to-r from-gold to-goldLight text-navy hover:shadow-lg hover:shadow-gold/40',
    outline: 'border border-navy text-navy dark:border-white dark:text-white hover:bg-navy/5',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
