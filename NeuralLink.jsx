// src/NeuralLink.jsx — SYS//CORE v5.0
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Plus, X, Save, Calendar, Trash2, Pencil, RefreshCw, Wifi } from "lucide-react";
import { C, DAYS, DAY_FULL } from "./tokens";
import { usePersist } from "./hooks";
import { Panel, Btn, Inp, DayTab, IBtn, SmBtn } from "./ui";
import ClassroomSync from "./ClassroomSync";

const DEF = {
  ПН: [
    { id:1, time:"08:00–09:30", name:"Алгоритми та структури даних", url:"https://meet.google.com", room:"401" },
    { id:2, time:"09:45–11:15", name:"Математичний аналіз",          url:"https://zoom.us",         room:"202" },
    { id:3, time:"14:00–15:30", name:"Комп'ютерні мережі",           url:"https://discord.com",     room:"Онлайн" },
  ],
  ВТ: [
    { id:4, time:"09:45–11:15", name:"Бази даних та SQL",            url:"https://teams.microsoft.com", room:"303" },
    { id:5, time:"11:30–13:00", name:"Операційні системи",            url:"https://meet.google.com",    room:"405" },
  ],
  СР: [
    { id:6, time:"08:00–09:30", name:"Машинне навчання",             url:"https://zoom.us",         room:"Онлайн" },
    { id:7, time:"13:00–14:30", name:"Комп'ютерна графіка",          url:"https://discord.com",     room:"lab2" },
  ],
  ЧТ: [
    { id:8, time:"10:00–11:30", name:"Веб-розробка",                 url:"https://meet.google.com", room:"304" },
    { id:9, time:"13:00–14:30", name:"Практикум Python",             url:"https://zoom.us",         room:"lab1" },
  ],
  ПТ: [
    { id:10, time:"09:00–10:30", name:"Диплом / НДР",                url:"https://teams.microsoft.com", room:"Онлайн" },
    { id:11, time:"11:00–12:30", name:"Фізична культура",            url:"#",                           room:"Спортзал" },
  ],
};
let sid = 500;

