// src/auth.tsx
//
// Real Firebase Authentication, replacing the original app's simulated
// accounts array (see the old "Simulates Firebase createUserWithEmailAndPassword"
// comment). Every function here talks to the real Firebase Auth SDK. Errors
// are returned as { ok, error } instead of thrown, so screens can show a
// friendly message inline the same way the original UI did.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile as fbUpdateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, firebaseConfigured } from "./firebase";
import { getUserProfile, createUserProfile, type UserProfile } from "./db";

export type AppUser = UserProfile & { uid: string; email: string; emailVerified: boolean };

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: AppUser | null;
  authLoading: boolean;
  firebaseConfigured: boolean;
  signUp: (opts: {
    name: string;
    email: string;
    password: string;
    role: string;
    gradeLevel?: string;
  }) => Promise<AuthResult>;
  logIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (role: string) => Promise<AuthResult>;
  sendReset: (email: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
  refreshVerification: () => Promise<boolean>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with that email already exists — try logging in instead.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with that email — try signing up instead.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
  };
  return map[code] || (err as Error)?.message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function loadProfile(fu: FirebaseUser) {
    const p = await getUserProfile(fu.uid);
    if (p) {
      setProfile({ ...p, uid: fu.uid, email: fu.email || p.email, emailVerified: fu.emailVerified });
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fu) => {
      setFirebaseUser(fu);
      if (fu) {
        await loadProfile(fu);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function signUp({ name, email, password, role, gradeLevel }: {
    name: string; email: string; password: string; role: string; gradeLevel?: string;
  }): Promise<AuthResult> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await fbUpdateProfile(cred.user, { displayName: name.trim() });
      await createUserProfile(cred.user.uid, {
        displayName: name.trim(),
        email: email.trim(),
        role,
        gradeLevel: gradeLevel || "",
        school: "",
        board: "CBSE",
        subjects: [],
        lang: "English",
        learningStyle: "Mixed",
      });
      await sendEmailVerification(cred.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  }

  async function logIn(email: string, password: string): Promise<AuthResult> {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  }

  async function signInWithGoogle(role: string): Promise<AuthResult> {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUserProfile(cred.user.uid);
      if (!existing) {
        await createUserProfile(cred.user.uid, {
          displayName: cred.user.displayName || "Student",
          email: cred.user.email || "",
          role,
          gradeLevel: "",
          school: "",
          board: "CBSE",
          subjects: [],
          lang: "English",
          learningStyle: "Mixed",
        });
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  }

  async function sendReset(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  }

  async function resendVerification(): Promise<AuthResult> {
    try {
      if (!auth.currentUser) return { ok: false, error: "Not signed in." };
      await sendEmailVerification(auth.currentUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  }

  async function refreshVerification(): Promise<boolean> {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    setFirebaseUser(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await loadProfile(auth.currentUser);
    }
    return auth.currentUser.emailVerified;
  }

  async function logOut() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (firebaseUser) await loadProfile(firebaseUser);
  }

  const value: AuthContextValue = {
    firebaseUser, profile, authLoading, firebaseConfigured,
    signUp, logIn, signInWithGoogle, sendReset, resendVerification,
    refreshVerification, logOut, refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
