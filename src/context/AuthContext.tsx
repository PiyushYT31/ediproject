import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signOut as fbSignOut, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isProfileComplete: boolean;
  signOutUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateRole: (newRole: UserRole) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to User Profile changes in Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // If no user profile document exists yet, create default
          const defaultProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || "User",
            email: user.email || "",
            role: UserRole.CONSUMER,
            photoURL: user.photoURL || undefined,
            createdAt: Date.now(),
            profileSetupComplete: false,
          };
          setUserProfile(defaultProfile);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("User profile snapshot warning:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  const signOutUser = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    const collections = ["users", "workers", "vendors", "artisans"];
    await Promise.allSettled(
      collections.map((col) => deleteDoc(doc(db, col, user.uid)))
    );
    await deleteUser(user);
    setUser(null);
    setUserProfile(null);
  };

  const updateRole = async (newRole: UserRole) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: newRole,
      });
      setUserProfile((prev) => (prev ? { ...prev, role: newRole } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users");
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users");
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (e) {
      console.warn("Failed to refresh profile:", e);
    }
  };

  const role = userProfile?.role || UserRole.CONSUMER;
  const isProfileComplete = Boolean(userProfile?.profileSetupComplete);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        role,
        isProfileComplete,
        signOutUser,
        deleteAccount,
        updateRole,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

