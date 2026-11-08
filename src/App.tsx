/**
 * WorkSphere — Modern Decentralized Hyperlocal Marketplace
 * Indian Market Focus (Hindi, Marathi, English)
 */

import React, { useState, useEffect, useMemo } from "react";
import Layout from "./components/Layout";
import CategoryGrid from "./components/CategoryGrid";
import WorkerCard from "./components/WorkerCard";
import WorkerDetails from "./components/WorkerDetails";
import JobCard from "./components/JobCard";
import VendorPortal from "./components/VendorPortal";
import ArtisanPortal from "./components/ArtisanPortal";
import WorkerPortal from "./components/WorkerPortal";
import WorkerProfileSetup from "./components/WorkerProfileSetup";
import ShopkeeperProfileSetup from "./components/ShopkeeperProfileSetup";
import ArtisanProfileSetup from "./components/ArtisanProfileSetup";
import RegistrationScreen from "./components/RegistrationScreen";
import ArtisanCatalog from "./components/ArtisanCatalog";
import ErrorBoundary from "./components/ErrorBoundary";
import ProfileImageUploader from "./components/ProfileImageUploader";
import AccountSettings from "./components/AccountSettings";
import WorkerMapView from "./components/WorkerMapView";
import ShopkeeperCard from "./components/ShopkeeperCard";
import CustomerOrderCard from "./components/CustomerOrderCard";
import ChatModal from "./components/ChatModal";
import { 
  PUNE_FALLBACK_WORKERS, 
  PUNE_FALLBACK_ARTISANS, 
  PUNE_FALLBACK_SHOPS 
} from "./data/puneSampleData";
import { WorkerProfile, ShopkeeperProfile, ArtisanProfile, UserRole, JobRequest, JobStatus, Order } from "./types";
import { 
  Search, 
  SlidersHorizontal, 
  Map as MapIcon, 
  List, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Mic, 
  MicOff, 
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { rankWorkers } from "./lib/recommendation";
import { filterByRadius } from "./lib/geofencing";
import { processVoiceCommand } from "./lib/voice";

// Firebase Imports
import { db, handleFirestoreError, OperationType } from "./firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  or 
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";

import { I18nContext, Language, translations, useI18n } from "./lib/i18n";
import LanguageSelector from "./components/LanguageSelector";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { AppProvider } from "./context/AppContext";

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("work_sphere_lang");
    return (saved as Language) || "en";
  });

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    localStorage.setItem("work_sphere_lang", language);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      <ErrorBoundary>
        <AuthProvider>
          <LocationProvider>
            <AppProvider>
              <WorkSphereApp />
            </AppProvider>
          </LocationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </I18nContext.Provider>
  );
}

