const STATUS_STYLES = {
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  checked_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  completed: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  clean: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  dirty: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const text = status.replace(/_/g, ' ');
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {text}
    </span>
  );
}
