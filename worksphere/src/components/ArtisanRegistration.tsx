import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Palette, Camera, Check } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import LocationPicker from './LocationPicker';

const ARTISAN_SPECIALTIES = [
  'pottery', 'textiles', 'jewelry', 'woodwork', 'leather', 'sculpture', 'paintings'
];

export default function ArtisanRegistration({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    specialty: '',
    artisanBio: '',
    state: '',
    city: ''
  });

  const handleRegister = async () => {
    if (!auth.currentUser) return;

    const artisanProfile = {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || 'Artisan',
      role: UserRole.ARTISAN,
      artisanBio: formData.artisanBio,
      specialty: formData.specialty,
      rating: 5.0,
      location: {
        latitude: 0,
        longitude: 0,
        state: formData.state,
        city: formData.city,
        address: `${formData.city}, ${formData.state}`
      },
      createdAt: Date.now()
    };

    try {
      // Update basic user role
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        role: UserRole.ARTISAN
      }, { merge: true });

      // Create artisan profile
      await setDoc(doc(db, "artisans", auth.currentUser.uid), artisanProfile);
      
      setStep(3);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "artisans");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#141414]/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] text-white rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">{t('becomeArtisanBtn')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#141414]/60">{t('selectCategory')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ARTISAN_SPECIALTIES.map(spec => (
                    <button
                      key={spec}
                      onClick={() => setFormData({ ...formData, specialty: spec })}
                      className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        formData.specialty === spec 
                          ? 'bg-[#141414] text-white border-transparent' 
                          : 'bg-white border-[#141414]/10 text-[#141414]/60 hover:border-[#141414]'
                      }`}
                    >
                      {t(spec)}
                    </button>
                  ))}
                </div>
              </div>

              <LocationPicker 
                onLocationChange={(state, city) => setFormData({ ...formData, state, city })}
              />

              <button
                disabled={!formData.specialty || !formData.city}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('getStarted')}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#141414]/60">{t('artisanBio')}</label>
                <textarea
                  value={formData.artisanBio}
                  onChange={(e) => setFormData({ ...formData, artisanBio: e.target.value })}
                  placeholder={t('bioPlaceholder')}
                  className="w-full px-4 py-3 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all min-h-[120px] resize-none"
                />
              </div>

              <div className="bg-[#141414]/5 p-4 rounded-2xl">
                <p className="text-xs text-[#141414]/60 leading-relaxed font-medium">
                  {t('vendorBenefit')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border border-[#141414]/10 rounded-2xl font-bold hover:bg-[#141414]/5 transition-all text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleRegister}
                  className="flex-[2] py-4 bg-[#141414] text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t('completeRegistration')}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                <Check className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{t('allSet')}</h3>
                <p className="text-[#141414]/60 mt-2">{t('profileLive')}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
