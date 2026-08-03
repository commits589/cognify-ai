import { useState } from "react";
import { X, Copy, Share2, Image as ImageIcon, FileText, Check, Download, ToggleLeft } from "lucide-react";
import { downloadText } from "./aiClient";
import { C, CODE_TOKEN_RE, FENCE_RE, GLASS_BG, GLASS_BORDER, GLOW, GRADIENT, INLINE_RE } from "./theme";

export function Btn({ children, variant = "primary", size = "md", className = "", style, onClick, ...rest }) {
  const [ripples, setRipples] = useState([]);
  const variants = {
    primary: { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW, border: "none" },
    secondary: { background: "rgba(255,255,255,0.07)", color: C.ink, border: `1px solid ${GLASS_BORDER}` },
    ghost: { background: "transparent", color: C.inkSoft, border: "1px solid transparent" },
    danger: { background: "rgba(248,113,113,0.15)", color: C.flag, border: "1px solid rgba(248,113,113,0.3)" },
  };
  const sizes = { sm: "text-sm px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-base px-6 py-3" };
  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 2;
    const id = `${Date.now()}_${Math.random()}`;
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left - d / 2, y: e.clientY - rect.top - d / 2, size: d }]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    onClick?.(e);
  }
  return (
    <button
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-px active:translate-y-0 ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      onClick={handleClick}
      {...rest}
    >
      {children}
      {ripples.map((r) => (
        <span key={r.id} className="cognify-ripple" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} aria-hidden="true" />
      ))}
    </button>
  );
}

export function Card({ children, className = "", style }) {
  return (
    <div
      className={`cognify-card rounded-2xl border backdrop-blur-xl ${className}`}
      style={{ background: GLASS_BG, borderColor: GLASS_BORDER, boxShadow: "0 1px 1px rgba(0,0,0,0.2), 0 12px 32px -12px rgba(0,0,0,0.5)", ...style }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: C.inkSoft, border: `1px solid ${GLASS_BORDER}` }}>
      {color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />}
      {children}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1.5" style={{ color: C.inkSoft }}>{label}</span>
      {children}
    </label>
  );
}

