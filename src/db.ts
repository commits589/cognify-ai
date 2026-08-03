// src/db.ts
//
// Firestore data-access layer. The original app kept everything — chat
// sessions, quizzes, attempts, flashcard decks, notes, progress, classes,
// the admin user list, announcements, feedback, the moderation queue — in
// plain React useState with nothing written to a database. Every function
// below replaces one of those in-memory arrays with a real Firestore
// collection so data survives refreshes and is shared where it should be
// (e.g. a teacher's class roster, admin-visible user list).
//
// Data shape:
//   users/{uid}                      → profile doc
//   users/{uid}/sessions/{id}        → chat sessions
//   users/{uid}/quizzes/{id}         → saved quizzes
//   users/{uid}/attempts/{id}        → quiz attempts
//   users/{uid}/decks/{id}           → flashcard decks
//   users/{uid}/notes/{id}           → saved notes
//   users/{uid}/progress/{dateKey}   → { minutes, quizzes, cards, xp }
//   users/{uid}/meta/stats           → { xp, streak, lastActive }
//   classes/{id}                     → { name, teacherUid, subject, studentUids }
//   schools/{id}                     → { name }
//   announcements/{id}               → { text, author, active, createdAt }
//   feedback/{id}                    → { fromUid, from, text, status, createdAt }
//   moderationQueue/{id}             → { author, type, excerpt, status }
//   settings/featureFlags            → { voiceLearning, boardExamMode, homeworkUploads, aiTools }

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit as fsLimit, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  displayName: string;
  email: string;
  role: string; // "student" | "teacher" | "admin"
  gradeLevel?: string;
  school?: string;
  board?: string;
  subjects?: string[];
  lang?: string;
  learningStyle?: string;
  photoURL?: string;
  createdAt?: unknown;
  lastActiveAt?: unknown;
  teacherVerified?: boolean;
}

/* ------------------------------- profile ------------------------------- */

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(uid: string, profile: UserProfile) {
  await setDoc(doc(db, "users", uid), { ...profile, createdAt: serverTimestamp() });
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>) {
  await updateDoc(doc(db, "users", uid), patch as Record<string, unknown>);
}

/* --------------------------- generic subcollection helpers -------------- */

async function listSub<T>(uid: string, sub: string): Promise<(T & { id: string })[]> {
  const snap = await getDocs(collection(db, "users", uid, sub));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}
async function addSub<T extends object>(uid: string, sub: string, data: T) {
  const ref = await addDoc(collection(db, "users", uid, sub), data as Record<string, unknown>);
  return ref.id;
}
async function setSub<T extends object>(uid: string, sub: string, id: string, data: T) {
  await setDoc(doc(db, "users", uid, sub, id), data as Record<string, unknown>, { merge: true });
}
async function deleteSub(uid: string, sub: string, id: string) {
  await deleteDoc(doc(db, "users", uid, sub, id));
}
async function clearSub(uid: string, sub: string) {
  const snap = await getDocs(collection(db, "users", uid, sub));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/* Chat sessions */
export const listSessions = (uid: string) => listSub(uid, "sessions");
export const saveSession = (uid: string, id: string, data: object) => setSub(uid, "sessions", id, data);
export const deleteSession = (uid: string, id: string) => deleteSub(uid, "sessions", id);
export const clearSessions = (uid: string) => clearSub(uid, "sessions");

/* Quizzes */
export const listQuizzes = (uid: string) => listSub(uid, "quizzes");
export const saveQuiz = (uid: string, id: string, data: object) => setSub(uid, "quizzes", id, data);
export const deleteQuiz = (uid: string, id: string) => deleteSub(uid, "quizzes", id);

/* Quiz attempts */
export const listAttempts = (uid: string) => listSub(uid, "attempts");
export const addAttempt = (uid: string, data: object) => addSub(uid, "attempts", data);

/* Flashcard decks */
export const listDecks = (uid: string) => listSub(uid, "decks");
export const saveDeck = (uid: string, id: string, data: object) => setSub(uid, "decks", id, data);
export const deleteDeck = (uid: string, id: string) => deleteSub(uid, "decks", id);

/* Saved notes */
export const listNotes = (uid: string) => listSub(uid, "notes");
export const saveNote = (uid: string, id: string, data: object) => setSub(uid, "notes", id, data);
export const deleteNote = (uid: string, id: string) => deleteSub(uid, "notes", id);

/* Daily progress (keyed by yyyy-mm-dd) */
export async function getProgress(uid: string): Promise<Record<string, { minutes: number; quizzes: number; cards: number; xp: number }>> {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  const out: Record<string, { minutes: number; quizzes: number; cards: number; xp: number }> = {};
  snap.docs.forEach((d) => { out[d.id] = d.data() as { minutes: number; quizzes: number; cards: number; xp: number }; });
  return out;
}
export async function bumpProgress(uid: string, dateKey: string, delta: { minutes?: number; quizzes?: number; cards?: number; xp?: number }) {
  const ref = doc(db, "users", uid, "progress", dateKey);
  const snap = await getDoc(ref);
  const cur = snap.exists() ? (snap.data() as { minutes: number; quizzes: number; cards: number; xp: number }) : { minutes: 0, quizzes: 0, cards: 0, xp: 0 };
  await setDoc(ref, {
    minutes: cur.minutes + (delta.minutes || 0),
    quizzes: cur.quizzes + (delta.quizzes || 0),
    cards: cur.cards + (delta.cards || 0),
    xp: cur.xp + (delta.xp || 0),
  });
}

/* xp / streak / lastActive */
export interface UserStats { xp: number; streak: number; lastActive: string | null; aiRequestCount: number }
export async function getStats(uid: string): Promise<UserStats> {
  const snap = await getDoc(doc(db, "users", uid, "meta", "stats"));
  return snap.exists() ? (snap.data() as UserStats) : { xp: 0, streak: 0, lastActive: null, aiRequestCount: 0 };
}
export async function setStats(uid: string, stats: UserStats) {
  await setDoc(doc(db, "users", uid, "meta", "stats"), stats);
}

/* ------------------------------- classes --------------------------------- */
export async function listClasses(): Promise<any[]> {
  const snap = await getDocs(collection(db, "classes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function createClass(data: object) {
  return (await addDoc(collection(db, "classes"), data)).id;
}
export async function updateClass(id: string, patch: object) {
  await updateDoc(doc(db, "classes", id), patch as Record<string, unknown>);
}
export async function deleteClass(id: string) {
  await deleteDoc(doc(db, "classes", id));
}

/* ------------------------------- schools ---------------------------------- */
export async function listSchools(): Promise<{ id: string; name: string }[]> {
  const snap = await getDocs(collection(db, "schools"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as { name: string }) }));
}
export async function addSchool(name: string) {
  return (await addDoc(collection(db, "schools"), { name })).id;
}

/* ---------------------------- announcements -------------------------------- */
export async function listAnnouncements(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc"), fsLimit(50)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function postAnnouncement(text: string, author: string) {
  return (await addDoc(collection(db, "announcements"), { text, author, active: true, createdAt: serverTimestamp() })).id;
}
export async function setAnnouncementActive(id: string, active: boolean) {
  await updateDoc(doc(db, "announcements", id), { active });
}
export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, "announcements", id));
}

