import React, { useState } from "react";
import { motion } from "motion/react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { UserRole, WorkerProfile } from "../types";
import { cn } from "../lib/utils";
import LocationPicker from "./LocationPicker";

import { useI18n } from "../lib/i18n";

import { WORKER_CATEGORIES } from "../constants";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkerRegistration({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "",
    basePrice: 500,
    bio: "",
    state: "",
    city: ""
  });

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    const workerProfile: any = {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || "Anonymous",
      role: UserRole.WORKER,
      photoURL: auth.currentUser.photoURL || "",
      category: formData.category,
      rating: 5.0,
      totalJobs: 0,
      completionRate: 1.0,
      basePrice: formData.basePrice,
      bio: formData.bio,
      location: {
        latitude: 19.0760, // Default for now
        longitude: 72.8777,
        state: formData.state,
        city: formData.city,
        address: `${formData.city}, ${formData.state}`
      },
      isAvailable: true,
      createdAt: Date.now(),
    };

    try {
      // Create worker document
      await setDoc(doc(db, "workers", auth.currentUser.uid), workerProfile);
      // Update user role in users collection
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        role: UserRole.WORKER
      });
      
      setStep(2);
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{t('becomeWorker')}</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">
                  {t('selectCategory')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKER_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-bold transition-all",
                        formData.category === cat
                          ? "bg-[#141414] text-white border-transparent"
                          : "bg-white border-[#141414]/10 hover:border-[#141414]"
                      )}
                    >
                      {t(cat)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">
                  {t('baseServicePrice')}
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
                  className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all font-bold"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">
                  {t('professionalBio')}
                </label>
                <textarea
                  placeholder={t('bioPlaceholder')}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-4">
                <LocationPicker 
                  onLocationChange={(state, city) => setFormData({ ...formData, state, city })}
                />
              </div>

              <button
                disabled={!formData.category || !formData.bio || !formData.city || loading}
                onClick={handleSubmit}
                className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('completeRegistration')
                )}
              </button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t('allSet')}</h3>
                <p className="text-[#141414]/60">{t('profileLive')}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
