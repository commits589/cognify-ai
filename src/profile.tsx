import { useState, useRef } from "react";
import { uploadUserFile } from "./storage";
import { BOARDS, C, GRADIENT, INDIAN_LANGUAGES, LEARNING_STYLES, SUBJECTS, inputClass, inputStyle } from "./theme";
import { Btn, Card, Field, PageHeader } from "./ui";

export function Profile({ user, setUser, lang, setLang }) {
  const [name, setName] = useState(user.displayName);
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || "");
  const [school, setSchool] = useState(user.school || "");
  const [board, setBoard] = useState(user.board || "CBSE");
  const [subjects, setSubjects] = useState(user.subjects || []);
  const [learningStyle, setLearningStyle] = useState(user.learningStyle || "Mixed");
  const [photoURL, setPhotoURL] = useState(user.photoURL || null);
  const [photoError, setPhotoError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  function toggleSubject(s) {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setPhotoError("Image must be under 5MB.");
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      // Storage (not a base64 string in Firestore) — a multi-MB photo as base64
      // would blow past Firestore's 1MB-per-document limit.
      const { url } = await uploadUserFile(user.uid, file, "avatars");
      setPhotoURL(url);
    } catch {
      setPhotoError("Could not upload photo. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setUser({ ...user, displayName: name, gradeLevel, school, board, subjects, learningStyle, photoURL });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-xl mx-auto">
      <PageHeader title="Profile" subtitle="Manage how Cognify addresses you and tailors your experience." />
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundImage: GRADIENT }}>
            {photoURL ? <img src={photoURL} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-2xl font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#fff" }}>{name?.[0]?.toUpperCase() || "?"}</span>}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <Btn type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Change photo</Btn>
            {photoError && <p className="text-xs mt-1.5" style={{ color: C.flag }}>{photoError}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} /></Field>
          <Field label="Email"><input value={user.email} disabled className={inputClass} style={{ ...inputStyle, background: "rgba(255,255,255,0.05)", color: C.slate }} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Role"><input value={user.role} disabled className={`${inputClass} capitalize`} style={{ ...inputStyle, background: "rgba(255,255,255,0.05)", color: C.slate }} /></Field>
            {user.role === "student" && (
              <Field label="Grade"><input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 9th grade" /></Field>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="School"><input value={school} onChange={(e) => setSchool(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Lincoln High School" /></Field>
            <Field label="Board">
              <select value={board} onChange={(e) => setBoard(e.target.value)} className={inputClass} style={inputStyle}>
                {BOARDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
          </div>

          <div>
            <span className="block text-xs font-medium mb-1.5" style={{ color: C.inkSoft }}>Subjects</span>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button type="button" key={s} onClick={() => toggleSubject(s)} className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={subjects.includes(s) ? { backgroundImage: GRADIENT, color: "#fff" } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft, border: `1px solid ${GLASS_BORDER}` }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Field label="Preferred language">
            <select value={lang.name} onChange={(e) => setLang({ name: e.target.value })} className={inputClass} style={inputStyle}>
              {["English", ...INDIAN_LANGUAGES].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>

          <Field label="Learning preferences">
            <select value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)} className={inputClass} style={inputStyle}>
              {LEARNING_STYLES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <p className="text-xs -mt-2" style={{ color: C.slateLight }}>For deeper accessibility and teaching-style controls, see Learning Support in the sidebar.</p>

          <div className="flex items-center gap-3 pt-2">
            <Btn type="submit">Save changes</Btn>
            {saved && <span className="text-sm" style={{ color: C.sageDark }}>Saved.</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
