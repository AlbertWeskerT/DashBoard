// src/ui.jsx — SYS//CORE v5.0 UI atoms
import { useState } from "react";
import { C } from "./tokens";

/* ── Panel ──────────────────────────────────────────────────────── */
export function Panel({ icon: Icon, title, sub, children, accent = C.cyan, scrollH }) {
  const [hov, setHov] = useState(false);
  return (
    <div className={`clip-lg sh sv relative overflow-hidden${hov ? " bpulse" : ""}`}
      style={{
        background: `linear-gradient(145deg,${C.bg2} 0%,${C.bg3} 60%,${C.bg4} 100%)`,
        border: `1px solid ${hov ? accent + "88" : C.border}`,
        boxShadow: hov ? `0 0 40px ${accent}0e,inset 0 1px 0 ${accent}22` : "none",
        transition: "border-color .25s,box-shadow .3s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 relative"
        style={{
          borderBottom: `1px solid ${hov ? accent + "44" : C.gray2}`,
          background: `linear-gradient(90deg,${accent}14,transparent 65%)`,
        }}>
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3,
          background: `linear-gradient(180deg,transparent,${accent},transparent)`, opacity:.9 }}/>
        <Icon size={13} style={{ color: accent }} className="flicker" />
        <span className="orb" style={{ color: accent, fontSize:11, letterSpacing:3 }}>{title}</span>
        {sub && <span className="mono ml-auto" style={{ color:C.dim, fontSize:10, letterSpacing:2 }}>{sub}</span>}
      </div>

      {/* Body */}
      <div className={scrollH ? "sy" : ""} style={scrollH ? { maxHeight: scrollH } : {}}>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* ── Btn ─────────────────────────────────────────────────────────── */
export function Btn({ ch, color = C.cyan, onClick, sm, disabled, full, style: sx }) {
  const [hov, setHov] = useState(false);
  return (
    <button disabled={disabled} className="clip-sm mono cursor-pointer"
      style={{
        border: `1px solid ${color}`,
        background: hov ? `${color}22` : "transparent",
        color: disabled ? C.dim : color,
        boxShadow: hov && !disabled ? `0 0 16px ${color}55,inset 0 0 8px ${color}11` : "none",
        transform: hov && !disabled ? "scale(1.03)" : "scale(1)",
        transition: "all .16s",
        padding: sm ? "3px 10px" : "5px 15px",
        fontSize: sm ? 10 : 11,
        letterSpacing: 1,
        opacity: disabled ? .35 : 1,
        whiteSpace: "nowrap",
        width: full ? "100%" : undefined,
        display: "inline-flex", alignItems: "center", gap: 4,
        ...sx,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}>
      {ch}
    </button>
  );
}

/* ── Inp ─────────────────────────────────────────────────────────── */
export function Inp({ val, set, ph, onKey, style: sx, type = "text", rows, yellow }) {
  if (rows) return (
    <textarea className={`ci clip-inp mono${yellow ? " ci-y" : ""}`}
      placeholder={ph} value={val} onChange={e => set(e.target.value)}
      rows={rows} style={sx}
      onFocus={e => e.target.style.borderColor = yellow ? C.yellow : C.cyan}
      onBlur={e  => e.target.style.borderColor = C.border} />
  );
  return (
    <input type={type} className={`ci clip-inp mono${yellow ? " ci-y" : ""}`}
      placeholder={ph} value={val}
      onChange={e => set(e.target.value)} onKeyDown={onKey}
      onFocus={e => e.target.style.borderColor = yellow ? C.yellow : C.cyan}
      onBlur={e  => e.target.style.borderColor = C.border}
      style={sx} />
  );
}

/* ── ProgBar ─────────────────────────────────────────────────────── */
export function ProgBar({ pct, color = C.cyan, h = 7 }) {
  const p = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="pb-wrap clip-sm" style={{ height: h }}>
      <div className="pb-fill"
        style={{ width:`${p}%`, background:`linear-gradient(90deg,${color}88,${color})`, boxShadow:`0 0 10px ${color}88` }} />
    </div>
  );
}

/* ── Tag ─────────────────────────────────────────────────────────── */
export function Tag({ label, color }) {
  return (
    <span className="mono" style={{
      fontSize:9, letterSpacing:2, padding:"2px 7px",
      border:`1px solid ${color}66`, color, background:`${color}16`, flexShrink:0,
    }}>{label}</span>
  );
}

/* ── IBtn (icon-only button) ─────────────────────────────────────── */
export function IBtn({ Icon, base = C.dim, hover = C.cyan, onClick, size = 12 }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      style={{ color:hov?hover:base, background:"none", border:"none", cursor:"pointer",
        padding:"0 2px", transition:"color .15s", lineHeight:1, flexShrink:0 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <Icon size={size} />
    </button>
  );
}

/* ── Section label ───────────────────────────────────────────────── */
export function SecLabel({ ch, color = C.dim }) {
  return (
    <div className="mono" style={{ color, fontSize:9, letterSpacing:3, marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
      {ch}
    </div>
  );
}

/* ── DayTab ──────────────────────────────────────────────────────── */
export function DayTab({ label, active, onClick }) {
  return (
    <button className="clip-sm orb cursor-pointer"
      onClick={onClick}
      style={{
        fontSize:10, padding:"4px 10px", letterSpacing:2,
        border:`1px solid ${active ? C.cyan : C.border}`,
        background: active ? `${C.cyan}1c` : "transparent",
        color: active ? C.cyan : C.dim,
        boxShadow: active ? `0 0 12px ${C.cyan}44` : "none",
        transition:"all .18s",
      }}>
      {label}
    </button>
  );
}

/* ── SmallBtn ────────────────────────────────────────────────────── */
export function SmBtn({ ch, color, onClick, active }) {
  return (
    <button className="clip-sm mono cursor-pointer"
      onClick={onClick}
      style={{
        fontSize:9, padding:"3px 10px", letterSpacing:1,
        border:`1px solid ${active ? color : C.border}`,
        background: active ? `${color}1c` : "transparent",
        color: active ? color : C.dim,
        transition:"all .15s", display:"inline-flex", alignItems:"center", gap:3,
      }}>
      {ch}
    </button>
  );
}
