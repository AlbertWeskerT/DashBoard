// src/MissionLog.jsx — SYS//CORE v6.0 ULTIMATE
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Plus, Pencil, Trash2, X, Save,
  Clock, ChevronRight, FileText, AlertTriangle,
} from "lucide-react";
import { C, PRIO, PRIO_CYCLE, EXP } from "./tokens";
import { usePersist } from "./hooks";
import { Panel, Btn, Tag, IBtn } from "./ui";

// ── Default tasks ──────────────────────────────────────────────
const DEF = [
  { id:1, text:"Здати лабораторну з БД",       done:false, priority:"high", deadline:null, note:"", description:"" },
  { id:2, text:"Підготувати презентацію по ОС", done:false, priority:"med",  deadline:null, note:"", description:"" },
  { id:3, text:"Прочитати розділ 7 з мереж",   done:false, priority:"low",  deadline:null, note:"", description:"" },
  { id:4, text:"Вивчити JOIN-запити в SQL",     done:false, priority:"med",  deadline:null, note:"", description:"" },
];
let tid = 600;

// ── Time helpers ───────────────────────────────────────────────
function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - Date.now()) / 86400000);
}
function isUrgent(iso) {
  const d = daysLeft(iso);
  return d !== null && d >= 0 && d <= 1;
}
function isCritical(iso) {
  const d = daysLeft(iso);
  return d !== null && d >= 0 && d < 3;
}
function isOverdue(iso) {
  const d = daysLeft(iso);
  return d !== null && d < 0;
}

// ── Cyber Deadline Badge ───────────────────────────────────────
function DeadlineBadge({ iso, compact = false }) {
  if (!iso) return null;
  const days    = daysLeft(iso);
  const overdue = isOverdue(iso);
  const crit    = isCritical(iso);
  const color   = overdue ? C.red : crit ? C.pink : C.dim;
  const pulse   = overdue || crit;

  if (compact) {
    // Inline badge in collapsed row
    return (
      <span className="mono" style={{
        fontSize:9, flexShrink:0, letterSpacing:1,
        color,
        animation: pulse ? "dlPulse 1.4s ease-in-out infinite" : undefined,
        display:"inline-flex", alignItems:"center", gap:3,
      }}>
        <Clock size={8}/>
        {overdue ? `−${Math.abs(days)}д` : days === 0 ? "TODAY!" : days === 1 ? "TOMORROW!" : `${days}д`}
      </span>
    );
  }

  // Full badge shown in expanded section
  const label = new Date(iso).toLocaleDateString("uk", { day:"2-digit", month:"long", year:"numeric" });
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px",
      border:`1px solid ${color}66`,
      background:`${color}10`,
      animation: pulse ? "dlPulse 1.4s ease-in-out infinite" : undefined,
    }}>
      <Clock size={9} style={{ color }}/>
      <span className="mono" style={{ fontSize:10, color, letterSpacing:1 }}>
        {overdue
          ? `ПРОСТРОЧЕНО ${Math.abs(days)} ДН ТОМУ`
          : days === 0
          ? "СЬОГОДНІ — ОСТАННІЙ ДЕНЬ!"
          : days === 1
          ? "ЗАВТРА!"
          : `ДО ${label.toUpperCase()} (${days} ДН)`}
      </span>
      {crit && !overdue && <AlertTriangle size={9} style={{ color }}/>}
    </div>
  );
}

