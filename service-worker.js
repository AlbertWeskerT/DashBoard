const CACHE="syscore-v5";
const STATIC=["/","/index.html","/manifest.json","/icons/icon-192.png","/icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(c=>{if(c)return c;return fetch(e.request).then(r=>{if(!r||r.status!==200||r.type!=="basic")return r;caches.open(CACHE).then(ca=>ca.put(e.request,r.clone()));return r;}).catch(()=>e.request.destination==="document"?caches.match("/index.html"):undefined);}));});
