// src/BootSequence.jsx — SYS//CORE v5.0
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { C } from "./tokens";

const LINES = [
  { t:"BIOS v5.0 .................................. INIT", c:C.cyan },
  { t:"CPU: 8-CORE NEURAL PROCESSOR ............... OK", c:C.green },
  { t:"RAM: 32GB DDR5 ............................. OK", c:C.green },
  { t:"STORAGE: 2TB NVME .......................... OK", c:C.green },
  { t:"LOADING SYS//CORE KERNEL v5.0 ...............", c:C.cyan },
  { t:"NEURAL LINK PROTOCOL ................... ONLINE", c:C.green },
  { t:"CLASSROOM SYNC ENGINE .................. ACTIVE", c:C.green },
  { t:"MISSION DATABASE ........................ READY", c:C.green },
  { t:"BIOMETRIC SENSORS .................. CALIBRATED", c:C.green },
  { t:"ECONOMY MODULE ......................... LOADED", c:C.green },
  { t:"NETRUNNER EXP ENGINE ................... ACTIVE", c:C.purple },
  { t:"PWA SERVICE WORKER .............. REGISTERED", c:C.green },
  { t:"> JACK IN. СИСТЕМА ГОТОВА, NETRUNNER.", c:C.yellow },
];

export default function BootSequence({ onDone }) {
  const [lines,  setLines]  = useState([]);
  const [cur,    setCur]    = useState("");
  const [li,     setLi]     = useState(0);
  const [ci,     setCi]     = useState(0);
  const [exiting,setExiting]= useState(false);

  useEffect(() => {
    if (li >= LINES.length) {
      setTimeout(() => { setExiting(true); setTimeout(onDone, 500); }, 900);
      return;
    }
    const target = LINES[li].t;
    if (ci < target.length) {
      const t = setTimeout(() => { setCur(target.slice(0, ci + 1)); setCi(c => c+1); }, 11 + Math.random()*11);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setLines(p => [...p, LINES[li]]); setCur(""); setCi(0); setLi(i => i+1); }, 65);
    return () => clearTimeout(t);
  }, [li, ci, onDone]);

  const pct = Math.min(Math.round((li / LINES.length) * 100), 100);

  return (
    <motion.div className="fixed inset-0 flex flex-col justify-center items-center z-50"
      style={{ background: C.bg }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: .4 }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,240,255,.015) 3px,rgba(0,240,255,.015) 4px)"
      }}/>

      <div className="w-full max-w-2xl px-8" style={{ position:"relative", zIndex:1 }}>
        <motion.div initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }}
          className="orb rgb gc font-black mb-1"
          style={{ color:C.cyan, fontSize:38, letterSpacing:6 }}>SYS//CORE</motion.div>
        <div className="mono" style={{ color:C.dim, fontSize:10, letterSpacing:4, marginBottom:30 }}>
          CYBERPUNK LIFE MANAGEMENT SYSTEM v5.0
        </div>

        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, minHeight:260 }}>
          {lines.map((l,i) => (
            <motion.div key={i} initial={{ opacity:0,x:-6 }} animate={{ opacity:1,x:0 }}
              style={{ marginBottom:4, color:l.c }}>{l.t}</motion.div>
          ))}
          {li < LINES.length && (
            <div style={{ color:LINES[li]?.c || C.cyan }}>
              {cur}<span style={{ animation:"bootBlink .65s infinite" }}>█</span>
            </div>
          )}
        </div>

        <div style={{ height:3, background:C.gray, width:"100%", marginTop:24, position:"relative", overflow:"hidden" }}>
          <motion.div style={{ height:"100%", background:C.cyan, boxShadow:`0 0 10px ${C.cyan}`, position:"absolute", left:0, top:0 }}
            animate={{ width:`${pct}%` }} transition={{ duration:.18 }}/>
          <div style={{ position:"absolute", top:0, bottom:0, width:"25%",
            background:"linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)",
            animation:"scanH 1.8s linear infinite" }}/>
        </div>
        <div className="mono" style={{ color:C.dim, fontSize:10, marginTop:5, letterSpacing:2 }}>{pct}%</div>
      </div>
    </motion.div>
  );
}
