import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, GRADIENT, dayKey, inputClass, inputStyle, subjectColor, todayKey } from "./theme";
import { Btn, Card, Field, GoalBar, PageHeader, Pill, StatCard } from "./ui";

export function Progress({ progress, attempts, sessions, xp, streak, goals, setGoals }) {
  const [range, setRange] = useState(14); // 7 | 14 | 30
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goals);

  const days = Array.from({ length: range }, (_, i) => dayKey(-(range - 1 - i)));
  const logs = days.map((d) => ({ date: d, ...(progress[d] || { minutes: 0, quizzes: 0, cards: 0, xp: 0 }) }));
  const chartData = logs.map((l) => ({ day: l.date.slice(5), minutes: l.minutes }));

  const today = progress[todayKey()] || { minutes: 0 };
  const weekDays = Array.from({ length: 7 }, (_, i) => dayKey(-i));
  const monthDays = Array.from({ length: 30 }, (_, i) => dayKey(-i));
  const weeklyMinutes = weekDays.reduce((a, d) => a + (progress[d]?.minutes || 0), 0);
  const monthlyMinutes = monthDays.reduce((a, d) => a + (progress[d]?.minutes || 0), 0);

  const questionsAsked = sessions.reduce((a, s) => a + s.messages.filter((m) => m.role === "user").length, 0);
  const questionsSolved = attempts.reduce((a, x) => a + x.totalCount, 0);
  const quizzesCompleted = attempts.length;
  const avgScore = attempts.length ? Math.round(attempts.reduce((a, x) => a + x.score, 0) / attempts.length) : null;
  const subjectsStudied = new Set([...sessions.map((s) => s.subject), ...attempts.map((a) => a.subject).filter(Boolean)]);

  // per-subject average score → strong/weak topics
  const bySubject = {};
  attempts.forEach((a) => {
    const key = a.subject || "General";
    if (!bySubject[key]) bySubject[key] = [];
    bySubject[key].push(a.score);
  });
  const subjectAverages = Object.entries(bySubject).map(([subject, scores]) => ({
    subject, avg: Math.round(scores.reduce((a, s) => a + s, 0) / scores.length), count: scores.length,
  }));
  const strongTopics = subjectAverages.filter((s) => s.avg >= 70).sort((a, b) => b.avg - a.avg);
  const weakTopics = subjectAverages.filter((s) => s.avg < 70).sort((a, b) => a.avg - b.avg);

  const scoreTrend = attempts.slice(0, 12).reverse().map((a, i) => ({ attempt: `#${i + 1}`, score: a.score }));

  const weeklyQuizzesDone = attempts.filter((a) => Number(a.id.split("_")[1]) >= Date.now() - 7 * 86400000).length;

  function saveGoals() {
    setGoals(goalDraft);
    setEditingGoals(false);
  }

  const tooltipStyle = { background: "#12142A", border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, fontSize: 12, color: C.ink };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <PageHeader title="Your progress" subtitle="Everything about how you're studying, in one place." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Learning streak" value={`${streak} 🔥`} />
        <StatCard label="Daily study time" value={`${today.minutes} min`} />
        <StatCard label="Weekly study time" value={`${weeklyMinutes} min`} />
        <StatCard label="Monthly study time" value={`${monthlyMinutes} min`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Questions asked" value={questionsAsked} />
        <StatCard label="Questions solved" value={questionsSolved} />
        <StatCard label="Quizzes completed" value={quizzesCompleted} />
        <StatCard label="Avg. quiz score" value={avgScore !== null ? `${avgScore}%` : "—"} />
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }}>Study minutes over time</h2>
          <div className="flex gap-1">
            {[7, 14, 30].map((r) => (
              <button key={r} onClick={() => setRange(r)} className="text-xs px-2.5 py-1 rounded-full"
                style={range === r ? { backgroundImage: GRADIENT, color: "#fff" } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft }}>
                {r}d
              </button>
            ))}
          </div>
        </div>
        {chartData.every((d) => d.minutes === 0) ? (
          <p className="text-sm" style={{ color: C.slate }}>No activity logged yet — chat with the tutor or take a quiz to get started.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.slate, fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
              <YAxis tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="minutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {scoreTrend.length > 1 && (
        <Card className="p-5 mb-6">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }} className="mb-4">Quiz score trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="attempt" tick={{ fill: C.slate, fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="#4F8CFF" strokeWidth={2.5} dot={{ fill: "#4F8CFF", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <Card className="p-5">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }} className="mb-3">Subjects studied</h2>
          {subjectsStudied.size === 0 ? (
            <p className="text-sm" style={{ color: C.slate }}>Nothing studied yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">{[...subjectsStudied].map((s) => <Pill key={s} color={subjectColor(s)}>{s}</Pill>)}</div>
          )}
        </Card>

        <Card className="p-5">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }} className="mb-3">Learning goals</h2>
          {editingGoals ? (
            <div className="space-y-3">
              <Field label="Daily study minutes goal"><input type="number" value={goalDraft.dailyMinutes} onChange={(e) => setGoalDraft((p) => ({ ...p, dailyMinutes: Number(e.target.value) }))} className={inputClass} style={inputStyle} /></Field>
              <Field label="Weekly quizzes goal"><input type="number" value={goalDraft.weeklyQuizzes} onChange={(e) => setGoalDraft((p) => ({ ...p, weeklyQuizzes: Number(e.target.value) }))} className={inputClass} style={inputStyle} /></Field>
              <div className="flex gap-2"><Btn size="sm" onClick={saveGoals}>Save</Btn><Btn size="sm" variant="ghost" onClick={() => setEditingGoals(false)}>Cancel</Btn></div>
            </div>
          ) : (
            <div className="space-y-4">
              <GoalBar label="Daily study time" current={today.minutes} target={goals.dailyMinutes} unit="min" />
              <GoalBar label="Quizzes this week" current={weeklyQuizzesDone} target={goals.weeklyQuizzes} unit="quizzes" />
              <button onClick={() => { setGoalDraft(goals); setEditingGoals(true); }} className="text-xs hover:underline" style={{ color: C.chalkLight }}>Edit goals</button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: C.sage }}>Strong topics</h2>
          {strongTopics.length === 0 ? (
            <p className="text-sm" style={{ color: C.slate }}>Take a few quizzes to see where you're doing well.</p>
          ) : (
            <ul className="space-y-2">{strongTopics.map((s) => (
              <li key={s.subject} className="flex items-center justify-between text-sm">
                <span style={{ color: C.ink }}>{s.subject}</span>
                <span style={{ color: C.sage }}>{s.avg}% avg ({s.count} {s.count === 1 ? "quiz" : "quizzes"})</span>
              </li>
            ))}</ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: C.flag }}>Weak topics</h2>
          {weakTopics.length === 0 ? (
            <p className="text-sm" style={{ color: C.slate }}>{subjectAverages.length === 0 ? "Take a few quizzes to see where to focus." : "No weak spots yet — nice work!"}</p>
          ) : (
            <ul className="space-y-2">{weakTopics.map((s) => (
              <li key={s.subject} className="flex items-center justify-between text-sm">
                <span style={{ color: C.ink }}>{s.subject}</span>
                <span style={{ color: C.flag }}>{s.avg}% avg ({s.count} {s.count === 1 ? "quiz" : "quizzes"})</span>
              </li>
            ))}</ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }} className="mb-4">Quiz history</h2>
        {attempts.length === 0 ? (
          <p className="text-sm" style={{ color: C.slate }}>No quizzes taken yet.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {attempts.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="truncate" style={{ color: C.ink }}>{a.quizTitle}</span>
                <span className="font-medium" style={{ color: a.score >= 70 ? C.sageDark : C.flag }}>{a.score}% ({a.correctCount}/{a.totalCount})</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-center mt-6" style={{ color: C.slateLight }}>
        In this preview, progress lives in this browser tab. The production app stores this in Firebase Firestore, keyed per student per day.
      </p>
    </div>
  );
}
