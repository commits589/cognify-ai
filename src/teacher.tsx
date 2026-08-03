import { useState } from "react";
import { AIToolDetail } from "./aiTools";
import { C, GRADIENT, TEACHER_CARDS } from "./theme";
import { Btn, Card, Empty, PageHeader, Pill } from "./ui";

export function TeacherDashboard({ setView, logActivity, classes }) {
  const [activeTool, setActiveTool] = useState(null);
  if (activeTool) return <AIToolDetail toolKey={activeTool} onBack={() => setActiveTool(null)} logActivity={logActivity} />;

  function handleSelect(card) {
    if (card.type === "ai-tool") setActiveTool(card.key);
    else setView(card.key === "student-performance" ? "student-performance" : card.key);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <PageHeader title="Teacher Dashboard" subtitle="Everything for planning, assessing, and tracking your classes." />
      {classes.length === 0 && (
        <Card className="p-4 mb-5 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm" style={{ color: C.slate }}>You haven't created a class yet.</p>
          <Btn size="sm" variant="secondary" onClick={() => setView("classes")}>Create a class</Btn>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEACHER_CARDS.map((c) => (
          <button key={c.key} onClick={() => handleSelect(c)} className="text-left">
            <Card className="p-5 h-full transition-all hover:-translate-y-0.5 hover:brightness-110">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                <c.icon size={19} color={c.color} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{c.title}</p>
              <p className="text-xs leading-snug" style={{ color: C.slate }}>{c.desc}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StudentPerformance({ classes, user }) {
  const [selected, setSelected] = useState(classes[0]?.id || null);
  const cls = classes.find((c) => c.id === selected);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      <PageHeader title="Track Student Performance" subtitle="Roster and standing for each of your classes." />
      {classes.length === 0 ? (
        <Card><Empty title="No classes yet" description="Create a class first — performance data appears here once students join and take assigned quizzes." /></Card>
      ) : (
        <>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {classes.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)} className="shrink-0 text-xs font-medium px-3.5 py-2 rounded-full"
                style={selected === c.id ? { backgroundImage: GRADIENT, color: "#fff" } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft }}>
                {c.name}
              </button>
            ))}
          </div>
          {cls && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }}>{cls.name}</h2>
                  <p className="text-xs" style={{ color: C.slate }}>{cls.subject} · code {cls.joinCode}</p>
                </div>
                <Pill color="#34D399">{cls.studentNames.length} enrolled</Pill>
              </div>
              {cls.studentNames.length === 0 ? (
                <Empty title="No students enrolled" description="Share the join code with your class to get started." />
              ) : (
                <ul className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {cls.studentNames.map((n) => (
                    <li key={n} className="flex items-center justify-between py-3">
                      <span className="text-sm" style={{ color: C.ink }}>{n}</span>
                      <span className="text-xs" style={{ color: C.slateLight }}>Awaiting quiz activity</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs mt-4 pt-4" style={{ color: C.slateLight, borderTop: `1px solid ${GLASS_BORDER}` }}>
                In this preview, each browser session only sees its own quiz attempts — per-student scores populate here once assigned quizzes are taken and synced through a real backend.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------- Legal ---------------------------------- */
