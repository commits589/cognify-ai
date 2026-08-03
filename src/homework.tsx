import { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Paperclip } from "lucide-react";
import { fileToBase64, solveHomework } from "./aiClient";
import { useSpeechRecognition, useSpeechSynthesis } from "./hooks";
import { C, GLASS_BG, GRADIENT, inputClass, inputStyle } from "./theme";
import { AttachmentChip, Btn, Card, CopyShareBar, InlineMarkdown, PageHeader, SectionBlock, SkeletonCard, Spinner } from "./ui";

export function HomeworkHelper({ user, logActivity, allowUploads = true }) {
  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  useEffect(() => { if (speech.transcript) setQuestion(speech.transcript); }, [speech.transcript]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        if (!isImage && !isPdf) continue;
        const base64 = await fileToBase64(file);
        setAttachments((prev) => [...prev, { id: `hw_${Date.now()}_${Math.random()}`, name: file.name, kind: isImage ? "image" : "pdf", mediaType: file.type, base64 }]);
      }
    } finally {
      setUploading(false);
    }
  }
  function removeAttachment(id) { setAttachments((prev) => prev.filter((a) => a.id !== id)); }

  async function handleSolve() {
    setError(null);
    if (!question.trim() && attachments.length === 0) return setError("Type a question, or attach an image/PDF of it.");
    setLoading(true);
    setResult(null);
    try {
      const data = await solveHomework(question.trim(), attachments, user?.gradeLevel);
      setResult(data);
      setHistory((prev) => [{ id: `hh_${Date.now()}`, question: data.question, data }, ...prev].slice(0, 20));
      logActivity({ minutes: 3, xpEarned: 5 });
      speech.reset();
    } catch (err) {
      setError(err.message || "Could not solve this right now.");
    } finally {
      setLoading(false);
    }
  }

  function getShareText() {
    if (!result) return "";
    return `Question:\n${result.question}\n\nUnderstanding:\n${result.understanding}\n\nStep-by-step solution:\n${(result.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nFinal answer:\n${result.finalAnswer}\n\nExplanation:\n${result.explanation}`;
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <PageHeader title="Homework Helper" subtitle="Type it, snap a photo, or upload a PDF — you'll get the reasoning, not just the answer." />

      <Card className="p-5 mb-5">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">{attachments.map((a) => <AttachmentChip key={a.id} att={a} onRemove={() => removeAttachment(a.id)} />)}</div>
        )}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          className={inputClass}
          style={inputStyle}
          placeholder="Type your homework question here, or attach a photo/PDF of it below…"
          aria-label="Homework question"
        />
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {allowUploads && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
              <Btn size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Spinner size={14} /> : <Paperclip size={14} />} Attach image / PDF
              </Btn>
            </>
          )}
          {speech.supported && (
            <Btn size="sm" variant={speech.listening ? "danger" : "secondary"} onClick={speech.listening ? speech.stop : speech.start} aria-pressed={speech.listening}>
              <Mic size={14} /> {speech.listening ? "Stop" : "Ask by voice"}
            </Btn>
          )}
          <div className="flex-1" />
          <Btn onClick={handleSolve} disabled={loading}>{loading ? <><Spinner /> Solving…</> : "Solve it"}</Btn>
        </div>
        {error && <p className="text-sm mt-3" style={{ color: C.flag }}>{error}</p>}
      </Card>

      {loading && <SkeletonCard lines={5} className="mb-6" />}

      {result && (
        <div className="space-y-4 mb-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.slateLight }}>Breakdown</span>
              <div className="flex items-center gap-2">
                <CopyShareBar getText={getShareText} filename="homework-solution.txt" />
                {tts.supported && <Btn size="sm" variant="secondary" onClick={() => tts.speak(getShareText())}><Volume2 size={13} /> {tts.speaking ? "Speaking…" : "Listen"}</Btn>}
              </div>
            </div>

            <SectionBlock label="Question" color={C.slate}><p className="text-sm" style={{ color: C.ink }}>{result.question}</p></SectionBlock>
            <SectionBlock label="Understanding" color="#4F8CFF"><p className="text-sm" style={{ color: C.inkSoft }}>{result.understanding}</p></SectionBlock>
            <SectionBlock label="Step-by-step solution" color="#8B5CF6">
              <ol className="space-y-2">
                {(result.steps || []).map((s, i) => (
                  <li key={i} className="text-sm flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundImage: GRADIENT, color: "#fff" }}>{i + 1}</span>
                    <InlineMarkdown text={s} />
                  </li>
                ))}
              </ol>
            </SectionBlock>
            <SectionBlock label="Final answer" color={C.sage}>
              <p className="text-sm font-semibold px-3.5 py-2.5 rounded-lg inline-block" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: C.sage }}>{result.finalAnswer}</p>
            </SectionBlock>
            <SectionBlock label="Explanation" color={C.chalkLight} last><p className="text-sm" style={{ color: C.inkSoft }}>{result.explanation}</p></SectionBlock>
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-2" style={{ color: C.inkSoft }}>Recent questions</h2>
          <div className="space-y-1.5">
            {history.map((h) => (
              <button key={h.id} onClick={() => setResult(h.data)} className="w-full text-left text-sm px-3.5 py-2.5 rounded-lg truncate" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: C.inkSoft }}>
                {h.question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