function WorkSphereApp() {
  const { t, language } = useI18n();
  const { user, userProfile, loading: authLoading, signOutUser, deleteAccount, updateRole } = useAuth();
  const { location: userLocation } = useLocation();

  // Language selection check (persisted in localStorage)
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(() => {
    return Boolean(localStorage.getItem("work_sphere_lang_selected"));
  });

  const [discoveryMode, setDiscoveryMode] = useState<"workers" | "artisans" | "hardware">("workers");
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [nearbyViewMode, setNearbyViewMode] = useState<"list" | "map">("list");
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [portalView, setPortalView] = useState<"profile" | "worker" | "vendor" | "artisan">("profile");
  const [jobsView, setJobsView] = useState<"bookings" | "assignments">("bookings");
  const [customerJobsSubTab, setCustomerJobsSubTab] = useState<"services" | "orders">("services");
  const [activeChatTarget, setActiveChatTarget] = useState<{
    id: string;
    name: string;
    photo?: string;
    phone?: string;
  } | null>(null);

  // Registration & Wizard Flow State
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileSetupRole, setProfileSetupRole] = useState<UserRole | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Voice Interaction State
  const [isListening, setIsListening] = useState(false);

  // Fetch Workers Collection
  const [workersValue, workersLoading] = useCollection(
    collection(db, "workers")
  );

  // Fetch Vendors Collection
  const [vendorsValue, vendorsLoading] = useCollection(
    collection(db, "vendors")
  );

  // Fetch Artisans Collection
  const [artisansValue] = useCollection(
    collection(db, "artisans")
  );

  // Fetch Jobs Collection for current user
  const [jobsValue, jobsLoading] = useCollection(
    user
      ? query(
          collection(db, "jobs"),
          or(
            where("consumerId", "==", user.uid),
            where("workerId", "==", user.uid)
          ),
          orderBy("createdAt", "desc")
        )
      : null
  );

  // Fetch Consumer Orders (Craft purchases from artisans)
  const [ordersValue, ordersLoading] = useCollection(
    user ? query(collection(db, "orders"), where("consumerId", "==", user.uid)) : null
  );

  const workers = useMemo(() => {
    const liveWorkers = workersValue?.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as WorkerProfile)) || [];
    const liveIds = new Set(liveWorkers.map((w) => w.uid));
    const fallbackList = PUNE_FALLBACK_WORKERS.filter((w) => !liveIds.has(w.uid));
    return [...liveWorkers, ...fallbackList];
  }, [workersValue]);

  const vendors = useMemo(() => {
    const liveVendors = vendorsValue?.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as ShopkeeperProfile)) || [];
    const liveIds = new Set(liveVendors.map((v) => v.uid));
    const fallbackList = PUNE_FALLBACK_SHOPS.filter((v) => !liveIds.has(v.uid));
    return [...liveVendors, ...fallbackList];
  }, [vendorsValue]);

  const artisans = useMemo(() => {
    const liveArtisans = artisansValue?.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as ArtisanProfile)) || [];
    const liveIds = new Set(liveArtisans.map((a) => a.uid));
    const fallbackList = PUNE_FALLBACK_ARTISANS.filter((a) => !liveIds.has(a.uid));
    return [...liveArtisans, ...fallbackList];
  }, [artisansValue]);

  const jobs = useMemo(() => {
    return jobsValue?.docs.map((doc) => ({ id: doc.id, ...doc.data() } as JobRequest)) || [];
  }, [jobsValue]);

  const consumerOrders = useMemo(() => {
    const list = ordersValue?.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order)) || [];
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [ordersValue]);

  // Rank workers using Haversine distance and fairness scoring
  const rankedWorkers = useMemo(() => {
    return rankWorkers(workers, userLocation);
  }, [workers, userLocation]);

  const nearbyWorkers = useMemo(() => {
    const within = filterByRadius(rankedWorkers, userLocation.latitude, userLocation.longitude, 25);
    return within.length > 0 ? within : rankedWorkers.slice(0, 8);
  }, [rankedWorkers, userLocation]);

  // Filtered workers for Explore screen
  const filteredWorkers = useMemo(() => {
    return rankedWorkers.filter((worker) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        worker.displayName.toLowerCase().includes(q) ||
        worker.category.toLowerCase().includes(q) ||
        (worker.profession && worker.profession.toLowerCase().includes(q)) ||
        (worker.skills && worker.skills.some((s) => s.toLowerCase().includes(q)));

      const matchesCategory = !selectedCategory || worker.category === selectedCategory;
      const matchesRating = !minRating || (worker.rating || 5) >= minRating;

      return matchesSearch && matchesCategory && matchesRating;
    });
  }, [rankedWorkers, searchQuery, selectedCategory, minRating]);

  // Web Speech API Voice Search
  const handleVoiceCommand = async () => {
    if (isListening) return;
    setIsListening(true);

    try {
      const langCode = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
      const result = await processVoiceCommand(new Blob(), langCode);

      if (result.params?.category) {
        setSelectedCategory(result.params.category);
        setActiveTab("explore");
      }
    } catch (err) {
      console.warn("Voice command error:", err);
    } finally {
      setIsListening(false);
    }
  };

  const handleLanguageComplete = () => {
    localStorage.setItem("work_sphere_lang_selected", "true");
    setHasSelectedLanguage(true);
  };

  const handleRegistrationComplete = (needsProfileSetup: boolean, role: UserRole) => {
    if (needsProfileSetup) {
      setProfileSetupRole(role);
      setShowProfileSetup(true);
    } else {
      setActiveTab("explore");
    }
  };

  const handleSwitchToConsumer = async () => {
    if (!user) return;
    if (window.confirm(t("roleSwitchWarning") || "Switch account to Consumer?")) {
      await updateRole(UserRole.CONSUMER);
      setPortalView("profile");
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Connecting to WorkSphere...
          </p>
        </div>
      </div>
    );
  }

  // Language onboarding step if not selected
  if (!hasSelectedLanguage) {
    return <LanguageSelector onComplete={handleLanguageComplete} />;
  }

  // Registration / Login screen if user is not authenticated
  if (!user) {
    return <RegistrationScreen onComplete={handleRegistrationComplete} />;
  }

  // Profile Setup Wizards for special roles
  if (showProfileSetup && profileSetupRole) {
    const handleCloseSetup = () => {
      setShowProfileSetup(false);
      setProfileSetupRole(null);
    };

    if (profileSetupRole === UserRole.WORKER) {
      return (
        <WorkerProfileSetup
          onClose={handleCloseSetup}
          onSuccess={() => {
            handleCloseSetup();
            setPortalView("worker");
            setActiveTab("profile");
          }}
        />
      );
    } else if (profileSetupRole === UserRole.VENDOR) {
      return (
        <ShopkeeperProfileSetup
          onClose={handleCloseSetup}
          onSuccess={() => {
            handleCloseSetup();
            setPortalView("vendor");
            setActiveTab("profile");
          }}
        />
      );
    } else if (profileSetupRole === UserRole.ARTISAN) {
      return (
        <ArtisanProfileSetup
          onClose={handleCloseSetup}
          onSuccess={() => {
            handleCloseSetup();
            setPortalView("artisan");
            setActiveTab("profile");
          }}
        />
      );
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        {/* ===================== TAB 1: EXPLORE ===================== */}
        {activeTab === "explore" && (
          <motion.div
            key="explore"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 sm:p-5 space-y-5"
          >
            {/* Provider Mode Banner (for sellers/providers) */}
            {(userProfile?.accountType === "provider" || userProfile?.role !== UserRole.CONSUMER) && (
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">
                      Provider Dashboard Active
                    </span>
                    <span className="text-[10px] text-indigo-300 capitalize">
                      {userProfile?.subRole || userProfile?.role} Account
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const role = userProfile?.subRole || userProfile?.role;
                    if (role === "artisan") setPortalView("artisan");
                    else if (role === "vendor") setPortalView("vendor");
                    else setPortalView("worker");
                    setActiveTab("profile");
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Open Dashboard →
                </button>
              </div>
            )}

            {/* Hyperlocal Discovery Filter Tabs (Workers vs Artisans vs Hardware) */}
            <div className="flex bg-slate-200/70 p-1 rounded-2xl">
              <button
                onClick={() => setDiscoveryMode("workers")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  discoveryMode === "workers"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Daily Workers
              </button>
              <button
                onClick={() => {
                  setDiscoveryMode("artisans");
                  setActiveTab("catalog");
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  discoveryMode === "artisans"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Artisans & Crafts
              </button>
              <button
                onClick={() => setDiscoveryMode("hardware")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  discoveryMode === "hardware"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Local Hardware
              </button>
            </div>

            {/* Search Header Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder={t("searchPlaceholder") || "Find verified plumbers, electricians, carpenters..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3.5 bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs sm:text-sm font-medium transition-all shadow-xs"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Voice Search Button */}
                <button
                  onClick={handleVoiceCommand}
                  title="Search by voice"
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "hover:bg-slate-100 text-slate-400 hover:text-indigo-600"
                  )}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Filter Modal Trigger */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filter results"
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    showFilters || minRating > 0
                      ? "bg-indigo-50 text-indigo-600 font-bold"
                      : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Drawer / Bar (Expandable) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Filter By Minimum Rating</span>
                    {minRating > 0 && (
                      <button
                        onClick={() => setMinRating(0)}
                        className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[0, 3.5, 4.0, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1",
                          minRating === rating
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {rating === 0 ? "All Ratings" : (
                          <>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {rating}+
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {discoveryMode === "hardware" ? (
              /* ================= HARDWARE & SHOPS VIEW ================= */
              <section className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Local Hardware & Material Suppliers
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Direct contact with verified local stores for tools, pipes, cements, and electricals
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {vendorsLoading ? (
                    <div className="py-16 text-center text-xs font-bold text-slate-400">
                      Loading local hardware shops...
                    </div>
                  ) : vendors.length > 0 ? (
                    vendors
                      .filter((v) => {
                        const q = searchQuery.toLowerCase().trim();
                        return (
                          !q ||
                          v.shopName.toLowerCase().includes(q) ||
                          (v.shopCategory && v.shopCategory.toLowerCase().includes(q)) ||
                          (v.ownerName && v.ownerName.toLowerCase().includes(q))
                        );
                      })
                      .map((shop) => (
                        <ShopkeeperCard key={shop.uid} shop={shop} />
                      ))
                  ) : (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-sm font-bold text-slate-700">No hardware stores listed yet</p>
                      <p className="text-xs text-slate-400">Local store owners can register via Provider Mode.</p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              /* ================= DAILY WORKERS VIEW ================= */
              <>
                {/* Category Grid Section */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      {t("categories") || "Service Categories"}
                    </h2>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 cursor-pointer"
                      >
                        {t("clear") || "Show All"}
                      </button>
                    )}
                  </div>
                  <CategoryGrid
                    onSelect={(cat) => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    selectedCategory={selectedCategory}
                  />
                </section>

                {/* Recommended / Search Workers Section */}
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {selectedCategory
                          ? `${t(selectedCategory) || selectedCategory} Specialists`
                          : t("recommended") || "Recommended Professionals"}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Ranked by rating, distance & fair dispatch
                      </p>
                    </div>

                    {/* List / Map Switch */}
                    <button
                      onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                      className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                    >
                      {viewMode === "list" ? (
                        <>
                          <MapIcon className="w-3.5 h-3.5 text-indigo-600" /> {t("mapView") || "Map View"}
                        </>
                      ) : (
                        <>
                          <List className="w-3.5 h-3.5 text-indigo-600" /> {t("listView") || "List View"}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Workers Render View */}
                  {viewMode === "map" ? (
                    <WorkerMapView
                      workers={filteredWorkers}
                      center={[userLocation.latitude, userLocation.longitude]}
                      onSelectWorker={(w) => setSelectedWorker(w)}
                    />
                  ) : (
                    <div className="space-y-3">
                      {workersLoading ? (
                        <div className="py-16 text-center text-xs font-bold text-slate-400">
                          Loading available providers...
                        </div>
                      ) : filteredWorkers.length > 0 ? (
                        filteredWorkers.map((worker) => (
                          <WorkerCard
                            key={worker.uid}
                            worker={worker}
                            distance={(worker as any).distance}
                            onClick={() => setSelectedWorker(worker)}
                          />
                        ))
                      ) : (
                        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                          <p className="text-sm font-bold text-slate-700">
                            {t("noWorkers") || "No workers found matching your query"}
                          </p>
                          <p className="text-xs text-slate-400">
                            Try selecting another category or clearing filters.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </motion.div>
        )}

        {/* ===================== TAB 2: CATALOG ===================== */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ArtisanCatalog />
          </motion.div>
        )}

        {/* ===================== TAB 3: NEARBY ===================== */}
        {activeTab === "nearby" && (
          <motion.div
            key="nearby"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {t("nearbyWorkers") || "Nearby Service Providers"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Showing active professionals within 25 km of {userLocation.city || "your location"}
                </p>
              </div>
              <button
                onClick={() => setNearbyViewMode(nearbyViewMode === "list" ? "map" : "list")}
                className="w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                {nearbyViewMode === "list" ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-3">
              {nearbyViewMode === "map" ? (
                <WorkerMapView
                  workers={nearbyWorkers}
                  center={[userLocation.latitude, userLocation.longitude]}
                  onSelectWorker={(w) => setSelectedWorker(w)}
                />
              ) : nearbyWorkers.length > 0 ? (
                nearbyWorkers.map((worker) => (
                  <WorkerCard
                    key={worker.uid}
                    worker={worker}
                    distance={(worker as any).distance}
                    onClick={() => setSelectedWorker(worker)}
                  />
                ))
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {t("noWorkersNearby") || "No workers found in your immediate radius"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Try updating your location in Account Settings or browsing the Explore tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===================== TAB 4: JOBS ===================== */}
        {activeTab === "jobs" && (
          <motion.div
            key="jobs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 sm:p-5 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {userProfile?.role === UserRole.WORKER
                    ? t("jobs") || "My Service Orders"
                    : "My Orders & Bookings"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {userProfile?.role === UserRole.WORKER
                    ? "Manage assigned tasks and incoming hire requests"
                    : "Track your booked technicians and handcrafted craft orders"}
                </p>
              </div>

              {userProfile?.role === UserRole.WORKER ? (
                <div className="flex bg-slate-200/70 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setJobsView("bookings")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      jobsView === "bookings"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {t("myBookings") || "My Bookings"}
                  </button>
                  <button
                    onClick={() => setJobsView("assignments")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      jobsView === "assignments"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {t("workAssigned") || "Work Assigned"}
                  </button>
                </div>
              ) : (
                <div className="flex bg-slate-200/70 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setCustomerJobsSubTab("services")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      customerJobsSubTab === "services"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span>Booked Services</span>
                    {jobs.filter((j) => j.consumerId === user?.uid).length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                        {jobs.filter((j) => j.consumerId === user?.uid).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setCustomerJobsSubTab("orders")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      customerJobsSubTab === "orders"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span>Artisan Orders</span>
                    {consumerOrders.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {consumerOrders.length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Content Display based on role and active sub-tab */}
            {userProfile?.role === UserRole.WORKER || customerJobsSubTab === "services" ? (
              jobsLoading ? (
                <div className="text-center py-16 text-xs text-slate-400">Loading your jobs...</div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const filteredJobs = jobs.filter((job) =>
                      jobsView === "bookings" ? job.consumerId === user?.uid : job.workerId === user?.uid
                    );

                    if (filteredJobs.length > 0) {
                      return filteredJobs.map((job) => {
                        const worker = workers.find((w) => w.uid === job.workerId);
                        return (
                          <JobCard
                            key={job.id}
                            job={job}
                            workerName={worker?.displayName || t("unknownWorker") || "Service Provider"}
                            userRole={userProfile?.role || UserRole.CONSUMER}
                          />
                        );
                      });
                    }

                    return (
                      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                        <p className="font-bold text-base text-slate-800">
                          {t("noJobsFound") || "No bookings found yet"}
                        </p>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          {jobsView === "bookings"
                            ? "You have not booked any services yet. Explore providers to request assistance."
                            : "No client assignments have been scheduled yet."}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )
            ) : (
              /* Artisan Orders View */
              ordersLoading ? (
                <div className="text-center py-16 text-xs text-slate-400">Loading your craft orders...</div>
              ) : (
                <div className="space-y-3">
                  {consumerOrders.length > 0 ? (
                    consumerOrders.map((ord) => {
                      const artisan = artisans.find((a) => a.uid === ord.artisanId);
                      return (
                        <CustomerOrderCard
                          key={ord.id}
                          order={ord}
                          artisanName={artisan?.displayName || "Local Artisan"}
                          onOpenChat={(artisanId, name) => {
                            setActiveChatTarget({
                              id: artisanId,
                              name,
                              photo: artisan?.photoURL,
                              phone: artisan?.phoneNumber,
                            });
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                      <p className="font-bold text-base text-slate-800">No craft orders placed yet</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Explore the Artisans & Crafts section in Explore to discover handmade pottery, textiles, and authentic regional crafts.
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </motion.div>
        )}

        {/* ===================== TAB 5: PROFILE ===================== */}
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 sm:p-5 space-y-5"
          >
            {portalView === "profile" ? (
              <>
                {/* User Info Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-4">
                    <ProfileImageUploader
                      currentPhotoURL={userProfile?.photoURL || user.photoURL || undefined}
                      size="sm"
                      label=""
                      onUpload={async (url) => {
                        try {
                          await updateDoc(doc(db, "users", user.uid), { photoURL: url });
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {user.displayName || t("guestUser") || "User"}
                        </h3>
                        {userProfile?.role === UserRole.WORKER && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
                        {t(userProfile?.role || "consumer")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  <ProfileOption
                    label={t("changeLanguage") || "Change Language"}
                    onClick={() => setHasSelectedLanguage(false)}
                  />
                  <ProfileOption
                    label={t("accountSettings") || "Account & Location Settings"}
                    onClick={() => setShowAccountSettings(true)}
                  />

                  {/* Role Specific Portals */}
                  {userProfile?.role === UserRole.WORKER && (
                    <ProfileOption
                      label="Worker Portal & Service Rates"
                      variant="accent"
                      onClick={() => setPortalView("worker")}
                    />
                  )}

                  {userProfile?.role === UserRole.VENDOR && (
                    <ProfileOption
                      label={t("vendorPortalBtn") || "Vendor Store Portal"}
                      variant="accent"
                      onClick={() => setPortalView("vendor")}
                    />
                  )}

                  {userProfile?.role === UserRole.ARTISAN && (
                    <ProfileOption
                      label={t("artisanPortalBtn") || "Artisan Workshop Portal"}
                      variant="accent"
                      onClick={() => setPortalView("artisan")}
                    />
                  )}

                  {/* Become Provider Prompts for Consumers */}
                  {userProfile?.role === UserRole.CONSUMER && (
                    <>
                      <ProfileOption
                        label="Become a Verified Service Professional"
                        variant="accent"
                        onClick={() => {
                          setProfileSetupRole(UserRole.WORKER);
                          setShowProfileSetup(true);
                        }}
                      />
                      <ProfileOption
                        label="Register Hardware / Materials Shop"
                        variant="accent"
                        onClick={() => {
                          setProfileSetupRole(UserRole.VENDOR);
                          setShowProfileSetup(true);
                        }}
                      />
                      <ProfileOption
                        label="Open Artisan Store (Handcrafted Goods)"
                        variant="accent"
                        onClick={() => {
                          setProfileSetupRole(UserRole.ARTISAN);
                          setShowProfileSetup(true);
                        }}
                      />
                    </>
                  )}

                  {/* Switch back to consumer */}
                  {userProfile?.role !== UserRole.CONSUMER && (
                    <ProfileOption
                      label={t("switchToConsumer") || "Switch to Consumer Profile"}
                      onClick={handleSwitchToConsumer}
                    />
                  )}

                  {/* Sign Out & Account Deletion */}
                  <ProfileOption
                    label={t("signOut") || "Sign Out"}
                    onClick={signOutUser}
                  />
                  <ProfileOption
                    label={t("deleteAccount") || "Delete Account"}
                    onClick={deleteAccount}
                    variant="danger"
                  />
                </div>
              </>
            ) : portalView === "worker" ? (
              <div className="space-y-4">
                <button
                  onClick={() => setPortalView("profile")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("backToProfile") || "Back to Profile"}
                </button>
                <WorkerPortal />
              </div>
            ) : portalView === "vendor" ? (
              <div className="space-y-4">
                <button
                  onClick={() => setPortalView("profile")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("backToProfile") || "Back to Profile"}
                </button>
                <VendorPortal />
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setPortalView("profile")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("backToProfile") || "Back to Profile"}
                </button>
                <ArtisanPortal />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Worker Profile Modal */}
      <AnimatePresence>
        {selectedWorker && (
          <WorkerDetails
            worker={selectedWorker}
            onClose={() => setSelectedWorker(null)}
            onBookSuccess={() => setActiveTab("jobs")}
            currentUser={user}
            userProfileRole={userProfile?.role}
          />
        )}
      </AnimatePresence>

      {/* Account Settings Overlay */}
      <AnimatePresence>
        {showAccountSettings && (
          <AccountSettings
            onClose={() => setShowAccountSettings(false)}
            userProfile={userProfile}
          />
        )}
      </AnimatePresence>

      {/* Real-time Chat Modal with Worker or Artisan */}
      <AnimatePresence>
        {activeChatTarget && (
          <ChatModal
            isOpen={Boolean(activeChatTarget)}
            onClose={() => setActiveChatTarget(null)}
            workerId={activeChatTarget.id}
            workerName={activeChatTarget.name}
            workerPhoto={activeChatTarget.photo}
            workerPhone={activeChatTarget.phone}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}

function ProfileOption({
  label,
  variant = "default",
  onClick,
}: {
  label: string;
  variant?: "default" | "accent" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-5 py-4 rounded-2xl border transition-all font-bold text-xs flex items-center justify-between group cursor-pointer",
        variant === "default"
          ? "bg-white border-slate-200/90 text-slate-800 hover:border-indigo-500/40 hover:shadow-xs"
          : variant === "accent"
          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-600/20"
          : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
      )}
    >
      <span>{label}</span>
      <ChevronRight
        className={cn(
          "w-4 h-4 transition-transform group-hover:translate-x-1",
          variant === "default"
            ? "text-slate-400 group-hover:text-indigo-600"
            : variant === "accent"
            ? "text-white/60"
            : "text-rose-400"
        )}
      />
    </button>
  );
}
