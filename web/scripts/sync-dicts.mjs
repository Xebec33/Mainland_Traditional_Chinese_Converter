import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const repoRoot = path.join(webRoot, "..");
const srcOpencc = path.join(repoRoot, "opencc");
const pkgDist = path.join(webRoot, "node_modules", "opencc-wasm", "dist");
const destConfigDir = path.join(pkgDist, "data", "config");
const destDictDir = path.join(pkgDist, "data", "dict");

const required = [
  { from: path.join(srcOpencc, "s2tg.json"), to: path.join(destConfigDir, "s2tg.json") },
  { from: path.join(srcOpencc, "STGPhrases.ocd2"), to: path.join(destDictDir, "STGPhrases.ocd2") },
  { from: path.join(srcOpencc, "STGCharacters.ocd2"), to: path.join(destDictDir, "STGCharacters.ocd2") },
  { from: path.join(srcOpencc, "s2g.json"), to: path.join(destConfigDir, "s2g.json") },
  { from: path.join(srcOpencc, "SGPhrases.ocd2"), to: path.join(destDictDir, "SGPhrases.ocd2") },
  { from: path.join(srcOpencc, "SGCharacters.ocd2"), to: path.join(destDictDir, "SGCharacters.ocd2") },
  { from: path.join(srcOpencc, "t2gov.json"), to: path.join(destConfigDir, "t2gov.json") },
  { from: path.join(srcOpencc, "TGPhrases.ocd2"), to: path.join(destDictDir, "TGPhrases.ocd2") },
  { from: path.join(srcOpencc, "TGCharacters.ocd2"), to: path.join(destDictDir, "TGCharacters.ocd2") },
  { from: path.join(srcOpencc, "g2s.json"), to: path.join(destConfigDir, "g2s.json") },
  { from: path.join(srcOpencc, "GSPhrases.ocd2"), to: path.join(destDictDir, "GSPhrases.ocd2") },
  { from: path.join(srcOpencc, "GSCharacters.ocd2"), to: path.join(destDictDir, "GSCharacters.ocd2") },
];

function main() {
  const missing = required.filter((r) => !fs.existsSync(r.from));
  if (missing.length) {
    console.error(
      "[sync-dicts] 缺少 opencc/ 下的配置或词典。\n" +
        "通规简→繁：s2tg.json、STG*.ocd2（opencc-tonggui）。\n" +
        "古籍简→繁：s2g.json、SG*.ocd2。\n" +
        "繁→陆标繁：t2gov.json、TG*.ocd2。\n" +
        "古籍→简：g2s.json、GS*.ocd2（GujiCC 词表经 opencc_dict）。\n" +
        "缺失文件：\n" +
        missing.map((m) => "  - " + m.from).join("\n")
    );
    process.exit(1);
  }

  fs.mkdirSync(destConfigDir, { recursive: true });
  fs.mkdirSync(destDictDir, { recursive: true });

  for (const { from, to } of required) {
    fs.copyFileSync(from, to);
  }
  console.log("[sync-dicts] 已同步通规与古籍配置、词典到 opencc-wasm:", destConfigDir, destDictDir);
}

main();
