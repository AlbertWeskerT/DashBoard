// src/Header.jsx — SYS//CORE v5.0
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { C, EXP_PER_LEVEL } from "./tokens";
import { useClock, useGlitch } from "./hooks";
import { ProgBar } from "./ui";

/* ── Level-up overlay ──────────────────────────────────────────── */
export function LevelUpOverlay({ level, onClose }) {
  return (
    <div className="luo" onClick={onClose}>
      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:`linear-gradient(rgba(0,240,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.04) 1px,transparent 1px)`,
        backgroundSize:"44px 44px",
      }}/>
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,240,255,.018) 2px,rgba(0,240,255,.018) 4px)"
      }}/>

      <motion.div initial={{ opacity:0,scale:.45,y:30 }} animate={{ opacity:1,scale:1,y:0 }}
        transition={{ type:"spring",stiffness:190,damping:14 }}
        style={{ textAlign:"center", position:"relative", zIndex:1 }}>

        <motion.div animate={{ rotate:[0,5,-5,3,-3,0] }} transition={{ duration:.5,delay:.2 }}
          style={{ fontSize:64, marginBottom:12 }}>⚡</motion.div>

        <div className="orb rgb" style={{ color:C.cyan, fontSize:13, letterSpacing:7, marginBottom:14 }}>
          LEVEL INCREASED
        </div>
        <div className="orb font-black gy" style={{ color:C.yellow, fontSize:60, letterSpacing:4, lineHeight:1 }}>
          LVL {level}
        </div>
        <div className="orb gg" style={{ color:C.green, fontSize:20, letterSpacing:9, marginTop:16 }}>
          ACCESS GRANTED
        </div>
        <div className="mono" style={{ color:C.dim, fontSize:11, marginTop:24, letterSpacing:3 }}>
          [ tap to continue ]
        </div>
      </motion.div>
    </div>
  );
}

/* ── EXP Bar ────────────────────────────────────────────────────── */
export function ExpBar({ exp, showPop }) {
  const level   = Math.floor(exp / EXP_PER_LEVEL) + 1;
  const current = exp % EXP_PER_LEVEL;
  const pct     = (current / EXP_PER_LEVEL) * 100;
  return (
    <div style={{ position:"relative" }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Award size={12} style={{ color:C.purple }} />
          <span className="orb gp" style={{ color:C.purple, fontSize:11, letterSpacing:2 }}>
            LVL {level} NETRUNNER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="mono" style={{ color:C.dim, fontSize:10 }}>TOTAL: <span style={{ color:C.purple }}>{exp}</span> EXP</span>
          <span className="mono" style={{ color:C.dim, fontSize:10 }}>{current} / {EXP_PER_LEVEL}</span>
        </div>
      </div>
      <ProgBar pct={pct} color={C.purple} h={8}/>
      <div className="mono" style={{ color:C.dim, fontSize:9, marginTop:3, letterSpacing:2 }}>
        NEXT LVL: {EXP_PER_LEVEL - current} EXP
      </div>

      <AnimatePresence>
        {showPop && (
          <motion.div initial={{ opacity:0,y:2,x:"-50%" }} animate={{ opacity:1,y:-30,x:"-50%" }} exit={{ opacity:0,y:-52 }}
            style={{ position:"absolute",left:"50%",top:0,pointerEvents:"none",
              color:C.yellow,fontFamily:"'Orbitron',monospace",fontSize:15,fontWeight:900,letterSpacing:3,
              textShadow:`0 0 14px ${C.yellow}` }}>+EXP</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Header ────────────────────────────────────────────────── */
export default function Header({ exp }) {
  const { time, date } = useClock();
  const level = Math.floor(exp / EXP_PER_LEVEL) + 1;
  const { display, trigger } = useGlitch("SYS//CORE");

  return (
    <motion.div initial={{ opacity:0,y:-24 }} animate={{ opacity:1,y:0 }} transition={{ duration:.5 }}
      className="flex items-center justify-between px-5 py-3 mb-4 relative clip-lg"
      style={{
        border:`1px solid ${C.cyan}`,
        background:`linear-gradient(90deg,${C.cyan}0c,${C.bg2} 45%,${C.bg3} 100%)`,
        boxShadow:`0 2px 36px ${C.cyan}16,inset 0 1px 0 ${C.cyan}38`,
      }}>

      {/* Corner accents */}
      <div style={{ position:"absolute",top:0,right:0,width:20,height:20,
        borderTop:`2px solid ${C.yellow}`,borderRight:`2px solid ${C.yellow}` }}/>
      <div style={{ position:"absolute",bottom:0,left:0,width:20,height:20,
        borderBottom:`2px solid ${C.yellow}`,borderLeft:`2px solid ${C.yellow}` }}/>
      {/* Bottom glow */}
      <div style={{ position:"absolute",bottom:-1,left:"8%",right:"8%",height:1,
        background:`linear-gradient(90deg,transparent,${C.cyan}99,transparent)` }}/>

      <div>
        <div className="orb rgb gc font-black" onMouseEnter={trigger} style={{ cursor:"default",
          color:C.cyan,fontSize:24,letterSpacing:6,fontVariantNumeric:"tabular-nums" }}>
          {display}
        </div>
        <div className="mono" style={{ color:C.dim,fontSize:9,letterSpacing:4,marginTop:2 }}>
          CYBERPUNK LIFE MANAGEMENT SYSTEM v5.0
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div style={{ textAlign:"center" }}>
          <div className="orb gp" style={{ color:C.purple,fontSize:22,letterSpacing:1 }}>LVL {level}</div>
          <div className="mono" style={{ color:C.dim,fontSize:9,letterSpacing:2 }}>NETRUNNER</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div className="orb gc" style={{ color:C.cyan,fontSize:22,letterSpacing:2 }}>{time}</div>
          <div className="mono" style={{ color:C.dim,fontSize:9,letterSpacing:3 }}>{date}</div>
        </div>
        <div style={{ width:9,height:9,borderRadius:"50%",background:C.cyan,
          boxShadow:`0 0 10px ${C.cyan}`,animation:"pulse 2s infinite" }}/>
      </div>
    </motion.div>
  );
}
