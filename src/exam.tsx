import { GLASS_BORDER } from "./theme";
import { useState } from "react";
import { Clock } from "lucide-react";
import { generateBoardExamPlan } from "./aiClient";
import { C, EXAM_TABS, GLOW, GRADIENT, SUBJECTS, inputClass, inputStyle } from "./theme";
import { Btn, Card, CopyShareBar, Field, MessageContent, PageHeader, SkeletonCard, Spinner } from "./ui";

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export function BoardExamMode({ user, logActivity, setQuizzes, setView }) {
  const [board, setBoard] = useState("CBSE");
  const [grade, setGrade] = useState(user?.gradeLevel || "");
  const [subject, setSubject] = useState("Math");
  const [chapter, setChapter] = useState("");
  const [examDate, setExamDate] = useState("");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("studyPlan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizSaved, setQuizSaved] = useState(false);

  const daysLeft = daysUntil(examDate);

  async function handleGenerate() {
    setError(null);
    if (!chapter.trim()) return setError("Enter a chapter or topic to focus on.");
    if (!examDate) return setError("Pick your exam date so Cognify can plan around it.");
    setLoading(true);
    setData(null);
    setQuizSaved(false);
    try {
      const result = await generateBoardExamPlan({ board, grade, subject, chapter, examDate, daysLeft });
      setData(result);
      setActiveTab("studyPlan");
      logActivity({ minutes: 3, xpEarned: 6 });
    } catch (err) {
      setError(err.message || "Could not generate your exam prep plan.");
    } finally {
      setLoading(false);
    }
  }

  function takeMockTest() {
    if (!data?.mockTest?.length) return;
    const quiz = {
      id: `quiz_${Date.now()}`,
      title: `${chapter} — Mock Test (${board})`,
      subject,
      createdBy: user?.displayName || "Cognify AI",
      source: "ai",
      questions: data.mockTest.map((q, i) => ({ id: `q_${Date.now()}_${i}`, type: "mc", prompt: q.prompt, choices: q.choices, correctIndex: q.correctIndex, explanation: "" })),
    };
    setQuizzes((prev) => [quiz, ...prev]);
    setQuizSaved(true);
    setTimeout(() => setView("quizzes"), 600);
  }

  function getShareText() {
    if (!data) return "";
    return [
      `Board Exam Prep — ${subject} · ${chapter} · ${board} · Grade ${grade}`,
      `STUDY PLAN\n${data.studyPlan}`,
      `REVISION PLAN\n${data.revisionPlan}`,
      `IMPORTANT QUESTIONS\n${(data.importantQuestions || []).map((q) => `- ${q}`).join("\n")}`,
      `PREVIOUS-YEAR STYLE QUESTIONS\n${(data.previousYearQuestions || []).map((q) => `- ${q}`).join("\n")}`,
      (data.formulaSheet || []).length ? `FORMULA SHEET\n${data.formulaSheet.map((f) => `- ${f}`).join("\n")}` : "",
      `EXPECTED QUESTIONS\n${(data.expectedQuestions || []).map((q) => `- ${q}`).join("\n")}`,
      `DAILY TASKS\n${(data.dailyTasks || []).map((t) => `- ${t}`).join("\n")}`,
      `REVISION REMINDERS\n${(data.revisionReminders || []).map((r) => `- ${r}`).join("\n")}`,
    ].filter(Boolean).join("\n\n");
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      <PageHeader title="Board Exam Mode" subtitle="A complete prep package built around your syllabus and exam date." />

      <Card className="p-5 mb-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Board">
            <select value={board} onChange={(e) => setBoard(e.target.value)} className={inputClass} style={inputStyle}>
              <option>CBSE</option><option>ICSE</option><option>State Board</option>
            </select>
          </Field>
          <Field label="Grade"><input value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 10th" /></Field>
          <Field label="Subject">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} style={inputStyle}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Chapter / Topic"><input value={chapter} onChange={(e) => setChapter(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Trigonometry" /></Field>
          <Field label="Exam date"><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={inputClass} style={inputStyle} /></Field>
        </div>

        {daysLeft !== null && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ backgroundImage: GRADIENT, boxShadow: GLOW }}>
            <Clock size={18} color="#fff" />
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} until your exam` : daysLeft === 0 ? "Exam is today — good luck!" : "This date has passed"}
            </p>
          </div>
        )}

        <Btn onClick={handleGenerate} disabled={loading}>{loading ? <><Spinner /> Building your plan…</> : "Generate exam prep plan"}</Btn>
        {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
      </Card>

      {loading && <SkeletonCard lines={7} />}

      {data && (
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-semibold" style={{ color: C.ink }}>{chapter} — {subject}</h2>
            <CopyShareBar getText={getShareText} filename={`${chapter || "exam-prep"}.txt`} />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
            {EXAM_TABS.filter((t) => t.key !== "formulaSheet" || (data.formulaSheet || []).length > 0).map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={activeTab === t.key ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft }}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "studyPlan" && <MessageContent text={data.studyPlan || ""} />}
          {activeTab === "revisionPlan" && <MessageContent text={data.revisionPlan || ""} />}
          {activeTab === "importantQuestions" && <ol className="list-decimal pl-5 space-y-2 text-sm" style={{ color: C.inkSoft }}>{(data.importantQuestions || []).map((q, i) => <li key={i}>{q}</li>)}</ol>}
          {activeTab === "previousYearQuestions" && (
            <>
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.1)", color: C.chalkLight }}>AI-generated in the style/difficulty of past {board} papers — practice questions, not verified original exam papers.</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm" style={{ color: C.inkSoft }}>{(data.previousYearQuestions || []).map((q, i) => <li key={i}>{q}</li>)}</ol>
            </>
          )}
          {activeTab === "formulaSheet" && <ul className="space-y-2">{(data.formulaSheet || []).map((f, i) => <li key={i} className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.1)", color: C.chalkLight, fontFamily: "ui-monospace, monospace" }}>{f}</li>)}</ul>}
          {activeTab === "expectedQuestions" && <ol className="list-decimal pl-5 space-y-2 text-sm" style={{ color: C.inkSoft }}>{(data.expectedQuestions || []).map((q, i) => <li key={i}>{q}</li>)}</ol>}
          {activeTab === "mockTest" && (
            <div>
              <p className="text-sm mb-3" style={{ color: C.slate }}>{(data.mockTest || []).length} multiple-choice questions, ready to take in the real quiz flow (with scoring and history).</p>
              <Btn onClick={takeMockTest} disabled={quizSaved}>{quizSaved ? "Opening quiz…" : "Take mock test"}</Btn>
            </div>
          )}
          {activeTab === "dailyTasks" && <ul className="space-y-2">{(data.dailyTasks || []).map((t, i) => <li key={i} className="text-sm flex gap-2" style={{ color: C.inkSoft }}><span style={{ color: C.chalkLight }}>•</span>{t}</li>)}</ul>}
          {activeTab === "revisionReminders" && <ul className="space-y-2">{(data.revisionReminders || []).map((r, i) => <li key={i} className="text-sm flex gap-2" style={{ color: C.inkSoft }}><span style={{ color: C.sage }}>✓</span>{r}</li>)}</ul>}
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------- Learning Support ---------------------------------- */
