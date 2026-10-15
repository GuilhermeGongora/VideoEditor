// Cria o ranking.json a partir do ranking.example.json se ele ainda não existir.
// O ranking.json é o seu vídeo atual: não vai para o Git, então "git pull" nunca conflita com ele.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const target = path.join(ROOT, "ranking.json");
if (!fs.existsSync(target)) {
  fs.copyFileSync(path.join(ROOT, "ranking.example.json"), target);
  console.log("ranking.json criado a partir do ranking.example.json");
}
