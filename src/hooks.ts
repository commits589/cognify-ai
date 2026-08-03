import { useState, useEffect, useRef } from "react";

export function useSpeechRecognition() {
  const [supported] = useState(() => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);
  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscript(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => rec.stop();
  }, []);
  return {
    supported, listening, transcript,
    start: () => { setTranscript(""); setListening(true); recRef.current?.start(); },
    stop: () => { recRef.current?.stop(); setListening(false); },
    reset: () => setTranscript(""),
  };
}

export function useSpeechSynthesis() {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  rateRef.current = rate;

  const speak = (text) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rateRef.current;
    u.onstart = () => { setSpeaking(true); setPaused(false); };
    u.onend = () => { setSpeaking(false); setPaused(false); };
    u.onerror = () => { setSpeaking(false); setPaused(false); };
    window.speechSynthesis.speak(u);
  };
  const pause = () => { if (supported && speaking) { window.speechSynthesis.pause(); setPaused(true); } };
  const resume = () => { if (supported && paused) { window.speechSynthesis.resume(); setPaused(false); } };
  const stop = () => { if (!supported) return; window.speechSynthesis.cancel(); setSpeaking(false); setPaused(false); };

  return { supported, speaking, paused, rate, setRate, speak, pause, resume, stop };
}

/* ---------------------------------- app ---------------------------------- */
