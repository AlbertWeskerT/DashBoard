// src/Economy.jsx — SYS//CORE v5.0
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Coffee, ChevronRight, Check, X, TrendingUp, AlertTriangle, Pencil, Save, Plus, Trash2 } from "lucide-react";
import { C, SHIFT_BASE, EXP } from "./tokens";
import { usePersist } from "./hooks";
import { Panel, Btn, Inp, ProgBar, IBtn, Tag } from "./ui";

export default function Economy({ onExp }) {
  const [stipend,   setStipend]  = usePersist("sc_stip5",    2800);
  const [expenses,  setExpenses] = usePersist("sc_exp5",     3200);
  const [othIncome, setOthIncome]= usePersist("sc_othinc5",  0);
  const [shifts,    setShifts]   = usePersist("sc_shifts5",  []);
  const [clog,      setClog]     = usePersist("sc_clog5",    []);

  const [tips,    setTips]    = useState("");
  const [step,    setStep]    = useState(0); // 0=closed, 1=tips, 2=confirm
  const [editField, setEditField] = useState(null); // "stipend"|"expenses"|"other"

  const shiftTotal = shifts.reduce((a,s)=>a+SHIFT_BASE+(s.tips||0), 0);
  const totalIncome= stipend + shiftTotal + othIncome;
  const balance    = totalIncome - expenses;
  const positive   = balance >= 0;
  const ratio      = totalIncome > 0 ? (expenses/totalIncome)*100 : 0;

  const logShift = () => {
    const t = Number(tips) || 0;
    const total = SHIFT_BASE + t;
    setShifts(p=>[...p,{
      id:Date.now(),
      date:new Date().toLocaleDateString("uk",{day:"2-digit",month:"2-digit",year:"2-digit"}),
      time:new Date().toLocaleTimeString("uk",{hour:"2-digit",minute:"2-digit"}),
      tips:t, total,
    }]);
    setClog(p=>[{
      id:Date.now(),
      msg:`КОНТРАКТ ВИКОНАНО. ЗАРАХОВАНО ${total.toLocaleString("uk")} ЕДДІ. (+${t}₴ чайових)`,
    },...p].slice(0,30));
    setTips(""); setStep(0);
    onExp(EXP.shift);
  };

  const delShift = id => setShifts(p=>p.filter(s=>s.id!==id));

  const InlineEdit = ({ label, value, set, color, ro }) => {
    const [editing,setEditing] = useState(false);
    const [tmp,    setTmp]     = useState(String(value));
    if (ro) return (
      <div className="flex items-center justify-between py-2.5" style={{ borderBottom:`1px solid ${C.gray2}` }}>
        <span className="mono" style={{ color:C.dim, fontSize:11, letterSpacing:1 }}>{label}</span>
        <span className="orb" style={{ color, fontSize:14 }}>{value.toLocaleString("uk")} ₴</span>
      </div>
    );
    return (
      <div className="flex items-center justify-between py-2" style={{ borderBottom:`1px solid ${C.gray2}` }}>
        <span className="mono" style={{ color:C.dim, fontSize:11, letterSpacing:1 }}>{label}</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <input className="eco-i" type="number" value={tmp} onChange={e=>setTmp(e.target.value)}
              autoFocus onKeyDown={e=>{ if(e.key==="Enter"){set(Number(tmp)||0);setEditing(false);} if(e.key==="Escape")setEditing(false);}}
              style={{ color }}
              onFocus={e=>e.target.style.borderColor=C.yellow} onBlur={e=>e.target.style.borderColor=C.border}/>
            <IBtn Icon={Save}  hover={C.green} onClick={()=>{set(Number(tmp)||0);setEditing(false);}} size={13}/>
            <IBtn Icon={X}     hover={C.pink}  onClick={()=>setEditing(false)} size={13}/>
          </div>
        ) : (
          <div className="flex items-center gap-2" style={{ cursor:"pointer" }} onClick={()=>{setTmp(String(value));setEditing(true);}}>
            <span className="orb" style={{ color, fontSize:15 }}>{value.toLocaleString("uk")} ₴</span>
            <Pencil size={11} style={{ color:C.dim }}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <Panel icon={DollarSign} title="ECONOMY" sub="FINANCE.EXE" accent={C.yellow}>

      {/* Income/Expenses — inline editable */}
      <InlineEdit label="▲ СТИПЕНДІЯ"    value={stipend}    set={setStipend}   color={C.cyan}/>
      <InlineEdit label="▲ ЗАРПЛАТА"     value={shiftTotal} set={null}         color={C.green} ro/>
      <InlineEdit label="▲ ІНШІ ДОХОДИ" value={othIncome}  set={setOthIncome} color={C.blue}/>
      <InlineEdit label="▼ ВИТРАТИ"      value={expenses}   set={setExpenses}  color={C.pink}/>

      {/* Spending ratio */}
      <div className="mt-3 mb-3">
        <div className="flex justify-between mb-1">
          <span className="mono" style={{ color:C.dim, fontSize:9, letterSpacing:2 }}>ВИТРАТИ / ДОХІД</span>
          <span className="mono" style={{ color:ratio>80?C.red:ratio>60?C.yellow:C.green, fontSize:9 }}>
            {ratio.toFixed(0)}%
          </span>
        </div>
        <ProgBar pct={ratio} color={ratio>80?C.red:ratio>60?C.yellow:C.green} h={5}/>
        {ratio > 80 && (
          <div className="flex items-center gap-2 mt-2 mono" style={{ color:C.red, fontSize:10 }}>
            <AlertTriangle size={10}/>ВИТРАТИ {ratio.toFixed(0)}% ВІД ДОХОДУ!
          </div>
        )}
      </div>

      {/* ── Shift Calculator ── */}
      <div className="mb-3">
        {step === 0 && (
          <Btn ch={<><Coffee size={11}/>RECORD SHIFT · {SHIFT_BASE}₴ BASE · 09:00–21:00</>}
            color={C.orange} onClick={()=>setStep(1)} full/>
        )}

        <AnimatePresence>
          {step >= 1 && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden" }}>
              <div className="p-3 mt-1" style={{ border:`1px solid ${C.orange}55`, background:`${C.orange}08` }}>
                {step === 1 && (
                  <div className="flex flex-col gap-2">
                    <div className="orb" style={{ color:C.orange, fontSize:10, letterSpacing:2 }}>
                      <Coffee size={10} style={{ display:"inline",marginRight:4 }}/>
                      ЗМІНА 09:00–21:00 · БАЗА: {SHIFT_BASE}₴
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="mono" style={{ color:C.dim, fontSize:11 }}>+ ЧАЙОВІ:</span>
                      <input className="ci clip-inp mono" type="number" placeholder="0 ₴" value={tips}
                        onChange={e=>setTips(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&setStep(2)}
                        autoFocus style={{ width:90 }}
                        onFocus={e=>e.target.style.borderColor=C.orange}
                        onBlur={e=>e.target.style.borderColor=C.border}/>
                    </div>
                    <div className="flex gap-2">
                      <Btn ch="ДАЛІ →" color={C.orange} onClick={()=>setStep(2)}/>
                      <Btn ch={<><X size={10}/>СКАСУВАТИ</>} color={C.dim} sm onClick={()=>{setStep(0);setTips("");}}/>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="mono" style={{ color:C.dim, fontSize:11 }}>РАЗОМ ЗА ЗМІНУ:</div>
                      <div className="orb" style={{ color:C.yellow, fontSize:28, letterSpacing:2 }}>
                        {(SHIFT_BASE+(Number(tips)||0)).toLocaleString("uk")} ₴
                      </div>
                      <div className="mono" style={{ color:C.dim, fontSize:10 }}>
                        {SHIFT_BASE}₴ база + {Number(tips)||0}₴ чайових
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Btn ch={<><Check size={10}/>ПІДТВЕРДИТИ +{EXP.shift} EXP</>} color={C.green} onClick={logShift}/>
                      <Btn ch="← НАЗАД" color={C.dim} sm onClick={()=>setStep(1)}/>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shift history */}
        {shifts.length > 0 && (
          <div className="mt-2">
            <div className="mono mb-1" style={{ color:C.dim, fontSize:9, letterSpacing:2 }}>
              RECENT SHIFTS ({shifts.length} total, {shiftTotal.toLocaleString("uk")}₴):
            </div>
            <div className="sy" style={{ maxHeight:100 }}>
              {shifts.slice(-6).reverse().map(s => (
                <div key={s.id} className="flex justify-between items-center py-1"
                  style={{ borderBottom:`1px solid ${C.gray2}`, fontSize:10 }}>
                  <span className="mono" style={{ color:C.dim }}>{s.date} {s.time}</span>
                  <span className="mono" style={{ color:C.orange }}>
                    {s.total.toLocaleString("uk")}₴{s.tips>0&&<span style={{ color:C.dim }}> (+{s.tips})</span>}
                  </span>
                  <IBtn Icon={X} hover={C.pink} onClick={()=>delShift(s.id)} size={10}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contract Log */}
      {clog.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="mono" style={{ color:C.dim, fontSize:9, letterSpacing:2 }}>CONTRACT LOG:</span>
            <button onClick={()=>setClog([])} className="mono"
              style={{ color:C.dim, fontSize:9, background:"none", border:"none", cursor:"pointer", letterSpacing:1 }}
              onMouseEnter={e=>e.currentTarget.style.color=C.pink}
              onMouseLeave={e=>e.currentTarget.style.color=C.dim}>CLEAR</button>
          </div>
          <div className="sy" style={{ maxHeight:90 }}>
            {clog.map((l,i) => (
              <div key={l.id} className="mono import-in py-1"
                style={{ color:C.green, fontSize:10, borderBottom:`1px solid ${C.gray2}`, letterSpacing:.5 }}>
                <span style={{ color:C.dim2 }}>// </span>{l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Net Balance */}
      <motion.div className="flex items-baseline justify-between pt-3 mt-1"
        style={{ borderTop:`1px solid ${C.cyan}` }}
        key={balance} animate={{ scale:[1,1.013,1] }} transition={{ duration:.3 }}>
        <span className="orb" style={{ color:C.yellow, fontSize:11, letterSpacing:2 }}>
          <ChevronRight size={11} style={{ display:"inline" }}/>NET BALANCE
        </span>
        <span className="orb" style={{ color:positive?C.yellow:C.red, fontSize:28,
          textShadow:`0 0 18px ${positive?C.yellow:C.red}99` }}>
          {balance.toLocaleString("uk")} ₴
        </span>
      </motion.div>
    </Panel>
  );
}
