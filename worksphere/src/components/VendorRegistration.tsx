import React, { useState } from "react";
import { motion } from "motion/react";
import { X, CheckCircle2, Loader2, Store } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { UserRole, HardwareVendor } from "../types";
import LocationPicker from "./LocationPicker";

import { useI18n } from "../lib/i18n";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorRegistration({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    state: "",
    city: ""
  });

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    const vendorProfile: any = {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || "Anonymous",
      role: UserRole.VENDOR,
      photoURL: auth.currentUser.photoURL || "",
      shopName: formData.shopName,
      inventory: [], // Initial empty inventory
      location: {
        latitude: 0, // In production, use geolocation
        longitude: 0,
        state: formData.state,
        city: formData.city,
        address: formData.address,
      },
      createdAt: Date.now(),
    };

    try {
      // Create vendor document
      await setDoc(doc(db, "vendors", auth.currentUser.uid), vendorProfile);
      // Update user role in users collection
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        role: UserRole.VENDOR
      });
      
      setStep(2);
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#141414] text-white rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{t('vendorPortal')}</h2>
            </div>
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
                  {t('shopName')}
                </label>
                <input
                  type="text"
                  placeholder={t('shopNamePlaceholder')}
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all font-bold"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">
                  {t('shopAddress')}
                </label>
                <textarea
                  placeholder={t('shopAddressPlaceholder')}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all min-h-[100px] resize-none font-medium"
                />
              </div>

              <div className="space-y-4">
                <LocationPicker 
                  onLocationChange={(state, city) => setFormData({ ...formData, state, city })}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  {t('vendorBenefit')}
                </p>
              </div>

              <button
                disabled={!formData.shopName || !formData.address || !formData.city || loading}
                onClick={handleSubmit}
                className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('registerShop')
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
                <h3 className="text-2xl font-bold">{t('shopRegistered')}</h3>
                <p className="text-[#141414]/60">{t('startAddingItems')}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
