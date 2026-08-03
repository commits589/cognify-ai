import { useState, useEffect, useRef } from "react";
import { Mic, Plus, Search, Pin, PinOff, Pencil, X, Copy, Volume2, Share2, RefreshCw, Square, Paperclip } from "lucide-react";
import { fileToBase64, streamTutor } from "./aiClient";
import { useSpeechRecognition, useSpeechSynthesis } from "./hooks";
import { C, GLASS_BG, GLASS_BORDER, GLOW, GRADIENT, SUBJECTS, inputStyle, subjectColor } from "./theme";
import { Btn, Pill, Empty, AttachmentChip, MessageContent, TypingIndicator, Spinner } from "./ui";

export function Chat({ sessions, setSessions, logActivity, seed, onConsumeSeed, user, a11y, lang }) {
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [subject, setSubject] = useState("General");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const streamRef = useRef("");
  const fileInputRef = useRef(null);
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  useEffect(() => { if (speech.transcript) setInput(speech.transcript); }, [speech.transcript]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);

  useEffect(() => {
    if (!seed) return;
    setSubject(seed.subject || "General");
    if (seed.autoSend && seed.message) {
      sendMessage(seed.message);
    } else if (seed.message) {
      setInput(seed.message);
    } else if (seed.autoVoice && speech.supported) {
      setTimeout(() => speech.start(), 300);
    }
    onConsumeSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  function openSession(s) {
    setActiveId(s.id);
    setMessages(s.messages);
    setSubject(s.subject);
    setSidebarOpen(false);
  }
  function startNew() {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }
  function deleteSession(id, e) {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) startNew();
  }
  function togglePin(id, e) {
    e.stopPropagation();
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
  }
  function startRename(s, e) {
    e.stopPropagation();
    setRenamingId(s.id);
    setRenameValue(s.title);
  }
  function commitRename(id) {
    if (renameValue.trim()) setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: renameValue.trim() } : s)));
    setRenamingId(null);
  }
  function clearConversation() {
    setMessages([]);
    if (activeId) setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, messages: [] } : s)));
  }

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
        setPendingAttachments((prev) => [...prev, { id: `att_${Date.now()}_${Math.random()}`, name: file.name, kind: isImage ? "image" : "pdf", mediaType: file.type, base64 }]);
      }
    } finally {
      setUploading(false);
    }
  }
  function removeAttachment(id) {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function runStream(history, sid) {
    abortRef.current = new AbortController();
    streamRef.current = "";
    setStreamingText("");
    setSending(true);
    setError(null);
    try {
      const { content, followUps } = await streamTutor(history, subject, user?.gradeLevel, a11y, lang, {
        signal: abortRef.current.signal,
        onDelta: (text) => { streamRef.current = text; setStreamingText(text); },
      });
      const finalText = content || streamRef.current;
      const assistantMsg = { id: `m_${Date.now() + 1}`, role: "assistant", content: finalText, followUps };
      const updated = [...history, assistantMsg];
      setMessages(updated);
      setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, messages: updated } : s)));
      logActivity({ minutes: 1, xpEarned: 2 });
      if (a11y?.audioExplanations && tts.supported) tts.speak(finalText.replace(/[#*`_]/g, ""));
    } catch (err) {
      if (err.name === "AbortError") {
        const assistantMsg = { id: `m_${Date.now() + 1}`, role: "assistant", content: streamRef.current || "*Generation stopped.*", followUps: [] };
        const updated = [...history, assistantMsg];
        setMessages(updated);
        setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, messages: updated } : s)));
      } else {
        setError(err.message);
      }
    } finally {
      setSending(false);
      setStreamingText("");
      abortRef.current = null;
    }
  }

  async function sendMessage(text) {
    if ((!text.trim() && pendingAttachments.length === 0) || sending) return;
    setError(null);
    const userMsg = { id: `m_${Date.now()}`, role: "user", content: text.trim(), attachments: pendingAttachments.length ? pendingAttachments : undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingAttachments([]);
    speech.reset();

    let sid = activeId;
    if (!sid) {
      sid = `s_${Date.now()}`;
      setActiveId(sid);
      const title = text.trim().slice(0, 60) || (userMsg.attachments ? `${userMsg.attachments[0].name}` : "New chat");
      setSessions((prev) => [{ id: sid, title, subject, messages: [], pinned: false }, ...prev]);
    }
    runStream(next, sid);
  }
  function handleSend(e) {
    e.preventDefault();
    sendMessage(input);
  }
  function stopGeneration() {
    abortRef.current?.abort();
  }
  function regenerate() {
    if (sending) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const cutIdx = messages.length - 1 - lastUserIdx;
    const history = messages.slice(0, cutIdx + 1);
    setMessages(history);
    runStream(history, activeId);
  }
  function continueResponse() {
    if (sending) return;
    sendMessage("Please continue exactly where you left off.");
  }
  async function shareMessage(content) {
    if (navigator.share) {
      try { await navigator.share({ title: "Cognify AI", text: content }); return; } catch { /* user cancelled */ }
    }
    navigator.clipboard?.writeText(content);
  }
  function copyMessage(content) {
    navigator.clipboard?.writeText(content);
  }

  const filteredSessions = sessions
    .filter((s) => !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const lastAssistantIdx = [...messages].map((m, i) => (m.role === "assistant" ? i : -1)).filter((i) => i >= 0).pop();

  return (
    <div className="flex flex-col md:flex-row cognify-chat-h" style={{ height: "calc(100vh - 3.5rem - 5rem)" }}>
      <style>{`@media (min-width: 768px) { .cognify-chat-h { height: 100vh !important; } }`}</style>
      <div id="chat-session-list" className={`${sidebarOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-72 shrink-0 pt-16 md:pt-6 px-4 pb-4 absolute md:relative inset-0 z-10 md:z-auto backdrop-blur-xl`} style={{ borderRight: `1px solid ${GLASS_BORDER}`, background: "rgba(18,20,42,0.75)" }}>
        <Btn size="sm" onClick={startNew} className="mb-3 w-full"><Plus size={14} /> New chat</Btn>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${GLASS_BORDER}` }}>
          <Search size={13} color={C.slateLight} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chats…" aria-label="Search chats" className="flex-1 bg-transparent outline-none text-xs" style={{ color: C.ink }} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 cognify-smooth-scroll">
          {filteredSessions.length === 0 ? (
            <p className="text-xs px-2" style={{ color: C.slate }}>{sessions.length === 0 ? "No conversations yet." : "No chats match your search."}</p>
          ) : (
            filteredSessions.map((s) => (
              <div key={s.id} onClick={() => openSession(s)} role="button" tabIndex={0} aria-label={`Open chat: ${s.title || "Untitled chat"}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSession(s); } }}
                className="group w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 cursor-pointer"
                style={activeId === s.id ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { color: C.ink }}>
                {renamingId === s.id ? (
                  <input
                    autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(s.id); if (e.key === "Escape") setRenamingId(null); }}
                    onBlur={() => commitRename(s.id)}
                    className="flex-1 bg-transparent outline-none border-b text-sm"
                    style={{ color: activeId === s.id ? "#fff" : C.ink, borderColor: "rgba(255,255,255,0.3)" }}
                  />
                ) : (
                  <span className="truncate flex-1 flex items-center gap-1.5">
                    {s.pinned && <Pin size={11} className="shrink-0" />}
                    {s.title || "Untitled chat"}
                  </span>
                )}
                <span className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center gap-1.5">
                  <button type="button" aria-label={s.pinned ? "Unpin chat" : "Pin chat"} onClick={(e) => togglePin(s.id, e)}>{s.pinned ? <PinOff size={12} /> : <Pin size={12} />}</button>
                  <button type="button" aria-label="Rename chat" onClick={(e) => startRename(s, e)}><Pencil size={12} /></button>
                  <button type="button" aria-label="Delete chat" onClick={(e) => deleteSession(s.id, e)}><X size={12} /></button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 pt-2 md:pt-0">
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
          <button className="md:hidden text-sm font-medium px-2 py-1" style={{ color: C.inkSoft }} onClick={() => setSidebarOpen((v) => !v)} aria-expanded={sidebarOpen} aria-controls="chat-session-list">Chats</button>
          <div className="flex items-center gap-2 overflow-x-auto" role="group" aria-label="Filter by subject">
            {SUBJECTS.map((s) => (
              <button key={s} onClick={() => setSubject(s)} aria-pressed={subject === s} className="shrink-0" style={{ opacity: subject === s ? 1 : 0.55 }}>
                <Pill color={subjectColor(s)}>{s}</Pill>
              </button>
            ))}
          </div>
          {messages.length > 0 && (
            <button onClick={clearConversation} className="hidden sm:block shrink-0 text-xs hover:underline" style={{ color: C.slateLight }}>Clear conversation</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5 cognify-smooth-scroll">
          {messages.length === 0 ? (
            <Empty title="Ask me anything about your studies" description="Pick a subject above, then ask a question, paste a problem, attach an image or PDF, or use the mic. I'll walk through it with you rather than just giving the answer." />
          ) : (
            messages.map((m, idx) => (
              <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className="max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={m.role === "user" ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW } : { background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: C.ink, backdropFilter: "blur(12px)" }}>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">{m.attachments.map((a) => <AttachmentChip key={a.id} att={a} />)}</div>
                  )}
                  {m.role === "assistant" ? <MessageContent text={m.content} /> : <span className="whitespace-pre-wrap">{m.content}</span>}
                </div>

                {m.role === "assistant" && (
                  <div className="flex items-center gap-3 mt-1.5 px-1">
                    <button onClick={() => copyMessage(m.content)} className="text-xs flex items-center gap-1" style={{ color: C.slateLight }}><Copy size={11} /> Copy</button>
                    {tts.supported && <button onClick={() => tts.speak(m.content)} className="text-xs flex items-center gap-1" style={{ color: C.slateLight }}><Volume2 size={11} /> {tts.speaking ? "Speaking…" : "Listen"}</button>}
                    <button onClick={() => shareMessage(m.content)} className="text-xs flex items-center gap-1" style={{ color: C.slateLight }}><Share2 size={11} /> Share</button>
                    {idx === lastAssistantIdx && !sending && (
                      <>
                        <button onClick={regenerate} className="text-xs flex items-center gap-1" style={{ color: C.slateLight }}><RefreshCw size={11} /> Regenerate</button>
                        <button onClick={continueResponse} className="text-xs flex items-center gap-1" style={{ color: C.slateLight }}>Continue</button>
                      </>
                    )}
                  </div>
                )}

                {m.role === "assistant" && idx === lastAssistantIdx && !sending && m.followUps?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%] sm:max-w-[75%]">
                    {m.followUps.map((fq, i) => (
                      <button key={i} onClick={() => sendMessage(fq)} className="text-xs px-3 py-1.5 rounded-full text-left transition-all hover:brightness-110"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}`, color: C.inkSoft }}>
                        {fq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {sending && (
            <div className="flex flex-col items-start">
              <div className="max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: C.ink, backdropFilter: "blur(12px)" }}>
                {streamingText ? <MessageContent text={streamingText} streaming /> : <TypingIndicator />}
              </div>
              <button onClick={stopGeneration} className="flex items-center gap-1.5 text-xs mt-1.5 px-3 py-1.5 rounded-full" style={{ color: C.flag, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)" }}>
                <Square size={10} /> Stop generating
              </button>
            </div>
          )}
          {error && <p className="text-sm text-center" style={{ color: C.flag }}>{error}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 md:px-6 py-4" style={{ borderTop: `1px solid ${GLASS_BORDER}` }}>
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {pendingAttachments.map((a) => <AttachmentChip key={a.id} att={a} onRemove={() => removeAttachment(a.id)} />)}
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Attach image or PDF"
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{ border: `1px solid ${GLASS_BORDER}`, color: C.ink, background: GLASS_BG }}>
              {uploading ? <Spinner size={15} /> : <Paperclip size={16} />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder="Ask Cognify AI anything…"
              rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none max-h-32"
              style={inputStyle}
            />
            {speech.supported && (
              <button type="button" onClick={speech.listening ? speech.stop : speech.start}
                aria-label={speech.listening ? "Stop voice input" : "Start voice input"} aria-pressed={speech.listening}
                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                style={speech.listening ? { background: C.flag, color: "#fff" } : { border: `1px solid ${GLASS_BORDER}`, color: C.ink, background: GLASS_BG }}>
                <Mic size={16} />
              </button>
            )}
            <Btn type="submit" disabled={sending || (!input.trim() && pendingAttachments.length === 0)}>Send</Btn>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Quizzes ---------------------------------- */