function ScheduleRow({ row, onDel, onEdit }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="flex items-center gap-2 py-2 -mx-4 px-4"
      style={{ borderBottom:`1px solid ${C.gray2}`, background:hov?"rgba(0,240,255,.03)":"transparent", transition:"background .15s" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <span className="mono" style={{ color:C.yellow, fontSize:11, minWidth:94, flexShrink:0 }}>{row.time}</span>
      <div style={{ flex:1 }}>
        <div className="mono" style={{ color:C.text, fontSize:12 }}>{row.name}</div>
        {row.room && <div className="mono" style={{ color:C.dim, fontSize:9, letterSpacing:1, marginTop:1 }}>📍 {row.room}</div>}
      </div>
      <div className="flex gap-1.5" style={{ opacity:hov?1:0, transition:"opacity .15s" }}>
        <Btn ch={<><Wifi size={9}/>LINK</>} color={C.cyan} sm onClick={() => window.open(row.url||"#","_blank")}/>
        <IBtn Icon={Pencil} hover={C.yellow} onClick={() => onEdit(row)}/>
        <IBtn Icon={Trash2} hover={C.pink}   onClick={() => onDel(row.id)}/>
      </div>
    </div>
  );
}

function RowForm({ initial, onSave, onCancel, accentColor }) {
  const [f, setF] = useState(initial || { time:"", name:"", url:"", room:"" });
  return (
    <div className="flex flex-col gap-2 p-3" style={{ border:`1px solid ${accentColor}44`, background:`${accentColor}07` }}>
      <div className="flex gap-2">
        <Inp val={f.time} set={v=>setF(p=>({...p,time:v}))} ph="09:00–10:30"    style={{ width:110 }}/>
        <Inp val={f.name} set={v=>setF(p=>({...p,name:v}))} ph="Назва предмету" style={{ flex:1 }}/>
      </div>
      <div className="flex gap-2">
        <Inp val={f.url}  set={v=>setF(p=>({...p,url:v}))}  ph="https://meet.google.com" style={{ flex:1 }}/>
        <Inp val={f.room} set={v=>setF(p=>({...p,room:v}))} ph="Кімната / онлайн"        style={{ width:110 }}/>
      </div>
      <div className="flex gap-2">
        <Btn ch={<><Save size={10}/>ЗБЕРЕГТИ</>} color={accentColor} onClick={() => { if(f.time&&f.name) onSave(f); }}/>
        <Btn ch={<><X size={10}/>СКАСУВАТИ</>}   color={C.dim} sm    onClick={onCancel}/>
      </div>
    </div>
  );
}

export default function NeuralLink({ onTasksImported }) {
  const today  = new Date().getDay();
  const todayI = today >= 1 && today <= 5 ? today-1 : 0;
  const [day,    setDay]   = useState(DAYS[todayI]);
  const [sched,  setSched] = usePersist("sc_sched5", DEF);
  const [panel,  setPanel] = useState(""); // "" | "add" | "sync" | editId
  const [editRow,setEditRow]= useState(null);

  const rows = sched[day] || [];

  const addRow = (f) => {
    setSched(p => ({...p,[day]:[...(p[day]||[]),{id:sid++,...f}].sort((a,b)=>a.time.localeCompare(b.time))}));
    setPanel("");
  };
  const delRow  = id => setSched(p => ({...p,[day]:p[day].filter(r=>r.id!==id)}));
  const saveEdit = (f) => {
    setSched(p => ({...p,[day]:p[day].map(r=>r.id===editRow.id?{...r,...f}:r).sort((a,b)=>a.time.localeCompare(b.time))}));
    setPanel(""); setEditRow(null);
  };

  return (
    <Panel icon={Cpu} title="NEURAL LINK" sub={`${rows.length} PAIRS`} scrollH={420}>
      {/* Day tabs */}
      <div className="flex gap-1 mb-3 flex-wrap items-center">
        {DAYS.map((d,i) => (
          <DayTab key={d} label={d} active={d===day} onClick={() => { setDay(d); setPanel(""); }} />
        ))}
        <div className="flex gap-1 ml-auto">
          <SmBtn ch={<><RefreshCw size={9}/>SYNC</>}  color={C.green}  active={panel==="sync"} onClick={() => setPanel(p=>p==="sync"?"":"sync")}/>
          <SmBtn ch={<><Plus size={9}/>ADD</>}         color={C.yellow} active={panel==="add"}  onClick={() => setPanel(p=>p==="add" ?"":"add")}/>
        </div>
      </div>

      {/* Day label */}
      <div className="mono flex items-center gap-2 mb-2" style={{ color:C.dim, fontSize:10, letterSpacing:3 }}>
        <Calendar size={10}/>{DAY_FULL[DAYS.indexOf(day)].toUpperCase()}
        <span className="ml-auto" style={{ color:C.dim2, fontSize:9 }}>{rows.length} ПАР</span>
      </div>

      {/* Classroom Sync panel */}
      <AnimatePresence>
        {panel==="sync" && (
          <motion.div key="sync" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden", marginBottom:12 }}>
            <div className="p-3" style={{ border:`1px solid ${C.green}44`, background:`${C.green}06` }}>
              <div className="orb mb-3" style={{ color:C.green, fontSize:10, letterSpacing:2 }}>
                <RefreshCw size={10} style={{ display:"inline", marginRight:6 }}/>CLASSROOM SYNC
              </div>
              <ClassroomSync onImport={(tasks) => { onTasksImported(tasks); setPanel(""); }}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {panel==="add" && (
          <motion.div key="add" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden", marginBottom:12 }}>
            <RowForm onSave={addRow} onCancel={() => setPanel("")} accentColor={C.yellow}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {panel==="edit" && editRow && (
          <motion.div key="edit" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden", marginBottom:12 }}>
            <RowForm initial={editRow} onSave={saveEdit} onCancel={() => { setPanel(""); setEditRow(null); }} accentColor={C.cyan}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rows */}
      <AnimatePresence mode="popLayout">
        {rows.length === 0 && (
          <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:.5 }}
            className="mono" style={{ color:C.dim, fontSize:11, textAlign:"center", padding:"20px 0", letterSpacing:2 }}>
            // НЕ РОЗКЛАДЕНО ДЛЯ {day}
          </motion.div>
        )}
        {rows.map(r => (
          <motion.div key={r.id} layout initial={{ opacity:0,x:-14 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:20 }}>
            <ScheduleRow row={r} onDel={delRow}
              onEdit={(row) => { setEditRow(row); setPanel("edit"); }}/>
          </motion.div>
        ))}
      </AnimatePresence>
    </Panel>
  );
}