export function Spinner({ size = 18, color = C.inkSoft }) {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function TypingIndicator({ color = C.inkSoft }) {
  return (
    <div className="flex items-center gap-1.5 py-0.5" role="status" aria-label="AI is typing">
      <span className="cognify-typing-dot" style={{ background: color }} />
      <span className="cognify-typing-dot" style={{ background: color }} />
      <span className="cognify-typing-dot" style={{ background: color }} />
    </div>
  );
}

export function Skeleton({ className = "", style }) {
  return <div className={`cognify-skeleton rounded-md ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCard({ lines = 4, showHeader = true, className = "" }) {
  return (
    <Card className={`p-5 md:p-6 ${className}`} role="status" aria-label="Loading">
      {showHeader && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <Skeleton className="h-4" style={{ width: "38%" }} />
          <Skeleton className="h-7 rounded-full" style={{ width: 90 }} />
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: i === lines - 1 ? "55%" : `${88 - i * 4}%` }} />
        ))}
      </div>
    </Card>
  );
}

export function Empty({ title, description, action }) {
  return (
    <div className="text-center py-14 px-6">
      <h3 className="text-xl mb-2" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{title}</h3>
      <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: C.slate }}>{description}</p>
      {action}
    </div>
  );
}

/* ---------------------------------- markdown / code rendering ---------------------------------- */

export function highlightLine(line) {
  const nodes = [];
  let lastIndex = 0, m, key = 0;
  CODE_TOKEN_RE.lastIndex = 0;
  while ((m = CODE_TOKEN_RE.exec(line))) {
    if (m.index > lastIndex) nodes.push(<span key={key++}>{line.slice(lastIndex, m.index)}</span>);
    const color = m[1] ? "#6EE7B7" : m[2] ? "#7C7A99" : m[3] ? "#FBBF24" : "#C4B5FD";
    const style = m[2] ? { color, fontStyle: "italic" } : { color };
    nodes.push(<span key={key++} style={style}>{m[0]}</span>);
    lastIndex = CODE_TOKEN_RE.lastIndex;
  }
  if (lastIndex < line.length) nodes.push(<span key={key++}>{line.slice(lastIndex)}</span>);
  return nodes;
}

export function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl overflow-hidden my-2" style={{ border: `1px solid ${GLASS_BORDER}`, background: "rgba(0,0,0,0.35)" }}>
      <div className="flex items-center justify-between px-3.5 py-2" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
        <span className="text-xs font-mono" style={{ color: C.slateLight }}>{lang || "text"}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs" style={{ color: copied ? C.sage : C.slateLight }}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed" style={{ margin: 0 }}>
        <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: C.ink }}>
          {code.split("\n").map((line, i) => <div key={i}>{highlightLine(line) || "\u00A0"}</div>)}
        </code>
      </pre>
    </div>
  );
}

export function InlineMarkdown({ text }) {
  const nodes = [];
  let lastIndex = 0, m, key = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text))) {
    if (m.index > lastIndex) nodes.push(<span key={key++}>{text.slice(lastIndex, m.index)}</span>);
    if (m[1]) nodes.push(<strong key={key++} style={{ color: C.ink, fontWeight: 600 }}>{m[1].slice(2, -2)}</strong>);
    else if (m[2]) nodes.push(<code key={key++} className="px-1.5 py-0.5 rounded text-[0.85em]" style={{ background: "rgba(139,92,246,0.15)", color: C.chalkLight, fontFamily: "ui-monospace, monospace" }}>{m[2].slice(1, -1)}</code>);
    else if (m[3]) nodes.push(<span key={key++} style={{ fontFamily: "Space Grotesk, serif", fontStyle: "italic", color: C.chalkLight }}>{m[3].slice(1, -1)}</span>);
    else if (m[4]) nodes.push(<em key={key++}>{m[4].slice(1, -1)}</em>);
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return <>{nodes}</>;
}

export function MarkdownBlock({ text }) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // block math $$...$$
    if (line.trim().startsWith("$$")) {
      const collected = [line.trim().slice(2)];
      i++;
      while (i < lines.length && !lines[i].includes("$$")) { collected.push(lines[i]); i++; }
      if (i < lines.length) { collected.push(lines[i].split("$$")[0]); i++; }
      blocks.push({ type: "math", content: collected.join(" ").trim() });
      continue;
    }
    // heading
    const heading = line.match(/^(#{1,6})\s+(.*)/);
    if (heading) { blocks.push({ type: "heading", level: heading[1].length, content: heading[2] }); i++; continue; }
    // table
    if (line.includes("|") && lines[i + 1] && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const headerCells = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push({ type: "table", header: headerCells, rows });
      continue;
    }
    // blockquote
    if (line.trim().startsWith("> ")) {
      const collected = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { collected.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      blocks.push({ type: "quote", content: collected.join(" ") });
      continue;
    }
    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
      blocks.push({ type: "ul", items });
      continue;
    }
    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      blocks.push({ type: "ol", items });
      continue;
    }
    // paragraph
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s|^\s*[-*]\s+|^\s*\d+\.\s+|^\s*>\s|^\s*\$\$/.test(lines[i]) && !(lines[i].includes("|") && lines[i + 1] && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]))) {
      para.push(lines[i]); i++;
    }
    blocks.push({ type: "p", content: para.join(" ") });
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const Tag = `h${Math.min(b.level + 2, 6)}`;
          return <Tag key={idx} style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: C.ink, fontSize: b.level === 1 ? "1.15em" : "1.05em", marginTop: idx > 0 ? 6 : 0 }}><InlineMarkdown text={b.content} /></Tag>;
        }
        if (b.type === "math") return <div key={idx} className="text-center py-2 text-base" style={{ fontFamily: "Space Grotesk, serif", fontStyle: "italic", color: C.chalkLight }}>{b.content}</div>;
        if (b.type === "quote") return <div key={idx} className="pl-3 py-1 text-sm italic" style={{ borderLeft: `2px solid ${C.chalk}`, color: C.inkSoft }}><InlineMarkdown text={b.content} /></div>;
        if (b.type === "ul") return <ul key={idx} className="list-disc pl-5 space-y-1 text-sm">{b.items.map((it, j) => <li key={j}><InlineMarkdown text={it} /></li>)}</ul>;
        if (b.type === "ol") return <ol key={idx} className="list-decimal pl-5 space-y-1 text-sm">{b.items.map((it, j) => <li key={j}><InlineMarkdown text={it} /></li>)}</ol>;
        if (b.type === "table") {
          return (
            <div key={idx} className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${GLASS_BORDER}` }}>
              <table className="w-full text-xs">
                <thead><tr>{b.header.map((h, j) => <th key={j} className="text-left px-3 py-2 font-medium" style={{ background: "rgba(255,255,255,0.05)", color: C.ink, borderBottom: `1px solid ${GLASS_BORDER}` }}>{h}</th>)}</tr></thead>
                <tbody>{b.rows.map((row, r) => (
                  <tr key={r}>{row.map((cell, c) => <td key={c} className="px-3 py-2" style={{ color: C.inkSoft, borderBottom: r < b.rows.length - 1 ? `1px solid ${GLASS_BORDER}` : "none" }}><InlineMarkdown text={cell} /></td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          );
        }
        return <p key={idx} className="text-sm leading-relaxed"><InlineMarkdown text={b.content} /></p>;
      })}
    </div>
  );
}

