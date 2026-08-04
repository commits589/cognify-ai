import { GLASS_BORDER } from "./theme";
import { useState, useEffect, useRef } from "react";
import { Mic, Sparkles, Square, Check, Download, Play, Pause } from "lucide-react";
import { askVoiceTutor, downloadText, summarizeVoiceSession } from "./aiClient";
import { useSpeechRecognition, useSpeechSynthesis } from "./hooks";
import { C, GLASS_BG, GLOW, GRADIENT } from "./theme";
import { Btn, Card, CopyShareBar, PageHeader, Spinner, TypingIndicator } from "./ui";

export function VoiceLearning({ logActivity, savedNotes, setSavedNotes }) {
  const [transcript, setTranscript] = useState([]); // [{role, text}]
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [transcript]);

  async function handleStopListening() {
    speech.stop();
    const said = speech.transcript.trim();
    speech.reset();
    if (!said) return;
    setError(null);
    const next = [...transcript, { role: "user", text: said }];
    setTranscript(next);
    setThinking(true);
    try {
      const reply = await askVoiceTutor(next);
      const updated = [...next, { role: "assistant", text: reply }];
      setTranscript(updated);
      logActivity({ minutes: 1, xpEarned: 2 });
      tts.speak(reply);
    } catch (err) {
      setError(err.message || "Could not reach the AI tutor.");
    } finally {
      setThinking(false);
    }
  }

  function replayLast() {
    const lastAi = [...transcript].reverse().find((m) => m.role === "assistant");
    if (lastAi) tts.speak(lastAi.text);
  }

  async function handleSummarize() {
    if (transcript.length === 0) return;
    setSummarizing(true);
    setError(null);
    try {
      const text = transcript.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n");
      const s = await summarizeVoiceSession(text);
      setSummary(s);
    } catch (err) {
      setError(err.message || "Could not summarize this session.");
    } finally {
      setSummarizing(false);
    }
  }

  function transcriptText() {
    return transcript.map((m) => `${m.role === "user" ? "You" : "Cognify AI"}: ${m.text}`).join("\n\n");
  }

  function handleSaveNotes() {
    setSavedNotes((prev) => [{
      id: `note_${Date.now()}`,
      meta: { subject: "General", chapter: "", topic: "Voice Learning session", difficulty: "—" },
      data: { shortNotes: summary || "No summary generated.", detailedNotes: transcriptText(), keyPoints: [], definitions: [], formulas: [], examples: [], summary: summary || "", revisionNotes: [] },
      createdAt: Date.now(),
    }, ...prev]);
    setNotesSaved(true);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto">
      <PageHeader title="Voice Learning" subtitle="Talk it through — ask out loud, and hear the answer back." />

      <Card className="p-6 mb-5 text-center">
        <button
          onClick={speech.listening ? handleStopListening : speech.start}
          disabled={!speech.supported || thinking}
          aria-label={speech.listening ? "Stop and send" : "Start speaking"}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-all"
          style={speech.listening ? { background: C.flag, boxShadow: "0 0 0 8px rgba(248,113,113,0.15)" } : { backgroundImage: GRADIENT, boxShadow: GLOW }}
        >
          <Mic size={28} color="#fff" />
        </button>
        <p className="text-sm" style={{ color: C.slate }}>
          {!speech.supported ? "Voice input isn't supported in this browser." : speech.listening ? "Listening — tap to stop and send" : thinking ? "Thinking…" : "Tap to start speaking"}
        </p>
        {speech.listening && speech.transcript && <p className="text-sm mt-3 italic" style={{ color: C.inkSoft }}>"{speech.transcript}"</p>}
        {thinking && <div className="mt-3 flex justify-center"><TypingIndicator /></div>}
      </Card>

      {tts.supported && (
        <Card className="p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {!tts.speaking && <Btn size="sm" variant="secondary" onClick={replayLast} disabled={transcript.length === 0}><Play size={13} /> Play last answer</Btn>}
              {tts.speaking && !tts.paused && <Btn size="sm" variant="secondary" onClick={tts.pause}><Pause size={13} /> Pause</Btn>}
              {tts.paused && <Btn size="sm" variant="secondary" onClick={tts.resume}><Play size={13} /> Resume</Btn>}
              <Btn size="sm" variant="ghost" onClick={tts.stop} disabled={!tts.speaking}><Square size={12} /> Stop</Btn>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: C.slate }}>Speed</span>
              <input type="range" min="0.5" max="2" step="0.1" value={tts.rate} onChange={(e) => tts.setRate(Number(e.target.value))} aria-label="Playback speed" style={{ accentColor: C.chalk }} />
              <span className="text-xs w-8" style={{ color: C.slate }}>{tts.rate.toFixed(1)}x</span>
            </div>
          </div>
        </Card>
      )}

      {error && <p className="text-sm mb-4" style={{ color: C.flag }}>{error}</p>}

      {transcript.length > 0 && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.slateLight }}>Transcript</h2>
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="secondary" onClick={() => downloadText("voice-transcript.txt", transcriptText())}><Download size={13} /> Download transcript</Btn>
              <Btn size="sm" variant="secondary" onClick={handleSummarize} disabled={summarizing}>{summarizing ? <Spinner size={13} /> : <Sparkles size={13} />} Generate summary</Btn>
            </div>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto cognify-smooth-scroll">
            {transcript.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] rounded-xl px-3.5 py-2 text-sm" style={m.role === "user" ? { backgroundImage: GRADIENT, color: "#fff" } : { background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: C.ink }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </Card>
      )}

      {summary && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.slateLight }}>Session summary</h2>
            <div className="flex items-center gap-2">
              <CopyShareBar getText={() => summary} filename="voice-session-summary.txt" />
              <Btn size="sm" variant="secondary" onClick={handleSaveNotes} disabled={notesSaved}>{notesSaved ? <><Check size={13} /> Saved</> : "Save notes"}</Btn>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{summary}</p>
        </Card>
      )}
    </div>
  );
}
