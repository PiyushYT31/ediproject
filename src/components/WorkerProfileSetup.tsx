import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Loader2, ChevronRight, ChevronLeft, MapPin, Briefcase, Camera, Check } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { UserRole } from "../types";
import { cn } from "../lib/utils";
import LocationPicker from "./LocationPicker";
import ProfileImageUploader from "./ProfileImageUploader";
import { useI18n } from "../lib/i18n";
import { WORKER_CATEGORIES, WORKER_SKILLS, DAYS_OF_WEEK, TRAVEL_DISTANCES, LANGUAGES_SPOKEN } from "../constants";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkerProfileSetup({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [profilePhotoURL, setProfilePhotoURL] = useState("");

  const [formData, setFormData] = useState({
    profession: "",
    yearsOfExperience: 0,
    skills: [] as string[],
    languagesSpoken: [] as string[],
    serviceDescription: "",
    hourlyFee: 0,
    dailyCharges: 0,
    emergencyCharges: 0,
    availableTiming: { from: "09:00", to: "18:00" },
    availableDays: [] as string[],
    maxTravelDistance: "5km",
    state: "",
    city: "",
    latitude: 19.0760,
    longitude: 72.8777,
    address: "",
    whatsappNumber: "",
    portfolioUrls: [] as string[],
  });

  const toggleArrayItem = (field: 'skills' | 'languagesSpoken' | 'availableDays', item: string) => {
    setFormData(prev => {
      const array = prev[field];
      if (array.includes(item)) {
        return { ...prev, [field]: array.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...array, item] };
      }
    });
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      return formData.profession && formData.serviceDescription && formData.skills.length > 0;
    }
    if (currentStep === 2) {
      return formData.hourlyFee > 0 && formData.availableDays.length > 0;
    }
    if (currentStep === 3) {
      return formData.state && formData.city && formData.whatsappNumber;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();

      const workerProfile: any = {
        uid: auth.currentUser.uid,
        displayName: userData?.displayName || auth.currentUser.displayName || "Worker",
        role: UserRole.WORKER,
        photoURL: profilePhotoURL || userData?.photoURL || auth.currentUser.photoURL || "",
        category: formData.profession, // map profession to category
        profession: formData.profession,
        rating: 5.0,
        totalJobs: 0,
        completionRate: 1.0,
        basePrice: formData.hourlyFee, // map hourly fee to base price
        bio: formData.serviceDescription,
        serviceDescription: formData.serviceDescription,
        yearsOfExperience: formData.yearsOfExperience,
        skills: formData.skills,
        languagesSpoken: formData.languagesSpoken,
        hourlyFee: formData.hourlyFee,
        dailyCharges: formData.dailyCharges,
        emergencyCharges: formData.emergencyCharges,
        availableTiming: formData.availableTiming,
        availableDays: formData.availableDays,
        maxTravelDistance: formData.maxTravelDistance,
        location: {
          latitude: formData.latitude || 19.0760,
          longitude: formData.longitude || 72.8777,
          state: formData.state,
          city: formData.city,
          address: formData.address || `${formData.city}, ${formData.state}`
        },
        whatsappNumber: formData.whatsappNumber,
        portfolioUrls: formData.portfolioUrls,
        isAvailable: true,
        isOnline: true,
        aadhaarVerified: false,
        createdAt: Date.now(),
      };

      // Create/Update worker document
      await setDoc(doc(db, "workers", auth.currentUser.uid), workerProfile);
      
      // Update user role and profile setup status in users collection
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        role: UserRole.WORKER,
        profileSetupComplete: true,
      });
      
      setStep(4); // Success step
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workers/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/80 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-2xl bg-[#F5F5F0] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-[#141414]/10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('becomeWorker')}</h2>
            <p className="text-[#141414]/50 font-medium text-sm mt-1">Complete your profile to get started</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#141414]/5 hover:bg-[#141414]/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {step <= totalSteps && (
          <div className="bg-white px-8 py-4 shrink-0">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 h-2 rounded-full bg-[#141414]/10 overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#141414]"
                    initial={{ width: "0%" }}
                    animate={{ width: step >= s ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <ProfileImageUploader
                currentPhotoURL={profilePhotoURL || auth.currentUser?.photoURL || undefined}
                onUpload={setProfilePhotoURL}
                size="md"
                label="Profile Photo"
              />

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Profession</label>
                <select
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                >
                  <option value="">Select your main profession</option>
                  {WORKER_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {WORKER_SKILLS.slice(0, 10).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleArrayItem('skills', skill)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                        formData.skills.includes(skill)
                          ? "bg-[#141414] text-white border-[#141414]"
                          : "bg-white border-[#141414]/10 text-[#141414]/60 hover:border-[#141414]/30"
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Service Description</label>
                <textarea
                  placeholder="Describe your work and experience..."
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm min-h-[120px] resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Hourly Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hourlyFee}
                    onChange={(e) => setFormData({ ...formData, hourlyFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Daily Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dailyCharges}
                    onChange={(e) => setFormData({ ...formData, dailyCharges: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleArrayItem('availableDays', day)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                        formData.availableDays.includes(day)
                          ? "bg-[#141414] text-white border-[#141414]"
                          : "bg-white border-[#141414]/10 text-[#141414]/60 hover:border-[#141414]/30"
                      )}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">From Time</label>
                  <input
                    type="time"
                    value={formData.availableTiming.from}
                    onChange={(e) => setFormData({ ...formData, availableTiming: { ...formData.availableTiming, from: e.target.value } })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">To Time</label>
                  <input
                    type="time"
                    value={formData.availableTiming.to}
                    onChange={(e) => setFormData({ ...formData, availableTiming: { ...formData.availableTiming, to: e.target.value } })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Max Travel Distance</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAVEL_DISTANCES.map((dist) => (
                    <button
                      key={dist.value}
                      onClick={() => setFormData({ ...formData, maxTravelDistance: dist.value })}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-bold transition-all",
                        formData.maxTravelDistance === dist.value
                          ? "bg-[#141414] text-white border-transparent"
                          : "bg-white border-[#141414]/10 hover:border-[#141414]"
                      )}
                    >
                      {dist.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <LocationPicker 
                  onLocationChange={(locData, city) => {
                    if (typeof locData === 'object') {
                      setFormData(prev => ({
                        ...prev,
                        state: locData.state,
                        city: locData.city,
                        latitude: locData.latitude ?? prev.latitude,
                        longitude: locData.longitude ?? prev.longitude,
                        address: locData.address ?? prev.address,
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        state: locData,
                        city: city || prev.city,
                      }));
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="For direct client communication"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Portfolio Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Link to an image of your work"
                  onChange={(e) => setFormData({ ...formData, portfolioUrls: [e.target.value] })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 h-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/30"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">{t('allSet')}</h3>
                <p className="text-[#141414]/60 font-medium">Your worker profile is now live!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step <= totalSteps && (
          <div className="bg-white px-8 py-5 flex items-center gap-4 border-t border-[#141414]/10 shrink-0">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-4 rounded-xl font-bold text-[#141414]/60 hover:bg-[#141414]/5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={step === totalSteps ? handleSubmit : handleNext}
              disabled={!validateStep(step) || loading}
              className="flex-1 py-4 bg-[#141414] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#141414]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 ml-auto"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : step === totalSteps ? (
                <>Complete Setup <Check className="w-5 h-5" /></>
              ) : (
                <>Next <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
