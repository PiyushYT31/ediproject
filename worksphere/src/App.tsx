/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Layout from "./components/Layout";
import CategoryGrid from "./components/CategoryGrid";
import WorkerCard from "./components/WorkerCard";
import WorkerDetails from "./components/WorkerDetails";
import JobCard from "./components/JobCard";
import VendorPortal from "./components/VendorPortal";
import WorkerProfileSetup from "./components/WorkerProfileSetup";
import ShopkeeperProfileSetup from "./components/ShopkeeperProfileSetup";
import ArtisanProfileSetup from "./components/ArtisanProfileSetup";
import RegistrationScreen from "./components/RegistrationScreen";
import ArtisanCatalog from "./components/ArtisanCatalog";
import ArtisanPortal from "./components/ArtisanPortal";
import ErrorBoundary from "./components/ErrorBoundary";
import ProfileImageUploader from "./components/ProfileImageUploader";
import AccountSettings from "./components/AccountSettings";
import WorkerMapView from "./components/WorkerMapView";
import { WorkerProfile, UserRole, JobRequest, JobStatus, UserProfile } from "./types";
import { Search, SlidersHorizontal, Map as MapIcon, List, User, ChevronLeft, ChevronRight, LogIn, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { rankWorkers } from "./lib/recommendation";
import { filterByRadius } from "./lib/geofencing";
import { processVoiceCommand } from "./lib/voice";
import { Mic, MicOff } from "lucide-react";
import { seedAllData, clearAllData } from "./scripts/seedData";

// Firebase Imports
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, deleteUser } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  or,
  limit
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection, useDocumentData } from "react-firebase-hooks/firestore";

import { I18nContext, Language, translations, useI18n } from "./lib/i18n";
import LanguageSelector from "./components/LanguageSelector";

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('work_sphere_lang');
    return (saved as Language) || 'en';
  });

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    localStorage.setItem('work_sphere_lang', language);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      <ErrorBoundary>
        <WorkSphereApp />
      </ErrorBoundary>
    </I18nContext.Provider>
  );
}

