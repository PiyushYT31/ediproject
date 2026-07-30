import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, User, Bell, Menu, Globe, Check, ShoppingBag, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { useI18n, Language } from "../lib/i18n";

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
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#141414]/10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {activeTab !== "explore" && (
            <button 
              onClick={() => onTabChange("explore")}
              className="p-1 hover:bg-[#141414]/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">WorkSphere</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors flex items-center gap-1"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">{language}</span>
            </button>
            
            <AnimatePresence>
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-[#141414]/10 overflow-hidden z-50"
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#141414]/5 transition-colors",
                          language === lang.code ? "bg-[#141414]/5 font-bold" : "font-medium text-[#141414]/70"
                        )}
                      >
                        <span>{lang.native}</span>
                        {language === lang.code && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onTabChange("profile")}
            className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 max-w-2xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#141414]/10 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto shadow-lg z-50">
        <NavButton
          icon={<Search />}
          label={t('explore')}
          isActive={activeTab === "explore"}
          onClick={() => onTabChange("explore")}
        />
        <NavButton
          icon={<ShoppingBag />}
          label={t('products')}
          isActive={activeTab === "catalog"}
          onClick={() => onTabChange("catalog")}
        />
        <NavButton
          icon={<MapPin />}
          label={t('nearby')}
          isActive={activeTab === "nearby"}
          onClick={() => onTabChange("nearby")}
        />
        <NavButton
          icon={<Menu />}
          label={t('jobs')}
          isActive={activeTab === "jobs"}
          onClick={() => onTabChange("jobs")}
        />
        <NavButton
          icon={<User />}
          label={t('profile')}
          isActive={activeTab === "profile"}
          onClick={() => onTabChange("profile")}
        />
      </nav>
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
        "flex flex-col items-center gap-1 transition-all",
        isActive ? "text-[#141414]" : "text-[#141414]/40"
      )}
    >
      <div className={cn("p-1 rounded-lg", isActive && "bg-[#141414]/5")}>
        {React.cloneElement(icon as React.ReactElement, {
          className: "w-6 h-6",
        })}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="w-1 h-1 bg-[#141414] rounded-full mt-0.5"
        />
      )}
    </button>
  );
}
