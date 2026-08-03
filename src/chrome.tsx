import { C } from "./theme";

export function FontImport() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      @keyframes cognifyFadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cognifyFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
      @keyframes cognifyOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes cognifyPulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
      .cognify-fade-1 { animation: cognifyFadeInUp 0.6s ease-out both; }
      .cognify-fade-2 { animation: cognifyFadeInUp 0.6s ease-out 0.15s both; }
      .cognify-fade-3 { animation: cognifyFadeInUp 0.6s ease-out 0.3s both; }
      .cognify-fade-4 { animation: cognifyFadeInUp 0.6s ease-out 0.45s both; }
      .cognify-float { animation: cognifyFloat 4.5s ease-in-out infinite; }
      .cognify-orbit { animation: cognifyOrbit 14s linear infinite; }
      .cognify-orbit-rev { animation: cognifyOrbit 18s linear infinite reverse; }
      .cognify-pulse { animation: cognifyPulse 3s ease-in-out infinite; }

      /* ---------- page / panel transitions ---------- */
      @keyframes cognifyPageIn { from { opacity: 0; transform: translateY(10px) scale(0.996); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes cognifyScreenIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cognifySlideDownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cognifySlideUpFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cognifySlideInLeft { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes cognifySlideInRight { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes cognifyOverlayFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cognifyScaleIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }

      /* main view content — fades + rises slightly whenever the view key changes */
      .cognify-page-transition { animation: cognifyPageIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
      /* full pre-auth screens (splash/login/signup/etc.) — a touch more travel */
      .cognify-screen-transition { animation: cognifyScreenIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .cognify-slide-down-fade { animation: cognifySlideDownFade 0.28s ease-out both; }
      .cognify-slide-up-fade { animation: cognifySlideUpFade 0.28s ease-out both; }
      .cognify-slide-in-left { animation: cognifySlideInLeft 0.3s ease-out both; }
      .cognify-slide-in-right { animation: cognifySlideInRight 0.3s ease-out both; }
      .cognify-overlay-fade { animation: cognifyOverlayFade 0.2s ease-out both; }
      .cognify-scale-in { animation: cognifyScaleIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both; }

      /* ---------- card hover ---------- */
      .cognify-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
      .cognify-card:hover {
        transform: translateY(-3px);
        border-color: rgba(255,255,255,0.22);
        box-shadow: 0 2px 4px rgba(0,0,0,0.25), 0 22px 40px -14px rgba(0,0,0,0.6);
      }

      /* ---------- button ripple ---------- */
      @keyframes cognifyRipple { to { transform: scale(1); opacity: 0; } }
      .cognify-ripple {
        position: absolute;
        border-radius: 9999px;
        transform: scale(0);
        background: rgba(255,255,255,0.55);
        pointer-events: none;
        animation: cognifyRipple 0.6s ease-out forwards;
      }

      /* ---------- AI typing indicator ---------- */
      @keyframes cognifyTypingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
      .cognify-typing-dot { width: 6px; height: 6px; border-radius: 9999px; display: inline-block; animation: cognifyTypingBounce 1.1s ease-in-out infinite; }
      .cognify-typing-dot:nth-child(2) { animation-delay: 0.15s; }
      .cognify-typing-dot:nth-child(3) { animation-delay: 0.3s; }

      /* ---------- loading skeletons ---------- */
      @keyframes cognifyShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      .cognify-skeleton {
        background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.15) 37%, rgba(255,255,255,0.06) 63%);
        background-size: 800px 100%;
        animation: cognifyShimmer 1.6s linear infinite;
      }

      /* ---------- streaming response cursor ---------- */
      @keyframes cognifyCursorBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      .cognify-cursor {
        display: inline-block; width: 2px; height: 1em; margin-left: 2px;
        background: currentColor; vertical-align: text-bottom;
        animation: cognifyCursorBlink 0.9s step-end infinite;
      }

      /* ---------- smooth scrolling ---------- */
      html { scroll-behavior: smooth; }
      .cognify-smooth-scroll { scroll-behavior: smooth; }

      @media (prefers-reduced-motion: reduce) {
        html, .cognify-smooth-scroll { scroll-behavior: auto; }
        .cognify-page-transition, .cognify-screen-transition, .cognify-slide-down-fade,
        .cognify-slide-up-fade, .cognify-slide-in-left, .cognify-slide-in-right,
        .cognify-overlay-fade, .cognify-scale-in,
        .cognify-fade-1, .cognify-fade-2, .cognify-fade-3, .cognify-fade-4,
        .cognify-float, .cognify-orbit, .cognify-orbit-rev, .cognify-pulse,
        .cognify-ripple, .cognify-typing-dot, .cognify-skeleton, .cognify-cursor {
          animation: none !important;
        }
        .cognify-card, .cognify-card:hover { transition: none !important; transform: none !important; }
      }
    `}</style>
  );
}
// Wraps whatever's currently on screen. Keying the inner div on transitionKey forces React
// to mount a fresh DOM node whenever it changes, so the CSS animation reliably replays —
// this is what makes switching views/screens feel like a real page transition.

export function PageTransition({ transitionKey, className = "cognify-page-transition", children }) {
  return <div key={transitionKey} className={className}>{children}</div>;
}

export function GlowBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute rounded-full" style={{ width: 560, height: 560, top: -180, left: -120, background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0) 70%)", filter: "blur(40px)" }} />
      <div className="absolute rounded-full" style={{ width: 640, height: 640, bottom: -220, right: -160, background: "radial-gradient(circle, rgba(79,140,255,0.22) 0%, rgba(79,140,255,0) 70%)", filter: "blur(40px)" }} />
      <div className="absolute rounded-full" style={{ width: 420, height: 420, top: "35%", left: "45%", background: "radial-gradient(circle, rgba(109,93,251,0.14) 0%, rgba(109,93,251,0) 70%)", filter: "blur(60px)" }} />
    </div>
  );
}
// Applies Learning Support display settings globally within the authenticated app:
// large text rescales the root font-size (so all Tailwind rem-based sizing scales with it),
// and dyslexia-friendly mode switches to Atkinson Hyperlegible — a typeface designed and
// tested specifically for reading clarity — with extra letter/line spacing.

export function A11yStyles({ a11y, theme }) {
  const scalePct = { md: 100, lg: 118, xl: 135 }[a11y.fontScale] || 100;
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
      html { font-size: ${scalePct}%; }
      *:focus-visible { outline: 2px solid #A78BFA !important; outline-offset: 2px; border-radius: 4px; }
      .cognify-skip-link { position: fixed; top: -100px; left: 12px; z-index: 100; background: #8B5CF6; color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; transition: top 0.15s; }
      .cognify-skip-link:focus { top: 12px; }
      ${a11y.dyslexiaFont ? `
        .cognify-app-root, .cognify-app-root * { font-family: 'Atkinson Hyperlegible', sans-serif !important; }
        .cognify-app-root p, .cognify-app-root li, .cognify-app-root span { letter-spacing: 0.02em; line-height: 1.75 !important; }
      ` : ""}
      ${a11y.highContrast ? `
        .cognify-high-contrast { background: #000000 !important; }
        .cognify-high-contrast p, .cognify-high-contrast span, .cognify-high-contrast li,
        .cognify-high-contrast td, .cognify-high-contrast th, .cognify-high-contrast label { color: #FFFFFF !important; }
        .cognify-high-contrast .backdrop-blur-xl { background: #0D0D0D !important; backdrop-filter: none !important; }
        .cognify-high-contrast * { border-color: rgba(255,255,255,0.5) !important; }
        .cognify-high-contrast button { text-decoration: underline; }
      ` : ""}
      ${theme === "light" && !a11y.highContrast ? `
        .cognify-light-mode { background: #F5F3FA !important; }
        .cognify-light-mode p, .cognify-light-mode span, .cognify-light-mode li,
        .cognify-light-mode td, .cognify-light-mode th, .cognify-light-mode label,
        .cognify-light-mode h1, .cognify-light-mode h2, .cognify-light-mode h3 { color: #1E1B2E !important; }
        .cognify-light-mode .backdrop-blur-xl { background: rgba(255,255,255,0.85) !important; border-color: rgba(30,27,46,0.1) !important; }
        .cognify-light-mode * { border-color: rgba(30,27,46,0.1) !important; }
        .cognify-light-mode input, .cognify-light-mode textarea, .cognify-light-mode select { background: rgba(255,255,255,0.9) !important; color: #1E1B2E !important; }
        .cognify-light-mode ::placeholder { color: rgba(30,27,46,0.4) !important; }
      ` : ""}
    `}</style>
  );
}

export function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.55))" }}>
        <defs>
          <linearGradient id="cognifyGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#4F8CFF" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#cognifyGrad)" />
        <path d="M12 26.5V13.5L20 9L28 13.5V26.5L20 31L12 26.5Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />
        <path d="M20 9V31" stroke="#fff" strokeWidth="1.4" opacity="0.55" />
        <circle cx="20" cy="20" r="2.4" fill="#fff" />
      </svg>
      <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: size * 0.62, color: C.ink }}>Cognify AI</span>
    </div>
  );
}

/* ---------------------------------- shared auth chrome ---------------------------------- */
