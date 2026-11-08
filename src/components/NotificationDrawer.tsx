import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCheck, Trash2, X, Briefcase, ShoppingBag, Sparkles } from "lucide-react";
import { useApp, AppNotification } from "../context/AppContext";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  onNavigateToTab,
}: NotificationDrawerProps) {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useApp();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    title="Mark all as read"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    title="Clear all"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No new notifications</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Job updates, orders, and messages will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markNotificationAsRead(item.id);
                      if (item.linkTab && onNavigateToTab) {
                        onNavigateToTab(item.linkTab);
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer flex gap-3 text-left ${
                      item.read
                        ? "hover:bg-slate-50 opacity-80"
                        : "bg-indigo-50/50 hover:bg-indigo-50/80 border border-indigo-100/60"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === "job"
                          ? "bg-indigo-100 text-indigo-700"
                          : item.type === "order"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.type === "job" ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

