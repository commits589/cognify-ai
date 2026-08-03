import { useState, useEffect } from "react";
import { ShieldCheck, Plus, X, ChevronLeft, Check } from "lucide-react";
import { generateQuiz, gradeShortAnswers } from "./aiClient";
import { C, GLOW, GRADIENT, SUBJECTS, inputClass, inputStyle, subjectColor } from "./theme";
import { Btn, Card, Empty, Field, Pill, Spinner } from "./ui";

export function Quizzes({ quizzes, setQuizzes, attempts, setAttempts, user, classes, logActivity, preset, onConsumePreset }) {
  const [mode, setMode] = useState(preset ? "create" : "list");
  const [activeQuiz, setActiveQuiz] = useState(null);

  useEffect(() => {
    if (preset) { setMode("create"); onConsumePreset && onConsumePreset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bestScoreFor = (id) => {
    const rel = attempts.filter((a) => a.quizId === id);
    return rel.length ? Math.max(...rel.map((a) => a.score)) : null;
  };

  if (mode === "create") {
    return <QuizCreate user={user} classes={classes} preset={preset} onCancel={() => setMode("list")} onSaved={(q) => { setQuizzes((p) => [q, ...p]); setActiveQuiz(q); setMode("take"); }} />;
  }
  if (mode === "take" && activeQuiz) {
    return <QuizTake quiz={activeQuiz} user={user} onDone={(attempt) => { setAttempts((p) => [attempt, ...p]); logActivity({ minutes: 3, quizzesTaken: 1, xpEarned: attempt.score >= 70 ? 15 : 8 }); }} onBack={() => setMode("list")} />;
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Quizzes</h1>
          <p className="text-sm mt-1" style={{ color: C.slate }}>Generate a quiz from any topic in seconds.</p>
        </div>
        <Btn onClick={() => setMode("create")}><Plus size={14} /> New quiz</Btn>
      </div>
      {quizzes.length === 0 ? (
        <Card><Empty title="No quizzes yet" description="Create a quiz from any topic — Cognify generates the questions for you." action={<Btn onClick={() => setMode("create")}>Create your first quiz</Btn>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map((q) => {
            const best = bestScoreFor(q.id);
            return (
              <Card key={q.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>{q.title}</h3>
                  <Pill color={subjectColor(q.subject)}>{q.subject}</Pill>
                </div>
                <p className="text-xs mb-4" style={{ color: C.slate }}>
                  {q.questions.length} questions
                  {best !== null && <span className="ml-2 font-medium" style={{ color: best >= 70 ? C.sageDark : C.flag }}>Best: {best}%</span>}
                </p>
                <Btn size="sm" variant="secondary" className="mt-auto w-full" onClick={() => { setActiveQuiz(q); setMode("take"); }}>
                  {best !== null ? "Retake quiz" : "Take quiz"}
                </Btn>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function QuizCreate({ user, classes, preset, onCancel, onSaved }) {
  const [genMode, setGenMode] = useState("ai");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(user?.gradeLevel || "");
  const [questionType, setQuestionType] = useState("Multiple Choice");
  const [count, setCount] = useState(preset?.count || 5);
  const [difficulty, setDifficulty] = useState(preset?.difficulty || "medium");
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  function addManual() {
    setQuestions((p) => [...p, { id: `q_${Date.now()}`, type: "mc", prompt: "", choices: ["", "", "", ""], correctIndex: 0, explanation: "" }]);
  }
  function updateQ(id, patch) { setQuestions((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q))); }
  function updateChoice(id, idx, val) { setQuestions((p) => p.map((q) => (q.id === id ? { ...q, choices: q.choices.map((c, i) => (i === idx ? val : c)) } : q))); }
  function removeQ(id) { setQuestions((p) => p.filter((q) => q.id !== id)); }

  async function handleGenerate() {
    setError(null);
    if (!topic.trim()) return setError("Enter a topic to generate questions from.");
    setGenerating(true);
    try {
      const qs = await generateQuiz(topic, subject, count, difficulty, questionType, grade);
      setQuestions(qs);
      if (!title) setTitle(topic);
    } catch (err) {
      setError(err.message || "Could not generate the quiz.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSave() {
    setError(null);
    if (!title.trim()) return setError("Give the quiz a title.");
    if (questions.length === 0) return setError("Add at least one question.");
    const invalid = questions.some((q) => {
      if (!q.prompt.trim()) return true;
      if (q.type === "short") return !q.correctAnswer?.trim();
      return !q.choices || q.choices.some((c) => !c.trim());
    });
    if (invalid) return setError("Every question needs a prompt, and choices (or a model answer for short-answer questions).");
    onSaved({ id: `quiz_${Date.now()}`, title: title.trim(), subject, grade, questionType, createdBy: user.displayName, questions, source: genMode });
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <button onClick={onCancel} className="flex items-center gap-1 text-xs mb-4" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> Back to quizzes</button>
      {preset?.examMode && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: C.chalkLight }}>
          <ShieldCheck size={12} /> Board Exam Mode — longer, harder practice set
        </span>
      )}
      <h1 className="text-2xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{preset?.examMode ? "Exam practice set" : "Create a quiz"}</h1>
      <p className="text-sm mb-6" style={{ color: C.slate }}>Generate questions with AI, or build them yourself.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setGenMode("ai")} className="px-4 py-2 rounded-full text-sm font-medium transition-all" style={genMode === "ai" ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { background: "rgba(255,255,255,0.05)", color: C.ink }}>AI-generated</button>
        <button onClick={() => setGenMode("manual")} className="px-4 py-2 rounded-full text-sm font-medium transition-all" style={genMode === "manual" ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { background: "rgba(255,255,255,0.05)", color: C.ink }}>Build manually</button>
      </div>

      <Card className="p-5 mb-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Quiz title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} placeholder="Cell Biology Basics" /></Field>
          <Field label="Subject">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} style={inputStyle}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        {genMode === "ai" && (
          <div className="pt-4 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Field label="Topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Photosynthesis, The French Revolution" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Grade level"><input value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 8th grade" /></Field>
              <Field label="Difficulty">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Number of questions"><input type="number" min={3} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))} className={inputClass} style={inputStyle} /></Field>
              <Field label="Question type">
                <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className={inputClass} style={inputStyle}>
                  <option>Multiple Choice</option>
                  <option>True / False</option>
                  <option>Short Answer</option>
                  <option>Mixed</option>
                </select>
              </Field>
            </div>
            <Btn type="button" variant="secondary" onClick={handleGenerate} disabled={generating}>{generating ? <><Spinner /> Generating…</> : "Generate questions"}</Btn>
          </div>
        )}
      </Card>

      {genMode === "manual" && <div className="mb-4"><Btn variant="ghost" onClick={addManual}><Plus size={14} /> Add question</Btn></div>}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.slate }}>
                Question {i + 1} · {q.type === "short" ? "Short answer" : q.type === "tf" ? "True/False" : "Multiple choice"}
              </span>
              <button onClick={() => removeQ(q.id)} className="text-xs" style={{ color: C.flag }}>Remove</button>
            </div>
            <textarea value={q.prompt} onChange={(e) => updateQ(q.id, { prompt: e.target.value })} placeholder="Question prompt" className={`${inputClass} mb-3`} style={inputStyle} rows={2} />
            {q.type === "short" ? (
              <input value={q.correctAnswer || ""} onChange={(e) => updateQ(q.id, { correctAnswer: e.target.value })} placeholder="Model answer" className={inputClass} style={inputStyle} />
            ) : (
              <div className="space-y-2">
                {(q.choices || []).map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="radio" checked={q.correctIndex === idx} onChange={() => updateQ(q.id, { correctIndex: idx })} style={{ accentColor: C.chalk }} />
                    <input value={c} onChange={(e) => updateChoice(q.id, idx, e.target.value)} placeholder={`Choice ${idx + 1}`} className={inputClass} style={inputStyle} disabled={q.type === "tf"} />
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: C.slate }}>{q.type === "short" ? "Students will type a free-text answer; the AI grades it against this model answer." : "Select the radio button next to the correct choice."}</p>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm mt-4" style={{ color: C.flag }}>{error}</p>}
      <div className="mt-6 flex justify-end"><Btn onClick={handleSave}>Save quiz</Btn></div>
    </div>
  );
}

export function QuizTake({ quiz, user, onDone, onBack }) {
  const [answers, setAnswers] = useState({}); // choice questions: index; short questions: string
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [shortResults, setShortResults] = useState({}); // qId -> { correct, feedback }
  const [error, setError] = useState(null);

  const allAnswered = quiz.questions.every((q) => {
    const a = answers[q.id];
    return q.type === "short" ? String(a || "").trim().length > 0 : a !== undefined;
  });

  async function handleSubmit() {
    setError(null);
    const shortQs = quiz.questions.filter((q) => q.type === "short");
    let gradedShort = {};
    if (shortQs.length > 0) {
      setGrading(true);
      try {
        const results = await gradeShortAnswers(shortQs.map((q) => ({ prompt: q.prompt, correctAnswer: q.correctAnswer, studentAnswer: answers[q.id] })));
        shortQs.forEach((q, i) => { gradedShort[q.id] = results[i] || { correct: false, feedback: "" }; });
        setShortResults(gradedShort);
      } catch (err) {
        setError("Couldn't AI-grade the short-answer questions, so they're marked ungraded. " + (err.message || ""));
      } finally {
        setGrading(false);
      }
    }

    const correctCount = quiz.questions.filter((q) => {
      if (q.type === "short") return gradedShort[q.id]?.correct;
      return answers[q.id] === q.correctIndex;
    }).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    setSubmitted(true);
    onDone({ id: `att_${Date.now()}`, quizId: quiz.id, quizTitle: quiz.title, subject: quiz.subject, userId: user.displayName, score, correctCount, totalCount: quiz.questions.length });
  }

  const correctCount = quiz.questions.filter((q) => (q.type === "short" ? shortResults[q.id]?.correct : answers[q.id] === q.correctIndex)).length;
  const score = submitted ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  const wrongCount = quiz.questions.length - correctCount;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> All quizzes</button>
        <Pill color={subjectColor(quiz.subject)}>{quiz.subject}</Pill>
      </div>
      <h1 className="text-2xl mb-6" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{quiz.title}</h1>

      {submitted && (
        <Card className="p-5 mb-6" style={{ border: `2px solid ${score >= 70 ? C.sage : C.flag}` }}>
          <p className="text-3xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{score}%</p>
          <p className="text-sm mb-3" style={{ color: C.slate }}>{score >= 70 ? "Nice work!" : "Review the explanations below and try again."}</p>
          <div className="flex items-center gap-4 text-xs">
            <span style={{ color: C.sage }}>✓ {correctCount} correct</span>
            <span style={{ color: C.flag }}>✕ {wrongCount} wrong</span>
            <span style={{ color: C.slate }}>{quiz.questions.length} total</span>
          </div>
        </Card>
      )}

      <div className="space-y-5">
        {quiz.questions.map((q, i) => {
          const selected = answers[q.id];
          const shortResult = shortResults[q.id];
          return (
            <Card key={q.id} className="p-5">
              <p className="text-sm font-medium mb-3" style={{ color: C.ink }}>{i + 1}. {q.prompt}</p>

              {q.type === "short" ? (
                <>
                  <textarea
                    disabled={submitted}
                    value={selected || ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    rows={2}
                    className={inputClass}
                    style={submitted ? { ...inputStyle, opacity: 0.8 } : inputStyle}
                    placeholder="Type your answer…"
                  />
                  {submitted && shortResult && (
                    <div className="mt-2 flex items-start gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: shortResult.correct ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: shortResult.correct ? C.sage : C.flag }}>
                      {shortResult.correct ? <Check size={13} className="mt-0.5 shrink-0" /> : <X size={13} className="mt-0.5 shrink-0" />}
                      <span>{shortResult.feedback} {!shortResult.correct && q.correctAnswer && <><br />Model answer: {q.correctAnswer}</>}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  {(q.choices || []).map((c, idx) => {
                    const showCorrect = submitted && idx === q.correctIndex;
                    const showWrong = submitted && selected === idx && idx !== q.correctIndex;
                    const style = showCorrect ? { border: `1px solid ${C.sage}`, background: "rgba(52,211,153,0.12)", color: C.sageDark }
                      : showWrong ? { border: `1px solid ${C.flag}`, background: "rgba(248,113,113,0.12)", color: C.flag }
                      : selected === idx ? { border: `1px solid ${C.chalk}`, background: "rgba(139,92,246,0.1)", color: C.ink }
                      : { border: "1px solid rgba(255,255,255,0.12)", color: C.ink };
                    return (
                      <button key={idx} disabled={submitted} onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                        className="w-full text-left text-sm px-4 py-2.5 rounded-lg transition-colors" style={style}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}

              {submitted && q.explanation && q.type !== "short" && selected !== undefined && (
                <p className="text-xs mt-3 rounded-lg px-3 py-2" style={{ color: C.slate, background: "rgba(255,255,255,0.05)" }}>{q.explanation}</p>
              )}
            </Card>
          );
        })}
      </div>

      {error && <p className="text-sm mt-4" style={{ color: C.flag }}>{error}</p>}

      <div className="mt-6 flex justify-end">
        {!submitted ? (
          <Btn onClick={handleSubmit} disabled={!allAnswered || grading}>{grading ? <><Spinner /> Grading…</> : "Submit answers"}</Btn>
        ) : (
          <Btn variant="secondary" onClick={onBack}>Back to quizzes</Btn>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Flashcards ---------------------------------- */