/* ------------------------------- feedback ---------------------------------- */
export async function listFeedback(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "feedback"), orderBy("createdAt", "desc"), fsLimit(100)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function submitFeedback(fromUid: string, from: string, text: string) {
  return (await addDoc(collection(db, "feedback"), { fromUid, from, text, status: "new", createdAt: serverTimestamp() })).id;
}
export async function setFeedbackStatus(id: string, status: string) {
  await updateDoc(doc(db, "feedback", id), { status });
}

/* --------------------------- moderation queue ------------------------------- */
export async function listModerationQueue(): Promise<any[]> {
  const snap = await getDocs(collection(db, "moderationQueue"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function setModerationStatus(id: string, status: string) {
  await updateDoc(doc(db, "moderationQueue", id), { status });
}

/* ------------------------------ feature flags -------------------------------- */
const DEFAULT_FLAGS = { voiceLearning: true, boardExamMode: true, homeworkUploads: true, aiTools: true };
export async function getFeatureFlags(): Promise<typeof DEFAULT_FLAGS> {
  const snap = await getDoc(doc(db, "settings", "featureFlags"));
  return snap.exists() ? { ...DEFAULT_FLAGS, ...(snap.data() as object) } : DEFAULT_FLAGS;
}
export async function setFeatureFlags(flags: Partial<typeof DEFAULT_FLAGS>) {
  await setDoc(doc(db, "settings", "featureFlags"), flags, { merge: true });
}

/* ------------------------------ aggregated app data --------------------------- */
// The original app kept sessions/quizzes/attempts/decks/notes/progress/xp/streak
// as plain React state with no persistence at all. Rather than rewire every
// child component to call per-item Firestore writes (a much larger surface-area
// change), App.tsx loads this single blob on sign-in and saves it back
// (debounced) whenever it changes — same component props/behavior as before,
// but now durable. The granular helpers above remain available for anything
// that should be item-level instead (and are used by shared/multi-user data:
// classes, schools, announcements, feedback, moderation, feature flags).
export interface AppDataBlob {
  sessions: any[];
  quizzes: any[];
  attempts: any[];
  decks: any[];
  savedNotes: any[];
  progress: Record<string, { minutes: number; quizzes: number; cards: number; xp: number }>;
  xp: number;
  streak: number;
  lastActive: string | null;
  classes: any[];
}
const EMPTY_APP_DATA: AppDataBlob = {
  sessions: [], quizzes: [], attempts: [], decks: [], savedNotes: [],
  progress: {}, xp: 0, streak: 0, lastActive: null, classes: [],
};
export async function getAppData(uid: string): Promise<AppDataBlob> {
  const snap = await getDoc(doc(db, "users", uid, "appData", "main"));
  return snap.exists() ? { ...EMPTY_APP_DATA, ...(snap.data() as object) } : EMPTY_APP_DATA;
}
export async function saveAppData(uid: string, data: AppDataBlob): Promise<void> {
  await setDoc(doc(db, "users", uid, "appData", "main"), data);
}


// Requires the caller's own user doc to have role "admin" — enforced by
// firestore.rules, not just hidden in the UI.
export async function listAllUsers(): Promise<(UserProfile & { id: string })[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserProfile) }));
}
export async function setUserRole(uid: string, role: string) {
  await updateDoc(doc(db, "users", uid), { role });
}
export async function setUserVerifiedTeacher(uid: string, verified: boolean) {
  await updateDoc(doc(db, "users", uid), { teacherVerified: verified });
}

/* ------------------------------ account deletion helpers ---------------------- */
export async function deleteAllUserData(uid: string) {
  for (const sub of ["sessions", "quizzes", "attempts", "decks", "notes", "progress"]) {
    await clearSub(uid, sub);
  }
}
