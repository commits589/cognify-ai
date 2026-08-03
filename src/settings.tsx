import { useState } from "react";
import { MessageSquare, BookOpen, Layers, TrendingUp, Users, ShieldCheck, LogOut, Volume2, GraduationCap, Sparkles, Accessibility, Eye, Globe, Download, Bell, Lock, Sun, Moon, Trash2, Megaphone } from "lucide-react";
import { downloadText } from "./aiClient";
import { C, GRADIENT, INDIAN_LANGUAGES, inputClass, inputStyle } from "./theme";
import { Btn, Field, PageHeader, SettingsSection, ToggleRow } from "./ui";

export function Settings({ user, theme, setTheme, a11y, setA11y, lang, setLang, notifPrefs, setNotifPrefs, privacyPrefs, setPrivacyPrefs, voiceRate, setVoiceRate, appData, onClearData, setView, onSignOut, onSubmitFeedback }) {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  function submitFeedback() {
    if (!feedbackText.trim()) return;
    onSubmitFeedback(feedbackText.trim());
    setFeedbackText("");
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2000);
  }
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [confirmingClear, setConfirmingClear] = useState(false);

  async function requestBrowserNotifications() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    setNotifPrefs({ browserPush: perm === "granted" });
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), user, ...appData };
    downloadText(`cognify-data-${todayKey()}.json`, JSON.stringify(payload, null, 2));
  }

  function handleClearData() {
    onClearData();
    setConfirmingClear(false);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Account, appearance, AI behavior, and data — all in one place." />

      <SettingsSection icon={Users} title="Account">
        <div className="space-y-1 mb-3">
          <p className="text-sm" style={{ color: C.ink }}>{user.displayName}</p>
          <p className="text-xs" style={{ color: C.slate }}>{user.email} · <span className="capitalize">{user.role}</span></p>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setView("profile")}>Edit profile</Btn>
      </SettingsSection>

      <SettingsSection icon={Globe} title="Language">
        <Field label="App & tutor language">
          <select value={lang.name} onChange={(e) => setLang({ name: e.target.value })} className={inputClass} style={inputStyle}>
            {["English", ...INDIAN_LANGUAGES].map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        {lang.name !== "English" && (
          <div className="mt-3"><ToggleRow icon={MessageSquare} label="Bilingual explanations" description={`Respond in English + ${lang.name} together.`} checked={lang.bilingual} onChange={(v) => setLang({ bilingual: v })} /></div>
        )}
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications">
        <ToggleRow icon={Bell} label="Daily reminder" description="A nudge to keep your study streak going." checked={notifPrefs.dailyReminder} onChange={(v) => setNotifPrefs({ dailyReminder: v })} />
        <ToggleRow icon={Sparkles} label="Achievement alerts" description="Notified when you hit an XP milestone or streak." checked={notifPrefs.achievementAlerts} onChange={(v) => setNotifPrefs({ achievementAlerts: v })} />
        <ToggleRow icon={Users} label="Class announcements" description="Updates from your teacher or class." checked={notifPrefs.classAnnouncements} onChange={(v) => setNotifPrefs({ classAnnouncements: v })} />
        <div className="pt-3.5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: C.ink }}>Browser notifications</p>
            <p className="text-xs mt-0.5" style={{ color: C.slate }}>
              {notifPermission === "granted" ? "Enabled for this browser." : notifPermission === "denied" ? "Blocked — enable in your browser's site settings." : "Not yet enabled."}
            </p>
          </div>
          {notifPermission !== "granted" && notifPermission !== "unsupported" && <Btn size="sm" variant="secondary" onClick={requestBrowserNotifications}>Enable</Btn>}
        </div>
      </SettingsSection>

      <SettingsSection icon={Lock} title="Privacy">
        <ToggleRow icon={Users} label="Visible to classmates" description="Let classmates in your joined classes see your name on leaderboards/rosters." checked={privacyPrefs.profileVisibleToClass} onChange={(v) => setPrivacyPrefs({ profileVisibleToClass: v })} />
        <ToggleRow icon={TrendingUp} label="Share progress with teacher" description="Teachers of your classes can see your quiz results and streak." checked={privacyPrefs.shareProgressWithTeacher} onChange={(v) => setPrivacyPrefs({ shareProgressWithTeacher: v })} />
      </SettingsSection>

      <SettingsSection icon={ShieldCheck} title="Security">
        <p className="text-sm mb-3" style={{ color: C.slate }}>Password and sign-in are managed by your account provider. From here, you can end your session on this device.</p>
        <Btn size="sm" variant="danger" onClick={onSignOut}><LogOut size={13} /> Sign out of this device</Btn>
      </SettingsSection>

      <SettingsSection icon={theme === "dark" ? Moon : Sun} title="Theme">
        <div className="flex gap-2">
          <button onClick={() => setTheme("dark")} className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg" style={theme === "dark" ? { backgroundImage: GRADIENT, color: "#fff" } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft, border: `1px solid ${GLASS_BORDER}` }}>
            <Moon size={14} /> Dark mode
          </button>
          <button onClick={() => setTheme("light")} className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg" style={theme === "light" ? { backgroundImage: GRADIENT, color: "#fff" } : { background: "rgba(255,255,255,0.05)", color: C.inkSoft, border: `1px solid ${GLASS_BORDER}` }}>
            <Sun size={14} /> Light mode
          </button>
        </div>
      </SettingsSection>

      <SettingsSection icon={Accessibility} title="Accessibility">
        <div className="flex items-center justify-between gap-4 py-1">
          <p className="text-sm" style={{ color: C.ink }}>Font size</p>
          <div className="flex items-center gap-1">
            {[{ v: "md", s: 13 }, { v: "lg", s: 16 }, { v: "xl", s: 19 }].map((opt) => (
              <button key={opt.v} onClick={() => setA11y({ fontScale: opt.v })} className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold"
                style={a11y.fontScale === opt.v ? { backgroundImage: GRADIENT, color: "#fff" } : { background: "rgba(255,255,255,0.06)", color: C.inkSoft }}>
                <span style={{ fontSize: opt.s }}>A</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-3">
          <ToggleRow icon={BookOpen} label="Dyslexia mode" description="Switches to a typeface designed for reading clarity." checked={a11y.dyslexiaFont} onChange={(v) => setA11y({ dyslexiaFont: v })} />
          <ToggleRow icon={Eye} label="High contrast" description="Pure black background, white text, solid cards." checked={a11y.highContrast} onChange={(v) => setA11y({ highContrast: v })} />
        </div>
        <button onClick={() => setView("support")} className="text-xs mt-1 hover:underline" style={{ color: C.chalkLight }}>More Learning Support options →</button>
      </SettingsSection>

      <SettingsSection icon={GraduationCap} title="AI Preferences">
        <ToggleRow icon={Sparkles} label="Simplify difficult topics" description="Break concepts into their simplest form first." checked={a11y.simplify} onChange={(v) => setA11y({ simplify: v })} />
        <ToggleRow icon={Layers} label="Step-by-step explanations" description="Numbered steps with check-ins between them." checked={a11y.stepByStep} onChange={(v) => setA11y({ stepByStep: v })} />
        <ToggleRow icon={MessageSquare} label="Simple language" description="Short sentences, everyday vocabulary." checked={a11y.simpleLanguage} onChange={(v) => setA11y({ simpleLanguage: v })} />
      </SettingsSection>

      <SettingsSection icon={Volume2} title="Voice Settings">
        <ToggleRow icon={Volume2} label="Audio explanations" description="Automatically read each AI response aloud." checked={a11y.audioExplanations} onChange={(v) => setA11y({ audioExplanations: v })} />
        <div className="flex items-center justify-between gap-4 pt-3.5">
          <span className="text-sm" style={{ color: C.ink }}>Default playback speed</span>
          <div className="flex items-center gap-2">
            <input type="range" min="0.5" max="2" step="0.1" value={voiceRate} onChange={(e) => setVoiceRate(Number(e.target.value))} style={{ accentColor: C.chalk }} />
            <span className="text-xs w-8" style={{ color: C.slate }}>{voiceRate.toFixed(1)}x</span>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Megaphone} title="Feedback">
        <p className="text-xs mb-3" style={{ color: C.slate }}>Spotted a bug, or have an idea? It goes straight to the admin team's Feedback Management queue.</p>
        <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={3} className={inputClass} style={inputStyle} placeholder="What's on your mind?" />
        <div className="flex items-center gap-3 mt-2">
          <Btn size="sm" onClick={submitFeedback} disabled={!feedbackText.trim()}>Send feedback</Btn>
          {feedbackSent && <span className="text-xs" style={{ color: C.sage }}>Sent — thank you!</span>}
        </div>
      </SettingsSection>

      <SettingsSection icon={Trash2} title="Data Controls">
        <p className="text-sm mb-3" style={{ color: C.slate }}>Export everything Cognify has stored for you this session, or clear it and start fresh.</p>
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="secondary" onClick={exportData}><Download size={13} /> Download my data</Btn>
          {!confirmingClear ? (
            <Btn size="sm" variant="danger" onClick={() => setConfirmingClear(true)}><Trash2 size={13} /> Clear all data</Btn>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: C.flag }}>Are you sure? This can't be undone.</span>
              <Btn size="sm" variant="danger" onClick={handleClearData}>Yes, clear</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setConfirmingClear(false)}>Cancel</Btn>
            </div>
          )}
        </div>
      </SettingsSection>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => setView("privacy")} className="text-xs hover:underline" style={{ color: C.slate }}>Privacy Policy</button>
        <button onClick={() => setView("terms")} className="text-xs hover:underline" style={{ color: C.slate }}>Terms & Conditions</button>
      </div>
      <Btn variant="ghost" onClick={onSignOut} className="w-full justify-center" style={{ color: C.flag }}><LogOut size={14} /> Log out</Btn>
    </div>
  );
}
