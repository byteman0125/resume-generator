const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

async function main() {
  const profileId = process.argv[2];
  if (!profileId) {
    console.error("Usage: npm run export:pdf -- <profileId>");
    process.exit(1);
  }

  const dataDir = path.join(process.cwd(), "data");
  const profilesPath = path.join(dataDir, "profiles.json");

  if (!fs.existsSync(profilesPath)) {
    console.error(`profiles.json not found at ${profilesPath}. Create a profile first.`);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(profilesPath, "utf-8"));
  const profile = rows.find((p) => p.id === profileId);
  if (!profile) {
    console.error(`Profile with id ${profileId} not found in profiles.json.`);
    process.exit(1);
  }

  const baseUrl = process.env.PDF_BASE_URL || "http://localhost:3000";
  // Use the same print view used by the app instead of the removed style page.
  const targetUrl = `${baseUrl}/print/${profileId}`;

  console.log(`Launching Chromium…`);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`Loading ${targetUrl}…`);
  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), "pdf");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const safeName =
    (profile.name || "resume")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .toLowerCase() || "resume";

  const outputPath = path.join(outDir, `${safeName}-${profileId}.pdf`);

  console.log(`Generating PDF at ${outputPath}…`);
  await page.pdf({
    path: outputPath,
    format: "Letter",
    printBackground: true,
    margin: {
      // Standard letter resume margins:
      // Top 0.7", left/right/bottom 0.5" – matches your style defaults.
      top: "0.7in",
      bottom: "0.5in",
      left: "0.5in",
      right: "0.5in",
    },
  });

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

