// src/MusicPlayer.jsx — SYS//CORE v8.0
// ─────────────────────────────────────────────────────────────────
// Використовує YouTube IFrame Player API (window.YT.Player):
//   • Реальне автопереключення — слухаємо onStateChange (ENDED → next)
//   • Програмна гучність — player.setVolume() / player.mute()
//   • Реальний play/pause через player.playVideo() / pauseVideo()
//   • Черга зберігається у localStorage
//   • Shuffle режим
//   • Прогрес-бар (поточна позиція / тривалість)
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Plus, X, ExternalLink,
  Shuffle, Repeat, ChevronRight, Trash2,
  Loader, AlertCircle,
} from "lucide-react";
import { C } from "./tokens";
import { usePersist } from "./hooks";
import { IBtn } from "./ui";

// ─── YouTube Player States ────────────────────────────────────────
const YT_STATE = { UNSTARTED:-1, ENDED:0, PLAYING:1, PAUSED:2, BUFFERING:3, CUED:5 };

// ─── URL utilities ────────────────────────────────────────────────
function extractVideoId(url) {
  if (!url) return null;
  for (const re of [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]) { const m = url.match(re); if (m) return m[1]; }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

function extractPlaylistId(url) {
  const m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function normalizeUrl(url) {
  return url.replace("music.youtube.com", "www.youtube.com");
}

function thumbUrl(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
}

function fmtTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Default queue ────────────────────────────────────────────────
const DEFAULT_QUEUE = [
  { id:"d1", title:"Cyberpunk 2077 — Official Soundtrack",   videoId:"UnEuKRmFBf4", playlistId:null },
  { id:"d2", title:"Lo-Fi Hip Hop — Beats to Study/Relax",   videoId:"jfKfPfyJRdk", playlistId:null },
  { id:"d3", title:"Dark Synthwave / Retrowave Mix",          videoId:"b8YtEkNq2DI", playlistId:null },
  { id:"d4", title:"Blade Runner Ambient / Black Mirror OST", videoId:"HlBhWKVHmCc", playlistId:null },
].map(t => ({ ...t, thumb: thumbUrl(t.videoId) }));

// ─── Load YouTube IFrame API script once ──────────────────────────
let ytApiLoaded  = false;
let ytApiLoading = false;
const ytApiCbs   = [];

function loadYTApi() {
  return new Promise((resolve) => {
    if (ytApiLoaded) { resolve(); return; }
    ytApiCbs.push(resolve);
    if (ytApiLoading) return;
    ytApiLoading = true;
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiCbs.forEach(cb => cb());
      ytApiCbs.length = 0;
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

// ═══════════════════════════════════════════════════════════════════
// CORE: useYTPlayer hook — manages YT.Player lifecycle
// ═══════════════════════════════════════════════════════════════════
function useYTPlayer({ containerId, onEnded, onStateChange, onReady }) {
  const playerRef = useRef(null);
  const readyRef  = useRef(false);

  const init = useCallback((videoId, playlistId) => {
    if (!videoId && !playlistId) return;

    const create = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      readyRef.current = false;

      const vars = {
        autoplay:       1,
        rel:            0,
        modestbranding: 1,
        fs:             1,
        controls:       1,
      };
      if (playlistId) { vars.list = playlistId; vars.listType = "playlist"; }

      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width:  "100%",
        videoId: videoId || undefined,
        playerVars: vars,
        events: {
          onReady: (e) => {
            readyRef.current = true;
            onReady?.(e);
          },
          onStateChange: (e) => {
            onStateChange?.(e.data);
            if (e.data === YT_STATE.ENDED) onEnded?.();
          },
          onError: (e) => console.warn("[YT Player] error", e.data),
        },
      });
    };

    if (ytApiLoaded) { create(); }
    else { loadYTApi().then(create); }
  }, [containerId, onEnded, onStateChange, onReady]);

  const ready = () => readyRef.current && playerRef.current;

  const api = {
    play:      ()    => ready() && playerRef.current.playVideo(),
    pause:     ()    => ready() && playerRef.current.pauseVideo(),
    setVol:    (v)   => ready() && playerRef.current.setVolume(v),
    mute:      ()    => ready() && playerRef.current.mute(),
    unmute:    ()    => ready() && playerRef.current.unMute(),
    isMuted:   ()    => ready() ? playerRef.current.isMuted() : false,
    getDur:    ()    => ready() ? (playerRef.current.getDuration() || 0) : 0,
    getCurr:   ()    => ready() ? (playerRef.current.getCurrentTime() || 0) : 0,
    seekTo:    (s)   => ready() && playerRef.current.seekTo(s, true),
    getState:  ()    => ready() ? playerRef.current.getPlayerState() : -1,
    getTitle:  ()    => {
      try { return ready() ? playerRef.current.getVideoData()?.title || "" : ""; } catch { return ""; }
    },
  };

  return { init, api };
}

// ═══════════════════════════════════════════════════════════════════
// TRACK CARD
// ═══════════════════════════════════════════════════════════════════
function TrackCard({ track, active, index, onPlay, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="flex items-center gap-2 py-2 -mx-4 px-4 cursor-pointer"
      style={{
        borderBottom:`1px solid ${C.gray2}`,
        background: active ? `${C.pink}10` : hov ? `${C.pink}06` : "transparent",
        borderLeft: active ? `3px solid ${C.pink}` : "3px solid transparent",
        transition:"all .15s",
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onPlay(index)}>

      {track.thumb
        ? <img src={track.thumb} alt="" style={{ width:48, height:34, objectFit:"cover", flexShrink:0 }}/>
        : <div style={{ width:48,height:34,background:C.gray,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Music2 size={14} style={{ color:C.dim }}/>
          </div>}

      <div style={{ flex:1, minWidth:0 }}>
        <div className="mono" style={{ fontSize:11, color:active?C.pink:C.text,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {active && <span style={{ color:C.pink, marginRight:4, animation:"pulse 1.2s infinite" }}>♪</span>}
          {track.title || "Unknown Track"}
        </div>
        {track.playlistId && <div className="mono" style={{ fontSize:9,color:C.dim,letterSpacing:1 }}>📋 PLAYLIST</div>}
      </div>

      <div style={{ display:"flex", gap:4, opacity:hov?1:0, transition:"opacity .15s", flexShrink:0 }}>
        {track.videoId && (
          <a href={`https://youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{ color:C.dim, display:"flex", alignItems:"center" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.cyan}
            onMouseLeave={e=>e.currentTarget.style.color=C.dim}>
            <ExternalLink size={11}/>
          </a>
        )}
        <IBtn Icon={Trash2} hover={C.pink} size={11}
          onClick={e=>{ e.stopPropagation(); onRemove(index); }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════
function ProgressBar({ current, duration, onSeek, color }) {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const barRef = useRef(null);

  const handleClick = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac * duration);
  };

  return (
    <div ref={barRef}
      style={{ height:4, background:C.gray2, cursor:"pointer", position:"relative", borderRadius:2 }}
      onClick={handleClick}>
      <div style={{
        height:"100%", width:`${pct}%`,
        background:`linear-gradient(90deg,${color}88,${color})`,
        boxShadow:`0 0 6px ${color}66`,
        borderRadius:2, transition:"width .5s linear",
        position:"relative",
      }}>
        {/* thumb dot */}
        <div style={{
          position:"absolute", right:-5, top:-4,
          width:12, height:12, borderRadius:"50%",
          background:color, boxShadow:`0 0 8px ${color}`,
        }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VOLUME SLIDER
// ═══════════════════════════════════════════════════════════════════
function VolumeControl({ volume, muted, onVolume, onToggleMute }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onToggleMute}
        style={{ color:muted?C.dim:C.pink, background:"none", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", transition:"color .15s" }}>
        {muted || volume === 0 ? <VolumeX size={15}/> : <Volume2 size={15}/>}
      </button>
      <div style={{ position:"relative", flex:1 }}>
        <input type="range" min="0" max="100" step="1"
          value={muted ? 0 : volume}
          onChange={e => onVolume(+e.target.value)}
          style={{
            width:"100%",
            accentColor: C.pink,
            cursor:"pointer",
          }}/>
      </div>
      <span className="mono" style={{ color:C.dim, fontSize:10, minWidth:30, textAlign:"right" }}>
        {muted ? "–" : `${volume}%`}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ADD TRACK FORM
// ═══════════════════════════════════════════════════════════════════
function AddTrackForm({ onAdd, onClose }) {
  const [url,   setUrl]   = useState("");
  const [title, setTitle] = useState("");
  const [err,   setErr]   = useState("");

  const submit = () => {
    const raw = normalizeUrl(url.trim());
    if (!raw) { setErr("Введи URL"); return; }
    const videoId    = extractVideoId(raw);
    const playlistId = extractPlaylistId(raw);
    if (!videoId && !playlistId) { setErr("Не вдалося розпізнати YouTube URL"); return; }
    onAdd({
      id:         Date.now().toString(),
      title:      title.trim() || (videoId ? `Track ${videoId}` : `Playlist ${playlistId}`),
      url:        raw,
      videoId,
      playlistId,
      thumb:      thumbUrl(videoId),
    });
    setUrl(""); setTitle(""); setErr(""); onClose();
  };

  return (
    <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }}
      exit={{ opacity:0,height:0 }} style={{ overflow:"hidden" }}>
      <div className="flex flex-col gap-2 p-3 mt-2"
        style={{ border:`1px solid ${C.pink}44`, background:`${C.pink}07` }}>

        <div className="mono" style={{ color:C.dim, fontSize:10, letterSpacing:1 }}>
          Вставити посилання з YouTube або YouTube Music:
        </div>

        <input className="ci clip-inp mono"
          value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://music.youtube.com/watch?v=... або youtu.be/..."
          style={{ width:"100%" }}
          onFocus={e => e.target.style.borderColor = C.pink}
          onBlur={e  => e.target.style.borderColor = C.border}
          onKeyDown={e => e.key === "Enter" && submit()}
          autoFocus/>

        <input className="ci clip-inp mono"
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Назва треку (необов'язково — підтягнеться автоматично)"
          style={{ width:"100%" }}
          onFocus={e => e.target.style.borderColor = C.pink}
          onBlur={e  => e.target.style.borderColor = C.border}
          onKeyDown={e => e.key === "Enter" && submit()}/>

        {err && <div className="mono" style={{ color:C.red, fontSize:10 }}>{err}</div>}

        <div className="mono" style={{ color:C.dim2, fontSize:9, lineHeight:1.6 }}>
          Підтримується: youtube.com/watch?v=... · youtu.be/... · music.youtube.com/watch?v=...<br/>
          · youtube.com/playlist?list=... · Просто 11-символьний ID відео
        </div>

        <div className="flex gap-2">
          <button className="clip-sm mono cursor-pointer"
            onClick={submit}
            style={{ fontSize:11, padding:"5px 16px", letterSpacing:1,
              border:`1px solid ${C.pink}`, background:`${C.pink}18`,
              color:C.pink, transition:"all .15s" }}>
            + ДОДАТИ В ЧЕРГУ
          </button>
          <button className="clip-sm mono cursor-pointer"
            onClick={onClose}
            style={{ fontSize:11, padding:"5px 12px", letterSpacing:1,
              border:`1px solid ${C.border}`, background:"transparent",
              color:C.dim, transition:"all .15s" }}>
            CANCEL
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function MusicPlayer() {
  const [queue,      setQueue]     = usePersist("sc_queue8",   DEFAULT_QUEUE);
  const [idx,        setIdx]       = usePersist("sc_idx8",     0);
  const [volume,     setVolume]    = usePersist("sc_vol8",     75);
  const [muted,      setMuted]     = usePersist("sc_muted8",   false);
  const [shuffle,    setShuffle]   = usePersist("sc_shuffle8", false);
  const [repeat,     setRepeat]    = usePersist("sc_repeat8",  false); // repeat one

  const [playing,    setPlaying]   = useState(false);
  const [ytState,    setYtState]   = useState(YT_STATE.UNSTARTED);
  const [duration,   setDuration]  = useState(0);
  const [position,   setPosition]  = useState(0);
  const [ytTitle,    setYtTitle]   = useState("");
  const [showVideo,  setShowVideo] = useState(true);
  const [showAdd,    setShowAdd]   = useState(false);
  const [tab,        setTab]       = useState("player"); // player | queue
  const [minimized,  setMinimized] = useState(false);
  const [ytReady,    setYtReady]   = useState(false);
  const [ytError,    setYtError]   = useState(false);

  const PLAYER_DIV_ID = "sc-yt-player-v8";
  const posTimer = useRef(null);
  const initLock = useRef(false); // prevent double-init

  // ── Current track ───────────────────────────────────────────────
  const safeIdx   = Math.max(0, Math.min(idx, queue.length - 1));
  const current   = queue[safeIdx] || null;

  // ── YT Player hook ──────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (repeat) {
      ytApi.seekTo(0);
      ytApi.play();
      return;
    }
    // Advance queue
    setIdx(prev => {
      const len = queue.length;
      if (len <= 1) return prev;
      if (shuffle) {
        let next;
        do { next = Math.floor(Math.random() * len); } while (next === prev && len > 1);
        return next;
      }
      return (prev + 1) % len;
    });
  }, [repeat, shuffle, queue.length]);

  const handleStateChange = useCallback((state) => {
    setYtState(state);
    setPlaying(state === YT_STATE.PLAYING);
  }, []);

  const handleReady = useCallback(() => {
    setYtReady(true);
    setYtError(false);
    initLock.current = false;
    // Apply saved volume
    ytApi.setVol(volume);
    if (muted) ytApi.mute(); else ytApi.unmute();
    // Fetch duration after a short delay
    setTimeout(() => {
      const dur = ytApi.getDur();
      if (dur) setDuration(dur);
    }, 1000);
  }, [volume, muted]);

  const { init: initPlayer, api: ytApi } = useYTPlayer({
    containerId:   PLAYER_DIV_ID,
    onEnded:       handleEnded,
    onStateChange: handleStateChange,
    onReady:       handleReady,
  });

  // ── Load track when idx or queue changes ────────────────────────
  useEffect(() => {
    if (!current || initLock.current) return;
    initLock.current = true;
    setYtReady(false);
    setYtError(false);
    setDuration(0);
    setPosition(0);
    setYtTitle("");
    // Small delay so DOM element exists
    const t = setTimeout(() => initPlayer(current.videoId, current.playlistId), 80);
    return () => clearTimeout(t);
  }, [safeIdx, queue.length]); // re-init when track changes

  // ── Position polling ────────────────────────────────────────────
  useEffect(() => {
    clearInterval(posTimer.current);
    if (playing) {
      posTimer.current = setInterval(() => {
        const pos = ytApi.getCurr();
        const dur = ytApi.getDur();
        if (pos) setPosition(pos);
        if (dur && !duration) setDuration(dur);
        // Fetch real title from player
        const t = ytApi.getTitle();
        if (t) setYtTitle(t);
      }, 800);
    }
    return () => clearInterval(posTimer.current);
  }, [playing, duration]);

  // ── Controls ────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!ytReady) return;
    if (playing) { ytApi.pause(); setPlaying(false); }
    else         { ytApi.play();  setPlaying(true);  }
  };

  const changeVolume = (v) => {
    setVolume(v);
    setMuted(false);
    ytApi.setVol(v);
    ytApi.unmute();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) ytApi.mute(); else { ytApi.unmute(); ytApi.setVol(volume); }
  };

  const goNext = useCallback(() => {
    if (queue.length <= 1) return;
    setIdx(prev => {
      if (shuffle) {
        let n; do { n = Math.floor(Math.random() * queue.length); } while (n === prev && queue.length > 1);
        return n;
      }
      return (prev + 1) % queue.length;
    });
  }, [shuffle, queue.length, setIdx]);

  const goPrev = useCallback(() => {
    if (queue.length <= 1) return;
    // If >3s into track — restart instead
    if (position > 3) { ytApi.seekTo(0); return; }
    setIdx(prev => (prev - 1 + queue.length) % queue.length);
  }, [queue.length, position, setIdx]);

  const playAt = (i) => {
    if (i === safeIdx) { togglePlay(); return; }
    setIdx(i);
  };

  // ── Queue management ────────────────────────────────────────────
  const addTrack = (track) => setQueue(p => [...p, track]);

  const removeTrack = (i) => {
    setQueue(p => { const n = [...p]; n.splice(i, 1); return n; });
    if (i < safeIdx) setIdx(p => Math.max(0, p - 1));
    else if (i === safeIdx) setIdx(0);
  };

  const moveUp = (i) => {
    if (i === 0) return;
    setQueue(p => { const n=[...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });
    if (safeIdx === i)   setIdx(i - 1);
    if (safeIdx === i-1) setIdx(i);
  };

  // ─── Displayed title (real YT title > saved title > placeholder) ─
  const displayTitle = ytTitle || current?.title || "NO TRACK SELECTED";

  return (
    <div className="clip-lg sh sv relative overflow-hidden"
      style={{
        background:`linear-gradient(145deg,${C.bg2},${C.bg3} 60%,${C.bg4})`,
        border:`1px solid ${C.pink}66`,
        boxShadow:`0 0 24px ${C.pink}0e`,
      }}>

      {/* ── Panel header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 relative"
        style={{ borderBottom:`1px solid ${C.gray2}`, background:`${C.pink}12` }}>
        <div style={{ position:"absolute",left:0,top:0,bottom:0,width:3,
          background:`linear-gradient(180deg,transparent,${C.pink},transparent)` }}/>
        <Music2 size={13} style={{ color:C.pink }} className="anim-flick"/>
        <span className="orb" style={{ color:C.pink, fontSize:11, letterSpacing:3 }}>AUDIO SYSTEM</span>
        <span className="mono ml-auto" style={{ color:C.dim, fontSize:10, letterSpacing:2 }}>
          {playing ? "● PLAYING" : "■ STOPPED"}
        </span>
        {/* Minimize toggle */}
        <button onClick={() => setMinimized(v => !v)}
          style={{ color:C.dim,background:"none",border:"none",cursor:"pointer",marginLeft:6,
            display:"flex",alignItems:"center",transition:"color .15s" }}
          onMouseEnter={e => e.currentTarget.style.color=C.pink}
          onMouseLeave={e => e.currentTarget.style.color=C.dim}
          title={minimized?"Expand":"Minimize"}>
          <motion.div animate={{ rotate: minimized ? 0 : 90 }} transition={{ duration:.2 }}>
            <ChevronRight size={14}/>
          </motion.div>
        </button>
      </div>

      {/* ── Minimized bar ── */}
      <AnimatePresence>
        {minimized && (
          <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }}
            exit={{ height:0,opacity:0 }} transition={{ duration:.2 }} style={{ overflow:"hidden" }}>
            <div className="flex items-center gap-2 px-4 py-2">
              {current?.thumb && (
                <img src={current.thumb} alt="" style={{ width:36,height:24,objectFit:"cover",flexShrink:0 }}/>
              )}
              <div style={{ flex:1,minWidth:0 }}>
                <div className="mono" style={{ fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {playing&&<span style={{ color:C.pink,marginRight:4,animation:"pulse 1.2s infinite" }}>♪</span>}
                  {displayTitle}
                </div>
                <ProgressBar current={position} duration={duration} onSeek={s=>ytApi.seekTo(s)} color={C.pink}/>
              </div>
              <IBtn Icon={SkipBack}    hover={C.pink} onClick={goPrev}   size={15}/>
              <button onClick={togglePlay} style={{ color:C.pink,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center" }}>
                {playing ? <Pause size={18}/> : <Play size={18}/>}
              </button>
              <IBtn Icon={SkipForward} hover={C.pink} onClick={goNext}   size={15}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full player ── */}
      <AnimatePresence>
        {!minimized && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="p-4">

              {/* Tab switcher */}
              <div className="flex gap-1 mb-3">
                {[{ id:"player",label:"▶ PLAYER" },{ id:"queue",label:`📋 QUEUE (${queue.length})` }].map(t => (
                  <button key={t.id} className="clip-sm mono cursor-pointer"
                    onClick={() => setTab(t.id)}
                    style={{ fontSize:9,padding:"3px 9px",letterSpacing:1,
                      border:`1px solid ${tab===t.id?C.pink:C.border}`,
                      background:tab===t.id?`${C.pink}18`:"transparent",
                      color:tab===t.id?C.pink:C.dim,transition:"all .15s" }}>{t.label}</button>
                ))}
                {/* VIDEO toggle */}
                <button onClick={() => setShowVideo(v => !v)}
                  className="clip-sm mono cursor-pointer ml-auto"
                  style={{ fontSize:9,padding:"3px 9px",letterSpacing:1,
                    border:`1px solid ${showVideo?C.pink:C.border}`,
                    background:showVideo?`${C.pink}14`:"transparent",
                    color:showVideo?C.pink:C.dim,transition:"all .15s" }}>
                  {showVideo?"VIDEO ▪":"VIDEO ○"}
                </button>
              </div>

              {/* ── PLAYER TAB ── */}
              {tab === "player" && (
                <div>
                  {/* Video / placeholder */}
                  <div style={{ position:"relative", marginBottom:12 }}>
                    {/* YT container — always in DOM for API control */}
                    <div style={{
                      display:showVideo?"block":"none",
                      position:"relative", paddingTop:"56.25%",
                      background:"#000", overflow:"hidden",
                    }}>
                      <div id={PLAYER_DIV_ID} style={{
                        position:"absolute",top:0,left:0,width:"100%",height:"100%",
                      }}/>
                    </div>

                    {/* Audio-only placeholder */}
                    {!showVideo && (
                      <div style={{ height:72, background:C.bg, border:`1px solid ${C.gray}`,
                        display:"flex",alignItems:"center",justifyContent:"center",gap:12 }}>
                        {playing
                          ? <>
                              {[0,1,2,3,4].map(i => (
                                <motion.div key={i}
                                  animate={{ scaleY:[0.3,1,0.3] }}
                                  transition={{ duration:.8,delay:i*.15,repeat:Infinity }}
                                  style={{ width:4,height:28,background:C.pink,borderRadius:2 }}/>
                              ))}
                            </>
                          : <Music2 size={28} style={{ color:C.dim, opacity:.4 }}/>}
                      </div>
                    )}

                    {/* Loading / error overlays */}
                    {!ytReady && !ytError && current && (
                      <div style={{ position:"absolute",inset:0,
                        background:"rgba(7,7,15,.7)",display:"flex",
                        alignItems:"center",justifyContent:"center",pointerEvents:"none" }}>
                        <motion.div animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:"linear" }}>
                          <Loader size={24} style={{ color:C.pink }}/>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Track info row */}
                  <div className="flex items-start gap-2 mb-3">
                    {current?.thumb && (
                      <img src={current.thumb} alt="" style={{ width:44,height:30,objectFit:"cover",flexShrink:0,border:`1px solid ${C.gray}` }}/>
                    )}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div className="mono" style={{ fontSize:12,color:C.text,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4 }}>
                        {displayTitle}
                      </div>
                      <div className="mono" style={{ color:C.dim,fontSize:9,letterSpacing:1,marginTop:2 }}>
                        {safeIdx+1} / {queue.length}
                        {shuffle && <span style={{ color:C.yellow,marginLeft:6 }}>SHUFFLE</span>}
                        {repeat  && <span style={{ color:C.cyan,marginLeft:6 }}>REPEAT 1</span>}
                      </div>
                    </div>
                    {current?.videoId && (
                      <a href={`https://youtube.com/watch?v=${current.videoId}`}
                        target="_blank" rel="noreferrer"
                        style={{ color:C.dim,flexShrink:0,display:"flex",alignItems:"center" }}
                        onMouseEnter={e=>e.currentTarget.style.color=C.cyan}
                        onMouseLeave={e=>e.currentTarget.style.color=C.dim}>
                        <ExternalLink size={12}/>
                      </a>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <ProgressBar current={position} duration={duration}
                      onSeek={s => { ytApi.seekTo(s); setPosition(s); }} color={C.pink}/>
                    <div className="flex justify-between mt-1">
                      <span className="mono" style={{ color:C.dim,fontSize:9 }}>{fmtTime(position)}</span>
                      <span className="mono" style={{ color:C.dim,fontSize:9 }}>{fmtTime(duration)}</span>
                    </div>
                  </div>

                  {/* Main controls */}
                  <div className="flex items-center justify-center gap-5 mb-3">
                    {/* Shuffle */}
                    <button onClick={() => setShuffle(v=>!v)}
                      style={{ color:shuffle?C.yellow:C.dim2,background:"none",border:"none",
                        cursor:"pointer",display:"flex",alignItems:"center",transition:"color .15s" }}>
                      <Shuffle size={14}/>
                    </button>

                    <IBtn Icon={SkipBack} hover={C.pink} onClick={goPrev} size={20}/>

                    {/* Play/Pause — big button */}
                    <button onClick={togglePlay}
                      className="clip-sm"
                      disabled={!current}
                      style={{
                        width:52,height:52,border:`1px solid ${C.pink}`,
                        background:`${C.pink}1a`,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        boxShadow:`0 0 16px ${C.pink}44`,
                        transition:"all .15s",
                        opacity:!current?0.4:1,
                      }}
                      onMouseEnter={e=>{if(current)e.currentTarget.style.boxShadow=`0 0 28px ${C.pink}88`;}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 16px ${C.pink}44`;}}>
                      {playing
                        ? <Pause size={22} style={{ color:C.pink }}/>
                        : <Play  size={22} style={{ color:C.pink }}/>}
                    </button>

                    <IBtn Icon={SkipForward} hover={C.pink} onClick={goNext} size={20}/>

                    {/* Repeat 1 */}
                    <button onClick={() => setRepeat(v=>!v)}
                      style={{ color:repeat?C.cyan:C.dim2,background:"none",border:"none",
                        cursor:"pointer",display:"flex",alignItems:"center",transition:"color .15s",
                        position:"relative" }}>
                      <Repeat size={14}/>
                      {repeat && (
                        <span style={{ position:"absolute",top:-5,right:-5,
                          fontSize:7,color:C.cyan,fontFamily:"monospace" }}>1</span>
                      )}
                    </button>
                  </div>

                  {/* Volume */}
                  <VolumeControl
                    volume={volume} muted={muted}
                    onVolume={changeVolume}
                    onToggleMute={toggleMute}
                  />

                  {/* Add track button */}
                  <div className="mt-3">
                    <button className="clip-sm mono cursor-pointer"
                      onClick={() => setShowAdd(v => !v)}
                      style={{ fontSize:10,padding:"4px 12px",letterSpacing:1,
                        border:`1px solid ${C.pink}`,
                        background:showAdd?`${C.pink}18`:"transparent",
                        color:C.pink,display:"inline-flex",alignItems:"center",gap:4,transition:"all .15s" }}>
                      {showAdd ? <X size={10}/> : <Plus size={10}/>}
                      {showAdd ? "CANCEL" : "+ ADD TRACK / PLAYLIST"}
                    </button>
                    <AnimatePresence>
                      {showAdd && (
                        <AddTrackForm onAdd={addTrack} onClose={() => setShowAdd(false)}/>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ── QUEUE TAB ── */}
              {tab === "queue" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="orb" style={{ color:C.pink,fontSize:10,letterSpacing:2 }}>
                      QUEUE — {queue.length} TRACKS
                    </span>
                    <button className="mono"
                      onClick={() => setQueue(DEFAULT_QUEUE)}
                      style={{ color:C.dim,fontSize:9,background:"none",border:"none",cursor:"pointer",letterSpacing:1 }}
                      onMouseEnter={e=>e.currentTarget.style.color=C.pink}
                      onMouseLeave={e=>e.currentTarget.style.color=C.dim}>
                      RESET TO DEFAULT
                    </button>
                  </div>

                  <div className="sy" style={{ maxHeight:300 }}>
                    <AnimatePresence mode="popLayout">
                      {queue.map((t,i) => (
                        <motion.div key={t.id||i} layout
                          initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }}
                          exit={{ opacity:0,x:20,transition:{duration:.15} }}>
                          <TrackCard
                            track={t} index={i}
                            active={i === safeIdx}
                            onPlay={playAt}
                            onRemove={removeTrack}/>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {queue.length === 0 && (
                      <div className="mono" style={{ color:C.dim,textAlign:"center",padding:"20px 0",fontSize:11 }}>
                        // QUEUE EMPTY — ADD TRACKS IN PLAYER TAB
                      </div>
                    )}
                  </div>

                  {/* Add from queue tab too */}
                  <div className="mt-3">
                    <button className="clip-sm mono cursor-pointer"
                      onClick={() => { setTab("player"); setShowAdd(true); }}
                      style={{ fontSize:10,padding:"4px 12px",letterSpacing:1,
                        border:`1px solid ${C.pink}`,background:"transparent",
                        color:C.pink,display:"inline-flex",alignItems:"center",gap:4,transition:"all .15s" }}>
                      <Plus size={10}/> ADD TRACK
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
