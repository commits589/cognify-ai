import { useState, useEffect } from "react";
import { MessageSquare, BookOpen, Mic, Sparkles, Megaphone } from "lucide-react";
import { useSpeechRecognition } from "./hooks";
import { C, FEATURE_CARDS, GLASS_BG, GLASS_BORDER, subjectColor, todayKey } from "./theme";
import { Btn, Card, Empty, PageHeader, Pill, StatCard } from "./ui";

export function FeatureCardGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {FEATURE_CARDS.map((f) => (
        <button key={f.key} onClick={() => onSelect(f.key)} className="text-left group">
          <Card className="p-4 h-full transition-all hover:-translate-y-0.5 hover:brightness-110" style={{ boxShadow: "0 4px 20px -8px rgba(0,0,0,0.4)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
              <f.icon size={17} color={f.color} />
            </div>
            <p className="text-sm font-medium mb-0.5" style={{ color: C.ink }}>{f.title}</p>
            <p className="text-xs leading-snug" style={{ color: C.slate }}>{f.desc}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}

export function SearchBar({ onAsk }) {
  const [q, setQ] = useState("");
  const speech = useSpeechRecognition();
  useEffect(() => { if (speech.transcript) setQ(speech.transcript); }, [speech.transcript]);

  function submit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    onAsk(q.trim());
    setQ("");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 w-full">
      <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-3 backdrop-blur-xl" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
        <Sparkles size={16} color={C.chalkLight} className="shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Cognify AI anything…"
          aria-label="Ask Cognify AI anything"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: C.ink }}
        />
      </div>
      {speech.supported && (
        <button type="button" onClick={speech.listening ? speech.stop : speech.start}
          aria-label={speech.listening ? "Stop voice input" : "Start voice input"} aria-pressed={speech.listening}
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all"
          style={speech.listening ? { background: C.flag, color: "#fff" } : { border: `1px solid ${GLASS_BORDER}`, color: C.ink, background: GLASS_BG }}>
          <Mic size={16} />
        </button>
      )}
      <Btn type="submit" className="shrink-0 hidden sm:inline-flex">Ask</Btn>
    </form>
  );
}

export function AnnouncementBanner({ announcements }) {
  const active = (announcements || []).filter((a) => a.active);
  if (active.length === 0) return null;
  return (
    <div className="mb-5 space-y-2">
      {active.map((a) => (
        <div key={a.id} className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
          <Megaphone size={15} color={C.chalkLight} className="shrink-0" />
          <p className="text-sm" style={{ color: C.ink }}>{a.text}</p>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ user, sessions, attempts, quizzes, progress, xp, streak, classes, demoUsers, setView, launchChat, launchQuizCreate, goals, announcements }) {
  const weekMinutes = Object.values(progress).reduce((a, p) => a + p.minutes, 0);
  const avgScore = attempts.length ? Math.round(attempts.reduce((a, x) => a + x.score, 0) / attempts.length) : null;

  if (user.role === "admin") {
    const students = demoUsers.filter((u) => u.role === "student").length;
    const teachers = demoUsers.filter((u) => u.role === "teacher").length;
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
        <PageHeader title={`Welcome back, ${user.displayName.split(" ")[0]}`} subtitle="School-wide overview." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total users" value={demoUsers.length + 1} />
          <StatCard label="Students" value={students} />
          <StatCard label="Teachers" value={teachers} />
          <StatCard label="Admins" value={1} />
        </div>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>User management</h2>
            <Btn size="sm" onClick={() => setView("admin")}>Open admin panel</Btn>
          </div>
          <p className="text-sm" style={{ color: C.slate }}>Manage roles and review accounts from the admin panel.</p>
        </Card>
      </div>
    );
  }

  if (user.role === "teacher") {
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
        <AnnouncementBanner announcements={announcements} />
        <PageHeader title={`Welcome back, ${user.displayName.split(" ")[0]}`} subtitle="Your classes at a glance." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Classes" value={classes.length} />
          <StatCard label="Students" value={new Set(classes.flatMap((c) => c.studentNames)).size} />
        </div>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>Your classes</h2>
            <Btn size="sm" onClick={() => setView("classes")}>Manage classes</Btn>
          </div>
          {classes.length === 0 ? (
            <Empty title="No classes yet" description="Create your first class to get a join code for students." action={<Btn size="sm" variant="secondary" onClick={() => setView("classes")}>Create a class</Btn>} />
          ) : (
            <ul className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>{c.name}</p>
                    <p className="text-xs" style={{ color: C.slate }}>{c.subject} · {c.studentNames.length} students · code {c.joinCode}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // --- student home dashboard ---
  function handleCardSelect(key) {
    if (key === "ask-ai") return launchChat({ subject: "General", message: "" });
    if (key === "homework") return setView("homework");
    if (key === "explain") return launchChat({ subject: "General", message: "Can you explain this concept step by step: " });
    if (key === "quiz-gen") return launchQuizCreate({ difficulty: "medium", count: 5 });
    if (key === "notes") return setView("notes");
    if (key === "translate") return setView("translate");
    if (key === "voice") return setView("voice");
    if (key === "exam") return setView("exam-mode");
  }

  const today = progress[todayKey()] || { minutes: 0, xp: 0 };
  const dailyGoalMin = goals?.dailyMinutes || 30;
  const subjectsStudied = new Set([...sessions.map((s) => s.subject), ...attempts.map((a) => a.subject).filter(Boolean)]);
  const questionsSolved = attempts.reduce((a, x) => a + x.totalCount, 0);
  const upcomingTasks = quizzes.filter((q) => q.classId && !attempts.some((a) => a.quizId === q.id));

  const activity = [
    ...sessions.map((s) => ({ id: s.id, type: "chat", ts: Number(s.id.split("_")[1]) || 0, title: s.title || "New chat", subject: s.subject })),
    ...attempts.map((a) => ({ id: a.id, type: "quiz", ts: Number(a.id.split("_")[1]) || 0, title: a.quizTitle, score: a.score, subject: a.subject })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 6);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <AnnouncementBanner announcements={announcements} />
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: C.ink }}>
          Hello, {user.displayName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm sm:text-base" style={{ color: C.slate }}>What would you like to learn today?</p>
      </div>

      <div className="mb-8"><SearchBar onAsk={(q) => launchChat({ subject: "General", message: q, autoSend: true })} /></div>

      <h2 className="text-sm font-medium mb-3" style={{ color: C.inkSoft }}>Quick tools</h2>
      <div className="mb-8"><FeatureCardGrid onSelect={handleCardSelect} /></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Daily streak" value={`${streak} 🔥`} />
        <StatCard label="Today's progress" value={`${today.minutes}/${dailyGoalMin} min`} />
        <StatCard label="Subjects studied" value={subjectsStudied.size} />
        <StatCard label="Questions solved" value={questionsSolved} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>Upcoming tasks</h2>
            <button onClick={() => setView("quizzes")} className="text-xs hover:underline" style={{ color: C.inkSoft }}>All quizzes →</button>
          </div>
          {upcomingTasks.length === 0 ? (
            <Empty title="" description="No assigned quizzes waiting on you right now." />
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.slice(0, 5).map((q) => (
                <li key={q.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg" style={{ color: C.ink, background: "rgba(255,255,255,0.03)" }}>
                  <span className="truncate">{q.title}</span>
                  <Pill color={subjectColor(q.subject)}>{q.subject}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>Recent activity</h2>
            <span className="text-xs" style={{ color: C.slateLight }}>Avg. score: {avgScore !== null ? `${avgScore}%` : "—"}</span>
          </div>
          {activity.length === 0 ? (
            <Empty title="" description="No activity yet — try one of the tools above to get started." />
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.type === "chat" ? <MessageSquare size={13} color={C.slate} /> : <BookOpen size={13} color={C.slate} />}
                    <span className="truncate" style={{ color: C.ink }}>{a.title}</span>
                  </div>
                  {a.type === "quiz" ? (
                    <span className="font-medium shrink-0" style={{ color: a.score >= 70 ? C.sageDark : C.flag }}>{a.score}%</span>
                  ) : (
                    <Pill color={subjectColor(a.subject)}>{a.subject}</Pill>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- Tools / Notes / Translate ---------------------------------- */

export function Tools({ launchChat, launchQuizCreate, setView }) {
  function handleSelect(key) {
    if (key === "ask-ai") return launchChat({ subject: "General", message: "" });
    if (key === "homework") return setView("homework");
    if (key === "explain") return launchChat({ subject: "General", message: "Can you explain this concept step by step: " });
    if (key === "quiz-gen") return launchQuizCreate({ difficulty: "medium", count: 5 });
    if (key === "notes") return setView("notes");
    if (key === "translate") return setView("translate");
    if (key === "voice") return setView("voice");
    if (key === "exam") return setView("exam-mode");
  }
  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <PageHeader title="Tools" subtitle="Everything Cognify can help you with, in one place." />
      <FeatureCardGrid onSelect={handleSelect} />
    </div>
  );
}
