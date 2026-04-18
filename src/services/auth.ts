"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore, type AuthUser, type UserType } from "@/stores/authStore";

export function firebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

function toAuthUser(u: User, fallbackType: UserType = "GENERAL"): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    nickname: u.displayName,
    userType: fallbackType,
    photoURL: u.photoURL,
  };
}

async function exchangeSession(idToken: string): Promise<void> {
  await fetch("/api/v1/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

async function clearSession(): Promise<void> {
  await fetch("/api/v1/auth/session", { method: "DELETE" });
}

export async function loginWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  // Server cookie exchange is best-effort — UI works without it
  // (e.g. when Firebase Admin env vars aren't configured in dev).
  try {
    await exchangeSession(idToken);
  } catch {
    /* noop */
  }
  return cred.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  nickname: string,
) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (nickname && cred.user) {
    await updateProfile(cred.user, { displayName: nickname });
  }
  const idToken = await cred.user.getIdToken();
  try {
    await exchangeSession(idToken);
  } catch {
    /* noop */
  }
  return cred.user;
}

export async function signOut() {
  const auth = getFirebaseAuth();
  await fbSignOut(auth);
  try {
    await clearSession();
  } catch {
    /* noop */
  }
}

/**
 * Wires Firebase auth state → Zustand store. Call once at app root.
 * Returns an unsubscribe function.
 */
export function startAuthListener(): () => void {
  if (!firebaseConfigured()) {
    useAuthStore.getState().setLoading(false);
    return () => {};
  }
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (u) => {
    if (u) useAuthStore.getState().setUser(toAuthUser(u));
    else useAuthStore.getState().setUser(null);
  });
}
