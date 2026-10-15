// Painel no navegador (porta 8080):
//   /       → baixar os vídeos de out/
//   /sons   → ouvir a biblioteca de efeitos, marcar ⭐ favorito / ⛔ banido e escrever o que cada som é.
//             Isso grava public/soundeffects/preferences.json, que o Claude lê para escolher os sons.
// Uso: npm run baixar   (ou npm run sons)  → aba "Ports" → porta 8080 → ícone de globo.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "out");
const THUMBS = path.join(ROOT, "thumbs");
const PUBLIC = path.join(ROOT, "public");
const CATALOG = path.join(PUBLIC, "soundeffects", "catalog.json");
const PREFS = path.join(PUBLIC, "soundeffects", "preferences.json");
const PORT = Number(process.env.PORT ?? 8080);

const TYPES = { ".mp4": "video/mp4", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".flac": "audio/flac", ".opus": "audio/ogg", ".png": "image/png", ".jpg": "image/jpeg" };
const readPrefs = () => (fs.existsSync(PREFS) ? JSON.parse(fs.readFileSync(PREFS, "utf8")) : { favorites: [], banned: [], notes: {} });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const STYLE = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:dark}body{font:16px system-ui;margin:0;background:#111;color:#eee}
header{position:sticky;top:0;background:#000;padding:12px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;z-index:2}
a{color:#5af}main{padding:16px;max-width:980px;margin:auto}h2{margin:28px 0 8px;text-transform:uppercase;font-size:14px;letter-spacing:.08em;color:#9aa}
.s{display:grid;grid-template-columns:1fr auto;gap:6px 12px;background:#1b1b1b;border-radius:10px;padding:10px 12px;margin:8px 0}
.s.ban{opacity:.45}.n{font-weight:700;word-break:break-word}.m{color:#9aa;font-size:13px}
.b{display:flex;gap:6px;align-items:center}button{background:#2a2a2a;color:#eee;border:0;border-radius:8px;padding:8px 10px;font-size:16px;cursor:pointer}
button.on{background:#3b5bdb}button.ban.on{background:#c92a2a}input{grid-column:1/-1;background:#0d0d0d;color:#eee;border:1px solid #333;border-radius:8px;padding:8px}
audio{grid-column:1/-1;width:100%;height:34px}#f{padding:8px;border-radius:8px;border:1px solid #333;background:#0d0d0d;color:#eee}
</style>`;

const downloadsPage = () => {
  const files = fs.existsSync(OUT)
    ? fs.readdirSync(OUT).filter((f) => /\.(mp4|mov|webm)$/i.test(f)).map((f) => ({ f, s: fs.statSync(path.join(OUT, f)) })).sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)
    : [];
  const rows = files.map(({ f, s }) => `<li><a href="/out/${encodeURIComponent(f)}" download>${esc(f)}</a> <span class="m">${(s.size / 1e6).toFixed(1)} MB · ${s.mtime.toLocaleString("pt-BR")}</span></li>`).join("");
  const thumbs = fs.existsSync(THUMBS)
    ? fs.readdirSync(THUMBS).filter((f) => /\.(png|jpe?g)$/i.test(f)).map((f) => ({ f, s: fs.statSync(path.join(THUMBS, f)) })).sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)
    : [];
  const grid = thumbs
    .map(({ f }) => `<a href="/thumbs/${encodeURIComponent(f)}" download style="display:inline-block;margin:6px;text-align:center;color:#ccc;font-size:13px"><img src="/thumbs/${encodeURIComponent(f)}?v" style="width:160px;border-radius:10px;display:block"><span>${esc(f)}</span></a>`)
    .join("");
  return `<!doctype html><title>Downloads</title>${STYLE}<header><b>Vídeos</b><a href="/sons">Biblioteca de sons →</a></header><main><ul style="line-height:2.4">${rows || "<li>Nada em out/ ainda.</li>"}</ul>${grid ? `<h2>Thumbnails (clique para baixar)</h2><div>${grid}</div>` : ""}</main>`;
};

const soundsPage = () => {
  if (!fs.existsSync(CATALOG)) return `<!doctype html>${STYLE}<main>Rode <code>npm run sfx:index</code> primeiro.</main>`;
  const { sounds } = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const prefs = readPrefs();
  const byRole = {};
  for (const s of sounds) (byRole[s.roles[0]] ??= []).push(s);
  const sections = Object.entries(byRole)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([role, list]) => {
      const items = list
        .map((s) => {
          const fav = prefs.favorites.includes(s.original);
          const ban = prefs.banned.includes(s.original);
          const note = prefs.notes?.[s.original] ?? "";
          return `<div class="s${ban ? " ban" : ""}" data-k="${esc(s.original)}" data-q="${esc(`${s.folder} ${s.name} ${s.roles.join(" ")} ${note}`.toLowerCase())}">
<div><div class="n">${esc(s.name)}</div><div class="m">${esc(s.folder)} · ${s.duration}s · ${esc(s.roles.join(", "))} · ${esc(s.traits)}</div></div>
<div class="b"><button class="fav${fav ? " on" : ""}" title="Favorito">⭐</button><button class="ban${ban ? " on" : ""}" title="Não usar">⛔</button></div>
<audio controls preload="none" src="/public/${s.original.split("/").map(encodeURIComponent).join("/")}"></audio>
<input placeholder="O que é esse som? quando usar? (ex.: tapa estalado, bom pra queda)" value="${esc(note)}">
</div>`;
        })
        .join("");
      return `<h2>${esc(role)} (${list.length})</h2>${items}`;
    })
    .join("");
  return `<!doctype html><title>Sons</title>${STYLE}
<header><b>Biblioteca de sons</b><input id="f" placeholder="filtrar…"><a href="/">← Vídeos</a><span class="m" id="st"></span></header>
<main><p class="m">Ouça, marque ⭐ nos que você mais gosta, ⛔ nos que não quer e descreva o som. Tudo salva sozinho e o Claude usa nas próximas edições.</p>${sections}</main>
<script>
const st=document.getElementById('st');
async function save(k,patch){st.textContent='salvando…';const r=await fetch('/api/prefs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k,...patch})});st.textContent=r.ok?'salvo ✓':'erro ao salvar';}
document.querySelectorAll('.s').forEach(el=>{const k=el.dataset.k;
 el.querySelector('.fav').onclick=e=>{e.target.classList.toggle('on');save(k,{favorite:e.target.classList.contains('on')})};
 el.querySelector('.ban').onclick=e=>{e.target.classList.toggle('on');el.classList.toggle('ban');save(k,{banned:e.target.classList.contains('on')})};
 let t;el.querySelector('input').oninput=e=>{clearTimeout(t);t=setTimeout(()=>save(k,{note:e.target.value}),600)};
 el.querySelector('audio').onplay=()=>document.querySelectorAll('audio').forEach(a=>{if(a!==el.querySelector('audio'))a.pause()});
});
document.getElementById('f').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.s').forEach(el=>el.style.display=el.dataset.q.includes(q)?'':'none')};
</script>`;
};

const sendFile = (res, file, download) => {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end("não encontrado");
  const stat = fs.statSync(file);
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": stat.size,
    ...(download ? { "Content-Disposition": `attachment; filename="${encodeURIComponent(path.basename(file))}"` } : {}),
  });
  fs.createReadStream(file).pipe(res);
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (req.method === "POST" && url === "/api/prefs") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const { k, favorite, banned, note } = JSON.parse(body);
          const p = readPrefs();
          p.favorites ??= [];
          p.banned ??= [];
          p.notes ??= {};
          const toggle = (arr, on) => (on ? [...new Set([...arr, k])] : arr.filter((x) => x !== k));
          if (favorite !== undefined) p.favorites = toggle(p.favorites, favorite);
          if (banned !== undefined) p.banned = toggle(p.banned, banned);
          if (note !== undefined) note.trim() ? (p.notes[k] = note.trim()) : delete p.notes[k];
          fs.writeFileSync(PREFS, JSON.stringify(p, null, 2) + "\n");
          res.writeHead(200).end("ok");
        } catch {
          res.writeHead(400).end("erro");
        }
      });
      return;
    }
    const html = (s) => res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(s);
    if (url === "/" || url === "") return html(downloadsPage());
    if (url === "/sons") return html(soundsPage());
    const safe = (base, rel) => {
      const p = path.normalize(path.join(base, rel));
      return p.startsWith(base) ? p : null;
    };
    if (url.startsWith("/out/")) {
      const p = safe(OUT, url.slice(5));
      return p ? sendFile(res, p, true) : res.writeHead(403).end();
    }
    if (url.startsWith("/thumbs/")) {
      const p = safe(THUMBS, url.slice(8).split("?")[0]);
      return p ? sendFile(res, p, !url.includes("?")) : res.writeHead(403).end();
    }
    if (url.startsWith("/public/")) {
      const p = safe(PUBLIC, url.slice(8));
      return p ? sendFile(res, p, false) : res.writeHead(403).end();
    }
    res.writeHead(404).end("não encontrado");
  })
  .listen(PORT, () => {
    console.log(`Painel em http://localhost:${PORT}  (vídeos)  e  http://localhost:${PORT}/sons  (biblioteca de sons)`);
    console.log(`No Codespaces: aba "Ports" → porta ${PORT} → ícone de globo.`);
  });
