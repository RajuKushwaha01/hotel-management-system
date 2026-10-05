import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 text-text-secondary" size={18} />}
      <input
        ref={ref}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg focus:outline-none focus:border-gold transition ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-danger text-xs mt-1">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
