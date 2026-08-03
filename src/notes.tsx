import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { generateFullNotes } from "./aiClient";
import { C, GLOW, GRADIENT, NOTE_TABS, SUBJECTS, inputClass, inputStyle } from "./theme";
import { Btn, Card, CopyShareBar, Field, InlineMarkdown, MessageContent, PageHeader, SkeletonCard, Spinner } from "./ui";

export function compileNotesText(meta, data) {
  let out = `${meta.topic} — ${meta.subject}${meta.chapter ? ` (${meta.chapter})` : ""} [${meta.difficulty}]\n\n`;
  out += `SHORT NOTES\n${data.shortNotes}\n\n`;
  out += `DETAILED NOTES\n${data.detailedNotes}\n\n`;
  out += `KEY POINTS\n${(data.keyPoints || []).map((k) => `- ${k}`).join("\n")}\n\n`;
  out += `DEFINITIONS\n${(data.definitions || []).map((d) => `- ${d.term}: ${d.definition}`).join("\n")}\n\n`;
  if ((data.formulas || []).length) out += `IMPORTANT FORMULAS\n${data.formulas.map((f) => `- ${f}`).join("\n")}\n\n`;
  out += `EXAMPLES\n${(data.examples || []).map((e) => `- ${e}`).join("\n")}\n\n`;
  out += `SUMMARY\n${data.summary}\n\n`;
  out += `REVISION NOTES\n${(data.revisionNotes || []).map((r) => `- ${r}`).join("\n")}`;
  return out;
}

export function NotesGenerator({ logActivity, savedNotes, setSavedNotes }) {
  const [subject, setSubject] = useState("General");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("shortNotes");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [viewingSaved, setViewingSaved] = useState(null);

  async function handleGenerate() {
    setError(null);
    if (!topic.trim()) return setError("Enter a topic first.");
    setGenerating(true);
    setData(null);
    setSaved(false);
    try {
      const result = await generateFullNotes(subject, chapter, topic, difficulty);
      setData(result);
      setActiveTab("shortNotes");
      logActivity({ minutes: 2, xpEarned: 4 });
    } catch (err) {
      setError(err.message || "Could not generate notes.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSaveNotes() {
    const meta = { subject, chapter, topic, difficulty };
    setSavedNotes((prev) => [{ id: `note_${Date.now()}`, meta, data, createdAt: Date.now() }, ...prev]);
    setSaved(true);
  }

  const activeMeta = viewingSaved ? viewingSaved.meta : { subject, chapter, topic, difficulty };
  const activeData = viewingSaved ? viewingSaved.data : data;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <PageHeader title="Notes Generator" subtitle="Short notes, detailed notes, definitions, formulas, examples — all in one place." />

      {!viewingSaved && (
        <Card className="p-5 mb-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Subject">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} style={inputStyle}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Chapter (optional)"><input value={chapter} onChange={(e) => setChapter(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Chapter 4: Cell Biology" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Mitochondria and cellular respiration" /></Field>
            <Field label="Difficulty">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass} style={inputStyle}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </Field>
          </div>
          <Btn onClick={handleGenerate} disabled={generating}>{generating ? <><Spinner /> Generating…</> : "Generate notes"}</Btn>
          {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
        </Card>
      )}

      {viewingSaved && (
        <button onClick={() => setViewingSaved(null)} className="flex items-center gap-1 text-xs mb-4" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> Back to generator</button>
      )}

      {generating && <SkeletonCard lines={6} />}

      {activeData && (
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: C.ink }}>{activeMeta.topic}</h2>
              <p className="text-xs" style={{ color: C.slate }}>{activeMeta.subject}{activeMeta.chapter ? ` · ${activeMeta.chapter}` : ""} · {activeMeta.difficulty}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CopyShareBar getText={() => compileNotesText(activeMeta, activeData)} filename={`${activeMeta.topic || "notes"}.txt`} />
              {!viewingSaved && (
                <Btn size="sm" variant="secondary" onClick={handleSaveNotes} disabled={saved}>
                  {saved ? <><Check size={13} /> Saved</> : <>Save notes</>}
                </Btn>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
            {NOTE_TABS.filter((t) => t.key !== "formulas" || (activeData.formulas || []).length > 0).map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={activeTab === t.key ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft }}>
                {t.label}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "shortNotes" && <MessageContent text={activeData.shortNotes || ""} />}
            {activeTab === "detailedNotes" && <MessageContent text={activeData.detailedNotes || ""} />}
            {activeTab === "keyPoints" && (
              <ul className="space-y-2">{(activeData.keyPoints || []).map((k, i) => <li key={i} className="text-sm flex gap-2" style={{ color: C.inkSoft }}><span style={{ color: C.chalkLight }}>•</span><InlineMarkdown text={k} /></li>)}</ul>
            )}
            {activeTab === "definitions" && (
              <div className="space-y-3">
                {(activeData.definitions || []).map((d, i) => (
                  <div key={i}><span className="text-sm font-semibold" style={{ color: C.ink }}>{d.term}</span><p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>{d.definition}</p></div>
                ))}
              </div>
            )}
            {activeTab === "formulas" && (
              <ul className="space-y-2">{(activeData.formulas || []).map((f, i) => <li key={i} className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.1)", color: C.chalkLight, fontFamily: "ui-monospace, monospace" }}>{f}</li>)}</ul>
            )}
            {activeTab === "examples" && (
              <ul className="space-y-2">{(activeData.examples || []).map((e, i) => <li key={i} className="text-sm" style={{ color: C.inkSoft }}><InlineMarkdown text={e} /></li>)}</ul>
            )}
            {activeTab === "summary" && <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{activeData.summary}</p>}
            {activeTab === "revisionNotes" && (
              <ul className="space-y-2">{(activeData.revisionNotes || []).map((r, i) => <li key={i} className="text-sm flex gap-2" style={{ color: C.inkSoft }}><span style={{ color: C.sage }}>✓</span><InlineMarkdown text={r} /></li>)}</ul>
            )}
          </div>
        </Card>
      )}

      {!viewingSaved && savedNotes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium mb-2" style={{ color: C.inkSoft }}>Saved notes</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {savedNotes.map((n) => (
              <button key={n.id} onClick={() => setViewingSaved(n)} className="text-left">
                <Card className="p-4">
                  <p className="text-sm font-medium truncate" style={{ color: C.ink }}>{n.meta.topic}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.slate }}>{n.meta.subject} · {n.meta.difficulty}</p>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
