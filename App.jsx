// src/App.jsx — SYS//CORE v7.0 ROOT
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useGlobalCSS from "./globalCSS";
import { usePersist, usePWA, useBioStale } from "./hooks";
import { C, EXP_PER_LEVEL } from "./tokens";
import BootSequence from "./BootSequence";
import Header, { ExpBar, LevelUpOverlay } from "./Header";
import NeuralLink from "./NeuralLink";
import MissionLog from "./MissionLog";
import Biometrics from "./Biometrics";
import Economy from "./Economy";
import HardwareGoals from "./HardwareGoals";
import MusicPlayer from "./MusicPlayer";

// ── Toast notification ─────────────────────────────────────────────
function Toast({ msg, color = C.green, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="toast clip-md mono"
      style={{ background:C.bg3, border:`1px solid ${color}55`, color, padding:"10px 16px", fontSize:11, letterSpacing:1, boxShadow:`0 0 20px ${color}33` }}>
      {msg}
    </div>
  );
}

export default function App() {
  useGlobalCSS();
  usePWA();

  const [booted,   setBooted]   = useState(false);
  const [exp,      setExp]       = usePersist("sc_exp5", 0);
  const [showPop,  setShowPop]   = useState(false);
  const [levelUp,  setLevelUp]   = useState(null);
  const [toasts,   setToasts]    = useState([]);
  const [imported, setImported]  = useState(null);
  const bioStale = useBioStale("sc_bio5");
  const prevLvl  = useRef(Math.floor(exp / EXP_PER_LEVEL) + 1);

  const addToast = useCallback((msg, color) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, color }]);
  }, []);

  const addExp = useCallback((amount) => {
    setExp(prev => {
      const next   = prev + amount;
      const newLvl = Math.floor(next / EXP_PER_LEVEL) + 1;
      const oldLvl = Math.floor(prev / EXP_PER_LEVEL) + 1;
      if (newLvl > oldLvl) setTimeout(() => setLevelUp(newLvl), 300);
      return next;
    });
    setShowPop(true);
    setTimeout(() => setShowPop(false), 1300);
  }, [setExp]);

  const handleImport = useCallback((tasks) => {
    setImported(tasks);
    addToast(`✓ ІМПОРТОВАНО ${tasks.length} ЗАВДАНЬ З CLASSROOM`, C.green);
    setTimeout(() => setImported(null), 600);
  }, [addToast]);

  return (
    <>
      {/* CRT + danger overlays (DOM, outside React) */}
      <div id="crt"/>
      <div id="scanmove"/>
      <div id="danger" className={bioStale ? "on" : ""}/>

      {/* Level-up overlay */}
      <AnimatePresence>
        {levelUp && (
          <LevelUpOverlay key={`lu${levelUp}`} level={levelUp} onClose={() => setLevelUp(null)}/>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div style={{ position:"fixed", top:20, right:20, zIndex:9997, display:"flex", flexDirection:"column", gap:8 }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ x:120,opacity:0 }} animate={{ x:0,opacity:1 }} exit={{ x:120,opacity:0 }}>
              <Toast msg={t.msg} color={t.color} onClose={() => setToasts(p=>p.filter(x=>x.id!==t.id))}/>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Boot */}
      <AnimatePresence>
        {!booted && <BootSequence key="boot" onDone={() => setBooted(true)}/>}
      </AnimatePresence>

      {/* Main app */}
      {booted && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.55 }}
          className="relative p-4 mx-auto"
          style={{ maxWidth:1200, minHeight:"100vh", zIndex:10 }}>

          <Header exp={exp}/>

          {/* EXP bar */}
          <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} transition={{ delay:.15 }}
            className="mb-4 clip-md p-3"
            style={{ background:`linear-gradient(90deg,${C.bg2},${C.bg3})`, border:`1px solid ${C.border}` }}>
            <ExpBar exp={exp} showPop={showPop}/>
          </motion.div>

          {/* Grid */}
          <motion.div
            className="grid gap-4"
            style={{ gridTemplateColumns:"repeat(auto-fit,minmax(450px,1fr))" }}
            initial="h" animate="v"
            variants={{ h:{}, v:{ transition:{ staggerChildren:.08 } } }}>
            {[
              <NeuralLink    key="nl" onTasksImported={handleImport}/>,
              <MissionLog    key="ml" onExp={addExp} importedTasks={imported}/>,
              <Biometrics    key="bi" onExp={addExp}/>,
              <Economy       key="ec" onExp={addExp}/>,
              <HardwareGoals key="hw" onExp={addExp}/>,
              <MusicPlayer   key="mp"/>,
            ].map((el,i) => (
              <motion.div key={i} variants={{
                h:{ opacity:0,y:32,filter:"blur(5px)" },
                v:{ opacity:1,y:0, filter:"blur(0px)", transition:{ duration:.4 } },
              }}>{el}</motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-6 mono"
            style={{ color:C.dim, fontSize:9, letterSpacing:3, paddingBottom:24 }}>
            SYS//CORE v7.0 • ALL DATA LOCAL • PWA READY •{" "}
            <span style={{ color:bioStale?C.red:C.green }}>
              {bioStale?"⚠ BIO STALE":"● BIO OK"}
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
}
