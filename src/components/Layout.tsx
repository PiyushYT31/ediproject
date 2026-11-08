import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  MapPin, 
  User, 
  Bell, 
  Globe, 
  Check, 
  ShoppingBag, 
  CalendarDays,
  Sparkles,
  ChevronDown,
  Navigation
} from "lucide-react";
import { cn } from "../lib/utils";
import { useI18n, Language } from "../lib/i18n";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useLocation } from "../context/LocationContext";
import NotificationDrawer from "./NotificationDrawer";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { t, language, setLanguage } = useI18n();
  const { user, userProfile } = useAuth();
  const { unreadCount } = useApp();
  const { location, isLocating, detectLocation } = useLocation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onTabChange("explore")}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <span className="text-lg font-black tracking-tight text-slate-900 font-sans">
                  Work<span className="text-indigo-600">Sphere</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 tracking-wide uppercase">
                  India
                </span>
              </div>
            </button>
          </div>

          {/* Quick Location Badge */}
          <button
            onClick={detectLocation}
            disabled={isLocating}
            title="Click to detect current GPS location"
            className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
          >
            <MapPin className={cn("w-3.5 h-3.5 text-indigo-600 shrink-0", isLocating && "animate-bounce")} />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {isLocating ? "Locating..." : location.city || "Mumbai"}
            </span>
            <Navigation className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          {/* Header Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span className="uppercase">{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 p-1"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Select Language
                      </div>
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer",
                            language === lang.code
                              ? "bg-indigo-50 text-indigo-700 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span>{lang.native}</span>
                          <span className="text-[11px] text-slate-400">({lang.name})</span>
                          {language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Avatar / Profile Button */}
            <button
              onClick={() => onTabChange("profile")}
              className="p-1 rounded-xl hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {user?.photoURL || userProfile?.photoURL ? (
                <img
                  src={user?.photoURL || userProfile?.photoURL}
                  alt={user?.displayName || "Profile"}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto pb-24">
        {children}
      </main>

      {/* Modern Bottom Dock Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
          <NavButton
            icon={<Compass className="w-5 h-5" />}
            label={t('explore') || "Explore"}
            isActive={activeTab === "explore"}
            onClick={() => onTabChange("explore")}
          />
          <NavButton
            icon={<ShoppingBag className="w-5 h-5" />}
            label={t('products') || "Catalog"}
            isActive={activeTab === "catalog"}
            onClick={() => onTabChange("catalog")}
          />
          <NavButton
            icon={<MapPin className="w-5 h-5" />}
            label={t('nearby') || "Nearby"}
            isActive={activeTab === "nearby"}
            onClick={() => onTabChange("nearby")}
          />
          <NavButton
            icon={<CalendarDays className="w-5 h-5" />}
            label={t('jobs') || "Jobs"}
            isActive={activeTab === "jobs"}
            onClick={() => onTabChange("jobs")}
          />
          <NavButton
            icon={<User className="w-5 h-5" />}
            label={t('profile') || "Profile"}
            isActive={activeTab === "profile"}
            onClick={() => onTabChange("profile")}
          />
        </div>
      </nav>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigateToTab={(tab) => {
          onTabChange(tab);
          setShowNotifications(false);
        }}
      />
    </div>
  );
}

function NavButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer group",
        isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
      )}
    >
      <div
        className={cn(
          "w-10 h-7 rounded-xl flex items-center justify-center transition-all",
          isActive ? "bg-indigo-50 text-indigo-600 scale-110 shadow-xs" : "group-hover:bg-slate-100"
        )}
      >
        {icon}
      </div>
      <span className="text-[11px] mt-0.5 tracking-tight transition-transform">
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-600"
        />
      )}
    </button>
  );
}
