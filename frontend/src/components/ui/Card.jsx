export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white dark:bg-darkCard border border-border dark:border-darkBorder rounded-2xl p-5 shadow-sm ${
        hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
