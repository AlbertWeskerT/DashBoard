// src/globalCSS.js — SYS//CORE v6.0 ULTIMATE
import { useEffect } from "react";

export const RAW_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#07070f!important;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior:none;}
body::-webkit-scrollbar{display:none;}
body{color:#c8e0e8;font-family:'Share Tech Mono',monospace;font-size:13px;min-height:100vh;overflow-x:hidden;}

/* ── CRT warp ─────────────────────────────── */
@keyframes crtWarp{0%,97%,100%{transform:none;filter:none;}98%{transform:skewX(.35deg) scaleY(.999);filter:brightness(1.07) hue-rotate(1deg);}99%{transform:skewX(-.2deg);}}
body{animation:crtWarp 9s infinite;}

/* ── Scanlines ────────────────────────────── */
#crt{position:fixed;inset:0;pointer-events:none;z-index:9000;}
#crt::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(0,240,255,.015) 3px,rgba(0,240,255,.015) 4px);}
#crt::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 55%,rgba(0,0,0,.7) 100%);}

/* ── Moving scanline ──────────────────────── */
#scanmove{position:fixed;left:0;right:0;height:3px;background:linear-gradient(transparent,rgba(0,240,255,.06),transparent);pointer-events:none;z-index:8999;animation:mscan 7s linear infinite;}
@keyframes mscan{from{top:-3px;}to{top:100vh;}}

/* ── Danger vignette ──────────────────────── */
#danger{position:fixed;inset:0;pointer-events:none;z-index:8998;opacity:0;transition:opacity .5s;}
#danger.on{opacity:1;background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 48%,rgba(255,51,51,.2) 100%);animation:dpulse 2.5s ease-in-out infinite;}
@keyframes dpulse{0%,100%{opacity:.35;}50%{opacity:1;}}

/* ── Keyframes ────────────────────────────── */
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.15;}}
@keyframes scanH{0%{left:-70%;}100%{left:120%;}}
@keyframes scanV{0%{top:-8%;}100%{top:108%;}}
@keyframes flicker{0%,86%,90%,95%,98%,100%{opacity:1;}87%{opacity:.25;}91%{opacity:.6;}96%{opacity:.8;}99%{opacity:.4;}}
@keyframes bootBlink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes rgb{
  0%  {text-shadow:-2px 0 #ff2d6d,2px 0 #00f0ff,0 0 10px #00f0ff;}
  33% {text-shadow:2px 0 #fcee0a,-2px 0 #ff2d6d,0 0 10px #fcee0a;}
  66% {text-shadow:-1px 0 #00f0ff,1px 0 #fcee0a,0 0 10px #ff2d6d;}
  100%{text-shadow:-2px 0 #ff2d6d,2px 0 #00f0ff,0 0 10px #00f0ff;}
}
@keyframes evap{
  0%  {opacity:1;transform:scale(1) skewX(0);filter:none;}
  20% {opacity:.9;transform:scale(1.02) skewX(-3deg);filter:hue-rotate(90deg) brightness(2);}
  45% {opacity:.55;transform:scale(1.06) skewX(5deg) translateX(3px);filter:hue-rotate(200deg);}
  70% {opacity:.2;transform:scale(1.12) skewX(-4deg) translateX(-2px);filter:hue-rotate(300deg) blur(2px);}
  100%{opacity:0;transform:scale(1.25) translateY(-14px);filter:blur(8px);}
}
@keyframes levelup{0%{opacity:0;transform:scale(.5);}20%{opacity:1;transform:scale(1.06);}80%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(1.04);}}
@keyframes deadblink{0%,100%{color:#fcee0a;text-shadow:0 0 10px #fcee0a;}50%{color:#ff8c00;text-shadow:0 0 18px #ff8c00;}}
@keyframes dlPulse{
  0%,100%{opacity:1;filter:none;}
  40%{opacity:.55;filter:brightness(1.6) saturate(1.4);}
  50%{opacity:.4;}
  60%{opacity:.7;}
}
@keyframes termBlink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes importIn{from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:none;}}
@keyframes borderPulse{0%,100%{box-shadow:0 0 5px rgba(0,240,255,.3),inset 0 0 5px rgba(0,240,255,.08);}50%{box-shadow:0 0 18px rgba(0,240,255,.7),inset 0 0 10px rgba(0,240,255,.15);}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes notif{0%{transform:translateX(120%);}10%{transform:translateX(0);}80%{transform:translateX(0);}100%{transform:translateX(120%);}}

/* ── Fonts ────────────────────────────────── */
.orb {font-family:'Orbitron',monospace;}
.mono{font-family:'Share Tech Mono',monospace;}

/* ── Glow text ────────────────────────────── */
.gc{text-shadow:0 0 10px #00f0ff,0 0 24px #00f0ff44;}
.gy{text-shadow:0 0 8px #fcee0a,0 0 20px #fcee0a44;}
.gp{text-shadow:0 0 8px #bf5fff,0 0 18px #bf5fff44;}
.gr{text-shadow:0 0 8px #ff3333,0 0 16px #ff333344;}
.gg{text-shadow:0 0 8px #00ff88,0 0 16px #00ff8844;}
.rgb{animation:rgb 2.5s linear infinite;}

/* ── Clips ────────────────────────────────── */
.clip-lg{clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));}
.clip-md{clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));}
.clip-sm{clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px));}
.clip-inp{clip-path:polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,0 100%);}

/* ── Panel scan effects ───────────────────── */
.sh::after{content:'';position:absolute;top:0;left:-70%;width:70%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,240,255,.55),transparent);animation:scanH 8s linear infinite;pointer-events:none;}
.sv::before{content:'';position:absolute;left:0;top:-8%;width:100%;height:8px;background:linear-gradient(180deg,transparent,rgba(0,240,255,.06),transparent);animation:scanV 10s linear infinite;pointer-events:none;z-index:0;}

/* ── Inputs ───────────────────────────────── */
.ci{background:#0f0f20;border:1px solid #2a2a42;color:#c8e0e8;font-family:'Share Tech Mono',monospace;font-size:12px;padding:6px 10px;outline:none;transition:border-color .2s,box-shadow .2s;}
.ci:focus{border-color:#00f0ff;box-shadow:0 0 8px rgba(0,240,255,.25);}
.ci::placeholder{color:#2f3f50;}
.ci-y:focus{border-color:#fcee0a;box-shadow:0 0 8px rgba(252,238,10,.2);}
.eco-i{background:#0f0f20;border:1px solid #2a2a42;color:#c8e0e8;font-family:'Share Tech Mono',monospace;font-size:14px;padding:4px 8px;outline:none;width:120px;text-align:right;transition:border-color .2s;}
.eco-i:focus{border-color:#fcee0a;}

/* ── Checkbox ─────────────────────────────── */
.cb{width:16px;height:16px;flex-shrink:0;border:1px solid #00f0ff;background:transparent;cursor:pointer;appearance:none;position:relative;clip-path:polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px));transition:background .15s;}
.cb:checked{background:#00f0ff;}
.cb:checked::after{content:'✓';position:absolute;top:-2px;left:2px;color:#000;font-size:11px;font-weight:900;}

/* ── Task row ─────────────────────────────── */
.tr .ta{opacity:0;transition:opacity .15s;}
.tr:hover .ta{opacity:1;}
.tr:hover{background:rgba(252,238,10,.03);}

/* ── Evaporate ────────────────────────────── */
.evap{animation:evap .6s ease forwards;pointer-events:none;}

/* ── Deadline blink ───────────────────────── */
.dl-urgent{animation:deadblink 1.1s ease-in-out infinite;}

/* ── Progress bar ─────────────────────────── */
.pb-wrap{background:#0c0c1e;position:relative;overflow:hidden;}
.pb-wrap::after{content:'';position:absolute;top:0;right:0;bottom:0;left:0;background:repeating-linear-gradient(90deg,transparent 0,transparent 4px,rgba(0,0,0,.3) 4px,rgba(0,0,0,.3) 5px);}
.pb-fill{height:100%;transition:width .7s cubic-bezier(.4,0,.2,1);position:relative;z-index:1;}
.pb-fill::after{content:'';position:absolute;right:0;top:0;bottom:0;width:3px;background:rgba(255,255,255,.7);filter:blur(1px);}

/* ── Panel border pulse ───────────────────── */
.bpulse{animation:borderPulse 3s ease-in-out infinite;}

/* ── Scroll ───────────────────────────────── */
.sy{overflow-y:auto;}
.sy::-webkit-scrollbar{width:3px;}
.sy::-webkit-scrollbar-track{background:#07070f;}
.sy::-webkit-scrollbar-thumb{background:#2a2a42;border-radius:2px;}

/* ── Level up overlay ─────────────────────── */
.luo{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(7,7,15,.97);animation:levelup 2.8s ease forwards;}

/* ── Notification toast ───────────────────── */
.toast{position:fixed;top:20px;right:20px;z-index:9998;animation:notif 4s ease forwards;}

/* ── Date input style ─────────────────────── */
input[type=date]{background:#0f0f20;border:1px solid #2a2a42;color:#c8e0e8;font-family:'Share Tech Mono',monospace;font-size:11px;padding:3px 7px;outline:none;transition:border-color .2s;}
input[type=date]:focus{border-color:#00f0ff;}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(.4);}
textarea.ci{resize:vertical;min-height:80px;line-height:1.6;}

/* ── Import animation ─────────────────────── */
.import-in{animation:importIn .3s ease both;}

/* ── Neon border ──────────────────────────── */
.nb-c{border:1px solid rgba(0,240,255,.5)!important;}
.nb-y{border:1px solid rgba(252,238,10,.5)!important;}
.nb-p{border:1px solid rgba(191,95,255,.5)!important;}
.nb-g{border:1px solid rgba(0,255,136,.5)!important;}
`;

export default function useGlobalCSS() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "sc-global";
    el.textContent = RAW_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}
