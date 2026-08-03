import { useState, useRef } from "react";
import { ChevronLeft, RefreshCw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { callClaude, generateMindMapFull, generateStructuredJSON } from "./aiClient";
import { AI_TOOLS, C, GLASS_BG, GLASS_BORDER, GLOW, GRADIENT, inputClass, inputStyle } from "./theme";
import { Btn, Card, CopyShareBar, Field, MessageContent, PageHeader, Pill, SkeletonCard, Spinner } from "./ui";

export function AIToolsHub({ onSelect, setView }) {
  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <PageHeader title="AI Tools" subtitle="A dedicated tool for whatever you're working on." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_TOOLS.map((t) => (
          <button key={t.key} onClick={() => (t.kind === "link" ? setView(t.linkView) : onSelect(t.key))} className="text-left">
            <Card className="p-5 h-full transition-all hover:-translate-y-0.5 hover:brightness-110">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}>
                <t.icon size={19} color={t.color} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{t.title}</p>
              <p className="text-xs leading-snug" style={{ color: C.slate }}>{t.desc}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToolField({ field, value, onChange }) {
  if (field.type === "textarea") {
    return <Field label={field.label}><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={inputClass} style={inputStyle} placeholder={field.placeholder} /></Field>;
  }
  if (field.type === "select") {
    return (
      <Field label={field.label}>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} style={inputStyle}>
          {field.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
    );
  }
  if (field.type === "number") {
    return <Field label={field.label}><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputClass} style={inputStyle} /></Field>;
  }
  return <Field label={field.label}><input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} style={inputStyle} placeholder={field.placeholder} /></Field>;
}

export function MindMapView({ data }) {
  return (
    <div className="overflow-x-auto py-2">
      <div className="flex flex-col items-center min-w-max">
        <div className="px-5 py-3 rounded-full text-sm font-semibold mb-6" style={{ backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW }}>{data.topic}</div>
        <div className="flex gap-4 flex-wrap justify-center">
          {(data.branches || []).map((b, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-px h-4" style={{ background: GLASS_BORDER }} />
              <div className="px-3.5 py-2 rounded-lg text-sm font-medium mb-3 text-center" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: C.chalkLight }}>{b.label}</div>
              <div className="flex flex-col gap-2">
                {(b.children || []).map((c, j) => (
                  <div key={j} className="px-3 py-1.5 rounded-lg text-xs text-center" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: C.inkSoft }}>{c}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function mindMapToText(data) {
  let out = `${data.topic}\n`;
  (data.branches || []).forEach((b) => {
    out += `- ${b.label}\n`;
    (b.children || []).forEach((c) => { out += `  - ${c}\n`; });
  });
  if ((data.keyConcepts || []).length) {
    out += `\nKey concepts:\n`;
    data.keyConcepts.forEach((k) => { out += `- ${k}\n`; });
  }
  return out;
}

export function TimelineView({ data }) {
  return (
    <div className="space-y-0">
      {(data.events || []).map((e, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundImage: GRADIENT, boxShadow: GLOW }} />
            {i < data.events.length - 1 && <div className="w-px flex-1" style={{ background: GLASS_BORDER, minHeight: 24 }} />}
          </div>
          <div className="pb-5">
            <p className="text-xs font-semibold" style={{ color: C.chalkLight }}>{e.date}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: C.ink }}>{e.title}</p>
            <p className="text-xs mt-1" style={{ color: C.slate }}>{e.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function timelineToText(data) {
  return `${data.topic}\n\n` + (data.events || []).map((e) => `${e.date} — ${e.title}\n${e.description}`).join("\n\n");
}

export function SlidesView({ data }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {(data.slides || []).map((s, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
          <p className="text-[10px] mb-1.5" style={{ color: C.slateLight }}>Slide {i + 1}</p>
          <p className="text-sm font-semibold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{s.title}</p>
          <ul className="space-y-1">
            {(s.bullets || []).map((b, j) => <li key={j} className="text-xs" style={{ color: C.inkSoft }}>• {b}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function slidesToText(data) {
  return `${data.title}\n\n` + (data.slides || []).map((s, i) => `Slide ${i + 1}: ${s.title}\n${(s.bullets || []).map((b) => `  - ${b}`).join("\n")}`).join("\n\n");
}

export function AIToolDetail({ toolKey, onBack, logActivity }) {
  const tool = AI_TOOLS.find((t) => t.key === toolKey);
  const [values, setValues] = useState(() => {
    const init = {};
    (tool.fields || []).forEach((f) => { init[f.key] = f.default ?? ""; });
    return init;
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function setField(key, val) { setValues((prev) => ({ ...prev, [key]: val })); }

  async function handleGenerate() {
    setError(null);
    const mainField = tool.fields[0];
    if (!String(values[mainField.key] || "").trim()) return setError(`Please fill in "${mainField.label}".`);
    setLoading(true);
    setResult(null);
    try {
      const systemPrompt = tool.system(values);
      if (tool.kind === "markdown") {
        const out = await callClaude([{ role: "user", content: values.input }], systemPrompt, 1600);
        setResult({ text: out });
      } else {
        const data = await generateStructuredJSON(systemPrompt, values.input, 1600);
        setResult({ data });
      }
      logActivity({ minutes: 2, xpEarned: 4 });
    } catch (err) {
      setError(err.message || "Something went wrong generating this.");
    } finally {
      setLoading(false);
    }
  }

  const getShareText = () => {
    if (!result) return "";
    if (tool.kind === "markdown") return result.text;
    if (tool.kind === "mindmap") return mindMapToText(result.data);
    if (tool.kind === "timeline") return timelineToText(result.data);
    if (tool.kind === "slides") return slidesToText(result.data);
    return "";
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-xs mb-4" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> All AI Tools</button>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${tool.color}22`, border: `1px solid ${tool.color}44` }}>
          <tool.icon size={19} color={tool.color} />
        </div>
        <div>
          <h1 className="text-xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{tool.title}</h1>
          <p className="text-xs" style={{ color: C.slate }}>{tool.desc}</p>
        </div>
      </div>

      <Card className="p-5 mt-5 mb-5 space-y-4">
        {tool.fields.map((f) => (
          <ToolField key={f.key} field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)} />
        ))}
        <Btn onClick={handleGenerate} disabled={loading}>{loading ? <><Spinner /> Generating…</> : "Generate"}</Btn>
        {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
      </Card>

      {loading && <SkeletonCard lines={6} />}

      {result && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-semibold" style={{ color: C.ink }}>Result</h2>
            <CopyShareBar getText={getShareText} filename={`${tool.key}.txt`} />
          </div>
          {tool.kind === "markdown" && <MessageContent text={result.text} />}
          {tool.kind === "mindmap" && <MindMapView data={result.data} />}
          {tool.kind === "timeline" && <TimelineView data={result.data} />}
          {tool.kind === "slides" && <SlidesView data={result.data} />}
        </Card>
      )}
    </div>
  );
}

export function AITools({ setView, logActivity }) {
  const [activeTool, setActiveTool] = useState(null);
  if (activeTool) return <AIToolDetail toolKey={activeTool} onBack={() => setActiveTool(null)} logActivity={logActivity} />;
  return <AIToolsHub onSelect={setActiveTool} setView={setView} />;
}

/* ---------------------------------- Teacher Dashboard ---------------------------------- */

export function MindMapGenerator({ logActivity }) {
  const [topic, setTopic] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  async function handleGenerate() {
    setError(null);
    if (!topic.trim()) return setError("Enter a topic first.");
    setLoading(true);
    setData(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    try {
      const result = await generateMindMapFull(topic);
      setData(result);
      logActivity({ minutes: 2, xpEarned: 4 });
    } catch (err) {
      setError(err.message || "Could not generate a mind map for this topic.");
    } finally {
      setLoading(false);
    }
  }

  function onPointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  }
  function onPointerUp() { dragRef.current = null; }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      <PageHeader title="Mind Map Generator" subtitle="Enter a topic, get a structured, explorable mind map." />

      <Card className="p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className={`${inputClass} flex-1`} style={inputStyle} placeholder="e.g. The Water Cycle, World War I, Cell Structure" aria-label="Mind map topic" />
          <Btn onClick={handleGenerate} disabled={loading}>{loading ? <><Spinner /> Generating…</> : "Generate mind map"}</Btn>
        </div>
        {error && <p className="text-sm mt-3" style={{ color: C.flag }}>{error}</p>}
      </Card>

      {loading && <SkeletonCard lines={5} showHeader={false} />}

      {data && (
        <>
          <Card className="p-3 mb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5" role="group" aria-label="Zoom and pan controls">
              <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} aria-label="Zoom out" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: C.ink }}><ZoomOut size={14} /></button>
              <span className="text-xs w-12 text-center" style={{ color: C.slate }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))} aria-label="Zoom in" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: C.ink }}><ZoomIn size={14} /></button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="text-xs px-2.5 py-1.5 rounded-lg ml-1" style={{ background: "rgba(255,255,255,0.06)", color: C.inkSoft }}>Reset view</button>
              <span className="hidden sm:flex items-center gap-1 text-xs ml-2" style={{ color: C.slateLight }}><Move size={12} /> Drag to pan</span>
            </div>
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="secondary" onClick={handleGenerate}><RefreshCw size={13} /> Regenerate</Btn>
              <CopyShareBar getText={() => mindMapToText(data)} filename={`${data.topic || "mindmap"}.txt`} />
            </div>
          </Card>

          <Card
            className="p-6 overflow-hidden select-none"
            style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
            onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
          >
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center top", transition: dragRef.current ? "none" : "transform 0.1s ease-out" }}>
              <MindMapView data={data} />
            </div>
          </Card>

          {(data.keyConcepts || []).length > 0 && (
            <Card className="p-5 mt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.slateLight }}>Key concepts</h2>
              <div className="flex flex-wrap gap-2">
                {data.keyConcepts.map((k, i) => <Pill key={i} color="#F472B6">{k}</Pill>)}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------- Homework Helper ---------------------------------- */
