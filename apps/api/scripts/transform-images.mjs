import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

const INPUT_DIR =
  process.env.INPUT_DIR ?? "/Users/chris/Desktop/workspace/资料/images";
const OUT_DIR =
  process.env.OUT_DIR ?? "/Users/chris/Desktop/workspace/资料/transform-images";

const IMAGE_TAG = process.env.STEX_DOCKER_IMAGE ?? "img-free/stexatlaser:0.6";
const CONCURRENCY = Number.parseInt(process.env.CONCURRENCY ?? "4", 10);

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (d) => stdout.push(Buffer.from(d)));
    child.stderr.on("data", (d) => stderr.push(Buffer.from(d)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) });
      reject(
        new Error(
          `${cmd} ${args.join(" ")} failed (code=${code})\n${Buffer.concat(stdout).toString(
            "utf8",
          )}\n${Buffer.concat(stderr).toString("utf8")}`,
        ),
      );
    });
  });
}

async function ensureDockerImage() {
  await run("docker", ["image", "inspect", IMAGE_TAG]);
}

async function listTexFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".tex"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function decompressTexToPng(texAbsPath, outPngAbsPath) {
  // Run Stex inside docker. Mount input/output directories to stable paths.
  const inDir = path.dirname(texAbsPath);
  const outDir = path.dirname(outPngAbsPath);
  const texName = path.basename(texAbsPath);
  const outName = path.basename(outPngAbsPath);

  await fs.mkdir(outDir, { recursive: true });

  await run("docker", [
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "-v",
    `${inDir}:/in:ro`,
    "-v",
    `${outDir}:/out`,
    IMAGE_TAG,
    "decompress",
    "-i",
    `/in/${texName}`,
    "-o",
    `/out/${outName}`,
  ]);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function parseKleiAtlasXml(xmlText) {
  // XML 结构示例：
  // <Atlas><Texture filename="xxx.tex" /><Elements>
  //   <Element name="foo.tex" u1="0.1" u2="0.2" v1="0.3" v2="0.4" />
  // </Elements></Atlas>
  const textureMatch = /<Texture[^>]*\bfilename="([^"]+)"/.exec(xmlText);
  const texture = textureMatch?.[1] ?? null;

  const elements = [];
  const re = /<Element\b([^/>]*)\/>/g;
  let m;
  while ((m = re.exec(xmlText))) {
    const attrs = m[1] ?? "";
    const get = (key) => {
      const mm = new RegExp(`\\b${key}="([^"]+)"`).exec(attrs);
      return mm ? mm[1] : null;
    };
    const name = get("name");
    const u1 = get("u1");
    const u2 = get("u2");
    const v1 = get("v1");
    const v2 = get("v2");
    if (!name || u1 == null || u2 == null || v1 == null || v2 == null) continue;
    elements.push({
      name,
      u1: Number(u1),
      u2: Number(u2),
      v1: Number(v1),
      v2: Number(v2),
    });
  }

  return { texture, elements };
}

function uvToPxRect({ u1, u2, v1, v2 }, width, height) {
  const x = Math.round(u1 * width);
  const y = Math.round(v1 * height);
  const w = Math.round((u2 - u1) * width);
  const h = Math.round((v2 - v1) * height);
  return { x, y, w, h };
}

async function mapLimit(items, limit, fn) {
  const ret = [];
  let idx = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      ret[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return ret;
}

async function main() {
  if (!fssync.existsSync(INPUT_DIR)) {
    throw new Error(`INPUT_DIR not found: ${INPUT_DIR}`);
  }

  await ensureDockerImage();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const texFiles = await listTexFiles(INPUT_DIR);
  if (!texFiles.length) {
    console.log("No .tex files found in", INPUT_DIR);
    return;
  }

  console.log(`Found ${texFiles.length} .tex files`);

  const results = await mapLimit(texFiles, CONCURRENCY, async (name) => {
    const texPath = path.join(INPUT_DIR, name);
    const base = name.replace(/\.tex$/i, "");
    const pngName = `${base}.png`;
    const pngPath = path.join(OUT_DIR, pngName);
    const xmlPath = path.join(INPUT_DIR, `${base}.xml`);
    const jsonName = `${base}.json`;
    const jsonPath = path.join(OUT_DIR, jsonName);

    try {
      await decompressTexToPng(texPath, pngPath);
      const st = await fs.stat(pngPath);
      const meta = await sharp(pngPath, { failOn: "none" }).metadata();

      // If atlas xml exists, write frames json (pixels + uvs)
      let frames = null;
      let atlasTexture = null;
      if (await fileExists(xmlPath)) {
        const xmlText = await fs.readFile(xmlPath, "utf8");
        const parsed = parseKleiAtlasXml(xmlText);
        atlasTexture = parsed.texture;
        const width = meta.width ?? 0;
        const height = meta.height ?? 0;
        frames = Object.fromEntries(
          parsed.elements.map((el) => {
            const rect = width && height ? uvToPxRect(el, width, height) : { x: null, y: null, w: null, h: null };
            return [
              el.name,
              {
                rect,
                uv: { u1: el.u1, u2: el.u2, v1: el.v1, v2: el.v2 },
              },
            ];
          }),
        );

        const outJson = {
          atlas: {
            texture: atlasTexture,
            png: pngName,
            width: meta.width ?? null,
            height: meta.height ?? null,
          },
          frames,
        };
        await fs.writeFile(jsonPath, JSON.stringify(outJson, null, 2), "utf8");
      }

      return {
        name: base,
        tex: name,
        png: pngName,
        xml: (await fileExists(xmlPath)) ? path.basename(xmlPath) : null,
        json: frames ? jsonName : null,
        atlasTexture,
        bytes: st.size,
        width: meta.width ?? null,
        height: meta.height ?? null,
        ok: true,
      };
    } catch (e) {
      return {
        name: base,
        tex: name,
        png: pngName,
        xml: (await fileExists(xmlPath)) ? path.basename(xmlPath) : null,
        json: null,
        atlasTexture: null,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });

  const index = {
    inputDir: INPUT_DIR,
    outputDir: OUT_DIR,
    stexImage: IMAGE_TAG,
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    items: results,
  };

  const indexPath = path.join(OUT_DIR, "index.json");
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");

  console.log("Wrote", indexPath);
  console.log("OK:", index.ok, "Failed:", index.failed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

