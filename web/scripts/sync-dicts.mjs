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
];

function main() {
  const missing = required.filter((r) => !fs.existsSync(r.from));
  if (missing.length) {
    console.error(
      "[sync-dicts] 缺少 opencc/ 下的配置或词典，请确保存在 s2tg.json、STGPhrases.ocd2、STGCharacters.ocd2。\n" +
        "可从上游 Release 获取：https://github.com/amorphobia/opencc-tonggui/releases\n" +
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
  console.log("[sync-dicts] 已同步通规配置与词典到 opencc-wasm:", destConfigDir, destDictDir);
}

main();
