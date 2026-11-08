import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Briefcase, 
  Store, 
  Wrench, 
  Palette, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  Lock, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  Info, 
  Sparkles,
  CheckCircle2,
  ShoppingBag
} from "lucide-react";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";
import { 
  registerWithEmail, 
  loginWithEmail, 
  signInWithGoogle, 
  signInAnonymously, 
  db, 
  handleFirestoreError, 
  OperationType 
} from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserRole, ProviderSubRole } from "../types";

interface Props {
  onComplete: (needsProfileSetup: boolean, role: UserRole, subRole?: string) => void;
}

export default function RegistrationScreen({ onComplete }: Props) {
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailAuthDisabled, setEmailAuthDisabled] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 2-Login Architecture: "customer" (Buyer) vs "provider" (Seller)
  const [accountType, setAccountType] = useState<"customer" | "provider">("customer");
  
  // Provider Sub-Roles: worker, artisan, vendor
  const [providerSubRole, setProviderSubRole] = useState<ProviderSubRole>(ProviderSubRole.WORKER);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const validate = (): string | null => {
    if (!isLogin) {
      if (!formData.fullName.trim()) return t('errorNameRequired') || "Name is required";
      if (!formData.email.trim()) return t('errorEmailRequired') || "Email is required";
      if (!formData.phone.trim()) return t('errorPhoneRequired') || "Phone number is required";
      if (formData.phone.length < 10) return t('errorPhoneInvalid') || "Enter a valid 10-digit phone number";
      if (formData.password.length < 6) return t('errorPasswordShort') || "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword) return t('errorPasswordMismatch') || "Passwords do not match";
    } else {
      if (!formData.email.trim()) return t('errorEmailRequired') || "Email is required";
      if (!formData.password.trim()) return t('errorPasswordRequired') || "Password is required";
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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const role = data.role || (data.accountType === "provider" ? UserRole.WORKER : UserRole.CONSUMER);
          const subRole = data.subRole || "worker";
          const setupDone = Boolean(data.profileSetupComplete) || role === UserRole.CONSUMER;
          onComplete(!setupDone, role, subRole);
        } else {
          // Re-create default customer profile if doc missing
          const profile: any = {
            uid: user.uid,
            displayName: user.displayName || formData.email.split('@')[0],
            email: formData.email,
            role: UserRole.CONSUMER,
            accountType: "customer",
            profileSetupComplete: true,
            createdAt: Date.now(),
          };
          await setDoc(doc(db, "users", user.uid), profile);
          onComplete(false, UserRole.CONSUMER);
        }
      } else {
        const user = await registerWithEmail(formData.email, formData.password, formData.fullName);
        
        const isProvider = accountType === "provider";
        const role = isProvider
          ? (providerSubRole === ProviderSubRole.ARTISAN ? UserRole.ARTISAN : providerSubRole === ProviderSubRole.SHOPKEEPER ? UserRole.VENDOR : UserRole.WORKER)
          : UserRole.CONSUMER;

        const profile: any = {
          uid: user.uid,
          displayName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phone,
          role,
          accountType,
          subRole: isProvider ? providerSubRole : undefined,
          profileSetupComplete: !isProvider,
          createdAt: Date.now(),
        };

        try {
          await setDoc(doc(db, "users", user.uid), profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }

        // Customer lands immediately on discovery feed; Provider hits mandatory setup wizard
        onComplete(isProvider, role, providerSubRole);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError(t('errorEmailInUse') || "Email already in use");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError(t('errorInvalidCredentials') || "Invalid email or password");
      } else if (err.code === "auth/user-not-found") {
        setError(t('errorUserNotFound') || "No account found with this email");
      } else {
        setError(err.message || t('errorGeneric') || "Authentication failed");
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
        const subRole = data.subRole || "worker";
        const setupDone = Boolean(data.profileSetupComplete) || role === UserRole.CONSUMER;
        onComplete(!setupDone, role, subRole);
      } else {
        // New Google user default customer
        const profile: any = {
          uid: user.uid,
          displayName: user.displayName || "User",
          email: user.email,
          role: UserRole.CONSUMER,
          accountType: "customer",
          profileSetupComplete: true,
          createdAt: Date.now(),
        };
        if (user.photoURL) profile.photoURL = user.photoURL;
        await setDoc(doc(db, "users", user.uid), profile);
        onComplete(false, UserRole.CONSUMER);
      }
    } catch (err: any) {
      if (err.code === "auth/unauthorized-domain") {
        setUnauthorizedDomain(true);
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in error");
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
      const profile: any = {
        uid: user.uid,
        displayName: "Guest User",
        role: UserRole.CONSUMER,
        accountType: "customer",
        profileSetupComplete: true,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "users", user.uid), profile);
      onComplete(false, UserRole.CONSUMER);
    } catch (err: any) {
      setError(err.message || "Guest sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-sky-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Work<span className="text-indigo-600">Sphere</span> India
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">
              {isLogin ? "Sign in to access your dashboard" : "Join the decentralized hyperlocal marketplace"}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2-LOGIN ARCHITECTURE SELECTION (Registration Only) */}
          {!isLogin && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                Select Account Type
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Customer (Buyer) */}
                <button
                  type="button"
                  onClick={() => setAccountType("customer")}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative",
                    accountType === "customer"
                      ? "bg-white border-indigo-600 shadow-md shadow-indigo-600/10 text-slate-900 ring-2 ring-indigo-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center mb-2.5",
                    accountType === "customer" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">Customer</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Hire labor, buy local crafts, shop supplies
                  </p>
                  {accountType === "customer" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
                  )}
                </button>

                {/* 2. Service Provider (Seller) */}
                <button
                  type="button"
                  onClick={() => setAccountType("provider")}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative",
                    accountType === "provider"
                      ? "bg-white border-indigo-600 shadow-md shadow-indigo-600/10 text-slate-900 ring-2 ring-indigo-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center mb-2.5",
                    accountType === "provider" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">Provider</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Offer services, crafts, or hardware supplies
                  </p>
                  {accountType === "provider" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
                  )}
                </button>
              </div>

              {/* Sub-Category Selection for Providers */}
              <AnimatePresence>
                {accountType === "provider" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3"
                  >
                    <span className="text-xs font-bold text-indigo-950 block">
                      Choose Your Provider Category:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Daily Wage Worker */}
                      <button
                        type="button"
                        onClick={() => setProviderSubRole(ProviderSubRole.WORKER)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex flex-col items-center gap-1.5",
                          providerSubRole === ProviderSubRole.WORKER
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        )}
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Daily Worker</span>
                      </button>

                      {/* Artisan */}
                      <button
                        type="button"
                        onClick={() => setProviderSubRole(ProviderSubRole.ARTISAN)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex flex-col items-center gap-1.5",
                          providerSubRole === ProviderSubRole.ARTISAN
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        )}
                      >
                        <Palette className="w-4 h-4" />
                        <span>Artisan</span>
                      </button>

                      {/* Shopkeeper */}
                      <button
                        type="button"
                        onClick={() => setProviderSubRole(ProviderSubRole.SHOPKEEPER)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex flex-col items-center gap-1.5",
                          providerSubRole === ProviderSubRole.SHOPKEEPER
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        )}
                      >
                        <Store className="w-4 h-4" />
                        <span>Shopkeeper</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Your password" : "Min. 6 characters"}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-type password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In to Account" : "Create Account & Continue"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google & Guest Options */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="text-center text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer"
              >
                Browse as Guest (Buyer View)
              </button>
            </div>
          </div>

          {/* Toggle Login / Register */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 cursor-pointer"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