export function MessageContent({ text, streaming = false }) {
  const parts = [];
  let lastIndex = 0, m, key = 0;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(text))) {
    if (m.index > lastIndex) parts.push(<MarkdownBlock key={key++} text={text.slice(lastIndex, m.index)} />);
    parts.push(<CodeBlock key={key++} lang={m[1]} code={m[2].replace(/\n$/, "")} />);
    lastIndex = FENCE_RE.lastIndex;
  }
  if (lastIndex < text.length) parts.push(<MarkdownBlock key={key++} text={text.slice(lastIndex)} />);
  return (
    <div className="space-y-2">
      {parts}
      {streaming && <span className="cognify-cursor" aria-hidden="true" />}
    </div>
  );
}

/* ---------------------------------- speech hooks ---------------------------------- */

export function StatCard({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs mb-1" style={{ color: C.slate }}>{label}</p>
      <p className="text-2xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{value}</p>
    </Card>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{title}</h1>
      <p className="text-sm mt-1" style={{ color: C.slate }}>{subtitle}</p>
    </div>
  );
}

export function FeatureDisabledNotice({ feature, setView }) {
  return (
    <div className="px-6 py-20 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
        <ToggleLeft size={24} color={C.flag} />
      </div>
      <h2 className="text-lg mb-2" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{feature} is currently disabled</h2>
      <p className="text-sm mb-5" style={{ color: C.slate }}>Your school administrator has turned this feature off for now.</p>
      <Btn variant="secondary" onClick={() => setView("dashboard")}>Back to Dashboard</Btn>
    </div>
  );
}

export function GoalBar({ label, current, target, unit }) {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  const met = current >= target;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span style={{ color: C.inkSoft }}>{label}</span>
        <span style={{ color: met ? C.sage : C.slate }}>{current}/{target} {unit}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundImage: met ? "linear-gradient(90deg,#34D399,#10B981)" : GRADIENT }} />
      </div>
    </div>
  );
}

/* ---------------------------------- Classes ---------------------------------- */

export function ToggleRow({ label, description, checked, onChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && <Icon size={17} color={checked ? C.chalkLight : C.slate} className="mt-0.5 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: C.ink }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: C.slate }}>{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="shrink-0 w-11 h-6 rounded-full relative transition-all"
        style={{ background: checked ? undefined : "rgba(255,255,255,0.12)", backgroundImage: checked ? GRADIENT : undefined }}
      >
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: checked ? 22 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
      </button>
    </div>
  );
}

export function SectionBlock({ label, color, children, last }) {
  return (
    <div className="mb-4 pb-4" style={{ borderBottom: last ? "none" : `1px solid ${GLASS_BORDER}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

export function AttachmentChip({ att, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${GLASS_BORDER}`, color: C.inkSoft }}>
      {att.kind === "image" ? <ImageIcon size={12} /> : <FileText size={12} />}
      <span className="max-w-[120px] truncate">{att.name}</span>
      {onRemove && <button onClick={onRemove} className="ml-0.5"><X size={11} /></button>}
    </div>
  );
}

export function CopyShareBar({ getText, filename }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  async function share() {
    const text = getText();
    if (navigator.share) {
      try { await navigator.share({ title: "Cognify AI", text }); return; } catch { /* cancelled */ }
    }
    navigator.clipboard?.writeText(text);
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Btn size="sm" variant="secondary" onClick={copy}>{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}</Btn>
      {filename && <Btn size="sm" variant="secondary" onClick={() => downloadText(filename, getText())}><Download size={13} /> Download</Btn>}
      <Btn size="sm" variant="secondary" onClick={share}><Share2 size={13} /> Share</Btn>
    </div>
  );
}

export function DataActionRow({ label, description, actionLabel, variant, icon: Icon, onClick, confirming, done, onConfirm, onCancel }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: C.ink }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: C.slate }}>{description}</p>
      </div>
      {done ? (
        <span className="text-xs shrink-0" style={{ color: C.sage }}>Done ✓</span>
      ) : confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <Btn size="sm" variant="danger" onClick={onConfirm}>Confirm</Btn>
          <Btn size="sm" variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      ) : (
        <Btn size="sm" variant={variant} onClick={onClick} className="shrink-0"><Icon size={13} /> {actionLabel}</Btn>
      )}
    </div>
  );
}

export function SettingsSection({ icon: Icon, title, children }) {
  return (
    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} color={C.chalkLight} />
        <h2 className="text-sm font-semibold" style={{ color: C.ink }}>{title}</h2>
      </div>
      {children}
    </Card>
  );
}
