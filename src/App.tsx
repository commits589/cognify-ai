import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, BookOpen, Layers, TrendingUp, Users, ShieldCheck,
  LogOut, Menu, GraduationCap, Wrench, Calendar,
  Settings as SettingsIcon, Accessibility, Sparkles, X,
} from "lucide-react";
import { useAuth } from "./auth";
import {
  getAppData, saveAppData, type AppDataBlob,
  listAllUsers, setUserRole, setUserVerifiedTeacher, updateUserProfile,
  listSchools, addSchool,
  getFeatureFlags, setFeatureFlags as persistFeatureFlags,
  listAnnouncements, postAnnouncement, setAnnouncementActive, deleteAnnouncement,
  listFeedback, submitFeedback, setFeedbackStatus,
  listModerationQueue, setModerationStatus,
  listClasses, createClass, updateClass, deleteClass,
  deleteAllUserData,
} from "./db";
import { C, GRADIENT, GLASS_BORDER, GLOW, todayKey, dayKey } from "./theme";
import { Btn, FeatureDisabledNotice } from "./ui";
import { FontImport, PageTransition, GlowBackground, A11yStyles, Logo } from "./chrome";
import { Splash, LoginScreen, SignupScreen, ForgotPasswordScreen, VerifyEmailScreen } from "./authScreens";
import { Dashboard, Tools } from "./dashboard";
import { Chat } from "./chat";
import { Quizzes } from "./quizzes";
import { Flashcards } from "./flashcards";
import { Progress } from "./progress";
import { Classes } from "./classes";
import { AdminPanel } from "./admin";
import { Profile } from "./profile";
import { AITools, MindMapGenerator } from "./aiTools";
import { HomeworkHelper } from "./homework";
import { VoiceLearning } from "./voice";
import { BoardExamMode } from "./exam";
import { TeacherDashboard, StudentPerformance } from "./teacher";
import { PrivacyPolicy, TermsAndConditions } from "./legal";
import { Settings } from "./settings";
import { LearningSupport } from "./support";
import { NotesGenerator } from "./notes";
import { Translate } from "./translate";

const EMPTY_APP_DATA: AppDataBlob = {
  sessions: [], quizzes: [], attempts: [], decks: [], savedNotes: [],
  progress: {}, xp: 0, streak: 0, lastActive: null, classes: [],
};

