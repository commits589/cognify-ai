import { GLASS_BORDER } from "./theme";
import { useState, useEffect } from "react";
import { Mic, Volume2, Copy, Share2, ArrowRightLeft } from "lucide-react";
import { translateText } from "./aiClient";
import { useSpeechRecognition, useSpeechSynthesis } from "./hooks";
import { ALL_LANGUAGES, LANG_CODES, C, inputClass, inputStyle } from "./theme";
import { Btn, Card, PageHeader, Skeleton, Spinner } from "./ui";

export function Translate({ logActivity }) {
  const [text, setText] = useState("");
  const [fromLang, setFromLang] = useState("Auto-detect");
  const [toLang, setToLang] = useState("Spanish");
  const [result, setResult] = useState("");
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState(null);
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  useEffect(() => { if (speech.transcript) setText(speech.transcript); }, [speech.transcript]);

  async function handleTranslate() {
    setError(null);
    if (!text.trim()) return setError("Enter some text to translate.");
    setTranslating(true);
    setResult("");
    try {
      const out = await translateText(text, fromLang, toLang);
      setResult(out);
      logActivity({ minutes: 1, xpEarned: 2 });
    } catch (err) {
      setError(err.message || "Could not translate.");
    } finally {
      setTranslating(false);
    }
  }

  function swapLanguages() {
    if (fromLang === "Auto-detect") return;
    setFromLang(toLang);
    setToLang(fromLang);
    setText(result);
    setResult(text);
  }

  async function shareResult() {
    if (navigator.share) {
      try { await navigator.share({ title: "Cognify AI Translation", text: result }); return; } catch { /* cancelled */ }
    }
    navigator.clipboard?.writeText(result);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <PageHeader title="Translate" subtitle="Translate text between languages, instantly." />

      <div className="flex items-center gap-3 mb-4">
        <select value={fromLang} onChange={(e) => setFromLang(e.target.value)} className={`${inputClass} flex-1`} style={inputStyle} aria-label="From language">
          <option>Auto-detect</option>
          {ALL_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
        <button onClick={swapLanguages} aria-label="Swap languages" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${GLASS_BORDER}`, color: C.ink }}>
          <ArrowRightLeft size={14} />
        </button>
        <select value={toLang} onChange={(e) => setToLang(e.target.value)} className={`${inputClass} flex-1`} style={inputStyle} aria-label="To language">
          {ALL_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: C.slate }}>Input</span>
            {speech.supported && (
              <button onClick={speech.listening ? speech.stop : speech.start} aria-label={speech.listening ? "Stop voice input" : "Start voice input"} aria-pressed={speech.listening}
                className="w-7 h-7 rounded-full flex items-center justify-center" style={speech.listening ? { background: C.flag, color: "#fff" } : { color: C.inkSoft }}>
                <Mic size={13} />
              </button>
            )}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className={inputClass} style={inputStyle} placeholder="Type, paste, or speak text here…" aria-label="Text to translate" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: C.slate }}>Output</span>
            {result && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => navigator.clipboard?.writeText(result)} aria-label="Copy translation" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: C.inkSoft }}><Copy size={13} /></button>
                {tts.supported && <button onClick={() => tts.speak(result,LANG_CODES[toLang])} aria-label="Speak translation" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: C.inkSoft }}><Volume2 size={13} /></button>}
                <button onClick={shareResult} aria-label="Share translation" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: C.inkSoft }}><Share2 size={13} /></button>
              </div>
            )}
          </div>
          <div className="rounded-lg px-3.5 py-2.5 text-sm min-h-[164px] whitespace-pre-wrap" style={{ ...inputStyle, color: result ? C.ink : C.slateLight }}>
            {translating ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-3" style={{ width: "92%" }} />
                <Skeleton className="h-3" style={{ width: "84%" }} />
                <Skeleton className="h-3" style={{ width: "70%" }} />
              </div>
            ) : result || "Translation will appear here…"}
          </div>
        </Card>
      </div>

      <Btn onClick={handleTranslate} disabled={translating} className="mt-4">{translating ? <><Spinner /> Translating…</> : "Translate"}</Btn>
      {error && <p className="text-sm mt-3" style={{ color: C.flag }}>{error}</p>}
    </div>
  );
}

/* ---------------------------------- AI Tools ---------------------------------- */
