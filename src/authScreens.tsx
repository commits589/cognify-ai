import { useState } from "react";
import { GraduationCap, Sparkles, Mail, ArrowLeft, CheckCircle2, Chrome } from "lucide-react";
import { FontImport, GlowBackground, Logo } from "./chrome";
import { C, GLASS_BORDER, GLOW, GRADIENT, ROLE_OPTIONS, inputClass, inputStyle } from "./theme";
import { Btn, Card, Field } from "./ui";

export function AuthLayout({ children, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative" style={{ background: C.paper, fontFamily: "Inter, sans-serif" }}>
      <FontImport />
      <GlowBackground />
      {onBack && (
        <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-1.5 text-sm z-10" style={{ color: C.inkSoft }}>
          <ArrowLeft size={15} /> Back
        </button>
      )}
      <div className="relative z-10 mb-7"><Logo size={30} /></div>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}

export function RolePicker({ role, setRole }) {
  return (
    <div>
      <span className="block text-xs font-medium mb-1.5" style={{ color: C.inkSoft }}>I am a…</span>
      <div className="grid grid-cols-3 gap-2">
        {ROLE_OPTIONS.map((r) => (
          <button type="button" key={r.value} onClick={() => setRole(r.value)}
            className="text-left rounded-lg px-3 py-2.5 transition-all"
            style={role === r.value ? { backgroundImage: GRADIENT, color: "#fff", boxShadow: GLOW, border: "1px solid transparent" } : { color: C.ink, border: `1px solid ${GLASS_BORDER}`, background: "rgba(255,255,255,0.03)" }}>
            <span className="block text-sm font-medium">{r.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs mt-1.5" style={{ color: C.slate }}>{ROLE_OPTIONS.find((r) => r.value === role).blurb}</p>
    </div>
  );
}

export function GoogleButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all hover:brightness-110"
      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${GLASS_BORDER}`, color: C.ink }}>
      <Chrome size={16} /> Continue with Google
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: GLASS_BORDER }} />
      <span className="text-xs" style={{ color: C.slateLight }}>or</span>
      <div className="flex-1 h-px" style={{ background: GLASS_BORDER }} />
    </div>
  );
}

/* ---------------------------------- Splash screen ---------------------------------- */

export function SplashIllustration() {
  const nodeStyle = (angle, radius, color) => ({
    position: "absolute", top: "50%", left: "50%", width: 14, height: 14, borderRadius: 999,
    background: color, boxShadow: `0 0 14px ${color}`,
    transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
  });
  return (
    <div className="cognify-float relative mx-auto" style={{ width: 220, height: 220 }}>
      <div className="cognify-orbit absolute inset-0">
        <div style={nodeStyle(0, 100, "#8B5CF6")} />
        <div style={nodeStyle(120, 100, "#4F8CFF")} />
        <div style={nodeStyle(240, 100, "#34D399")} />
      </div>
      <div className="cognify-orbit-rev absolute" style={{ inset: 20 }}>
        <div style={nodeStyle(60, 78, "#C4B5FD")} />
        <div style={nodeStyle(200, 78, "#93C5FD")} />
      </div>
      <div className="cognify-pulse absolute inset-6 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 70%)" }} />
      <div className="absolute inset-10 rounded-full flex items-center justify-center backdrop-blur-xl" style={{ backgroundImage: GRADIENT, boxShadow: GLOW }}>
        <GraduationCap size={56} color="#fff" strokeWidth={1.5} />
      </div>
    </div>
  );
}

export function Splash({ onGetStarted, onLogin }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative text-center" style={{ background: C.paper, fontFamily: "Inter, sans-serif" }}>
      <FontImport />
      <GlowBackground />
      <div className="relative z-10 cognify-fade-1 mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${GLASS_BORDER}`, color: C.chalkLight }}>
          <Sparkles size={13} /> AI-Powered Learning
        </span>
      </div>
      <div className="relative z-10 cognify-fade-2 my-6">
        <SplashIllustration />
      </div>
      <div className="relative z-10 cognify-fade-3 mb-3">
        <div className="flex justify-center mb-4"><Logo size={30} /></div>
        <h1 className="text-3xl sm:text-5xl leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: C.ink }}>
          Learn Smarter<br />
          with{" "}
          <span style={{ backgroundImage: GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Cognify AI</span>
        </h1>
        <p className="text-sm sm:text-base mt-3 max-w-xs mx-auto" style={{ color: C.inkSoft }}>
          Your AI Learning Assistant<br />for Every Student
        </p>
      </div>
      <div className="relative z-10 cognify-fade-4 flex flex-col sm:flex-row items-center gap-3 mt-5">
        <Btn size="lg" onClick={onGetStarted}>Get Started</Btn>
        <Btn size="lg" variant="secondary" onClick={onLogin}>Login / Sign Up</Btn>
      </div>
      <p className="relative z-10 cognify-fade-4 text-xs mt-8 max-w-sm text-center" style={{ color: C.slateLight }}>
        🔒 Live interactive preview — AI calls are made server-side, no API key ever touches this code.
      </p>
    </div>
  );
}

/* ---------------------------------- Login ---------------------------------- */

export function LoginScreen({ onLoggedIn, onGoogle, onForgot, onSwitchToSignup, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) return setError("Enter your email and password.");
    setBusy(true);
    const result = await onLoggedIn(email.trim(), password);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const result = await onGoogle();
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <AuthLayout onBack={onBack}>
      <Card className="p-7">
        <h1 className="text-2xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Welcome back</h1>
        <p className="text-sm mb-6" style={{ color: C.slate }}>Log in to keep studying where you left off.</p>

        <GoogleButton onClick={handleGoogle} />
        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="you@school.edu" />
          </Field>
          <Field label="Password">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} style={inputStyle} placeholder="••••••••" />
          </Field>
          <div className="flex justify-end -mt-1">
            <button type="button" onClick={onForgot} className="text-xs hover:underline" style={{ color: C.chalkLight }}>Forgot password?</button>
          </div>
          {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
          <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</Btn>
        </form>

        <p className="text-sm mt-6 text-center" style={{ color: C.slate }}>
          New to Cognify?{" "}
          <button onClick={onSwitchToSignup} className="font-medium hover:underline" style={{ color: C.ink }}>Create an account</button>
        </p>
      </Card>
    </AuthLayout>
  );
}

/* ---------------------------------- Sign up ---------------------------------- */

export function SignupScreen({ onSignedUp, onGoogle, onSwitchToLogin, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [gradeLevel, setGradeLevel] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) return setError("Fill in your name and email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    const result = await onSignedUp({ name: name.trim(), email: email.trim(), password, role, gradeLevel: role === "student" ? gradeLevel.trim() : "" });
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const result = await onGoogle(role);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <AuthLayout onBack={onBack}>
      <Card className="p-7">
        <h1 className="text-2xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Create your account</h1>
        <p className="text-sm mb-6" style={{ color: C.slate }}>Free for students and teachers.</p>

        <GoogleButton onClick={handleGoogle} />
        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} placeholder="Ada Lovelace" />
          </Field>
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="you@school.edu" />
          </Field>
          <Field label="Password">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} style={inputStyle} placeholder="At least 6 characters" />
          </Field>
          <RolePicker role={role} setRole={setRole} />
          {role === "student" && (
            <Field label="Grade level (optional, helps the AI tutor calibrate)">
              <input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 9th grade, freshman year" />
            </Field>
          )}
          {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
          <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Btn>
        </form>

        <p className="text-sm mt-6 text-center" style={{ color: C.slate }}>
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="font-medium hover:underline" style={{ color: C.ink }}>Log in</button>
        </p>
      </Card>
    </AuthLayout>
  );
}

/* ---------------------------------- Forgot password ---------------------------------- */

export function ForgotPasswordScreen({ onSendReset, onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setBusy(true);
    const result = await onSendReset(email.trim());
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <AuthLayout onBack={onBackToLogin}>
      <Card className="p-7">
        {sent ? (
          <div className="text-center py-2">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <CheckCircle2 size={26} color={C.sage} />
              </div>
            </div>
            <h1 className="text-xl mb-2" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Check your inbox</h1>
            <p className="text-sm mb-6" style={{ color: C.slate }}>We sent a password reset link to <span style={{ color: C.ink }}>{email}</span> (if an account exists for that address).</p>
            <Btn variant="secondary" className="w-full" onClick={onBackToLogin}>Back to login</Btn>
          </div>
        ) : (
          <>
            <h1 className="text-2xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Reset your password</h1>
            <p className="text-sm mb-6" style={{ color: C.slate }}>Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Email">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="you@school.edu" />
              </Field>
              {error && <p className="text-sm" style={{ color: C.flag }}>{error}</p>}
              <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Btn>
            </form>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}

/* ---------------------------------- Email verification ---------------------------------- */

export function VerifyEmailScreen({ email, onCheckVerified, onResend, onBack }) {
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);
  if (!email) return null;

  async function handleCheck() {
    setChecking(true);
    setNotYet(false);
    const verified = await onCheckVerified();
    setChecking(false);
    if (!verified) setNotYet(true);
  }

  async function handleResend() {
    await onResend();
    setResent(true);
  }

  return (
    <AuthLayout onBack={onBack}>
      <Card className="p-7 text-center">
        <div className="flex justify-center mb-4">
          <div className="cognify-pulse w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundImage: GRADIENT, boxShadow: GLOW }}>
            <Mail size={26} color="#fff" />
          </div>
        </div>
        <h1 className="text-xl mb-2" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>Verify your email</h1>
        <p className="text-sm mb-1" style={{ color: C.slate }}>We sent a verification link to</p>
        <p className="text-sm font-medium mb-6" style={{ color: C.ink }}>{email}</p>
        {notYet && <p className="text-sm mb-3" style={{ color: C.flag }}>Not verified yet — click the link in your email, then try again.</p>}
        <Btn className="w-full mb-3" onClick={handleCheck} disabled={checking}>{checking ? "Checking…" : "I've verified my email"}</Btn>
        <button
          onClick={handleResend}
          className="text-xs hover:underline"
          style={{ color: C.chalkLight }}
        >
          {resent ? "Verification email resent ✓" : "Resend verification email"}
        </button>
      </Card>
    </AuthLayout>
  );
}

/* ---------------------------------- Dashboard ---------------------------------- */
