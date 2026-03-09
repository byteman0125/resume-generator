const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const destDir = path.join(root, "dist-electron");
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const copies = [
  ["electron/main.js", "main.js"],
  ["electron/preload.js", "preload.js"],
];
for (const [from, to] of copies) {
  const src = path.join(root, from);
  const dest = path.join(destDir, to);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${from} -> dist-electron/${to}`);
}

const resSrc = path.join(root, "electron", "resources");
const resDest = path.join(destDir, "resources");
if (fs.existsSync(resSrc)) {
  if (!fs.existsSync(resDest)) fs.mkdirSync(resDest, { recursive: true });
  const files = fs.readdirSync(resSrc);
  for (const f of files) {
    const s = path.join(resSrc, f);
    if (fs.statSync(s).isFile()) {
      fs.copyFileSync(s, path.join(resDest, f));
      console.log(`Copied electron/resources/${f} -> dist-electron/resources/${f}`);
    }
  }
}
