import { useState } from "react";
import { Plus } from "lucide-react";
import { generateFlashcards } from "./aiClient";
import { BOX_DAYS, C, GLASS_BG, SUBJECTS, inputClass, inputStyle, subjectColor } from "./theme";
import { Btn, Card, Empty, Field, Pill } from "./ui";

export function Flashcards({ decks, setDecks, logActivity }) {
  const [creating, setCreating] = useState(false);
  const [studying, setStudying] = useState(null);

  if (studying) {
    return <StudySession deck={studying} onExit={(updated) => { setDecks((p) => p.map((d) => (d.id === updated.id ? updated : d))); setStudying(null); }} logActivity={logActivity} />;
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Flashcards</h1>
          <p className="text-sm mt-1" style={{ color: C.slate }}>Cards you keep missing come back sooner.</p>
        </div>
        <Btn onClick={() => setCreating(true)}><Plus size={14} /> New deck</Btn>
      </div>

      {creating && <CreateDeck onCancel={() => setCreating(false)} onCreated={(d) => { setDecks((p) => [d, ...p]); setCreating(false); }} />}

      {decks.length === 0 && !creating ? (
        <Card><Empty title="No decks yet" description="Create a deck from a topic and Cognify will generate the cards for you." action={<Btn onClick={() => setCreating(true)}>Create your first deck</Btn>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {decks.map((d) => {
            const due = d.cards.filter((c) => c.nextReview <= Date.now()).length;
            return (
              <Card key={d.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: C.ink }}>{d.title}</h3>
                  <Pill color={subjectColor(d.subject)}>{d.subject}</Pill>
                </div>
                <p className="text-xs mb-4" style={{ color: C.slate }}>{d.cards.length} cards {due > 0 && <span style={{ color: C.flag }} className="font-medium">· {due} due</span>}</p>
                <div className="mt-auto flex gap-2">
                  <Btn size="sm" className="flex-1" onClick={() => setStudying(d)}>Study</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setDecks((p) => p.filter((x) => x.id !== d.id))}>Delete</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CreateDeck({ onCancel, onCreated }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setError(null);
    if (!topic.trim()) return setError("Enter a topic first.");
    setGenerating(true);
    try {
      const generated = await generateFlashcards(topic, subject, count);
      setCards(generated);
      if (!title) setTitle(topic);
    } catch (err) {
      setError(err.message || "Could not generate flashcards.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSave() {
    if (!title.trim() || cards.length === 0) return setError("Give the deck a title and generate at least one card.");
    onCreated({ id: `deck_${Date.now()}`, title: title.trim(), subject, cards });
  }

  return (
    <Card className="p-5 mb-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Deck title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} placeholder="Spanish Verbs" /></Field>
        <Field label="Subject">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} style={inputStyle}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Common irregular verbs" /></Field>
      <Field label="Number of cards"><input type="number" min={4} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className={inputClass} style={inputStyle} /></Field>
      <Btn type="button" variant="secondary" onClick={handleGenerate} disabled={generating}>{generating ? "Generating…" : "Generate cards"}</Btn>

      {cards.length > 0 && (
        <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs mb-2" style={{ color: C.slate }}>{cards.length} cards ready</p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 cognify-smooth-scroll">
            {cards.map((c) => (
              <div key={c.id} className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                <span className="font-medium">{c.front}</span> — {c.back}
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel} type="button">Cancel</Btn>
        <Btn onClick={handleSave} disabled={cards.length === 0}>Save deck</Btn>
      </div>
    </Card>
  );
}

export function StudySession({ deck, onExit, logActivity }) {
  const dueCards = deck.cards.filter((c) => c.nextReview <= Date.now());
  const queue = dueCards.length > 0 ? dueCards : deck.cards;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [working, setWorking] = useState(deck.cards);
  const [reviewed, setReviewed] = useState(0);
  const current = queue[index];

  function grade(knewIt) {
    const updated = working.map((c) => {
      if (c.id !== current.id) return c;
      const newLevel = knewIt ? Math.min(c.boxLevel + 1, 4) : 0;
      return { ...c, boxLevel: newLevel, nextReview: Date.now() + BOX_DAYS[newLevel] * 86400000 };
    });
    setWorking(updated);
    setReviewed((n) => n + 1);
    setFlipped(false);
    if (index + 1 < queue.length) setIndex((i) => i + 1);
    else {
      logActivity({ minutes: 2, cardsReviewed: reviewed + 1, xpEarned: reviewed + 1 });
      onExit({ ...deck, cards: updated });
    }
  }

  if (!current) return <div className="px-6 py-16 text-center"><p style={{ color: C.slate }} className="mb-4">No cards to study right now.</p><Btn variant="secondary" onClick={() => onExit(deck)}>Back to decks</Btn></div>;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onExit({ ...deck, cards: working })} className="text-xs" style={{ color: C.inkSoft }}>← Exit session</button>
        <span className="text-xs" style={{ color: C.slate }}>{index + 1} / {queue.length}</span>
      </div>
      <button onClick={() => setFlipped((f) => !f)} className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center p-8 text-center mb-6 backdrop-blur-xl transition-all hover:brightness-110" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, boxShadow: "0 8px 32px -8px rgba(139,92,246,0.25)" }}>
        <p className="text-xl" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{flipped ? current.back : current.front}</p>
      </button>
      <p className="text-center text-xs mb-6" style={{ color: C.slate }}>Tap the card to {flipped ? "see the question" : "reveal the answer"}</p>
      {flipped && (
        <div className="flex gap-3">
          <Btn variant="danger" className="flex-1" onClick={() => grade(false)}>Still learning</Btn>
          <Btn variant="primary" className="flex-1" onClick={() => grade(true)}>Knew it</Btn>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Progress ---------------------------------- */
