import React, { useState } from "react";
import { motion } from "motion/react";
import { X, CheckCircle2, Loader2, ChevronRight, Store, Check } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { UserRole } from "../types";
import { cn } from "../lib/utils";
import LocationPicker from "./LocationPicker";
import ProfileImageUploader from "./ProfileImageUploader";
import { useI18n } from "../lib/i18n";
import { SHOPKEEPER_CATEGORIES } from "../constants";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShopkeeperProfileSetup({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [profilePhotoURL, setProfilePhotoURL] = useState("");

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    shopCategory: "",
    shopDescription: "",
    shopAddress: "",
    state: "",
    city: "",
    landmark: "",
    pincode: "",
    openingTime: "09:00",
    closingTime: "21:00",
    weeklyOff: "Sunday",
    contactNumber: "",
    whatsappNumber: "",
    homeDelivery: false,
    pickupAvailable: true,
    cashOnDelivery: true,
    onlinePayment: true,
    shopLogoUrl: "",
    gstNumber: "",
  });

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      return formData.shopName && formData.ownerName && formData.shopCategory;
    }
    if (currentStep === 2) {
      return formData.state && formData.city && formData.shopAddress && formData.contactNumber;
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

      const shopkeeperProfile: any = {
        uid: auth.currentUser.uid,
        displayName: userData?.displayName || auth.currentUser.displayName || "Shopkeeper",
        role: UserRole.VENDOR,
        photoURL: profilePhotoURL || userData?.photoURL || auth.currentUser.photoURL || "",
        shopName: formData.shopName,
        ownerName: formData.ownerName,
        shopCategory: formData.shopCategory,
        shopDescription: formData.shopDescription,
        location: {
          latitude: 0,
          longitude: 0,
          state: formData.state,
          city: formData.city,
          address: formData.shopAddress,
        },
        landmark: formData.landmark,
        pincode: formData.pincode,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        weeklyOff: formData.weeklyOff,
        contactNumber: formData.contactNumber,
        whatsappNumber: formData.whatsappNumber,
        homeDelivery: formData.homeDelivery,
        pickupAvailable: formData.pickupAvailable,
        cashOnDelivery: formData.cashOnDelivery,
        onlinePayment: formData.onlinePayment,
        shopLogoUrl: formData.shopLogoUrl,
        gstNumber: formData.gstNumber,
        isPublished: true,
        aadhaarVerified: false,
        inventory: [],
        createdAt: Date.now(),
      };

      // Create vendor document
      await setDoc(doc(db, "vendors", auth.currentUser.uid), shopkeeperProfile);
      
      // Update user role
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        role: UserRole.VENDOR,
        profileSetupComplete: true,
      });
      
      setStep(4);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vendors/${auth.currentUser.uid}`);
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
            <h2 className="text-2xl font-bold tracking-tight">Setup Shop Profile</h2>
            <p className="text-[#141414]/50 font-medium text-sm mt-1">Complete your profile to start selling</p>
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
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Shop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Agarwal Hardware"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Owner Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Shop Category</label>
                <select
                  value={formData.shopCategory}
                  onChange={(e) => setFormData({ ...formData, shopCategory: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                >
                  <option value="">Select a category</option>
                  {SHOPKEEPER_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Shop Description</label>
                <textarea
                  placeholder="What does your shop sell?"
                  value={formData.shopDescription}
                  onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <LocationPicker 
                  onLocationChange={(state, city) => setFormData(prev => ({ ...prev, state, city }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Full Shop Address</label>
                <textarea
                  placeholder="Complete address including street, area, locality..."
                  value={formData.shopAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, shopAddress: val }));
                  }}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="Near temple, bus stand..."
                  value={formData.landmark}
                  onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Pincode</label>
                  <input
                    type="text"
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Contact Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Opening Time</label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Closing Time</label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Services Available</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#141414]/10 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.homeDelivery}
                      onChange={(e) => setFormData({ ...formData, homeDelivery: e.target.checked })}
                      className="w-5 h-5 accent-[#141414]"
                    />
                    <span className="text-sm font-bold">Home Delivery</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#141414]/10 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.onlinePayment}
                      onChange={(e) => setFormData({ ...formData, onlinePayment: e.target.checked })}
                      className="w-5 h-5 accent-[#141414]"
                    />
                    <span className="text-sm font-bold">Online Payment</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-bold text-sm uppercase"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Shop Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.shopLogoUrl}
                  onChange={(e) => setFormData({ ...formData, shopLogoUrl: e.target.value })}
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
                <h3 className="text-3xl font-bold">Shop Registered!</h3>
                <p className="text-[#141414]/60 font-medium">You can now start adding items to your inventory.</p>
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
                <>Publish Shop <Check className="w-5 h-5" /></>
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
