/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import CategoryGrid from "./components/CategoryGrid";
import WorkerCard from "./components/WorkerCard";
import WorkerDetails from "./components/WorkerDetails";
import JobCard from "./components/JobCard";
import VendorPortal from "./components/VendorPortal";
import WorkerRegistration from "./components/WorkerRegistration";
import VendorRegistration from "./components/VendorRegistration";
import ArtisanRegistration from "./components/ArtisanRegistration";
import ArtisanCatalog from "./components/ArtisanCatalog";
import ArtisanPortal from "./components/ArtisanPortal";
import ErrorBoundary from "./components/ErrorBoundary";
import { WorkerProfile, UserRole, JobRequest, JobStatus, UserProfile } from "./types";
import { Search, SlidersHorizontal, Map as MapIcon, List, User, ChevronLeft, ChevronRight, LogIn, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { rankWorkers } from "./lib/recommendation";
import { filterByRadius } from "./lib/geofencing";
import { processVoiceCommand } from "./lib/voice";
import { Mic, MicOff } from "lucide-react";

// Firebase Imports
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
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
  or
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
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(() => {
    return !!localStorage.getItem('work_sphere_lang_selected');
  });
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [portalView, setPortalView] = useState<"profile" | "vendor" | "artisan">("profile");
  const [jobsView, setJobsView] = useState<"bookings" | "assignments">("bookings");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisteringVendor, setIsRegisteringVendor] = useState(false);
  const [isRegisteringArtisan, setIsRegisteringArtisan] = useState(false);
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

  // Sync user profile to Firestore on login
  useEffect(() => {
    if (user) {
      const syncProfile = async () => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const profile: any = {
            uid: user.uid,
            displayName: user.displayName || "Anonymous",
            role: UserRole.CONSUMER,
            createdAt: Date.now(),
          };
          if (user.email) profile.email = user.email;
          if (user.photoURL) profile.photoURL = user.photoURL;
          try {
            await setDoc(userRef, profile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
        }
      };
      syncProfile();
    }
  }, [user]);

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
    localStorage.setItem('work_sphere_lang_selected', 'true');
    setHasSelectedLanguage(true);
  };

  if (!hasSelectedLanguage) {
    return <LanguageSelector onComplete={handleLanguageComplete} />;
  }

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
              <div className="w-10 h-10 bg-[#141414] text-white rounded-xl flex items-center justify-center">
                <MapIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-3">
              {nearbyWorkers.length > 0 ? (
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

            {!user ? (
              <div className="bg-white rounded-2xl border border-[#141414]/10 p-12 text-center space-y-4">
                <p className="font-bold text-lg">{t('signInToViewJobs')}</p>
                <button 
                  onClick={handleSignIn}
                  className="bg-[#141414] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 mx-auto"
                >
                  <LogIn className="w-4 h-4" /> {t('signIn')}
                </button>
              </div>
            ) : jobsLoading ? (
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
                <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
                  <div className="w-20 h-20 bg-[#141414]/5 rounded-2xl flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-[#141414]/20" />
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
                  {!user && (
                    <button 
                      onClick={handleSignIn}
                      className="p-3 bg-[#141414] text-white rounded-xl hover:scale-105 transition-transform"
                    >
                      <LogIn className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <ProfileOption label={t('changeLanguage')} onClick={() => setHasSelectedLanguage(false)} />
                  <ProfileOption label={t('accountSettings')} />
                  <ProfileOption label={t('paymentMethods')} />
                  <ProfileOption label={t('helpSupport')} />
                  {!user && (
                    <ProfileOption 
                      label={t('exitGuest')} 
                      onClick={() => setActiveTab('explore')}
                    />
                  )}
                  {user && (
                    <>
                      {userProfile?.role !== UserRole.WORKER ? (
                        <ProfileOption 
                          label={userProfile?.role === UserRole.CONSUMER ? t('becomeWorkerBtn') : t('switchToWorker')} 
                          variant="accent" 
                          onClick={() => setIsRegistering(true)}
                        />
                      ) : (
                        <ProfileOption 
                          label={t('workerPortalBtn')} 
                          variant="accent" 
                          onClick={() => setPortalView("profile")}
                        />
                      )}
                      
                      {userProfile?.role !== UserRole.VENDOR ? (
                        <ProfileOption 
                          label={userProfile?.role === UserRole.CONSUMER ? t('becomeVendorBtn') : t('switchToVendor')} 
                          variant="accent" 
                          onClick={() => setIsRegisteringVendor(true)}
                        />
                      ) : (
                        <ProfileOption 
                          label={t('vendorPortalBtn')} 
                          variant="accent" 
                          onClick={() => setPortalView("vendor")}
                        />
                      )}

                      {userProfile?.role !== UserRole.ARTISAN ? (
                        <ProfileOption 
                          label={userProfile?.role === UserRole.CONSUMER ? t('becomeArtisanBtn') : t('switchToArtisan')} 
                          variant="accent" 
                          onClick={() => setIsRegisteringArtisan(true)}
                        />
                      ) : (
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
        {isRegistering && (
          <WorkerRegistration 
            onClose={() => setIsRegistering(false)} 
            onSuccess={() => setActiveTab("profile")}
          />
        )}
        {isRegisteringVendor && (
          <VendorRegistration 
            onClose={() => setIsRegisteringVendor(false)} 
            onSuccess={() => {
              setActiveTab("profile");
              setPortalView("vendor");
            }}
          />
        )}
        {isRegisteringArtisan && (
          <ArtisanRegistration 
            onClose={() => setIsRegisteringArtisan(false)} 
            onSuccess={() => {
              setActiveTab("profile");
              setPortalView("artisan");
            }}
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
  variant?: "default" | "accent";
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left px-6 py-4 rounded-2xl border transition-all font-bold text-sm flex items-center justify-between group",
        variant === "default" 
          ? "bg-white border-[#141414]/10 hover:border-[#141414]" 
          : "bg-[#141414] text-white border-transparent hover:bg-[#141414]/90"
      )}
    >
      <span>{label}</span>
      <ChevronRight className={cn(
        "w-4 h-4 transition-transform group-hover:translate-x-1",
        variant === "default" ? "text-[#141414]/20" : "text-white/40"
      )} />
    </button>
  );
}
