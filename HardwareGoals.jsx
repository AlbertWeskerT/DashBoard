// src/HardwareGoals.jsx — SYS//CORE v5.0
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, X, Save, TrendingUp, Trash2, Pencil } from "lucide-react";
import { C, EXP } from "./tokens";
import { usePersist } from "./hooks";
import { Panel, Btn, Inp, ProgBar, Tag, IBtn } from "./ui";

const DEF = [
  { id:1, name:"RTX 5070 Ti",      target:38000, saved:12000, icon:"🎮", note:"PriceUA ~₴38k" },
  { id:2, name:"Keychron Q1 Max",  target:6500,  saved:3200,  icon:"⌨️", note:"" },
  { id:3, name:"IPS 27\" Monitor", target:9500,  saved:1500,  icon:"🖥️", note:"BenQ или LG" },
];
let gid = 500;

function GoalRow({ g, onDel, onDeposit, onEdit }) {
  const pct     = Math.min((g.saved/g.target)*100, 100);
  const reached = pct >= 100;
  const left    = g.target - g.saved;
  return (
    <div className="mb-4">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span style={{ fontSize:16 }}>{g.icon}</span>
          <div>
            <div className="orb" style={{ color:reached?C.yellow:C.text, fontSize:12, letterSpacing:1 }}>{g.name}</div>
            {g.note && <div className="mono" style={{ color:C.dim, fontSize:9, letterSpacing:.5 }}>// {g.note}</div>}
          </div>
          {reached && <Tag label="ACQUIRED" color={C.yellow}/>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mono" style={{ color:C.purple, fontSize:11 }}>
            {g.saved.toLocaleString("uk")} / {g.target.toLocaleString("uk")} ₴
          </span>
          <IBtn Icon={Plus}   hover={C.green}  onClick={()=>onDeposit(g.id)}/>
          <IBtn Icon={Pencil} hover={C.yellow} onClick={()=>onEdit(g)}/>
          <IBtn Icon={Trash2} hover={C.pink}   onClick={()=>onDel(g.id)}/>
        </div>
      </div>
      <ProgBar pct={pct} color={reached?C.yellow:C.purple} h={9}/>
      <div className="flex justify-between mt-1">
        <span className="mono" style={{ color:C.dim, fontSize:9 }}>{pct.toFixed(1)}%</span>
        <span className="mono" style={{ color:C.dim, fontSize:9 }}>{left > 0 ? `${left.toLocaleString("uk")} ₴ to go` : "★ DONE"}</span>
      </div>
    </div>
  );
}

function GoalForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { name:"", target:"", saved:"0", icon:"💾", note:"" });
  return (
    <div className="flex flex-col gap-2 p-3" style={{ border:`1px solid ${C.purple}44`, background:`${C.purple}07` }}>
      <div className="flex gap-2">
        <Inp val={f.icon}   set={v=>setF(p=>({...p,icon:v}))}   ph="💾" style={{ width:44 }}/>
        <Inp val={f.name}   set={v=>setF(p=>({...p,name:v}))}   ph="Назва цілі" style={{ flex:1 }}/>
      </div>
      <div className="flex gap-2">
        <Inp val={f.target} set={v=>setF(p=>({...p,target:v}))} ph="Ціна ₴"  type="number" style={{ flex:1 }}/>
        <Inp val={f.saved}  set={v=>setF(p=>({...p,saved:v}))}  ph="Вже є ₴" type="number" style={{ flex:1 }}/>
      </div>
      <Inp val={f.note}   set={v=>setF(p=>({...p,note:v}))}   ph="// Нотатка (необов'язково)" style={{ width:"100%" }}/>
      <div className="flex gap-2">
        <Btn ch={<><Save size={10}/>ЗБЕРЕГТИ</>} color={C.purple}
          onClick={()=>{ if(f.name&&f.target) onSave({...f,target:Number(f.target),saved:Number(f.saved)||0}); }}/>
        <Btn ch={<><X size={10}/>СКАСУВАТИ</>}  color={C.dim} sm onClick={onCancel}/>
      </div>
    </div>
  );
}

