// Servidor simples para baixar os vídeos de out/ pelo navegador (funciona no Codespaces e no celular).
// Uso: npm run baixar  → abra a porta 8080 na aba "Ports" (ícone de globo) e toque no vídeo.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "out");
const PORT = Number(process.env.PORT ?? 8080);

const list = () =>
  fs.existsSync(OUT)
    ? fs
        .readdirSync(OUT)
        .filter((f) => /\.(mp4|mov|webm|png|jpg|gif)$/i.test(f))
        .map((f) => ({ f, s: fs.statSync(path.join(OUT, f)) }))
        .sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)
    : [];

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (url === "/" || url === "") {
      const rows = list()
        .map(
          ({ f, s }) =>
            `<li><a href="/${encodeURIComponent(f)}" download>${f}</a> <small>${(s.size / 1e6).toFixed(1)} MB · ${s.mtime.toLocaleString("pt-BR")}</small></li>`,
        )
        .join("");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
          `<title>Downloads</title><body style="font:18px system-ui;margin:24px;background:#111;color:#eee">` +
          `<h2>Vídeos renderizados</h2><ul style="line-height:2.2">${rows || "<li>Nada em out/ ainda.</li>"}</ul>` +
          `<style>a{color:#4af}</style></body>`,
      );
      return;
    }
    const file = path.join(OUT, path.basename(url));
    if (!fs.existsSync(file)) {
      res.writeHead(404).end("não encontrado");
      return;
    }
    const stat = fs.statSync(file);
    res.writeHead(200, {
      "Content-Type": file.endsWith(".mp4") ? "video/mp4" : "application/octet-stream",
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${path.basename(file)}"`,
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => {
    console.log(`Downloads em http://localhost:${PORT}`);
    console.log(`No Codespaces: aba "Ports" → porta ${PORT} → ícone de globo (Open in Browser).`);
  });
