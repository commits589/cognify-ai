import { useState } from "react";
import { C, SUBJECTS, inputClass, inputStyle, subjectColor } from "./theme";
import { Btn, Card, Empty, Field, Pill } from "./ui";

export function Classes({ user, classes, setClasses }) {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Math");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);

  function createClass(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    setClasses((p) => [{ id: `c_${Date.now()}`, name: name.trim(), subject, teacherName: user.displayName, joinCode, studentNames: [] }, ...p]);
    setName("");
  }

  function joinClass(e) {
    e.preventDefault();
    setError(null);
    const cls = classes.find((c) => c.joinCode === code.trim().toUpperCase());
    if (!cls) return setError("No class found with that code.");
    setClasses((p) => p.map((c) => (c.id === cls.id ? { ...c, studentNames: [...new Set([...c.studentNames, user.displayName])] } : c)));
    setCode("");
  }

  if (selected) {
    const cls = classes.find((c) => c.id === selected);
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
        <button onClick={() => setSelected(null)} className="text-xs mb-4" style={{ color: C.inkSoft }}>← All classes</button>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{cls.name}</h1>
          <Pill color={subjectColor(cls.subject)}>{cls.subject}</Pill>
        </div>
        <p className="text-sm mb-6" style={{ color: C.slate }}>Join code: <span className="font-mono font-medium" style={{ color: C.ink }}>{cls.joinCode}</span></p>
        {cls.studentNames.length === 0 ? (
          <Card><Empty title="No students yet" description="Share the join code above so students can enroll." /></Card>
        ) : (
          <Card className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {cls.studentNames.map((n) => (
              <div key={n} className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm font-medium" style={{ color: C.ink }}>{n}</p>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Classes</h1>
      <p className="text-sm mb-6" style={{ color: C.slate }}>{user.role === "teacher" ? "Create classes and share the join code with students." : "Join a class with the code your teacher gives you."}</p>

      {user.role === "teacher" ? (
        <Card className="p-5">
          <form onSubmit={createClass} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <Field label="Class name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} placeholder="Period 3 Biology" /></Field>
            <Field label="Subject">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} style={inputStyle}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Btn type="submit">Create class</Btn>
          </form>
        </Card>
      ) : (
        <Card className="p-5">
          <form onSubmit={joinClass} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1"><Field label="Class join code"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputClass} style={inputStyle} placeholder="e.g. 7K2P9Q" /></Field></div>
            <Btn type="submit">Join class</Btn>
          </form>
          {error && <p className="text-sm mt-2" style={{ color: C.flag }}>{error}</p>}
        </Card>
      )}

      <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }} className="mt-8 mb-3">{user.role === "teacher" ? "Your classes" : "Your enrolled classes"}</h2>
      {classes.length === 0 ? (
        <Card><Empty title="Nothing here yet" description={user.role === "teacher" ? "Create your first class above." : "Join a class using a code from your teacher."} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {classes.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>{c.name}</h3>
                <Pill color={subjectColor(c.subject)}>{c.subject}</Pill>
              </div>
              <p className="text-xs mb-4" style={{ color: C.slate }}>{c.studentNames.length} students{user.role === "teacher" && ` · code ${c.joinCode}`}</p>
              {user.role === "teacher" && <Btn size="sm" variant="secondary" onClick={() => setSelected(c.id)}>View roster</Btn>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Admin ---------------------------------- */