function DepositPanel({ g, onDeposit, onCancel }) {
  const [amt, setAmt] = useState("");
  return (
    <div className="flex gap-2 mt-2 p-2" style={{ border:`1px solid ${C.green}44`, background:`${C.green}07` }}>
      <span className="mono" style={{ color:C.green, fontSize:11, alignSelf:"center" }}>+</span>
      <Inp val={amt} set={setAmt} ph="сума ₴" type="number" style={{ flex:1 }}
        onKey={e=>e.key==="Enter"&&onDeposit(Number(amt)||0)}/>
      <Btn ch={<><TrendingUp size={10}/>DEPOSIT</>} color={C.green} sm onClick={()=>onDeposit(Number(amt)||0)} disabled={!amt}/>
      <IBtn Icon={X} hover={C.dim} onClick={onCancel}/>
    </div>
  );
}

export default function HardwareGoals({ onExp }) {
  const [goals,   setGoals]  = usePersist("sc_goals5", DEF);
  const [addOpen, setAddOpen]= useState(false);
  const [editG,   setEditG]  = useState(null);
  const [depId,   setDepId]  = useState(null);

  const totalTarget = goals.reduce((a,g)=>a+g.target,0);
  const totalSaved  = goals.reduce((a,g)=>a+g.saved, 0);
  const totalPct    = totalTarget>0?(totalSaved/totalTarget)*100:0;

  const addGoal = (f) => {
    setGoals(p=>[...p,{id:gid++,...f}]);
    setAddOpen(false);
  };
  const delGoal = id => setGoals(p=>p.filter(g=>g.id!==id));
  const saveEdit = (f) => {
    setGoals(p=>p.map(g=>g.id===editG.id?{...g,...f}:g));
    setEditG(null);
  };
  const deposit = (id, amt) => {
    setGoals(p=>p.map(g=>{
      if(g.id!==id)return g;
      const newSaved=Math.min(g.saved+amt,g.target);
      if(newSaved>=g.target&&g.saved<g.target) onExp(EXP.goal);
      return {...g,saved:newSaved};
    }));
    setDepId(null);
  };

  return (
    <Panel icon={Target} title="HARDWARE GOALS" sub="НАКОПИЧЕННЯ" accent={C.purple} scrollH={440}>
      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="mono" style={{ color:C.dim, fontSize:9, letterSpacing:2 }}>ЗАГАЛЬНИЙ ПРОГРЕС</span>
          <span className="mono" style={{ color:C.purple, fontSize:9 }}>
            {totalSaved.toLocaleString("uk")} / {totalTarget.toLocaleString("uk")} ₴
          </span>
        </div>
        <ProgBar pct={totalPct} color={C.purple} h={5}/>
      </div>

      {/* Goal list */}
      <AnimatePresence mode="popLayout">
        {goals.map(g => (
          <motion.div key={g.id} layout initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
            exit={{ opacity:0,x:20,transition:{duration:.15} }}>
            {editG?.id===g.id ? (
              <GoalForm initial={editG} onSave={saveEdit} onCancel={()=>setEditG(null)}/>
            ) : (
              <>
                <GoalRow g={g} onDel={delGoal}
                  onDeposit={id=>setDepId(i=>i===id?null:id)}
                  onEdit={row=>setEditG(row)}/>
                <AnimatePresence>
                  {depId===g.id && (
                    <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden", marginTop:-8, marginBottom:12 }}>
                      <DepositPanel g={g} onDeposit={amt=>deposit(g.id,amt)} onCancel={()=>setDepId(null)}/>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add goal */}
      <button className="clip-sm mono cursor-pointer mt-1"
        onClick={()=>setAddOpen(v=>!v)}
        style={{ fontSize:10, padding:"4px 12px", letterSpacing:1,
          border:`1px solid ${C.purple}`, background:addOpen?`${C.purple}18`:"transparent",
          color:C.purple, display:"inline-flex", alignItems:"center", gap:4, transition:"all .15s" }}>
        {addOpen?<X size={10}/>:<Plus size={10}/>}{addOpen?"СКАСУВАТИ":"+ НОВА ЦІЛЬ"}
      </button>

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden", marginTop:8 }}>
            <GoalForm onSave={addGoal} onCancel={()=>setAddOpen(false)}/>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
