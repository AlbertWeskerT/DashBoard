// src/Biometrics.jsx — SYS//CORE v5.0
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Scale, X, Pencil, Save, TrendingUp, Plus } from "lucide-react";
import { C, EXP } from "./tokens";
import { usePersist, useBioStale } from "./hooks";
import { Panel, Btn, Inp, ProgBar, IBtn, SecLabel } from "./ui";

const DEF_SETS = [
  { id:1, ex:"Жим лежачи",  kg:"80",  reps:"3×8",  note:"" },
  { id:2, ex:"Присідання",  kg:"100", reps:"4×6",  note:"" },
  { id:3, ex:"Тяга штанги", kg:"120", reps:"3×5",  note:"" },
  { id:4, ex:"Підтягування",kg:"BW",  reps:"4×10", note:"" },
];
let bid = 500;

function SetRow({ s, onDel, onEdit }) {
  const [hov,setHov]=useState(false);
  return (
    <tr onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:hov?"rgba(0,255,136,.03)":"transparent", transition:"background .15s" }}>
      <td style={{ padding:"7px 6px",borderBottom:`1px solid ${C.gray2}`,color:C.cyan,fontSize:12 }}>{s.ex}</td>
      <td style={{ padding:"7px 6px",borderBottom:`1px solid ${C.gray2}`,color:C.green,fontSize:13,fontFamily:"'Orbitron',monospace" }}>{s.kg}</td>
      <td style={{ padding:"7px 6px",borderBottom:`1px solid ${C.gray2}`,color:C.text,fontSize:12 }}>{s.reps}</td>
      <td style={{ padding:"7px 6px",borderBottom:`1px solid ${C.gray2}`,color:C.dim,fontSize:10 }}>{s.note}</td>
      <td style={{ padding:"7px 6px",borderBottom:`1px solid ${C.gray2}`,width:48 }}>
        <div style={{ opacity:hov?1:0,transition:"opacity .15s",display:"flex",gap:4 }}>
          <IBtn Icon={Pencil} hover={C.yellow} onClick={()=>onEdit(s)} size={11}/>
          <IBtn Icon={X}      hover={C.pink}   onClick={()=>onDel(s.id)} size={11}/>
        </div>
      </td>
    </tr>
  );
}

function SetEditRow({ s, onSave, onCancel }) {
  const [ex,  setEx]  = useState(s.ex);
  const [kg,  setKg]  = useState(s.kg);
  const [reps,setReps]= useState(s.reps);
  const [note,setNote]= useState(s.note||"");
  return (
    <tr style={{ background:`${C.cyan}07` }}>
      <td style={{ padding:"4px 4px", borderBottom:`1px solid ${C.gray2}` }}>
        <input className="ci clip-inp mono" value={ex} onChange={e=>setEx(e.target.value)} style={{ width:"100%",fontSize:11,padding:"3px 6px" }}/>
      </td>
      <td style={{ padding:"4px 4px", borderBottom:`1px solid ${C.gray2}` }}>
        <input className="ci clip-inp mono" value={kg} onChange={e=>setKg(e.target.value)} style={{ width:60,fontSize:11,padding:"3px 6px" }}/>
      </td>
      <td style={{ padding:"4px 4px", borderBottom:`1px solid ${C.gray2}` }}>
        <input className="ci clip-inp mono" value={reps} onChange={e=>setReps(e.target.value)} style={{ width:64,fontSize:11,padding:"3px 6px" }}/>
      </td>
      <td style={{ padding:"4px 4px", borderBottom:`1px solid ${C.gray2}` }}>
        <input className="ci clip-inp mono" value={note} onChange={e=>setNote(e.target.value)} placeholder="нотатка" style={{ width:"100%",fontSize:11,padding:"3px 6px" }}/>
      </td>
      <td style={{ padding:"4px 4px", borderBottom:`1px solid ${C.gray2}` }}>
        <div className="flex gap-1">
          <IBtn Icon={Save} hover={C.green} onClick={()=>onSave({ex,kg,reps,note})} size={11}/>
          <IBtn Icon={X}    hover={C.pink}  onClick={onCancel} size={11}/>
        </div>
      </td>
    </tr>
  );
}

