// src/ClassroomSync.jsx — SYS//CORE v7.0
// ────────────────────────────────────────────────────────────────
//  • Фільтр 120 днів (замість 365)
//  • Повні дані: description, materials, attachments, maxPoints,
//    workType, submissionState, courseTitle, creationTime
//  • Apps Script v2 з повним маппінгом
//  • Покращений термінал з прогресом
// ────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, CheckCircle, AlertTriangle, X,
  ExternalLink, ChevronRight, Clock, FileText,
  Zap, BookOpen, Link2, Award,
} from "lucide-react";
import { C } from "./tokens";
import { usePersist } from "./hooks";
import { Btn } from "./ui";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
export const MAX_AGE_DAYS = 30;    // ← фільтр: тільки останні 30 днів
const WARN_DAYS           = 3;     // дедлайн < 3 днів → pulse red

// ═══════════════════════════════════════════════════════════════
// APPS SCRIPT CODE v2 — ПОВНА ІНФОРМАЦІЯ
// ═══════════════════════════════════════════════════════════════
// Повертає: title, description, materials[], attachments[],
//           maxPoints, workType, dueDate, courseTitle,
//           courseId, workId, alternateLink, creationTime
const APPS_SCRIPT_V2 = `// SYS//CORE v7 — Google Apps Script
// Кроки: script.google.com → Новий проект → вставити код
// → Сервіси → Google Classroom API → увімкнути
// → Розгорнути → Веб-застосунок → Доступ: Всі → Скопіювати URL

function doGet(e) {
  try {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 днів тому

    var courses = Classroom.Courses.list({
      courseStates: ['ACTIVE'],
      pageSize: 20
    }).courses || [];

    var result = [];

    courses.forEach(function(course) {
      try {
        var page = '';
        do {
          var params = {
            courseWorkStates: ['PUBLISHED'],
            orderBy: 'dueDate asc',
            pageSize: 50
          };
          if (page) params.pageToken = page;

          var resp = Classroom.Courses.CourseWork.list(course.id, params);
          var works = resp.courseWork || [];
          page = resp.nextPageToken || '';

          works.forEach(function(work) {
            // Парсимо дедлайн
            var due = null;
            if (work.dueDate) {
              var d = work.dueDate;
              var t = work.dueTime || { hours: 23, minutes: 59 };
              due = new Date(
                d.year, d.month - 1, d.day,
                t.hours || 23, t.minutes || 59
              );
              // Фільтр: ігноруємо старіші за 120 днів
              if (due < cutoff) return;
              due = due.toISOString();
            }

            // Збираємо матеріали (посилання, файли)
            var materials = [];
            if (work.materials) {
              work.materials.forEach(function(mat) {
                if (mat.driveFile) {
                  materials.push({
                    type: 'drive',
                    title: mat.driveFile.driveFile.title || 'Файл Google Drive',
                    url: mat.driveFile.driveFile.alternateLink || ''
                  });
                } else if (mat.youtubeVideo) {
                  materials.push({
                    type: 'youtube',
                    title: mat.youtubeVideo.title || 'YouTube відео',
                    url: 'https://youtu.be/' + mat.youtubeVideo.id
                  });
                } else if (mat.link) {
                  materials.push({
                    type: 'link',
                    title: mat.link.title || mat.link.url,
                    url: mat.link.url
                  });
                } else if (mat.form) {
                  materials.push({
                    type: 'form',
                    title: mat.form.title || 'Google Form',
                    url: mat.form.formUrl || ''
                  });
                }
              });
            }

            // Стан здачі (якщо є submissions)
            var submissionState = 'NEW';
            try {
              var subs = Classroom.Courses.CourseWork.StudentSubmissions.list(
                course.id, work.id, { userId: 'me' }
              ).studentSubmissions || [];
              if (subs.length > 0) submissionState = subs[0].state || 'NEW';
            } catch(se) {}

            result.push({
              workId:          work.id,
              courseId:        course.id,
              courseTitle:     course.name,
              courseSection:   course.section || '',
              title:           work.title,
              description:     (work.description || '').slice(0, 800),
              workType:        work.workType || 'ASSIGNMENT',
              maxPoints:       work.maxPoints || null,
              dueDate:         due,
              creationTime:    work.creationTime || null,
              alternateLink:   work.alternateLink || '',
              materials:       materials,
              submissionState: submissionState,
              scheduledTime:   work.scheduledTime || null,
            });
          });
        } while (page);
      } catch(ce) {
        Logger.log('Course ' + course.name + ' error: ' + ce.message);
      }
    });

    // Сортуємо: спочатку прострочені, потім за дедлайном, потім без дедлайну
    result.sort(function(a, b) {
      var now = new Date();
      var da = a.dueDate ? new Date(a.dueDate) : null;
      var db = b.dueDate ? new Date(b.dueDate) : null;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: result.length,
        cutoffDays: 30,
        generatedAt: new Date().toISOString(),
        tasks: result
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: e.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

// ═══════════════════════════════════════════════════════════════
// DATE UTILS
// ═══════════════════════════════════════════════════════════════
const MO_UK = { "січ":1,"лют":2,"бер":3,"кві":4,"тра":5,"чер":6,"лип":7,"сер":8,"вер":9,"жов":10,"лис":11,"гру":12 };
const MO_EN = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

function parseAnyDate(s) {
  if (!s) return null; let m;
  if ((m = s.match(/(\d{4})-(\d{2})-(\d{2})/)))
    return new Date(+m[1],+m[2]-1,+m[3],23,59).toISOString();
  if ((m = s.match(/(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/))) {
    const d=+m[1],mo=+m[2];
    if(d>=1&&d<=31&&mo>=1&&mo<=12){
      const y=m[3]?(m[3].length===2?2000+parseInt(m[3]):+m[3]):new Date().getFullYear();
      return new Date(y,mo-1,d,23,59).toISOString();
    }
  }
  if ((m = s.match(/(\d{1,2})\s+([а-яa-z]{3,})/i))) {
    const mo=MO_UK[m[2].toLowerCase().slice(0,3)]||MO_EN[m[2].toLowerCase().slice(0,3)];
    if(mo) return new Date(new Date().getFullYear(),mo-1,+m[1],23,59).toISOString();
  }
  if ((m = s.match(/([а-яa-z]{3,})\s+(\d{1,2})/i))) {
    const mo=MO_UK[m[1].toLowerCase().slice(0,3)]||MO_EN[m[1].toLowerCase().slice(0,3)];
    if(mo) return new Date(new Date().getFullYear(),mo-1,+m[2],23,59).toISOString();
  }
  return null;
}

function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso)-Date.now())/86400000);
}

// ═══════════════════════════════════════════════════════════════
// TEXT PARSER  (paste mode)
// ═══════════════════════════════════════════════════════════════
const SKIP_RE   = /^(google classroom|stream|classwork|people|grades|assignments?|завдання|тема|оголошення|матеріали|оцінки|posted|due|здано|очікується|відсутнє|no due date|без терміну|\d{1,2}:\d{2}$|^\d+$)/i;
const DL_PRE_RE = /^(термін[:\s]*здач[іи]?|due\s*date|due|до|здати\s+до|дедлайн[:\s]*)/i;

export function parseClassroomText(raw) {
  if (!raw.trim()) return [];
  const lines = raw.split("\n").map(l=>l.trim()).filter(Boolean);
  const tasks  = [];
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.length < 5 || SKIP_RE.test(line)) { i++; continue; }
    const task = { text:line, description:"", deadline:null, materials:[], source:"paste" };
    const descLines = [];
    for (let j=i+1; j<Math.min(i+10,lines.length); j++) {
      const next = lines[j];
      const stripped = next.replace(DL_PRE_RE,"").trim();
      const dl = parseAnyDate(stripped)||parseAnyDate(next);
      if (dl) { task.deadline = dl; break; }
      if (!SKIP_RE.test(next) && next.length > 2) descLines.push(next);
    }
    task.description = descLines.join(" ").slice(0,400);
    // фільтр 120 днів
    if (task.deadline && new Date(task.deadline).getTime() < cutoff) { i++; continue; }
    tasks.push(task);
    i++;
  }
  return tasks;
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOK FETCHER
// ═══════════════════════════════════════════════════════════════
async function fetchWebhook(url, onLog) {
  onLog("ESTABLISHING CONNECTION...");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  onLog(`SERVER RESPONSE [${res.status} OK]`);

  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Script error");

  onLog(`PAYLOAD RECEIVED: ${json.count} RECORDS`);
  onLog(`CUTOFF: LAST ${json.cutoffDays || MAX_AGE_DAYS} DAYS [ACTIVE]`);
  onLog(`GENERATED AT: ${json.generatedAt ? new Date(json.generatedAt).toLocaleTimeString() : "N/A"}`);

  const raw   = json.tasks || [];
  const cutoff= Date.now() - MAX_AGE_DAYS * 86400000;
  const valid  = raw.filter(t => {
    if (!t.dueDate) return true;
    return new Date(t.dueDate).getTime() >= cutoff;
  });
  const skipped = raw.length - valid.length;
  if (skipped > 0) onLog(`FILTERING OLD TASKS... ${skipped} REMOVED [DONE]`);
  onLog(`MAPPING FULL TASK DATA... [OK]`);

  const tasks = valid.map(item => ({
    text:            item.courseTitle ? `[${item.courseTitle}] ${item.title}` : item.title,
    title:           item.title,
    description:     item.description || "",
    deadline:        item.dueDate || null,
    workType:        item.workType || "ASSIGNMENT",
    maxPoints:       item.maxPoints,
    courseTitle:     item.courseTitle || "",
    courseSection:   item.courseSection || "",
    materials:       item.materials || [],
    submissionState: item.submissionState || "NEW",
    alternateLink:   item.alternateLink || "",
    creationTime:    item.creationTime || null,
    source:          "classroom-api",
  }));

  onLog(`TASKS READY: ${tasks.length} [OK]`);
  return tasks;
}

// ═══════════════════════════════════════════════════════════════
// SYNC TERMINAL
// ═══════════════════════════════════════════════════════════════
function SyncTerminal({ lines, active }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [lines]);

  return (
    <AnimatePresence>
      {(active || lines.length > 0) && (
        <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ overflow:"hidden" }}>
          <div className="sy" style={{ background:"#020208", border:`1px solid ${C.green}44`,
            padding:"8px 10px", marginTop:8, maxHeight:140,
            fontFamily:"'Share Tech Mono',monospace", fontSize:10, lineHeight:1.75 }}>

            {/* Status bar */}
            <div style={{ color:C.green, letterSpacing:2, marginBottom:6,
              borderBottom:`1px solid ${C.green}22`, paddingBottom:5,
              display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:8,height:8,borderRadius:"50%",display:"inline-block",
                background:active?C.green:C.dim, flexShrink:0,
                boxShadow:active?`0 0 8px ${C.green}`:undefined,
                animation:active?"pulse 1s infinite":undefined }}/>
              <span>CLASSROOM SYNC TERMINAL</span>
              <span style={{ marginLeft:"auto", color:C.dim, fontSize:9 }}>
                {active?"● RUNNING":"■ DONE"}
              </span>
            </div>

            {lines.map((l,i) => {
              const col = l.includes("[OK]")||l.includes("[DONE]")||l.includes("[ACTIVE]") ? C.green
                        : l.includes("[FAIL]")||l.includes("ERROR") ? C.pink
                        : l.includes("WARNING")||l.includes("REMOVED") ? C.yellow
                        : C.cyan;
              return (
                <motion.div key={i} initial={{ opacity:0,x:-5 }} animate={{ opacity:1,x:0 }} transition={{ duration:.18 }}
                  style={{ color:col }}>
                  <span style={{ color:C.dim }}>{"›"} </span>{l}
                </motion.div>
              );
            })}

            {active && (
              <div style={{ color:C.green }}>
                <span style={{ color:C.dim }}>{"›"} </span>
                <span style={{ animation:"bootBlink .65s infinite" }}>█</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEADLINE BADGE
// ═══════════════════════════════════════════════════════════════
function DeadlineBadge({ iso, compact }) {
  if (!iso) return null;
  const days    = daysLeft(iso);
  const overdue = days !== null && days < 0;
  const crit    = days !== null && days >= 0 && days < WARN_DAYS;
  const color   = overdue ? C.red : crit ? C.pink : C.dim;
  const pulse   = overdue || crit;
  const label   = new Date(iso).toLocaleDateString("uk",{day:"2-digit",month:"short",year:"numeric"});

  if (compact) return (
    <span className="mono" style={{ fontSize:9,flexShrink:0,letterSpacing:1,color,
      animation:pulse?"dlPulse 1.4s ease-in-out infinite":undefined,
      display:"inline-flex",alignItems:"center",gap:3 }}>
      <Clock size={8}/>
      {overdue?`−${Math.abs(days)}д`:days===0?"TODAY!":days===1?"TOMORROW!":`${days}д`}
    </span>
  );

  return (
    <div style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",
      border:`1px solid ${color}66`,background:`${color}10`,
      animation:pulse?"dlPulse 1.4s ease-in-out infinite":undefined }}>
      <Clock size={9} style={{ color }}/>
      <span className="mono" style={{ fontSize:10,color,letterSpacing:1 }}>
        {overdue?`ПРОСТРОЧЕНО ${Math.abs(days)} ДН`
          :days===0?"СЬОГОДНІ!":days===1?"ЗАВТРА!"
          :`ДО ${label.toUpperCase()} (${days} ДН)`}
      </span>
      {crit&&!overdue&&<AlertTriangle size={9} style={{ color }}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORK TYPE BADGE
// ═══════════════════════════════════════════════════════════════
const WORK_LABELS = {
  ASSIGNMENT:      { label:"ASSIGNMENT", color:"#4488ff" },
  SHORT_ANSWER_QUESTION: { label:"QUIZ Q", color:"#bf5fff" },
  MULTIPLE_CHOICE_QUESTION: { label:"QUIZ MC", color:"#bf5fff" },
  MATERIAL:        { label:"MATERIAL", color:"#4a6070" },
};

function WorkTypeBadge({ type }) {
  const cfg = WORK_LABELS[type] || { label: type || "TASK", color: C.dim };
  return (
    <span className="mono" style={{ fontSize:8,letterSpacing:1.5,padding:"1px 6px",
      border:`1px solid ${cfg.color}55`,color:cfg.color,background:`${cfg.color}14`,flexShrink:0 }}>
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUBMISSION STATE BADGE
// ═══════════════════════════════════════════════════════════════
const SUB_LABELS = {
  TURNED_IN:     { label:"✓ ЗДАНО",      color:"#00ff88" },
  RETURNED:      { label:"↩ ПОВЕРНЕНО",  color:"#fcee0a" },
  RECLAIMED_BY_STUDENT: { label:"ЗАБРАНО", color:"#ff8c00" },
  NEW:           { label:"НОВЕ",         color:"#4a6070" },
  CREATED:       { label:"В РОБОТІ",     color:"#4488ff" },
};
function SubBadge({ state }) {
  const cfg = SUB_LABELS[state] || { label:state||"?", color:C.dim };
  return (
    <span className="mono" style={{ fontSize:8,letterSpacing:1,padding:"1px 6px",
      border:`1px solid ${cfg.color}55`,color:cfg.color,background:`${cfg.color}14`,flexShrink:0 }}>
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// MATERIAL LINK
// ═══════════════════════════════════════════════════════════════
const MAT_ICONS = { drive:"📄", youtube:"▶", link:"🔗", form:"📝" };
function MaterialLink({ mat }) {
  return (
    <a href={mat.url} target="_blank" rel="noreferrer"
      style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",
        border:`1px solid ${C.cyan}33`,background:`${C.cyan}09`,
        color:C.cyan,fontSize:9,letterSpacing:.5,textDecoration:"none",
        transition:"border-color .15s,background .15s" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${C.cyan}88`;e.currentTarget.style.background=`${C.cyan}18`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.cyan}33`;e.currentTarget.style.background=`${C.cyan}09`;}}>
      <span>{MAT_ICONS[mat.type]||"🔗"}</span>
      <span className="mono">{mat.title.slice(0,40)}</span>
      <ExternalLink size={8}/>
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPANDABLE PREVIEW CARD
// ═══════════════════════════════════════════════════════════════
function PreviewCard({ task, index }) {
  const [open, setOpen] = useState(false);
  const days    = daysLeft(task.deadline);
  const overdue = days !== null && days < 0;
  const crit    = days !== null && days >= 0 && days < WARN_DAYS;
  const accentColor = overdue ? C.red : crit ? C.pink : C.green;

  return (
    <motion.div initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }}
      transition={{ delay:index*0.035 }}
      style={{ borderBottom:`1px solid ${C.gray2}`, borderLeft:`3px solid ${accentColor}`, paddingLeft:8, marginBottom:2 }}>

      {/* Collapsed row */}
      <div className="flex items-center gap-2 py-2 cursor-pointer" onClick={() => setOpen(v=>!v)}>
        <motion.div animate={{ rotate:open?90:0 }} transition={{ duration:.18 }}>
          <ChevronRight size={11} style={{ color:C.dim, flexShrink:0 }}/>
        </motion.div>
        <span className="mono" style={{ flex:1, fontSize:11, color:C.text, minWidth:0 }}
          title={task.text}>{task.text}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {task.workType && <WorkTypeBadge type={task.workType}/>}
          {task.submissionState && <SubBadge state={task.submissionState}/>}
          {task.deadline && <DeadlineBadge iso={task.deadline} compact/>}
          {task.materials?.length > 0 && (
            <span style={{ color:C.dim, fontSize:9 }}>{task.materials.length}📎</span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }}
            exit={{ opacity:0,height:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
            <div style={{ paddingBottom:10, paddingRight:4 }}>
              {/* Full deadline */}
              {task.deadline && (
                <div style={{ marginBottom:8 }}>
                  <DeadlineBadge iso={task.deadline}/>
                </div>
              )}

              {/* Course info */}
              {task.courseTitle && (
                <div className="mono" style={{ color:C.dim, fontSize:9, letterSpacing:1, marginBottom:6 }}>
                  <BookOpen size={9} style={{ display:"inline", marginRight:4 }}/>
                  {task.courseTitle}{task.courseSection ? ` · ${task.courseSection}` : ""}
                  {task.maxPoints ? <span style={{ color:C.yellow }}> · MAX: {task.maxPoints} балів</span> : ""}
                </div>
              )}

              {/* Description */}
              {task.description ? (
                <div style={{ marginBottom:8 }}>
                  <div className="mono" style={{ color:C.cyan, fontSize:9, letterSpacing:2, marginBottom:4 }}>
                    // ОПИС ЗАВДАННЯ:
                  </div>
                  <div className="mono" style={{ color:C.text, fontSize:10, lineHeight:1.7,
                    padding:"6px 10px", background:C.bg, border:`1px solid ${C.border}`,
                    whiteSpace:"pre-wrap", maxHeight:120, overflowY:"auto" }}>
                    {task.description}
                  </div>
                </div>
              ) : (
                <div className="mono" style={{ color:C.dim2, fontSize:9, marginBottom:6 }}>// опис відсутній</div>
              )}

              {/* Materials */}
              {task.materials?.length > 0 && (
                <div style={{ marginBottom:8 }}>
                  <div className="mono" style={{ color:C.cyan, fontSize:9, letterSpacing:2, marginBottom:4 }}>
                    // МАТЕРІАЛИ ({task.materials.length}):
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {task.materials.map((m,i) => <MaterialLink key={i} mat={m}/>)}
                  </div>
                </div>
              )}

              {/* Classroom link */}
              {task.alternateLink && (
                <a href={task.alternateLink} target="_blank" rel="noreferrer"
                  style={{ display:"inline-flex",alignItems:"center",gap:4,color:C.green,fontSize:9,textDecoration:"none" }}>
                  <ExternalLink size={9}/>
                  <span className="mono">ВІДКРИТИ В CLASSROOM</span>
                </a>
              )}

              {/* Meta */}
              <div className="mono" style={{ color:C.dim2, fontSize:8, letterSpacing:1, marginTop:6 }}>
                SOURCE: {task.source === "classroom-api" ? "CLASSROOM API v2" : "PASTE PARSER"}
                {task.creationTime && ` · CREATED: ${new Date(task.creationTime).toLocaleDateString("uk")}`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ClassroomSync({ onImport }) {
  const [webhookUrl, setWebhookUrl] = usePersist("sc_webhook7", "");
  const [pasteText,  setPasteText]  = useState("");
  const [tab,        setTab]        = useState("paste");
  const [status,     setStatus]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [preview,    setPreview]    = useState([]);
  const [showPrev,   setShowPrev]   = useState(false);
  const [termLines,  setTermLines]  = useState([]);
  const [termActive, setTermActive] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const addLine = useCallback((line, delay=0) => new Promise(res => {
    const t = setTimeout(() => { setTermLines(p => [...p, line]); res(); }, delay);
    timers.current.push(t);
  }), []);

  const clearTerm = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTermLines([]); setTermActive(false);
  }, []);

  const showTasks = useCallback((tasks, skipped=0) => {
    if (!tasks.length) {
      setStatus({ type:"err", msg:"ЗАВДАНЬ НЕ ЗНАЙДЕНО — ПЕРЕВІР ФОРМАТ АБО WEBHOOK" });
    } else {
      setPreview(tasks); setShowPrev(true);
    }
  }, []);

  // ── PASTE ──────────────────────────────────────────────────
  const runPaste = useCallback(async () => {
    clearTerm(); setStatus(null); setTermActive(true);
    await addLine("INITIALIZING TEXT PARSER... [OK]", 0);
    await addLine(`INPUT: ${pasteText.split("\n").filter(l=>l.trim()).length} LINES`, 150);
    await addLine("TOKENIZING TASK BLOCKS...", 300);
    const tasks = parseClassroomText(pasteText);
    await addLine(`TASKS EXTRACTED: ${tasks.length}`, 500);
    await addLine(`TIME FILTER: LAST ${MAX_AGE_DAYS} DAYS [ACTIVE]`, 650);
    await addLine("PARSING DEADLINE PATTERNS... [OK]", 800);
    await addLine(`READY: ${tasks.length} TASKS [OK]`, 950);
    timers.current.push(setTimeout(() => { setTermActive(false); showTasks(tasks); }, 1100));
  }, [pasteText, clearTerm, addLine, showTasks]);

  // ── WEBHOOK ────────────────────────────────────────────────
  const runWebhook = useCallback(async () => {
    if (!webhookUrl.trim()) { setStatus({ type:"err", msg:"ВВЕДИ URL WEBHOOK" }); return; }
    clearTerm(); setStatus(null); setLoading(true); setTermActive(true);
    await addLine("INITIALIZING SYNC ENGINE... [OK]", 0);
    await addLine(`TARGET: ${webhookUrl.slice(0,50)}...`, 200);

    const logBuf = [];
    try {
      const tasks = await fetchWebhook(webhookUrl.trim(), l => logBuf.push(l));
      for (let i=0; i<logBuf.length; i++) await addLine(logBuf[i], 300+i*180);
      timers.current.push(setTimeout(() => {
        setTermActive(false); setLoading(false); showTasks(tasks);
      }, 300 + logBuf.length*180 + 300));
    } catch (e) {
      await addLine(`ERROR: ${e.message} [FAIL]`, 400);
      setTermActive(false); setLoading(false);
      setStatus({ type:"err", msg:`ПОМИЛКА: ${e.message}` });
    }
  }, [webhookUrl, clearTerm, addLine, showTasks]);

  // ── CONFIRM ────────────────────────────────────────────────
  const confirmImport = useCallback(() => {
    onImport(preview);
    setShowPrev(false); setPreview([]); setPasteText("");
    setStatus({ type:"ok", msg:`✓ ІМПОРТОВАНО ${preview.length} ЗАВДАНЬ → MISSION LOG` });
    clearTerm();
    setTimeout(() => setStatus(null), 4500);
  }, [preview, onImport, clearTerm]);

  // ── STATS ──────────────────────────────────────────────────
  const critCount   = preview.filter(t => { const d=daysLeft(t.deadline); return d!==null&&d>=0&&d<WARN_DAYS; }).length;
  const overdueCount= preview.filter(t => { const d=daysLeft(t.deadline); return d!==null&&d<0; }).length;
  const turnedIn    = preview.filter(t => t.submissionState==="TURNED_IN").length;

  const TABS = [
    { id:"paste",   label:"📋 ВСТАВИТИ" },
    { id:"webhook", label:"🔗 WEBHOOK API" },
    { id:"guide",   label:"📖 ІНСТРУКЦІЯ" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} className="clip-sm mono cursor-pointer"
            onClick={() => setTab(t.id)}
            style={{ fontSize:9,padding:"4px 10px",letterSpacing:1,
              border:`1px solid ${tab===t.id?C.green:C.border}`,
              background:tab===t.id?`${C.green}18`:"transparent",
              color:tab===t.id?C.green:C.dim,transition:"all .15s" }}>{t.label}</button>
        ))}
        <span className="mono ml-auto" style={{ color:C.dim, fontSize:9, alignSelf:"center", letterSpacing:1 }}>
          FILTER: LAST {MAX_AGE_DAYS}d
        </span>
      </div>

      {/* ── PASTE TAB ── */}
      {tab==="paste" && (
        <div className="flex flex-col gap-2">
          <div className="mono" style={{ color:C.dim, fontSize:10 }}>
            Google Classroom → Завдання (Classwork) → Ctrl+A → Ctrl+C → вставити:
          </div>
          <textarea className="ci clip-inp mono"
            placeholder={"Лабораторна робота №3 — Алгоритми\nОпис: Реалізувати алгоритм Дейкстри мовою Python.\nТермін здачі: 20 груд.\n\nКурсова — Комп'ютерні мережі\nDue: Dec 25\n\nПрезентація по ОС\nдо 15.01"}
            value={pasteText} onChange={e=>setPasteText(e.target.value)}
            rows={6} style={{ width:"100%", resize:"vertical" }}
            onFocus={e=>e.target.style.borderColor=C.green}
            onBlur={e=>e.target.style.borderColor=C.border}/>
          <div className="flex gap-2">
            <Btn ch={<><Zap size={10}/>PARSE & PREVIEW</>}
              color={C.green} onClick={runPaste} disabled={!pasteText.trim()||loading}/>
            {pasteText && <Btn ch={<><X size={10}/>CLEAR</>} color={C.dim} sm onClick={()=>{setPasteText("");clearTerm();}}/>}
          </div>
        </div>
      )}

      {/* ── WEBHOOK TAB ── */}
      {tab==="webhook" && (
        <div className="flex flex-col gap-2">
          <div className="mono" style={{ color:C.dim, fontSize:10 }}>URL Apps Script Web App (вкладка 📖 — деталі):</div>
          <input className="ci clip-inp mono" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            style={{ width:"100%" }}
            onFocus={e=>e.target.style.borderColor=C.green}
            onBlur={e=>e.target.style.borderColor=C.border}/>
          <div className="flex gap-2 items-center">
            <Btn ch={loading
              ? <><RefreshCw size={10} style={{ animation:"spin 1s linear infinite" }}/>SYNC...</>
              : <><RefreshCw size={10}/>SYNC CLASSROOM</>}
              color={C.green} onClick={runWebhook} disabled={loading||!webhookUrl.trim()}/>
            {webhookUrl && !loading && (
              <button onClick={()=>window.open(webhookUrl,"_blank")}
                style={{ color:C.dim,background:"none",border:"none",cursor:"pointer",
                  display:"flex",alignItems:"center",gap:3,fontSize:10 }}
                onMouseEnter={e=>e.currentTarget.style.color=C.cyan}
                onMouseLeave={e=>e.currentTarget.style.color=C.dim}>
                <ExternalLink size={10}/>TEST URL
              </button>
            )}
          </div>
          <div className="mono" style={{ color:C.dim2, fontSize:9 }}>
            Автоматично фільтрує завдання старіші за {MAX_AGE_DAYS} днів.
          </div>
        </div>
      )}

      {/* ── GUIDE TAB ── */}
      {tab==="guide" && (
        <div className="sy flex flex-col gap-3" style={{ maxHeight:320 }}>
          <div style={{ background:`${C.green}08`,border:`1px solid ${C.green}33`,padding:"10px 12px" }}>
            <div className="orb" style={{ color:C.green,fontSize:10,letterSpacing:2,marginBottom:8 }}>
              🔗 APPS SCRIPT v2 — ПОВНИЙ КОД (з описами та матеріалами)
            </div>
            <div className="mono" style={{ color:C.text,fontSize:11,lineHeight:1.75,marginBottom:8 }}>
              <b style={{ color:C.yellow }}>1.</b>{" "}
              <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color:C.cyan }}>
                script.google.com
              </a> → Новий проект → замінити весь код<br/>
              <b style={{ color:C.yellow }}>2.</b> Сервіси (⊕) → <b>Google Classroom API</b> → Додати<br/>
              <b style={{ color:C.yellow }}>3.</b> Зберегти (Ctrl+S) → Виконати → Авторизувати акаунт<br/>
              <b style={{ color:C.yellow }}>4.</b> Розгорнути → Новий деплой → Веб-застосунок<br/>
              &nbsp;&nbsp;&nbsp;→ Виконувати як: <b>Я</b> &nbsp;→ Доступ: <b>Всі</b> → Розгорнути<br/>
              <b style={{ color:C.yellow }}>5.</b> Скопіювати URL → вставити у вкладку 🔗 WEBHOOK API
            </div>
            <pre style={{ background:C.bg,border:`1px solid ${C.border}`,
              padding:"8px 10px",fontSize:9,color:C.cyan,
              overflowX:"auto",lineHeight:1.5,whiteSpace:"pre",
              maxHeight:240,overflowY:"auto" }}>
              {APPS_SCRIPT_V2}
            </pre>
            <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:6 }}>
              {["title","description (800 chars)","dueDate","courseTitle","workType","maxPoints","materials[]","submissionState","alternateLink","creationTime"].map(f => (
                <span key={f} className="mono" style={{ fontSize:8,padding:"1px 6px",
                  border:`1px solid ${C.cyan}44`,color:C.cyan,background:`${C.cyan}0c` }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background:`${C.cyan}08`,border:`1px solid ${C.cyan}33`,padding:"10px 12px" }}>
            <div className="orb" style={{ color:C.cyan,fontSize:10,letterSpacing:2,marginBottom:6 }}>
              📋 РУЧНИЙ ПАРСЕР — ПІДТРИМУВАНІ ФОРМАТИ
            </div>
            <div className="mono" style={{ color:C.text,fontSize:11,lineHeight:1.8 }}>
              Ctrl+A на сторінці Classroom → Ctrl+C → вставити у вкладку 📋<br/>
              <span style={{ color:C.yellow }}>Дати:</span> "20 груд." · "Dec 20" · "до 20.12" · "20/12/2025"<br/>
              <span style={{ color:C.yellow }}>Фільтр:</span> тільки завдання за останні <b>{MAX_AGE_DAYS} днів</b><br/>
              <span style={{ color:C.yellow }}>Опис:</span> рядки після назви (до дедлайну) → description поле
            </div>
          </div>
        </div>
      )}

      {/* Terminal */}
      <SyncTerminal lines={termLines} active={termActive}/>

      {/* Status */}
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity:0,y:-5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
            className="mono" style={{ marginTop:8,fontSize:10,letterSpacing:1,
              color:status.type==="ok"?C.green:C.pink,
              padding:"7px 10px",
              border:`1px solid ${status.type==="ok"?C.green:C.pink}44`,
              background:`${status.type==="ok"?C.green:C.pink}0b`,
              display:"flex",alignItems:"center",gap:6 }}>
            {status.type==="ok"?<CheckCircle size={11}/>:<AlertTriangle size={11}/>}
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {showPrev && (
          <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:10 }}
            style={{ marginTop:10,border:`1px solid ${C.green}66`,background:`${C.green}07`,padding:"10px 12px" }}>

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="orb" style={{ color:C.green,fontSize:10,letterSpacing:2 }}>
                  ЗНАЙДЕНО {preview.length} ЗАВДАНЬ — ПІДТВЕРДИТИ?
                </div>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {overdueCount>0&&<span className="mono" style={{ color:C.red,fontSize:9 }}>🔴 {overdueCount} ПРОСТРОЧЕНО</span>}
                  {critCount>0&&<span className="mono" style={{ color:C.pink,fontSize:9 }}>⚠ {critCount} КРИТИЧНО (&lt;{WARN_DAYS}д)</span>}
                  {turnedIn>0&&<span className="mono" style={{ color:C.green,fontSize:9 }}>✓ {turnedIn} ЗДАНО</span>}
                </div>
              </div>
              <Btn ch={<><X size={10}/>CANCEL</>} color={C.dim} sm onClick={()=>{setShowPrev(false);setPreview([]);}}/>
            </div>

            <div className="mono" style={{ color:C.dim2,fontSize:9,marginBottom:6,letterSpacing:1 }}>
              // Клікни ▶ щоб розгорнути деталі завдання
            </div>

            <div className="sy" style={{ maxHeight:240 }}>
              {preview.map((t,i) => <PreviewCard key={i} task={t} index={i}/>)}
            </div>

            <div className="flex gap-2 mt-3">
              <Btn ch={<><CheckCircle size={10}/>ІМПОРТУВАТИ ВСЕ ({preview.length})</>}
                color={C.green} onClick={confirmImport}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