// ── Task row (collapsed) ───────────────────────────────────────
function TaskRow({ task, expanded, onExpand, onToggle, onEdit, onDelete, dying }) {
  const hasDetails = task.description || task.deadline;
  const d = daysLeft(task.deadline);
  const leftAccent = isOverdue(task.deadline) ? C.red
                   : isCritical(task.deadline) ? C.pink
                   : isUrgent(task.deadline) ? C.yellow
                   : undefined;

  return (
    <div className={`tr${dying ? " evap" : ""}`}
      style={{
        borderBottom:`1px solid ${C.gray2}`, position:"relative",
        borderLeft: leftAccent ? `3px solid ${leftAccent}` : "3px solid transparent",
        paddingLeft: leftAccent ? 5 : 5,
      }}>
      <div className="flex items-start gap-2 py-2 -mx-4 px-4" style={{ minHeight:38 }}>

        {/* Checkbox */}
        <input type="checkbox" className="cb mt-0.5 flex-shrink-0"
          checked={task.done} onChange={() => onToggle(task.id)}/>

        {/* Priority dot */}
        <button onClick={() => onEdit(task.id, { priority: PRIO_CYCLE[task.priority] })}
          title={PRIO[task.priority]?.label}
          style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:5,
            background:PRIO[task.priority]?.color, border:"none", cursor:"pointer",
            boxShadow:`0 0 6px ${PRIO[task.priority]?.color}` }}/>

        {/* Expand arrow + title */}
        <div style={{ flex:1, minWidth:0 }}>
          <div className="flex items-center gap-1.5" style={{ cursor:hasDetails?"pointer":undefined }}
            onClick={() => hasDetails && onExpand(task.id)}>
            {hasDetails && (
              <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration:0.18 }}>
                <ChevronRight size={11} style={{ color:C.dim, flexShrink:0 }}/>
              </motion.div>
            )}
            <span className="mono" style={{
              fontSize:12,
              color: task.done ? C.dim : C.text,
              textDecoration: task.done ? "line-through" : "none",
              transition:"color .3s",
            }}>{task.text}</span>
            {task.description && !task.done && (
              <FileText size={9} style={{ color:C.dim2, flexShrink:0 }}/>
            )}
          </div>

          {/* Note */}
          {task.note && !task.done && (
            <div className="mono" style={{ fontSize:10, color:C.dim, marginTop:2, letterSpacing:.5 }}>
              // {task.note}
            </div>
          )}
        </div>

        {/* Right side: deadline + tags + actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {task.deadline && !task.done && (
            <DeadlineBadge iso={task.deadline} compact/>
          )}
          {task.done && <Tag label="DONE" color={C.green}/>}
          <div className="ta flex gap-0.5">
            <IBtn Icon={Pencil} hover={C.cyan}  onClick={() => onEdit(task.id, null)}/>
            <IBtn Icon={Trash2} hover={C.pink}  onClick={() => onDelete(task.id)}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expandable details section ────────────────────────────────
function TaskDetails({ task }) {
  return (
    <motion.div
      initial={{ opacity:0, height:0 }}
      animate={{ opacity:1, height:"auto" }}
      exit={{ opacity:0, height:0 }}
      transition={{ duration:0.22 }}
      style={{ overflow:"hidden" }}>
      <div style={{
        padding:"8px 12px 10px 32px",
        background:`${C.cyan}06`,
        borderBottom:`1px solid ${C.gray2}`,
        borderLeft:`1px solid ${C.cyan}22`,
        marginLeft:4,
      }}>
        {/* Full deadline badge */}
        {task.deadline && (
          <div style={{ marginBottom:8 }}>
            <DeadlineBadge iso={task.deadline} compact={false}/>
          </div>
        )}

        {/* Description */}
        {task.description ? (
          <div>
            <div className="mono" style={{ color:C.cyan, fontSize:9, letterSpacing:2, marginBottom:4 }}>
              // ОПИС ЗАВДАННЯ:
            </div>
            <div className="mono" style={{
              color:C.text, fontSize:11, lineHeight:1.7,
              padding:"6px 10px",
              background:`${C.bg}`,
              border:`1px solid ${C.border}`,
              whiteSpace:"pre-wrap",
            }}>
              {task.description}
            </div>
          </div>
        ) : (
          task.deadline && (
            <div className="mono" style={{ color:C.dim2, fontSize:9, letterSpacing:1 }}>
              // опис відсутній
            </div>
          )
        )}

        {/* Source badge if from Classroom */}
        {task.source === "classroom-api" || task.source === "paste" ? (
          <div className="mono" style={{ color:C.dim2, fontSize:8, letterSpacing:1, marginTop:6 }}>
            SOURCE: {task.source === "classroom-api" ? "GOOGLE CLASSROOM API" : "CLASSROOM PASTE"}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ── Edit form ─────────────────────────────────────────────────
function TaskEditForm({ task, onSave, onCancel }) {
  const [text, setText] = useState(task.text);
  const [note, setNote] = useState(task.note || "");
  const [desc, setDesc] = useState(task.description || "");
  const [dl,   setDl]   = useState(task.deadline ? new Date(task.deadline).toISOString().slice(0,10) : "");
  const [prio, setPrio] = useState(task.priority);

  const save = () => onSave({
    text: text.trim() || task.text,
    note, description: desc, priority: prio,
    deadline: dl ? new Date(dl + "T23:59:00").toISOString() : null,
  });

  return (
    <div className="py-2 -mx-4 px-4 flex flex-col gap-2"
      style={{ background:`${C.cyan}08`, borderBottom:`1px solid ${C.gray2}` }}>

      {/* Title */}
      <input className="ci clip-inp mono" value={text} onChange={e=>setText(e.target.value)}
        placeholder="Назва завдання" style={{ width:"100%", fontSize:12 }}
        onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}
        onKeyDown={e=>e.key==="Enter"&&save()}/>

      {/* Description */}
      <textarea className="ci clip-inp mono" value={desc} onChange={e=>setDesc(e.target.value)}
        placeholder="// Опис завдання (необов'язково)"
        rows={2} style={{ width:"100%", resize:"vertical", fontSize:11 }}
        onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>

      {/* Note */}
      <input className="ci clip-inp mono" value={note} onChange={e=>setNote(e.target.value)}
        placeholder="// Коротка нотатка" style={{ width:"100%", fontSize:11 }}
        onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>

      {/* Deadline + Priority row */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <span className="mono" style={{ color:C.dim, fontSize:10 }}>Дедлайн:</span>
          <input type="date" value={dl} onChange={e=>setDl(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono" style={{ color:C.dim, fontSize:10 }}>Пріоритет:</span>
          <div className="flex gap-1">
            {Object.entries(PRIO).map(([k,v]) => (
              <button key={k} onClick={()=>setPrio(k)} title={v.label}
                style={{ width:12, height:12, borderRadius:"50%", background:v.color,
                  border:prio===k?"2px solid white":"2px solid transparent",
                  cursor:"pointer", boxShadow:prio===k?`0 0 8px ${v.color}`:undefined }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Btn ch={<><Save size={10}/>ЗБЕРЕГТИ</>} color={C.cyan} onClick={save}/>
        <Btn ch={<><X size={10}/>СКАСУВАТИ</>}   color={C.dim} sm onClick={onCancel}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function MissionLog({ onExp, importedTasks }) {
  const [tasks,    setTasks]    = usePersist("sc_tasks6", DEF);
  const [dying,    setDying]    = useState(new Set());
  const [editId,   setEditId]   = useState(null);
  const [expanded, setExpanded] = useState(new Set()); // ids of expanded tasks
  const [input,    setInput]    = useState("");
  const [note,     setNote]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [dl,       setDl]       = useState("");
  const [prio,     setPrio]     = useState("med");
  const [filter,   setFilter]   = useState("active");
  const [showAdd,  setShowAdd]  = useState(false);
  const impRef = useRef(null);

  // ── Consume imported tasks from ClassroomSync ────────────────
  useEffect(() => {
    if (!importedTasks || importedTasks === impRef.current || !importedTasks.length) return;
    impRef.current = importedTasks;
    setTasks(prev => {
      const existing = new Set(prev.map(t => t.text.toLowerCase()));
      const fresh = importedTasks
        .filter(t => !existing.has(t.text.toLowerCase()))
        .map(t => ({
          id:          tid++,
          text:        t.text,
          description: t.description || "",
          done:        false,
          priority:    "med",
          deadline:    t.deadline || null,
          note:        "",
          source:      t.source || "classroom",
        }));
      if (fresh.length > 0) onExp(fresh.length * EXP.import);
      return [...prev, ...fresh];
    });
  }, [importedTasks]);

  // ── Evaporate helper ─────────────────────────────────────────
  const evap = (id, cb) => {
    setDying(p => new Set([...p, id]));
    setTimeout(() => { cb(); setDying(p => { const n=new Set(p); n.delete(id); return n; }); }, 630);
  };

  // ── Handlers ─────────────────────────────────────────────────
  const toggle = id => {
    const t = tasks.find(x=>x.id===id);
    if (!t) return;
    if (!t.done) {
      evap(id, () => { setTasks(p=>p.map(x=>x.id===id?{...x,done:true}:x)); onExp(EXP.task); });
    } else {
      setTasks(p=>p.map(x=>x.id===id?{...x,done:false}:x));
    }
  };

  const remove = id => evap(id, () => setTasks(p=>p.filter(x=>x.id!==id)));

  const editField = (id, patch) => {
    if (patch) { setTasks(p=>p.map(x=>x.id===id?{...x,...patch}:x)); }
    else { setEditId(id); }
  };

  const saveEdit = (id, data) => { setTasks(p=>p.map(x=>x.id===id?{...x,...data}:x)); setEditId(null); };

  const toggleExpand = id => {
    setExpanded(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const addTask = () => {
    if (!input.trim()) return;
    setTasks(p => [...p, {
      id: tid++, text:input.trim(), description:desc, done:false,
      priority:prio, deadline: dl ? new Date(dl+"T23:59:00").toISOString() : null,
      note, source:"manual",
    }]);
    setInput(""); setNote(""); setDesc(""); setDl(""); setShowAdd(false);
  };

  // ── Sorting + filtering ───────────────────────────────────────
  const visible = tasks
    .filter(t => {
      if (filter === "active")  return !t.done;
      if (filter === "done")    return t.done;
      if (filter === "urgent")  return (isCritical(t.deadline) || isOverdue(t.deadline)) && !t.done;
      if (filter === "classroom") return t.source && t.source !== "manual" && !t.done;
      return true;
    })
    .sort((a,b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const score = t => {
        if (isOverdue(t.deadline)) return 0;
        if (isCritical(t.deadline)) return 1;
        if (isUrgent(t.deadline)) return 2;
        return 3;
      };
      if (score(a) !== score(b)) return score(a) - score(b);
      const pc = { high:0, med:1, low:2 };
      return (pc[a.priority]||1) - (pc[b.priority]||1);
    });

  const doneCount     = tasks.filter(t=>t.done).length;
  const urgentCount   = tasks.filter(t=>isCritical(t.deadline)&&!t.done).length;
  const overdueCount  = tasks.filter(t=>isOverdue(t.deadline)&&!t.done).length;
  const classroomCount= tasks.filter(t=>t.source&&t.source!=="manual"&&!t.done).length;

  return (
    <Panel icon={ClipboardList} title="MISSION LOG" sub={`${doneCount}/${tasks.length}`} scrollH={480}>

      {/* ── Filter bar ── */}
      <div className="flex gap-1 mb-3 flex-wrap items-center">
        {[
          { id:"active",    label:"ACTIVE" },
          { id:"all",       label:"ALL" },
          { id:"done",      label:"DONE" },
          { id:"urgent",    label:`⚠ URGENT${urgentCount>0?` (${urgentCount})`:""}` },
          { id:"classroom", label:`📚 CLASSROOM${classroomCount>0?` (${classroomCount})`:""}` },
        ].map(f => (
          <button key={f.id} className="clip-sm mono cursor-pointer"
            onClick={() => setFilter(f.id)}
            style={{
              fontSize:9, padding:"3px 10px", letterSpacing:1,
              border:`1px solid ${filter===f.id?C.cyan:C.border}`,
              background: filter===f.id?`${C.cyan}18`:"transparent",
              color: filter===f.id?C.cyan:C.dim, transition:"all .15s",
            }}>{f.label}</button>
        ))}
        {overdueCount > 0 && (
          <span className="mono ml-auto" style={{ color:C.red, fontSize:9 }}>
            🔴 {overdueCount} ПРОСТРОЧЕНО
          </span>
        )}
      </div>

      {/* ── Task list ── */}
      <div className="sy" style={{ maxHeight:300 }}>
        <AnimatePresence mode="popLayout">
          {visible.length === 0 && (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:.5 }}
              className="mono" style={{ color:C.dim, fontSize:11, textAlign:"center", padding:"18px 0", letterSpacing:2 }}>
              // {filter==="done"?"НЕМАЄ ВИКОНАНИХ":"ВСЕ ВИКОНАНО ✓"}
            </motion.div>
          )}

          {visible.map(t => (
            <motion.div key={t.id} layout
              initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, scale:.92, transition:{duration:.15} }}>

              {editId === t.id ? (
                <TaskEditForm task={t}
                  onSave={data => saveEdit(t.id, data)}
                  onCancel={() => setEditId(null)}/>
              ) : (
                <>
                  <TaskRow
                    task={t}
                    expanded={expanded.has(t.id)}
                    dying={dying.has(t.id)}
                    onExpand={toggleExpand}
                    onToggle={toggle}
                    onEdit={editField}
                    onDelete={remove}
                  />
                  <AnimatePresence>
                    {expanded.has(t.id) && !dying.has(t.id) && (
                      <TaskDetails key={`d${t.id}`} task={t}/>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Add task ── */}
      <div className="mt-3">
        <button className="clip-sm mono cursor-pointer"
          onClick={() => setShowAdd(v=>!v)}
          style={{
            fontSize:10, padding:"4px 12px", letterSpacing:1,
            border:`1px solid ${C.yellow}`,
            background: showAdd ? `${C.yellow}18` : "transparent",
            color:C.yellow, display:"inline-flex", alignItems:"center", gap:4, transition:"all .15s",
          }}>
          {showAdd ? <X size={10}/> : <Plus size={10}/>}
          {showAdd ? "СКАСУВАТИ" : "+ НОВА МІСІЯ"}
        </button>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
              exit={{ opacity:0, height:0 }} style={{ overflow:"hidden", marginTop:8 }}>
              <div className="flex flex-col gap-2 p-3"
                style={{ border:`1px solid ${C.yellow}44`, background:`${C.yellow}06` }}>

                {/* Title */}
                <input className="ci clip-inp mono" value={input} onChange={e=>setInput(e.target.value)}
                  placeholder="НАЗВА ЗАВДАННЯ..."
                  onKeyDown={e=>e.key==="Enter"&&addTask()} style={{ width:"100%", fontSize:12 }}
                  onFocus={e=>e.target.style.borderColor=C.yellow} onBlur={e=>e.target.style.borderColor=C.border}
                  autoFocus/>

                {/* Description */}
                <textarea className="ci clip-inp mono" value={desc} onChange={e=>setDesc(e.target.value)}
                  placeholder="// Опис (необов'язково)" rows={2}
                  style={{ width:"100%", resize:"vertical", fontSize:11 }}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>

                {/* Note */}
                <input className="ci clip-inp mono" value={note} onChange={e=>setNote(e.target.value)}
                  placeholder="// Коротка нотатка" style={{ width:"100%", fontSize:11 }}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>

                {/* Deadline + priority */}
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="mono" style={{ color:C.dim, fontSize:10 }}>Дедлайн:</span>
                    <input type="date" value={dl} onChange={e=>setDl(e.target.value)}/>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono" style={{ color:C.dim, fontSize:10 }}>Пріоритет:</span>
                    <div className="flex gap-1">
                      {Object.entries(PRIO).map(([k,v]) => (
                        <button key={k} onClick={()=>setPrio(k)} title={v.label}
                          style={{ width:12, height:12, borderRadius:"50%", background:v.color,
                            border:prio===k?"2px solid white":"2px solid transparent",
                            cursor:"pointer", boxShadow:prio===k?`0 0 8px ${v.color}`:undefined }}/>
                      ))}
                    </div>
                  </div>
                </div>

                <Btn ch={<><Plus size={10}/>ДОДАТИ МІСІЮ</>}
                  color={C.yellow} onClick={addTask} disabled={!input.trim()}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}
