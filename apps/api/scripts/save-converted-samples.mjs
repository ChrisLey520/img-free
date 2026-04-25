import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = process.env.API_BASE ?? "http://localhost:3002";
const INPUT_DIR = process.env.INPUT_DIR ?? "/Users/chris/Desktop/workspace/资料/images";
const OUT_DIR = process.env.OUT_DIR ?? path.resolve(process.cwd(), "samples", "out");

const FILES = (process.env.FILES?.split(",").map((s) => s.trim()).filter(Boolean) ?? [
  "circle.tex",
  "avatars.tex",
  "button_icons.tex",
]).map((f) => path.resolve(INPUT_DIR, f));

function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Invalid dataUrl");
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

function extFromMime(mime) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/x-icon":
      return "ico";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

async function convertOne(filePath, targetFormat) {
  const fd = new FormData();
  fd.set("targetFormat", targetFormat);
  fd.set("options", JSON.stringify({}));
  const buf = await fs.readFile(filePath);
  fd.set("input", new Blob([buf]), path.basename(filePath));

  const res = await fetch(`${API_BASE}/convert`, { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
  return json;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const filePath of FILES) {
    const base = path.basename(filePath).replace(/\.[^/.]+$/, "");

    // Save PNG output
    const png = await convertOne(filePath, "png");
    {
      const { mime, buf } = parseDataUrl(png.output.dataUrl);
      const out = path.join(OUT_DIR, `${base}.png`);
      await fs.writeFile(out, buf);
      console.log("saved", out, mime, buf.length);
    }

    // Save SVG trace output (may be approximate)
    const svg = await convertOne(filePath, "svg");
    {
      const { mime, buf } = parseDataUrl(svg.output.dataUrl);
      const out = path.join(OUT_DIR, `${base}.svg`);
      await fs.writeFile(out, buf);
      console.log("saved", out, mime, buf.length);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