export default function Biometrics({ onExp }) {
  const [sets,    setSets]  = usePersist("sc_bio5",   DEF_SETS);
  const [curW,    setCurW]  = usePersist("sc_wcur",   68);
  const [goalW,   setGoalW] = usePersist("sc_wgoal",  80);
  const [startW,  setStartW]= usePersist("sc_wstart", 65);
  const [ex,  setEx]   = useState("");
  const [kg,  setKg]   = useState("");
  const [rep, setRep]  = useState("");
  const [note,setNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editS,   setEditS]   = useState(null);
  const stale = useBioStale("sc_bio5");

  const logSet = () => {
    if (!ex.trim()) return;
    const entry = { id:bid++, ex:ex.trim(), kg:kg||"—", reps:rep||"3×10", note, ts:Date.now() };
    setSets(p=>[...p,entry]);
    try { localStorage.setItem("sc_bio5_last", String(Date.now())); } catch {}
    setEx(""); setKg(""); setRep(""); setNote(""); setShowAdd(false);
    onExp(EXP.workout);
  };

  const delSet  = id  => setSets(p=>p.filter(s=>s.id!==id));
  const saveEdit= (id,data) => { setSets(p=>p.map(s=>s.id===id?{...s,...data}:s)); setEditS(null); };

  const total = Math.abs(goalW - startW) || 1;
  const done  = Math.abs(curW  - startW);
  const pct   = Math.min((done/total)*100, 100);
  const gain  = goalW >= startW;

  return (
    <Panel icon={Activity} title="BIOMETRICS"
      sub={stale ? "⚠ BIO STALE" : `${sets.length} SETS`}
      accent={stale ? C.red : C.green}
      scrollH={440}>

      {/* ── Mass Protocol ── */}
      <div className="mb-4 p-3" style={{ border:`1px solid ${C.green}33`, background:`${C.green}07` }}>
        <div className="flex items-center gap-2 mb-3">
          <Scale size={12} style={{ color:C.green }}/>
          <span className="orb gg" style={{ color:C.green, fontSize:10, letterSpacing:2 }}>MASS PROTOCOL</span>
          <span className="mono ml-auto" style={{ color:C.dim, fontSize:10 }}>
            {gain?"▲ НАБІР":"▼ СКИДАННЯ"} → {goalW}kg
          </span>
        </div>

        {/* Editable fields */}
        <div className="flex items-end gap-3 mb-3">
          <div>
            <div className="mono mb-1" style={{ color:C.dim, fontSize:9, letterSpacing:2 }}>START</div>
            <input className="ci clip-inp mono" type="number" value={startW} onChange={e=>setStartW(Number(e.target.value))}
              style={{ width:58,textAlign:"center",fontSize:13 }}
              onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ flex:1 }}>
            <div className="flex justify-between mb-1">
              <span className="mono" style={{ color:C.green, fontSize:9 }}>{pct.toFixed(0)}%</span>
              <span className="mono" style={{ color:C.dim, fontSize:9 }}>{Math.abs(goalW-curW).toFixed(1)}kg to go</span>
            </div>
            <ProgBar pct={pct} color={C.green} h={12}/>
          </div>
          <div>
            <div className="mono mb-1" style={{ color:C.dim, fontSize:9, letterSpacing:2 }}>GOAL</div>
            <input className="ci clip-inp mono" type="number" value={goalW} onChange={e=>setGoalW(Number(e.target.value))}
              style={{ width:58,textAlign:"center",fontSize:13 }}
              onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        </div>

        {/* Current weight — big editable */}
        <div className="flex items-center justify-center gap-3">
          <span className="mono" style={{ color:C.dim, fontSize:11 }}>ЗАРАЗ:</span>
          <input className="ci clip-inp" type="number" step=".1" value={curW}
            onChange={e=>setCurW(Number(e.target.value))}
            style={{ width:80,textAlign:"center",fontSize:24,fontFamily:"'Orbitron',monospace",
              color:C.green,padding:"4px 8px",boxShadow:`0 0 10px ${C.green}44` }}
            onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=C.border}/>
          <span className="orb gg" style={{ color:C.green, fontSize:24 }}>kg</span>
        </div>

        {pct >= 100 && (
          <div className="orb text-center mt-2" style={{ color:C.yellow, fontSize:11, letterSpacing:3 }}>
            ★ MASS GOAL REACHED — +{EXP.goal} EXP ★
          </div>
        )}
      </div>

      {stale && (
        <div className="mono mb-3 gr" style={{ color:C.red, fontSize:10, letterSpacing:2,
          padding:"6px 10px", border:`1px solid ${C.red}44`, background:`${C.red}09` }}>
          ⚠ ОСТАННЯ ТРЕНУВАННЯ &gt;48ГОД — БІОМЕТРИКА ДЕГРАДУЄ
        </div>
      )}

      {/* ── Workout log ── */}
      <div className="sy mb-3" style={{ maxHeight:200 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>{["ВПРАВА","KG","REPS","НОТАТКА",""].map(h=>(
              <th key={h} style={{ color:C.dim, fontSize:9, letterSpacing:2, padding:"3px 6px", textAlign:"left", borderBottom:`1px solid ${C.gray}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sets.map(s => (
                <motion.tr key={s.id} layout initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:20,transition:{duration:.15} }}
                  style={{ display: editS?.id===s.id ? "none" : undefined }}>
                  <td style={{ display:"none" }}/>
                </motion.tr>
              ))}
            </AnimatePresence>
            {sets.map(s =>
              editS?.id===s.id ? (
                <SetEditRow key={`e${s.id}`} s={s}
                  onSave={data=>saveEdit(s.id,data)}
                  onCancel={()=>setEditS(null)}/>
              ) : (
                <SetRow key={s.id} s={s}
                  onDel={delSet}
                  onEdit={row=>setEditS(row)}/>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add set */}
      <button className="clip-sm mono cursor-pointer"
        onClick={()=>setShowAdd(v=>!v)}
        style={{ fontSize:10, padding:"4px 12px", letterSpacing:1,
          border:`1px solid ${C.green}`, background:showAdd?`${C.green}18`:"transparent",
          color:C.green, display:"inline-flex", alignItems:"center", gap:4, transition:"all .15s" }}>
        {showAdd?<X size={10}/>:<Plus size={10}/>}{showAdd?"СКАСУВАТИ":"+ ЗАПИСАТИ СЕТ"}
      </button>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden", marginTop:8 }}>
            <div className="flex flex-col gap-2 p-3" style={{ border:`1px solid ${C.green}44`, background:`${C.green}06` }}>
              <div className="flex gap-2 flex-wrap">
                <input className="ci clip-inp mono" placeholder="Вправа..." value={ex} onChange={e=>setEx(e.target.value)}
                  style={{ flex:1,minWidth:100 }}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
                <input className="ci clip-inp mono" placeholder="kg" value={kg} onChange={e=>setKg(e.target.value)} style={{ width:58 }}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
                <input className="ci clip-inp mono" placeholder="reps" value={rep} onChange={e=>setRep(e.target.value)} style={{ width:68 }}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}
                  onKeyDown={e=>e.key==="Enter"&&logSet()}/>
              </div>
              <input className="ci clip-inp mono" placeholder="// Нотатка..." value={note} onChange={e=>setNote(e.target.value)} style={{ width:"100%" }}
                onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
              <Btn ch={<><Zap size={10}/>LOG SET +{EXP.workout} EXP</>} color={C.green} onClick={logSet} disabled={!ex.trim()}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
