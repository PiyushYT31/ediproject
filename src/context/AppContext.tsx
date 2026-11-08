import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { collection, query, where, onSnapshot, or } from "firebase/firestore";
import { db } from "../firebase";
import { JobRequest, JobStatus } from "../types";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: "job" | "order" | "system";
  linkTab?: string;
}

interface AppContextType {
  favorites: string[]; // worker uids or product ids
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Favorites state persisted to localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("worksphere_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Sync favorites
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem("worksphere_favorites", JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  // Real-time job listeners to generate live in-app notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "jobs"),
      or(where("consumerId", "==", user.uid), where("workerId", "==", user.uid))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: AppNotification[] = [];

      snapshot.docs.forEach((doc) => {
        const job = doc.data() as JobRequest;
        let title = "Job Update";
        let message = "";

        if (job.status === JobStatus.ACCEPTED) {
          title = "Job Accepted! ✅";
          message = `Worker accepted booking for ${job.category}.`;
        } else if (job.status === JobStatus.IN_PROGRESS) {
          title = "Work in Progress 🔨";
          message = `Your ${job.category} service is underway.`;
        } else if (job.status === JobStatus.COMPLETED) {
          title = "Job Completed 🎉";
          message = `${job.category} job is marked as complete.`;
        } else if (job.status === JobStatus.PENDING) {
          title = "New Booking Request 📋";
          message = `Request placed for ${job.category}.`;
        }

        if (message) {
          newNotifications.push({
            id: `${doc.id}_${job.status}_${job.updatedAt || job.createdAt}`,
            title,
            message,
            timestamp: job.updatedAt || job.createdAt || Date.now(),
            read: false,
            type: "job",
            linkTab: "jobs",
          });
        }
      });

      // Sort newest first
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(newNotifications.slice(0, 15));
    });

    return () => unsubscribe();
  }, [user]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