export default function App() {
  const { firebaseUser, profile, authLoading, firebaseConfigured, signUp, logIn, signInWithGoogle, sendReset, resendVerification, refreshVerification, logOut, refreshProfile } = useAuth();

  const [screen, setScreen] = useState("splash"); // splash | login | signup | forgot
  const [view, setView] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState(null);
  const [quizPreset, setQuizPreset] = useState(null);

  const [a11y, setA11yState] = useState({
    simplify: false, stepByStep: false, slowMode: false, visualMode: false,
    dyslexiaFont: false, fontScale: "md", highContrast: false, focusMode: false, simpleLanguage: false, audioExplanations: false,
  });
  function setA11y(patch) { setA11yState((prev) => ({ ...prev, ...patch })); }
  const [lang, setLangState] = useState({ name: "English", bilingual: false });
  function setLang(patch) { setLangState((prev) => ({ ...prev, ...patch })); }
  const [goals, setGoalsState] = useState({ dailyMinutes: 30, weeklyQuizzes: 3 });
  function setGoals(patch) { setGoalsState((prev) => ({ ...prev, ...patch })); }
  const [theme, setTheme] = useState("dark");
  const [notifPrefs, setNotifPrefsState] = useState({ dailyReminder: true, achievementAlerts: true, classAnnouncements: true, browserPush: false });
  function setNotifPrefs(patch) { setNotifPrefsState((prev) => ({ ...prev, ...patch })); }
  const [privacyPrefs, setPrivacyPrefsState] = useState({ profileVisibleToClass: true, shareProgressWithTeacher: true });
  function setPrivacyPrefs(patch) { setPrivacyPrefsState((prev) => ({ ...prev, ...patch })); }
  const [voiceRate, setVoiceRate] = useState(1);
  const [aiRequestCount, setAiRequestCount] = useState(0);

  // Shared/multi-user data (Firestore-backed, loaded once app data is ready)
  const [featureFlags, setFeatureFlagsState] = useState({ voiceLearning: true, boardExamMode: true, homeworkUploads: true, aiTools: true });
  const [announcements, setAnnouncements] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [schools, setSchoolsState] = useState([]);
  const [demoUsers, setDemoUsersState] = useState([]); // real users, loaded from Firestore (kept name for minimal diff vs original)

  // Per-user data blob (real Firestore persistence)
  const [appDataLoaded, setAppDataLoaded] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [decks, setDecks] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [progress, setProgress] = useState({});
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastActive, setLastActive] = useState(null);
  const [classes, setClasses] = useState([]);

  const user = profile; // { uid, displayName, email, role, ... } | null

  /* -------------------- load this user's data once signed in -------------------- */
  useEffect(() => {
    let cancelled = false;
    if (!user) { setAppDataLoaded(false); return; }
    (async () => {
      const data = await getAppData(user.uid).catch(() => EMPTY_APP_DATA);
      if (cancelled) return;
      setSessions(data.sessions || []);
      setQuizzes(data.quizzes || []);
      setAttempts(data.attempts || []);
      setDecks(data.decks || []);
      setSavedNotes(data.savedNotes || []);
      setProgress(data.progress || {});
      setXp(data.xp || 0);
      setStreak(data.streak || 0);
      setLastActive(data.lastActive || null);
      setAppDataLoaded(true);
      updateUserProfile(user.uid, { lastActiveAt: new Date().toISOString() }).catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  /* -------------------- debounced save of this user's data blob -------------------- */
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!user || !appDataLoaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAppData(user.uid, { sessions, quizzes, attempts, decks, savedNotes, progress, xp, streak, lastActive, classes: [] }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error("Failed to save progress:", e);
      });
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, quizzes, attempts, decks, savedNotes, progress, xp, streak, lastActive, user?.uid, appDataLoaded]);

  /* -------------------- load shared/admin data once signed in -------------------- */
  useEffect(() => {
    if (!user) return;
    getFeatureFlags().then(setFeatureFlagsState).catch(() => {});
    listAnnouncements().then((a) => { console.log("ANNOUNCEMENTS:", a); setAnnouncements(a); }).catch((e) => console.log("ANNOUNCEMENTS ERROR:", e));
    listClasses().then(setClasses).catch(() => {});
    if (user.role === "admin") {
      listAllUsers().then((users) => setDemoUsersState(users.filter((u) => u.id !== user.uid).map((u) => ({ ...u, uid: u.id, grade: u.gradeLevel })))).catch(() => {});
      listSchools().then((s) => setSchoolsState(s.map((x) => x.name))).catch(() => {});
      listFeedback().then(setFeedbackList).catch(() => {});
      listModerationQueue().then(setModerationQueue).catch(() => {});
    }
  }, [user?.uid, user?.role]);

  function logActivity({ minutes = 0, quizzesTaken = 0, cardsReviewed = 0, xpEarned = 0 }) {
    const today = todayKey();
    setProgress((prev) => {
      const cur = prev[today] || { minutes: 0, quizzes: 0, cards: 0, xp: 0 };
      return { ...prev, [today]: { minutes: cur.minutes + minutes, quizzes: cur.quizzes + quizzesTaken, cards: cur.cards + cardsReviewed, xp: cur.xp + xpEarned } };
    });
    setXp((x) => x + xpEarned);
    setStreak((s) => {
      if (lastActive === today) return s;
      const yesterday = dayKey(-1);
      const next = lastActive === yesterday ? s + 1 : 1;
      setLastActive(today);
      return next;
    });
    setAiRequestCount((c) => c + 1);
  }

  /* -------------------------------- real auth handlers -------------------------------- */
  async function handleSignedUp({ name, email, password, role, gradeLevel }) {
    const result = await signUp({ name, email, password, role, gradeLevel });
    if (result.ok) setScreen("verify");
    return result;
  }
  async function handleGoogleAuthLogin() {
    return signInWithGoogle("student");
  }
  async function handleGoogleAuthSignup(role) {
    return signInWithGoogle(role);
  }
  async function handleLoggedIn(email, password) {
    return logIn(email, password);
  }
  async function handleCheckVerified() {
    return refreshVerification();
  }
  async function handleSignOut() {
    await logOut();
    setScreen("splash");
    setView("dashboard");
  }
  function launchChat(seed) { setChatSeed(seed); setView("chat"); }
  function launchQuizCreate(preset) { setQuizPreset(preset); setView("quizzes"); }

  function clearAllData() {
    setSessions([]); setQuizzes([]); setAttempts([]); setDecks([]); setSavedNotes([]);
    setProgress({}); setXp(0); setStreak(0); setLastActive(null);
  }
  function deleteChatHistory() { setSessions([]); }
  function deleteSavedFiles() {
    setSessions((prev) => prev.map((s) => ({ ...s, messages: s.messages.map((m) => ({ ...m, attachments: undefined })) })));
  }
  async function deleteAccount() {
    if (user) await deleteAllUserData(user.uid).catch(() => {});
    clearAllData();
    await logOut();
    setScreen("splash");
  }

  /* -------------------------------- admin/shared setters w/ persistence -------------------------------- */
  function setDemoUsers(updater) {
    setDemoUsersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      for (const nu of next) {
        const pu = prev.find((p) => p.uid === nu.uid);
        if (!pu) continue;
        if (pu.role !== nu.role) setUserRole(nu.uid, nu.role).catch(() => {});
        if (pu.verified !== nu.verified) setUserVerifiedTeacher(nu.uid, !!nu.verified).catch(() => {});
      }
      return next;
    });
  }
  function setSchools(updater) {
    setSchoolsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const added = next.filter((n) => !prev.includes(n));
      added.forEach((name) => addSchool(name).catch(() => {}));
      return next;
    });
  }
  function setFeatureFlags(patch) {
    setFeatureFlagsState((prev) => {
      const next = { ...prev, ...patch };
      persistFeatureFlags(next).catch(() => {});
      return next;
    });
  }
  function addAnnouncementLocal(text) {
    if (!user) return;
    postAnnouncement(text, user.displayName).then((id) => {
      setAnnouncements((prev) => [{ id, text, author: user.displayName, active: true, createdAt: Date.now() }, ...prev]);
    }).catch(() => {});
  }
  function setAnnouncementsWrapped(updater) {
    setAnnouncements((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Diff active toggles / additions handled inline by callers where possible;
      // fall back to syncing active flags for existing items.
      for (const na of next) {
        const pa = prev.find((p) => p.id === na.id);
        if (pa && pa.active !== na.active) setAnnouncementActive(na.id, na.active).catch(() => {});
      }
      const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
      removed.forEach((r) => deleteAnnouncement(r.id).catch(() => {}));
      return next;
    });
  }
  function setFeedbackListWrapped(updater) {
    setFeedbackList((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      for (const nf of next) {
        const pf = prev.find((p) => p.id === nf.id);
        if (pf && pf.status !== nf.status) setFeedbackStatus(nf.id, nf.status).catch(() => {});
        if (!pf && nf.id?.startsWith("fb_")) submitFeedback(user?.uid || "", nf.from, nf.text).catch(() => {});
      }
      return next;
    });
  }
  function setModerationQueueWrapped(updater) {
    setModerationQueue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      for (const nm of next) {
        const pm = prev.find((p) => p.id === nm.id);
        if (pm && pm.status !== nm.status) setModerationStatus(nm.id, nm.status).catch(() => {});
      }
      return next;
    });
  }

  function setClassesWrapped(updater) {
    setClasses((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const added = next.filter((n) => !prev.some((p) => p.id === n.id));
      added.forEach((a) => {
        const { id, ...data } = a;
        createClass(data).then((realId) => {
          setClasses((cur) => cur.map((c) => (c.id === a.id ? { ...c, id: realId } : c)));
        }).catch(() => {});
      });
      for (const n of next) {
        const p = prev.find((x) => x.id === n.id);
        if (p && added.every((a) => a.id !== n.id) && JSON.stringify(p) !== JSON.stringify(n)) {
          const { id, ...data } = n;
          updateClass(n.id, data).catch(() => {});
        }
      }
      const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
      removed.forEach((r) => deleteClass(r.id).catch(() => {}));
      return next;
    });
  }

  async function handleUpdateProfile(patch) {
    if (!user) return;
    const { uid, email, emailVerified, ...fields } = patch;
    await updateUserProfile(user.uid, fields).catch(() => {});
    await refreshProfile();
  }

  /* -------------------------------- auth screens -------------------------------- */
  if (!firebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: C.paper, fontFamily: "Inter, sans-serif" }}>
        <FontImport />
        <div className="max-w-md">
          <h1 className="text-xl mb-3" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Firebase isn't configured yet</h1>
          <p className="text-sm" style={{ color: C.slate }}>
            Copy <code>.env.example</code> to <code>.env</code>, fill in your Firebase project's web config, and restart the dev server (or set the same variables in your Netlify site settings). See README.md for step-by-step setup.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper }}>
        <FontImport />
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `3px solid ${GLASS_BORDER}`, borderTopColor: C.chalkLight }} />
      </div>
    );
  }

  if (!user) {
    // Signed in with Firebase but email not verified yet → show verify screen.
    if (firebaseUser && !firebaseUser.emailVerified && screen !== "login" && screen !== "forgot") {
      return <PageTransition transitionKey="verify" className="cognify-screen-transition">
        <VerifyEmailScreen email={firebaseUser.email} onCheckVerified={handleCheckVerified} onResend={resendVerification} onBack={handleSignOut} />
      </PageTransition>;
    }
    // Signed in + verified, but their Firestore profile hasn't loaded yet.
    if (firebaseUser && firebaseUser.emailVerified) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper }}>
          <FontImport />
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `3px solid ${GLASS_BORDER}`, borderTopColor: C.chalkLight }} />
        </div>
      );
    }
    let authScreen = null;
    if (screen === "splash") authScreen = <Splash onGetStarted={() => setScreen("signup")} onLogin={() => setScreen("login")} />;
    else if (screen === "login") authScreen = <LoginScreen onLoggedIn={handleLoggedIn} onGoogle={handleGoogleAuthLogin} onForgot={() => setScreen("forgot")} onSwitchToSignup={() => setScreen("signup")} onBack={() => setScreen("splash")} />;
    else if (screen === "signup") authScreen = <SignupScreen onSignedUp={handleSignedUp} onGoogle={handleGoogleAuthSignup} onSwitchToLogin={() => setScreen("login")} onBack={() => setScreen("splash")} />;
    else if (screen === "forgot") authScreen = <ForgotPasswordScreen onSendReset={sendReset} onBackToLogin={() => setScreen("login")} />;
    if (authScreen) return <PageTransition transitionKey={screen} className="cognify-screen-transition">{authScreen}</PageTransition>;
  }

  if (user && !appDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper }}>
        <FontImport />
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `3px solid ${GLASS_BORDER}`, borderTopColor: C.chalkLight }} />
      </div>
    );
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "chat", label: "AI Tutor", icon: MessageSquare },
    { key: "quizzes", label: "Quizzes", icon: BookOpen },
    { key: "flashcards", label: "Flashcards", icon: Layers },
    { key: "progress", label: "Progress", icon: TrendingUp },
    { key: "classes", label: "Classes", icon: Users },
    ...(featureFlags.aiTools ? [{ key: "ai-tools", label: "AI Tools", icon: Wrench }] : []),
    ...(featureFlags.boardExamMode ? [{ key: "exam-mode", label: "Board Exam Mode", icon: Calendar }] : []),
    { key: "settings", label: "Settings", icon: SettingsIcon },
    { key: "support", label: "Learning Support", icon: Accessibility },
  ];
  if (user.role === "teacher") navItems.push({ key: "teacher-dashboard", label: "Teacher Dashboard", icon: GraduationCap });
  if (user.role === "admin") navItems.push({ key: "admin", label: "Admin", icon: ShieldCheck });

  if (a11y.focusMode) {
    return (
      <div className={`min-h-screen relative cognify-app-root ${a11y.highContrast ? "cognify-high-contrast" : ""} ${theme === "light" ? "cognify-light-mode" : ""}`} style={{ background: C.paper, fontFamily: "Inter, sans-serif" }}>
        <FontImport />
        <A11yStyles a11y={a11y} theme={theme} />
        <a href="#main-content" className="cognify-skip-link">Skip to main content</a>
        {theme === "dark" && !a11y.highContrast && <GlowBackground />}
        <div className="fixed top-4 left-4 z-30">
          <Btn size="sm" variant="secondary" onClick={() => setA11y({ focusMode: false })}><X size={13} /> Exit focus mode</Btn>
        </div>
        <main id="main-content" className="relative pt-16 pb-6" style={{ zIndex: 1 }}>
          <PageTransition transitionKey={view}>
            {view === "dashboard" && <Dashboard user={user} sessions={sessions} attempts={attempts} quizzes={quizzes} progress={progress} xp={xp} streak={streak} classes={classes} demoUsers={demoUsers} setView={setView} launchChat={launchChat} launchQuizCreate={launchQuizCreate} goals={goals} announcements={announcements} />}
            {view === "chat" && <Chat sessions={sessions} setSessions={setSessions} logActivity={logActivity} seed={chatSeed} onConsumeSeed={() => setChatSeed(null)} user={user} a11y={a11y} lang={lang} />}
            {view !== "dashboard" && view !== "chat" && (
              <div className="px-6 py-16 text-center">
                <p className="text-sm mb-4" style={{ color: C.slate }}>This page isn't available in Focus Mode — exit to access the full app.</p>
                <Btn variant="secondary" onClick={() => setA11y({ focusMode: false })}>Exit focus mode</Btn>
              </div>
            )}
          </PageTransition>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex relative cognify-app-root ${a11y.highContrast ? "cognify-high-contrast" : ""} ${theme === "light" ? "cognify-light-mode" : ""}`} style={{ background: C.paper, fontFamily: "Inter, sans-serif" }}>
      <FontImport />
      <A11yStyles a11y={a11y} theme={theme} />
      <a href="#main-content" className="cognify-skip-link">Skip to main content</a>
      {theme === "dark" && !a11y.highContrast && <GlowBackground />}
      {/* desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col p-5 relative backdrop-blur-xl" style={{ zIndex: 1, borderRight: `1px solid ${GLASS_BORDER}`, background: "rgba(18,20,42,0.55)" }}>
        <Logo />
        <nav className="flex-1 flex flex-col gap-1 mt-8" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={view === item.key ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { color: C.inkSoft }}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${GLASS_BORDER}` }}>
          <button onClick={() => setView("profile")} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold" style={{ backgroundImage: GRADIENT, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
              {(user.displayName || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: C.ink }}>{user.displayName}</p>
              <p className="text-xs capitalize" style={{ color: C.slate }}>{user.role}</p>
            </div>
          </button>
          <button onClick={handleSignOut} className="w-full text-left mt-2 px-3.5 py-2 text-sm rounded-lg flex items-center gap-2" style={{ color: C.flag }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 backdrop-blur-xl" style={{ background: "rgba(10,11,24,0.85)", borderBottom: `1px solid ${GLASS_BORDER}` }}>
        <Logo size={22} />
        <button onClick={() => setMobileNavOpen((v) => !v)} aria-label={mobileNavOpen ? "Close menu" : "Open menu"} aria-expanded={mobileNavOpen} className="p-2 rounded-lg"><Menu size={20} color={C.ink} /></button>
      </div>
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-20 cognify-overlay-fade" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileNavOpen(false)}>
          <div className="absolute top-14 inset-x-0 rounded-b-2xl p-4 backdrop-blur-xl cognify-slide-down-fade" style={{ background: "rgba(18,20,42,0.92)", borderBottom: `1px solid ${GLASS_BORDER}` }} onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setView(item.key); setMobileNavOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-left"
                style={view === item.key ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { color: C.inkSoft }}
              >
                <item.icon size={17} /> {item.label}
              </button>
            ))}
            <button onClick={handleSignOut} className="w-full text-left mt-2 px-3.5 py-2 text-sm rounded-lg flex items-center gap-2" style={{ color: C.flag }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0 relative" style={{ zIndex: 1 }}>
        <PageTransition transitionKey={view}>
          {view === "dashboard" && <Dashboard user={user} sessions={sessions} attempts={attempts} quizzes={quizzes} progress={progress} xp={xp} streak={streak} classes={classes} demoUsers={demoUsers} setView={setView} launchChat={launchChat} launchQuizCreate={launchQuizCreate} goals={goals} announcements={announcements} />}
          {view === "chat" && <Chat sessions={sessions} setSessions={setSessions} logActivity={logActivity} seed={chatSeed} onConsumeSeed={() => setChatSeed(null)} user={user} a11y={a11y} lang={lang} />}
          {view === "quizzes" && <Quizzes quizzes={quizzes} setQuizzes={setQuizzes} attempts={attempts} setAttempts={setAttempts} user={user} classes={classes} logActivity={logActivity} preset={quizPreset} onConsumePreset={() => setQuizPreset(null)} />}
          {view === "flashcards" && <Flashcards decks={decks} setDecks={setDecks} logActivity={logActivity} />}
          {view === "progress" && <Progress progress={progress} attempts={attempts} sessions={sessions} xp={xp} streak={streak} goals={goals} setGoals={setGoals} />}
          {view === "classes" && <Classes user={user} classes={classes} setClasses={setClassesWrapped} />}
          {view === "admin" && user.role === "admin" && (
            <AdminPanel
              user={user} demoUsers={demoUsers} setDemoUsers={setDemoUsers}
              schools={schools} setSchools={setSchools}
              featureFlags={featureFlags} setFeatureFlags={setFeatureFlags}
              announcements={announcements} setAnnouncements={setAnnouncementsWrapped}
              feedbackList={feedbackList} setFeedbackList={setFeedbackListWrapped}
              moderationQueue={moderationQueue} setModerationQueue={setModerationQueueWrapped}
              aiRequestCount={aiRequestCount} progress={progress}
            />
          )}
          {view === "profile" && <Profile user={user} setUser={handleUpdateProfile} lang={lang} setLang={setLang} />}
          {view === "ai-tools" && (featureFlags.aiTools ? <AITools setView={setView} logActivity={logActivity} /> : <FeatureDisabledNotice feature="AI Tools" setView={setView} />)}
          {view === "homework" && <HomeworkHelper user={user} logActivity={logActivity} allowUploads={featureFlags.homeworkUploads} />}
          {view === "mindmap-tool" && <MindMapGenerator logActivity={logActivity} />}
          {view === "voice" && (featureFlags.voiceLearning ? <VoiceLearning logActivity={logActivity} savedNotes={savedNotes} setSavedNotes={setSavedNotes} /> : <FeatureDisabledNotice feature="Voice Learning" setView={setView} />)}
          {view === "exam-mode" && (featureFlags.boardExamMode ? <BoardExamMode user={user} logActivity={logActivity} setQuizzes={setQuizzes} setView={setView} /> : <FeatureDisabledNotice feature="Board Exam Mode" setView={setView} />)}
          {view === "teacher-dashboard" && user.role === "teacher" && <TeacherDashboard setView={setView} logActivity={logActivity} classes={classes} announcements={announcements} />}
          {view === "student-performance" && <StudentPerformance classes={classes} user={user} />}
          {view === "privacy" && (
            <PrivacyPolicy
              user={user}
              appData={{ sessions, quizzes, attempts, decks, savedNotes, progress, xp, streak, goals }}
              onDeleteAccount={deleteAccount} onDeleteChatHistory={deleteChatHistory} onDeleteSavedFiles={deleteSavedFiles}
              setView={setView}
            />
          )}
          {view === "terms" && <TermsAndConditions setView={setView} />}
          {view === "settings" && (
            <Settings
              user={user} theme={theme} setTheme={setTheme} a11y={a11y} setA11y={setA11y} lang={lang} setLang={setLang}
              notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs} privacyPrefs={privacyPrefs} setPrivacyPrefs={setPrivacyPrefs}
              voiceRate={voiceRate} setVoiceRate={setVoiceRate}
              appData={{ sessions, quizzes, attempts, decks, savedNotes, progress, xp, streak, goals }}
              onClearData={clearAllData} setView={setView} onSignOut={handleSignOut}
              onSubmitFeedback={(text) => addFeedback(text)}
            />
          )}
          {view === "support" && <LearningSupport a11y={a11y} setA11y={setA11y} launchChat={launchChat} lang={lang} setLang={setLang} />}
          {view === "tools" && <Tools launchChat={launchChat} launchQuizCreate={launchQuizCreate} setView={setView} />}
          {view === "notes" && <NotesGenerator logActivity={logActivity} savedNotes={savedNotes} setSavedNotes={setSavedNotes} />}
          {view === "translate" && <Translate logActivity={logActivity} />}
        </PageTransition>
      </main>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch backdrop-blur-xl" style={{ background: "rgba(10,11,24,0.9)", borderTop: `1px solid ${GLASS_BORDER}` }}>
        {[
          { key: "dashboard", label: "Home", icon: TrendingUp },
          { key: "chat", label: "Chat", icon: MessageSquare },
          { key: "tools", label: "Tools", icon: Sparkles },
          { key: "progress", label: "Progress", icon: Layers },
          { key: "profile", label: "Profile", icon: Users },
        ].map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              style={{ color: active ? C.chalkLight : C.slate }}
            >
              <item.icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  function addFeedback(text) {
    if (!user) return;
    submitFeedback(user.uid, user.displayName, text).then((id) => {
      setFeedbackList((prev) => [{ id, from: user.displayName, text, status: "new", createdAt: Date.now() }, ...prev]);
    }).catch(() => {});
  }
}
