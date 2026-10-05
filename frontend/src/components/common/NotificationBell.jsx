import { useState, useRef, useEffect } from 'react';
import { Bell, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';

export default function NotificationBell({ mobileIconOnly = false }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const load = () => {
    notificationService.getAll().then((res) => {
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    });
  };

  useEffect(() => { load(); }, []);

  // Real-time: new notification pushed instantly via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
      toast(notification.title, { icon: '🔔' });
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [socket]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n) => {
    if (n.state === 'unread') {
      await notificationService.markAsRead(n._id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, state: 'read' } : x)));
    }
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    await notificationService.archive(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, state: 'read' })));
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen((o) => !o)} 
        className={mobileIconOnly ? 'relative' : 'relative p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-darkCard border border-border dark:border-darkBorder rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
          <div className="px-4 py-3 border-b border-border dark:border-darkBorder flex items-center justify-between">
            <span className="font-medium text-sm">Notifications</span>
            {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-gold hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-8">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 text-sm border-b border-border dark:border-darkBorder last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-start justify-between gap-2 ${n.state === 'unread' ? 'bg-gold/5' : ''}`}
                >
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-text-secondary text-xs mt-0.5">{n.message}</p>
                    <span className="text-xs text-text-secondary">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <button onClick={(e) => handleArchive(e, n._id)} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0" title="Archive">
                    <Archive size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