function WorkSphereApp() {
  const { t } = useI18n();
  const [user, loading, error] = useAuthState(auth);
  // Always show language selector on every app open (session-based)
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const seedRanOnce = useRef(false);
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [nearbyViewMode, setNearbyViewMode] = useState<"list" | "map">("list");
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [portalView, setPortalView] = useState<"profile" | "vendor" | "artisan">("profile");
  const [jobsView, setJobsView] = useState<"bookings" | "assignments">("bookings");
  
  // Registration Flow State
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileSetupRole, setProfileSetupRole] = useState<UserRole | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 19.0760, longitude: 72.8777 }); // Default to Mumbai

  // Firestore Collections
  const [workersValue, workersLoading, workersError] = useCollection(
    collection(db, "workers")
  );

  const [jobsValue, jobsLoading, jobsError] = useCollection(
    user ? query(
      collection(db, "jobs"),
      or(
        where("consumerId", "==", user.uid),
        where("workerId", "==", user.uid)
      ),
      orderBy("createdAt", "desc")
    ) : null
  );

  const [userProfile, userProfileLoading] = useDocumentData(
    user ? doc(db, "users", user.uid) : null
  );

  // Sync user profile to Firestore on login and manage flow
  useEffect(() => {
    if (user && hasSelectedLanguage && !showProfileSetup) {
      const checkProfile = async () => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const role = data.role || UserRole.CONSUMER;
          if (role !== UserRole.CONSUMER && !data.profileSetupComplete) {
            setProfileSetupRole(role);
            setShowProfileSetup(true);
          }
        }
      };
      checkProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasSelectedLanguage]);

  // Auto-seed data on first load
  useEffect(() => {
    if (!hasSelectedLanguage || seedRanOnce.current) return;
    const autoSeed = async () => {
      try {
        seedRanOnce.current = true;
        await clearAllData();
        await seedAllData();
      } catch (e) {
        console.warn("Auto-seed check failed:", e);
      }
    };
    autoSeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSelectedLanguage]);

  const workers = workersValue?.docs.map(doc => ({ uid: doc.id, ...doc.data() } as WorkerProfile)) || [];
  const jobs = jobsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobRequest)) || [];

  const rankedWorkers = rankWorkers(workers, userLocation);
  const nearbyWorkers = filterByRadius(rankedWorkers, userLocation.latitude, userLocation.longitude);

  const filteredWorkers = rankedWorkers.filter((worker) => {
    const matchesSearch = worker.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || worker.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Sign in error:", err);
    }
  };

  const handleVoiceCommand = async () => {
    setIsListening(true);
    // Simulate voice recognition delay
    setTimeout(async () => {
      const command = "Find me a plumber nearby"; // Simulated command
      const result = await processVoiceCommand(command);
      if (result.params?.category) {
        setSelectedCategory(result.params.category);
        setActiveTab("explore");
      }
      setIsListening(false);
    }, 2000);
  };

  const handleSignOut = () => {
    signOut(auth);
    setPortalView("profile");
    // Re-show language selector on next open
    setHasSelectedLanguage(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm(t('deleteAccountConfirm'));
    if (!confirmed) return;

    try {
      // Delete from all Firestore collections
      const collections = ["users", "workers", "vendors", "artisans"];
      await Promise.allSettled(
        collections.map(col => deleteDoc(doc(db, col, user.uid)))
      );
      // Delete Firebase Auth account
      await deleteUser(user);
      setPortalView("profile");
      setHasSelectedLanguage(false);
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        alert("For security, please sign out and sign back in before deleting your account.");
      } else {
        alert("Failed to delete account. Please try again.");
        console.error(err);
      }
    }
  };

  const handleSwitchToConsumer = async () => {
    if (!user) return;
    if (confirm(t('roleSwitchWarning'))) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          role: UserRole.CONSUMER
        });
        setPortalView("profile");
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, "users");
      }
    }
  };

  const handleBook = async () => {
    if (!selectedWorker || !user) return;

    // Validation: Only consumers can book
    if (userProfile?.role !== UserRole.CONSUMER) {
      alert(t('onlyConsumerCanBook'));
      return;
    }

    // Validation: Cannot book self
    if (user.uid === selectedWorker.uid) {
      alert(t('cannotBookSelf'));
      return;
    }
    
    const docRef = doc(collection(db, "jobs"));
    
    const newJobData = {
      id: docRef.id,
      consumerId: user.uid,
      workerId: String(selectedWorker.uid || ""),
      status: JobStatus.PENDING,
      category: String(selectedWorker.category || "General"),
      description: `Booking for ${selectedWorker.category || 'General'} services.`,
      location: { latitude: 0, longitude: 0, address: "Current Location" },
      quotedPrice: Number(selectedWorker.basePrice) || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await setDoc(docRef, newJobData);
      setSelectedWorker(null);
      setActiveTab("jobs");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "jobs");
    }
  };

  const handleLanguageComplete = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#141414] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!hasSelectedLanguage) {
    return <LanguageSelector onComplete={handleLanguageComplete} />;
  }

  if (!user) {
    return <RegistrationScreen onComplete={handleRegistrationComplete} />;
  }

  if (showProfileSetup && profileSetupRole) {
    const handleCloseSetup = () => {
      setShowProfileSetup(false);
      setProfileSetupRole(null);
    };

    if (profileSetupRole === UserRole.WORKER) {
      return <WorkerProfileSetup onClose={handleCloseSetup} onSuccess={handleCloseSetup} />;
    } else if (profileSetupRole === UserRole.VENDOR) {
      return <ShopkeeperProfileSetup onClose={handleCloseSetup} onSuccess={() => {
        setShowProfileSetup(false);
        setProfileSetupRole(null);
        setPortalView("vendor");
        setActiveTab("profile");
      }} />;
    } else if (profileSetupRole === UserRole.ARTISAN) {
      return <ArtisanProfileSetup onClose={handleCloseSetup} onSuccess={() => {
        setShowProfileSetup(false);
        setProfileSetupRole(null);
        setPortalView("artisan");
        setActiveTab("profile");
      }} />;
    }
  }



  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        {activeTab === "explore" && (
          <motion.div
            key="explore"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-6"
          >
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/40 group-focus-within:text-[#141414] transition-colors" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-24 py-4 bg-white border border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] transition-all shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  onClick={handleVoiceCommand}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-[#141414]/5 text-[#141414]/60"
                  )}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button className="p-2 hover:bg-[#141414]/5 rounded-xl transition-colors">
                  <SlidersHorizontal className="w-5 h-5 text-[#141414]/60" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#141414]/40">
                  {t('categories')}
                </h2>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs font-bold text-[#141414] underline underline-offset-4"
                  >
                    {t('clear')}
                  </button>
                )}
              </div>
              <CategoryGrid onSelect={setSelectedCategory} />
            </section>

            {/* Recommendations */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#141414]/40">
                  {selectedCategory ? t(selectedCategory) : t('recommended')}
                </h2>
                <button 
                  onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                  className="flex items-center gap-2 text-xs font-bold bg-white border border-[#141414]/10 px-3 py-1.5 rounded-full hover:bg-[#141414] hover:text-white transition-all"
                >
                  {viewMode === "list" ? (
                    <><MapIcon className="w-3 h-3" /> {t('mapView')}</>
                  ) : (
                    <><List className="w-3 h-3" /> {t('listView')}</>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {workersLoading ? (
                  <div className="text-center py-12">{t('loading')}</div>
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
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#141414]/20">
                    <p className="text-[#141414]/40 font-medium">{t('noWorkers')}</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === "nearby" && (
          <motion.div
            key="nearby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{t('nearbyWorkers')}</h2>
                <p className="text-xs font-bold text-[#141414]/40 uppercase tracking-widest mt-1">{t('withinRadius')}</p>
              </div>
              <button 
                onClick={() => setNearbyViewMode(nearbyViewMode === "list" ? "map" : "list")}
                className="w-10 h-10 bg-[#141414] text-white rounded-xl flex items-center justify-center hover:bg-[#141414]/90 transition-all"
              >
                {nearbyViewMode === "list" ? <MapIcon className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-3">
              {nearbyViewMode === "map" ? (
                <WorkerMapView workers={nearbyWorkers} center={[userLocation.latitude, userLocation.longitude]} />
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
                <div className="bg-white rounded-3xl border border-[#141414]/10 h-[40vh] flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-[#141414]/5 rounded-full flex items-center justify-center">
                    <MapIcon className="w-8 h-8 text-[#141414]/40" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t('noWorkersNearby')}</h3>
                    <p className="text-[#141414]/60 mt-2 text-sm max-w-[240px]">
                      {t('nearbyDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "jobs" && (
          <motion.div
            key="jobs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-bold tracking-tight">{t('jobs')}</h2>
              {userProfile?.role === UserRole.WORKER && (
                <div className="flex bg-[#141414]/5 p-1 rounded-xl">
                  <button 
                    onClick={() => setJobsView("bookings")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      jobsView === "bookings" ? "bg-white shadow-sm" : "text-[#141414]/40"
                    )}
                  >
                    {t('myBookings')}
                  </button>
                  <button 
                    onClick={() => setJobsView("assignments")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      jobsView === "assignments" ? "bg-white shadow-sm" : "text-[#141414]/40"
                    )}
                  >
                    {t('workAssigned')}
                  </button>
                </div>
              )}
            </div>

            {jobsLoading ? (
              <div className="text-center py-12">{t('loading')}</div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const filteredJobs = jobs.filter(job => 
                    jobsView === "bookings" ? job.consumerId === user.uid : job.workerId === user.uid
                  );

                  if (filteredJobs.length > 0) {
                    return filteredJobs.map((job) => {
                      const worker = workers.find(w => w.uid === job.workerId);
                      return (
                        <JobCard 
                          job={job} 
                          workerName={worker?.displayName || t('unknownWorker')} 
                          userRole={userProfile?.role || UserRole.CONSUMER}
                        />
                      );
                    });
                  }

                  return (
                    <div className="bg-white rounded-2xl border border-[#141414]/10 p-12 text-center space-y-2">
                      <p className="font-bold text-lg">{t('noJobsFound')}</p>
                      <p className="text-[#141414]/60 text-sm">
                        {jobsView === "bookings" 
                          ? t('bookingDescription')
                          : t('assignmentDescription')}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4"
          >
            <ArtisanCatalog />
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-6"
          >
            {portalView === "profile" ? (
              <>
                {/* Profile Card with Photo Upload for Consumer */}
                <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {user ? (
                        <ProfileImageUploader
                          currentPhotoURL={userProfile?.photoURL || user.photoURL || undefined}
                          size="sm"
                          label=""
                          onUpload={async (url) => {
                            if (!user) return;
                            try {
                              await updateDoc(doc(db, "users", user.uid), { photoURL: url });
                            } catch (e) { console.error(e); }
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#141414]/5 rounded-2xl flex items-center justify-center overflow-hidden">
                          <User className="w-10 h-10 text-[#141414]/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{user?.displayName || t('guestUser')}</h3>
                        {userProfile?.role === UserRole.WORKER && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-[#141414]/60 text-sm">
                        {user ? t(userProfile?.role || "consumer").toUpperCase() : t('signInPrompt')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <ProfileOption label={t('changeLanguage')} onClick={() => setHasSelectedLanguage(false)} />
                  <ProfileOption label={t('accountSettings')} onClick={() => setShowAccountSettings(true)} />
                  <ProfileOption label={t('paymentMethods')} />
                  <ProfileOption label={t('helpSupport')} />
                  {user && (
                    <>
                      {userProfile?.role === UserRole.CONSUMER && (
                        <>
                          <ProfileOption 
                            label={t('becomeWorkerBtn')} 
                            variant="accent" 
                            onClick={() => { setProfileSetupRole(UserRole.WORKER); setShowProfileSetup(true); }}
                          />
                          <ProfileOption 
                            label={t('becomeVendorBtn')} 
                            variant="accent" 
                            onClick={() => { setProfileSetupRole(UserRole.VENDOR); setShowProfileSetup(true); }}
                          />
                          <ProfileOption 
                            label={t('becomeArtisanBtn')} 
                            variant="accent" 
                            onClick={() => { setProfileSetupRole(UserRole.ARTISAN); setShowProfileSetup(true); }}
                          />
                        </>
                      )}

                      {userProfile?.role === UserRole.WORKER && (
                        <ProfileOption 
                          label={t('workerPortalBtn')} 
                          variant="accent" 
                          onClick={() => setPortalView("profile")}
                        />
                      )}

                      {userProfile?.role === UserRole.VENDOR && (
                        <ProfileOption 
                          label={t('vendorPortalBtn')} 
                          variant="accent" 
                          onClick={() => setPortalView("vendor")}
                        />
                      )}

                      {userProfile?.role === UserRole.ARTISAN && (
                        <ProfileOption 
                          label={t('artisanPortalBtn')} 
                          variant="accent" 
                          onClick={() => setPortalView("artisan")}
                        />
                      )}

                      {userProfile?.role !== UserRole.CONSUMER && (
                        <ProfileOption 
                          label={t('switchToConsumer')} 
                          variant="default"
                          onClick={handleSwitchToConsumer}
                        />
                      )}
                      <ProfileOption 
                        label={t('signOut')} 
                        onClick={handleSignOut}
                        variant="default"
                      />
                      <ProfileOption 
                        label={t('deleteAccount')} 
                        onClick={handleDeleteAccount}
                        variant="danger"
                      />
                    </>
                  )}
                </div>
              </>
            ) : portalView === "vendor" ? (
              <div className="space-y-6">
                <button 
                  onClick={() => setPortalView("profile")}
                  className="flex items-center gap-2 text-sm font-bold text-[#141414]/60 hover:text-[#141414] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('backToProfile')}
                </button>
                <VendorPortal />
              </div>
            ) : (
              <div className="space-y-6">
                <button 
                  onClick={() => setPortalView("profile")}
                  className="flex items-center gap-2 text-sm font-bold text-[#141414]/60 hover:text-[#141414] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('backToProfile')}
                </button>
                <ArtisanPortal />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedWorker && (
          <WorkerDetails 
            worker={selectedWorker} 
            onClose={() => setSelectedWorker(null)} 
            onBook={handleBook}
            currentUser={user}
            userProfileRole={userProfile?.role}
          />
        )}
      </AnimatePresence>

      {/* Account Settings overlay */}
      <AnimatePresence>
        {showAccountSettings && (
          <AccountSettings
            onClose={() => setShowAccountSettings(false)}
            userProfile={userProfile}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}

function ProfileOption({ 
  label, 
  variant = "default", 
  onClick 
}: { 
  label: string; 
  variant?: "default" | "accent" | "danger";
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left px-6 py-4 rounded-2xl border transition-all font-bold text-sm flex items-center justify-between group",
        variant === "default" 
          ? "bg-white border-[#141414]/10 hover:border-[#141414]" 
          : variant === "accent"
          ? "bg-[#141414] text-white border-transparent hover:bg-[#141414]/90"
          : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-400"
      )}
    >
      <span>{label}</span>
      <ChevronRight className={cn(
        "w-4 h-4 transition-transform group-hover:translate-x-1",
        variant === "default" ? "text-[#141414]/20" : variant === "accent" ? "text-white/40" : "text-red-400"
      )} />
    </button>
  );
}
