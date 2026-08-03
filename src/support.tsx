import { useState } from "react";
import { MessageSquare, BookOpen, Layers, Volume2, GraduationCap, Sparkles, Square, Search, Accessibility, Eye } from "lucide-react";
import { callClaude } from "./aiClient";
import { Chat } from "./chat";
import { Tools } from "./dashboard";
import { C, GLOW, GRADIENT, INDIAN_LANGUAGES, inputClass, inputStyle } from "./theme";
import { Translate } from "./translate";
import { Btn, Card, Field, MessageContent, Spinner, ToggleRow } from "./ui";

export function LearningSupport({ a11y, setA11y, launchChat, lang, setLang }) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("simple");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSimplify() {
    setError(null);
    if (!topic.trim()) return setError("Enter a topic or paste the text you're stuck on.");
    setLoading(true);
    setResult("");
    try {
      const system = `You explain difficult topics as simply as possible for a student who is struggling.
Use everyday words, short sentences, and a concrete real-world analogy. ${level === "eli5" ? "Explain it like the student is five years old." : "Keep it clear and simple but appropriate for a student, not a young child."}
Break it into small numbered steps. End with one short check-in question to see if it made sense.`;
      const out = await callClaude([{ role: "user", content: topic }], system, 900);
      setResult(out);
    } catch (err) {
      setError(err.message || "Could not simplify this right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <Accessibility size={22} color={C.chalkLight} />
        <h1 className="text-2xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Learning Support</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: C.slate }}>Tools for however you learn best — every setting here is optional and reversible.</p>

      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Simplify a difficult topic</h2>
        <p className="text-xs mb-4" style={{ color: C.slate }}>Paste a topic, term, or confusing paragraph — get it broken down into plain language.</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className={`${inputClass} flex-1`} style={inputStyle} placeholder="e.g. Newton's third law, or paste a confusing sentence" />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass} style={{ ...inputStyle, width: "auto" }}>
            <option value="simple">Simple</option>
            <option value="eli5">Explain like I'm 5</option>
          </select>
        </div>
        <Btn onClick={handleSimplify} disabled={loading}>{loading ? <><Spinner /> Simplifying…</> : "Simplify it"}</Btn>
        {error && <p className="text-sm mt-3" style={{ color: C.flag }}>{error}</p>}
        {result && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${GLASS_BORDER}` }}>
            <MessageContent text={result} />
            <Btn size="sm" variant="secondary" className="mt-3" onClick={() => launchChat({ subject: "General", message: `Can you keep explaining "${topic}" — I have more questions.` })}>
              Keep talking about this →
            </Btn>
          </div>
        )}
      </Card>

      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Display &amp; explanation settings</h2>
        <p className="text-xs mb-2" style={{ color: C.slate }}>These apply across the whole app, including the AI tutor's explanations.</p>

        <ToggleRow icon={Sparkles} label="Simplify difficult topics" description="The AI tutor breaks concepts into their simplest form before going deeper." checked={a11y.simplify} onChange={(v) => setA11y({ simplify: v })} />
        <ToggleRow icon={Layers} label="Step-by-step explanations" description="Every explanation is numbered, one idea at a time, with check-ins between steps." checked={a11y.stepByStep} onChange={(v) => setA11y({ stepByStep: v })} />
        <ToggleRow icon={GraduationCap} label="Slow explanation mode" description="Shorter responses, one small idea at a time, waiting for you before moving on." checked={a11y.slowMode} onChange={(v) => setA11y({ slowMode: v })} />
        <ToggleRow icon={Eye} label="Visual explanation mode" description="More analogies, comparisons, and described visuals instead of abstract text." checked={a11y.visualMode} onChange={(v) => setA11y({ visualMode: v })} />
        <ToggleRow icon={MessageSquare} label="Simple language mode" description="Short sentences and everyday words, with jargon defined immediately." checked={a11y.simpleLanguage} onChange={(v) => setA11y({ simpleLanguage: v })} />
        <ToggleRow icon={Volume2} label="Audio explanations (text-to-speech)" description="Automatically read each AI response aloud." checked={a11y.audioExplanations} onChange={(v) => setA11y({ audioExplanations: v })} />
        <ToggleRow icon={BookOpen} label="Dyslexia-friendly reading mode" description="Switches to Atkinson Hyperlegible, a typeface designed for reading clarity, with extra spacing." checked={a11y.dyslexiaFont} onChange={(v) => setA11y({ dyslexiaFont: v })} />
        <ToggleRow icon={Eye} label="High contrast mode" description="Pure black background, solid cards, and white text for maximum readability." checked={a11y.highContrast} onChange={(v) => setA11y({ highContrast: v })} />

        <div className="flex items-center justify-between gap-4 py-3.5" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
          <div className="flex items-start gap-3 min-w-0">
            <Search size={17} color={C.chalkLight} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium" style={{ color: C.ink }}>Adjustable font size</p>
              <p className="text-xs mt-0.5" style={{ color: C.slate }}>Scales text size across the entire app.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0" role="radiogroup" aria-label="Font size">
            {[{ v: "md", label: "A", size: 13 }, { v: "lg", label: "A", size: 16 }, { v: "xl", label: "A", size: 19 }].map((opt) => (
              <button
                key={opt.v}
                role="radio"
                aria-checked={a11y.fontScale === opt.v}
                aria-label={opt.v === "md" ? "Default size" : opt.v === "lg" ? "Large size" : "Extra large size"}
                onClick={() => setA11y({ fontScale: opt.v })}
                className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold transition-all"
                style={a11y.fontScale === opt.v ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { background: "rgba(255,255,255,0.06)", color: C.inkSoft, border: `1px solid ${GLASS_BORDER}` }}
              >
                <span style={{ fontSize: opt.size }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3.5">
          <ToggleRow icon={Square} label="Focus mode" description="Hides navigation and extra chrome — just your dashboard or chat, distraction-free." checked={a11y.focusMode} onChange={(v) => setA11y({ focusMode: v })} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Language &amp; translation</h2>
        <p className="text-xs mb-4" style={{ color: C.slate }}>Have the AI tutor explain things in another language, or bilingually alongside English.</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-1">
          <Field label="Explain in">
            <select value={lang.name} onChange={(e) => setLang({ name: e.target.value })} className={inputClass} style={inputStyle}>
              {["English", ...INDIAN_LANGUAGES].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        {lang.name !== "English" && (
          <ToggleRow
            icon={MessageSquare}
            label={`Bilingual explanations (English + ${lang.name})`}
            description={`Get every answer in English and ${lang.name} side by side, instead of just ${lang.name} alone.`}
            checked={lang.bilingual}
            onChange={(v) => setLang({ bilingual: v })}
          />
        )}
        {lang.name !== "English" && (
          <p className="text-xs mt-3" style={{ color: C.slateLight }}>
            The AI tutor in the Chat tab will now respond {lang.bilingual ? `in English + ${lang.name}` : `in ${lang.name}`}. Use the Translate tool from Quick Tools for one-off text.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- Chat ---------------------------------- */
