import React, { useState } from "react";
import { motion } from "motion/react";
import { X, CheckCircle2, Loader2, ChevronRight, Palette, Check } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { UserRole } from "../types";
import { cn } from "../lib/utils";
import LocationPicker from "./LocationPicker";
import ProfileImageUploader from "./ProfileImageUploader";
import { useI18n } from "../lib/i18n";
import { ARTISAN_CRAFT_CATEGORIES } from "../constants";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArtisanProfileSetup({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [profilePhotoURL, setProfilePhotoURL] = useState("");

  const [formData, setFormData] = useState({
    craftCategory: "",
    yearsOfExperience: 0,
    artisanBio: "",
    materialUsed: "",
    customOrdersAvailable: true,
    handmadeProducts: "",
    productionTime: "3-5 days",
    deliveryAvailable: true,
    shippingCharges: 0,
    state: "",
    city: "",
    latitude: 19.0760,
    longitude: 72.8777,
    workshopAddress: "",
    workshopPhotoUrl: "",
  });

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      return formData.craftCategory && formData.artisanBio;
    }
    if (currentStep === 2) {
      return formData.handmadeProducts && formData.productionTime;
    }
    if (currentStep === 3) {
      return formData.state && formData.city && formData.workshopAddress;
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

      const artisanProfile: any = {
        uid: auth.currentUser.uid,
        displayName: userData?.displayName || auth.currentUser.displayName || "Artisan",
        role: UserRole.ARTISAN,
        photoURL: profilePhotoURL || userData?.photoURL || auth.currentUser.photoURL || "",
        craftCategory: formData.craftCategory,
        specialty: formData.craftCategory, // fallback
        yearsOfExperience: formData.yearsOfExperience,
        artisanBio: formData.artisanBio,
        materialUsed: formData.materialUsed,
        customOrdersAvailable: formData.customOrdersAvailable,
        handmadeProducts: formData.handmadeProducts,
        productDescription: formData.handmadeProducts, // fallback
        productionTime: formData.productionTime,
        deliveryAvailable: formData.deliveryAvailable,
        shippingCharges: formData.shippingCharges,
        location: {
          latitude: formData.latitude || 19.0760,
          longitude: formData.longitude || 72.8777,
          state: formData.state,
          city: formData.city,
          address: formData.workshopAddress || `${formData.city}, ${formData.state}`,
        },
        workshopAddress: formData.workshopAddress,
        workshopPhotoUrls: formData.workshopPhotoUrl ? [formData.workshopPhotoUrl] : [],
        isPublished: true,
        rating: 5.0,
        createdAt: Date.now(),
      };

      // Create artisan document
      await setDoc(doc(db, "artisans", auth.currentUser.uid), artisanProfile);
      
      // Update user role
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        role: UserRole.ARTISAN,
        profileSetupComplete: true,
      });
      
      setStep(4);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `artisans/${auth.currentUser.uid}`);
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
        <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-[#141414]/10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Become an Artisan</h2>
            <p className="text-[#141414]/50 font-medium text-sm mt-1">Set up your catalog profile</p>
          </div>
          <button onClick={onClose} className="p-2 bg-[#141414]/5 hover:bg-[#141414]/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

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
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Craft Category</label>
                <select
                  value={formData.craftCategory}
                  onChange={(e) => setFormData({ ...formData, craftCategory: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                >
                  <option value="">Select your main craft</option>
                  {ARTISAN_CRAFT_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase()) || cat}</option>)}
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
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Artisan Biography</label>
                <textarea
                  placeholder="Tell customers about your journey and craft..."
                  value={formData.artisanBio}
                  onChange={(e) => setFormData({ ...formData, artisanBio: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm min-h-[120px] resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">What do you make?</label>
                <textarea
                  placeholder="E.g. Hand-painted ceramic vases, custom wooden tables..."
                  value={formData.handmadeProducts}
                  onChange={(e) => setFormData({ ...formData, handmadeProducts: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Materials Used (Optional)</label>
                <input
                  type="text"
                  placeholder="E.g. Teak wood, Terracotta clay"
                  value={formData.materialUsed}
                  onChange={(e) => setFormData({ ...formData, materialUsed: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Production Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 3-5 days"
                    value={formData.productionTime}
                    onChange={(e) => setFormData({ ...formData, productionTime: e.target.value })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Custom Orders</label>
                  <div className="flex items-center h-[54px] px-4 bg-white border border-[#141414]/10 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.customOrdersAvailable}
                        onChange={(e) => setFormData({ ...formData, customOrdersAvailable: e.target.checked })}
                        className="w-5 h-5 accent-[#141414]"
                      />
                      <span className="text-sm font-bold">Available</span>
                    </label>
                  </div>
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
                        workshopAddress: prev.workshopAddress || locData.address || `${locData.city}, ${locData.state}`,
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
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Workshop Address</label>
                <textarea
                  placeholder="Where do you work?"
                  value={formData.workshopAddress}
                  onChange={(e) => setFormData({ ...formData, workshopAddress: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Workshop Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/workshop.jpg"
                  value={formData.workshopPhotoUrl}
                  onChange={(e) => setFormData({ ...formData, workshopPhotoUrl: e.target.value })}
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
                <h3 className="text-3xl font-bold">Store Published!</h3>
                <p className="text-[#141414]/60 font-medium">You can now add your handmade products to the catalog.</p>
              </div>
            </div>
          )}
        </div>

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
                <>Publish Store <Check className="w-5 h-5" /></>
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
