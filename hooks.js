// src/hooks.js — SYS//CORE v5.0
import { useState, useEffect, useCallback, useRef } from "react";
import { GLITCH } from "./tokens";

export function usePersist(key, def) {
  const [s, set] = useState(() => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  });
  const write = useCallback(val => {
    set(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [s, write];
}

export function useClock() {
  const [time, setTime] = useState("--:--:--");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString("uk", { hour12: false }));
      setDate(n.toLocaleDateString("uk", { weekday:"short", day:"2-digit", month:"2-digit" }).toUpperCase());
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return { time, date };
}

export function useGlitch(text) {
  const [display, setDisplay] = useState(text);
  const [active, setActive]   = useState(false);
  const frame = useRef(null);
  const iter  = useRef(0);

  const trigger = useCallback(() => {
    if (active) return;
    setActive(true); iter.current = 0;
    const total = text.length * 4;
    const step = () => {
      iter.current++;
      setDisplay(text.split("").map((ch, i) => {
        if (ch === " " || ch === "/" || ch === ":") return ch;
        if (i < iter.current / 3.2) return ch;
        return GLITCH[Math.floor(Math.random() * GLITCH.length)];
      }).join(""));
      if (iter.current < total) { frame.current = requestAnimationFrame(step); }
      else { setDisplay(text); setActive(false); }
    };
    frame.current = requestAnimationFrame(step);
  }, [text, active]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return { display, active, trigger };
}

export function usePWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator)
      window.addEventListener("load", () =>
        navigator.serviceWorker.register("/service-worker.js").catch(() => {})
      );
  }, []);
}

export function useBioStale(bioKey) {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    try {
      const ts = localStorage.getItem(`${bioKey}_last`);
      setStale(!ts || (Date.now() - Number(ts)) > 172800000); // 48h
    } catch { setStale(false); }
  }, [bioKey]);
  return stale;
}
