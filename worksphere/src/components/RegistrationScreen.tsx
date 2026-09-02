import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Store, Wrench, Palette, Eye, EyeOff, 
  Mail, Phone, Lock, ChevronRight, Loader2, AlertCircle, ExternalLink, Info, Ghost
} from "lucide-react";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";
import { registerWithEmail, loginWithEmail, signInWithGoogle, signInAnonymously, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserRole } from "../types";

interface Props {
  onComplete: (needsProfileSetup: boolean, role: UserRole) => void;
}

const ROLES = [
  { role: UserRole.CONSUMER, icon: User, label: 'customer', desc: 'roleDescCustomer' },
  { role: UserRole.VENDOR, icon: Store, label: 'shopkeeper', desc: 'roleDescShopkeeper' },
  { role: UserRole.WORKER, icon: Wrench, label: 'worker', desc: 'roleDescWorker' },
  { role: UserRole.ARTISAN, icon: Palette, label: 'artisan', desc: 'roleDescArtisan' },
];

export default function RegistrationScreen({ onComplete }: Props) {
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailAuthDisabled, setEmailAuthDisabled] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: UserRole.CONSUMER,
  });

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role });
  };

  const validate = (): string | null => {
    if (!isLogin) {
      if (!formData.fullName.trim()) return t('errorNameRequired');
      if (!formData.email.trim()) return t('errorEmailRequired');
      if (!formData.phone.trim()) return t('errorPhoneRequired');
      if (formData.phone.length < 10) return t('errorPhoneInvalid');
      if (formData.password.length < 6) return t('errorPasswordShort');
      if (formData.password !== formData.confirmPassword) return t('errorPasswordMismatch');
    } else {
      if (!formData.email.trim()) return t('errorEmailRequired');
      if (!formData.password.trim()) return t('errorPasswordRequired');
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const user = await loginWithEmail(formData.email, formData.password);
        // Check if profile setup is complete
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const role = data.role || UserRole.CONSUMER;
          const setupDone = data.profileSetupComplete || role === UserRole.CONSUMER;
          onComplete(!setupDone, role);
        } else {
          // Profile was deleted from DB but user exists in Auth -> recreate as consumer
          const profile: any = {
            uid: user.uid,
            displayName: user.displayName || formData.email.split('@')[0],
            email: formData.email,
            role: UserRole.CONSUMER,
            profileSetupComplete: true,
            createdAt: Date.now(),
          };
          await setDoc(doc(db, "users", user.uid), profile);
          onComplete(false, UserRole.CONSUMER);
        }
      } else {
        const user = await registerWithEmail(formData.email, formData.password, formData.fullName);
        
        // Create user profile in Firestore
        const profile: any = {
          uid: user.uid,
          displayName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phone,
          role: formData.role,
          profileSetupComplete: formData.role === UserRole.CONSUMER,
          createdAt: Date.now(),
        };

        try {
          await setDoc(doc(db, "users", user.uid), profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }

        // Customer goes straight to dashboard, others need profile setup
        const needsSetup = formData.role !== UserRole.CONSUMER;
        onComplete(needsSetup, formData.role);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError(t('errorEmailInUse'));
      } else if (err.code === "auth/invalid-email") {
        setError(t('errorEmailInvalid'));
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError(t('errorWrongPassword'));
      } else if (err.code === "auth/user-not-found") {
        setError(t('errorUserNotFound'));
      } else if (err.code === "auth/operation-not-allowed") {
        setEmailAuthDisabled(true);
        setError("");
      } else {
        setError(err.message || t('errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await signInWithGoogle();
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = data.role || UserRole.CONSUMER;
        const setupDone = data.profileSetupComplete || role === UserRole.CONSUMER;
        onComplete(!setupDone, role);
      } else {
        // New Google user → create profile as consumer
        const profile: any = {
          uid: user.uid,
          displayName: user.displayName || "User",
          email: user.email,
          role: UserRole.CONSUMER,
          profileSetupComplete: true,
          createdAt: Date.now(),
        };
        if (user.photoURL) profile.photoURL = user.photoURL;
        await setDoc(doc(db, "users", user.uid), profile);
        onComplete(false, UserRole.CONSUMER);
      }
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        setError("Google Sign-In is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.");
      } else if (err.code === "auth/unauthorized-domain") {
        setUnauthorizedDomain(true);
        setError("");
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || t('errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await signInAnonymously();
      // Create a minimal guest profile in Firestore
      const profile: any = {
        uid: user.uid,
        displayName: "Guest User",
        role: UserRole.CONSUMER,
        profileSetupComplete: true,
        createdAt: Date.now(),
      };
      try {
        await setDoc(doc(db, "users", user.uid), profile);
      } catch (_) {}
      onComplete(false, UserRole.CONSUMER);
    } catch (err: any) {
      setError(err.message || "Guest sign-in failed. Please try Google Sign-In.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError("");
    if (emailAuthDisabled) setEmailAuthDisabled(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F5F0] overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-start p-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-[#141414] text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#141414]/20 mb-4"
            >
              <span className="text-2xl font-black">W</span>
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141414]">
              {t('welcomeToWorksphere')}
            </h1>
            <p className="text-[#141414]/50 font-medium text-sm">
              {isLogin ? t('signInToContinue') : t('createAccountToContinue')}
            </p>
          </div>

          {/* Email Auth Disabled Banner */}
          <AnimatePresence>
            {emailAuthDisabled && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-amber-50 border border-amber-300 rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-800">Email/Password Sign-In is Disabled</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      This Firebase project has not enabled Email/Password authentication.
                      Please enable it in the Firebase Console to use this sign-in method.
                    </p>
                    <a
                      href={`https://console.firebase.google.com/project/gen-lang-client-0339886940/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-800 underline underline-offset-4 hover:text-amber-900 transition-colors"
                    >
                      Open Firebase Console
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div className="bg-amber-100 px-4 py-2.5 border-t border-amber-200">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Quick Fix Steps</p>
                  <ol className="mt-1.5 space-y-1 list-decimal list-inside">
                    <li className="text-xs text-amber-700">Go to Firebase Console → Authentication → Sign-in method</li>
                    <li className="text-xs text-amber-700">Click <strong>Email/Password</strong> and toggle <strong>Enable</strong></li>
                    <li className="text-xs text-amber-700">Save and refresh this page</li>
                  </ol>
                  <p className="text-xs font-semibold text-amber-800 mt-2">In the meantime, try signing in with Google below ↓</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unauthorized Domain Banner */}
          <AnimatePresence>
            {unauthorizedDomain && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-orange-50 border border-orange-300 rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-orange-800">Domain Not Authorized for Google Sign-In</p>
                    <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                      The domain <strong>localhost</strong> is not in your Firebase project's authorized domains list. Google Sign-In will be blocked until you add it.
                    </p>
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0339886940/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-orange-800 underline underline-offset-4 hover:text-orange-900 transition-colors"
                    >
                      Open Firebase Auth Settings
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div className="bg-orange-100 px-4 py-2.5 border-t border-orange-200">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Quick Fix Steps</p>
                  <ol className="mt-1.5 space-y-1 list-decimal list-inside">
                    <li className="text-xs text-orange-700">Go to Firebase Console → Authentication → <strong>Settings</strong> tab</li>
                    <li className="text-xs text-orange-700">Scroll to <strong>"Authorized domains"</strong></li>
                    <li className="text-xs text-orange-700">Click <strong>"Add domain"</strong> → type <code className="bg-orange-200 px-1 rounded">localhost</code> → click Add</li>
                    <li className="text-xs text-orange-700">Save and try Google Sign-In again</li>
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Fields */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/30" />
                    <input
                      type="text"
                      placeholder={t('fullName')}
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/30" />
                    <input
                      type="tel"
                      placeholder={t('phoneNumber')}
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/30" />
              <input
                type="email"
                placeholder={t('emailAddress')}
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/30" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? t('password') : t('createPassword')}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#141414]/30 hover:text-[#141414]/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t('confirmPassword')}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Role Selection (Registration only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 px-1">
                  {t('selectYourRole')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((item, index) => (
                    <motion.button
                      key={item.role}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleRoleSelect(item.role)}
                      className={cn(
                        "relative p-4 rounded-2xl border-2 transition-all text-left group",
                        formData.role === item.role
                          ? "bg-[#141414] border-[#141414] text-white shadow-lg shadow-[#141414]/20"
                          : "bg-white border-[#141414]/5 hover:border-[#141414]/20 text-[#141414]"
                      )}
                    >
                      <item.icon className={cn(
                        "w-7 h-7 mb-3",
                        formData.role === item.role ? "text-white" : "text-[#141414]/40"
                      )} />
                      <p className="font-bold text-sm leading-tight">{t(item.label)}</p>
                      <p className={cn(
                        "text-[10px] mt-1 leading-tight font-medium",
                        formData.role === item.role ? "text-white/60" : "text-[#141414]/30"
                      )}>
                        {t(item.desc)}
                      </p>
                      {formData.role === item.role && (
                        <motion.div
                          layoutId="role-indicator"
                          className="absolute top-3 right-3 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
                        >
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#141414]/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isLogin ? t('signInBtn') : t('continue')}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#141414]/10" />
            <span className="text-xs font-bold text-[#141414]/30 uppercase tracking-widest">{t('or')}</span>
            <div className="flex-1 h-px bg-[#141414]/10" />
          </div>

          {/* Google Sign In */}
          <button
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white border border-[#141414]/10 rounded-2xl font-bold text-sm hover:border-[#141414]/30 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('signInWithGoogle')}
          </button>

          {/* Toggle Login/Register */}
          <p className="text-center text-sm text-[#141414]/50 font-medium">
            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-[#141414] font-bold underline underline-offset-4 hover:text-[#141414]/70 transition-colors"
            >
              {isLogin ? t('registerNow') : t('loginHere')}
            </button>
          </p>

          {/* Guest Sign In */}
          <div className="pt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-[#141414]/8" />
              <span className="text-[10px] font-black text-[#141414]/25 uppercase tracking-[0.15em]">or browse without account</span>
              <div className="flex-1 h-px bg-[#141414]/8" />
            </div>
            <motion.button
              disabled={loading}
              onClick={handleGuestSignIn}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 bg-[#141414]/4 border border-dashed border-[#141414]/15 rounded-2xl font-bold text-sm text-[#141414]/50 hover:text-[#141414]/70 hover:border-[#141414]/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Ghost className="w-4 h-4" />
              Continue as Guest
            </motion.button>
            <p className="text-center text-[10px] text-[#141414]/30 mt-2 font-medium">No account needed · Limited features</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
