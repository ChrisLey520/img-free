import { mkdir, chmod, rm, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import https from "node:https";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "v0.6";
const ASSET = "Stex_v0.6_Linux_Static_x64.22.04.g++-12.zip";
const URL = `https://github.com/oblivioncth/Stexatlaser/releases/download/${VERSION}/${ASSET}`;
const IMAGE_TAG = "img-free/stexatlaser:0.6";

const BIN_DIR = path.resolve(__dirname, "..", "bin");
const OUT_DIR = path.join(BIN_DIR, "stexatlaser-linux");
const ZIP_PATH = path.join(OUT_DIR, ASSET);

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function download(url, destPath) {
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          return download(res.headers.location, destPath).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          return reject(new Error(`Download failed: ${res.statusCode} ${res.statusMessage}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close();
        reject(err);
      });
  });
}

async function findExecutable(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const found = await findExecutable(p);
      if (found) return found;
      continue;
    }
    if (!ent.isFile()) continue;
    // In Stex releases, the executable is typically named "stex" or "Stex".
    if (ent.name === "stex" || ent.name === "Stex" || ent.name === "stexatlaser" || ent.name === "Stexatlaser") {
      const s = await stat(p);
      if (s.size > 0) return p;
    }
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Clean previous extract (keep the zip if present).
  const extractedDir = path.join(OUT_DIR, "extracted");
  await rm(extractedDir, { recursive: true, force: true });
  await mkdir(extractedDir, { recursive: true });

  console.log(`Downloading ${URL}`);
  await download(URL, ZIP_PATH);

  console.log("Unzipping...");
  await run("unzip", ["-o", ZIP_PATH, "-d", extractedDir]);

  const exePath = await findExecutable(extractedDir);
  if (!exePath) throw new Error("Could not find stex executable inside zip");

  const finalPath = path.join(OUT_DIR, "stex");
  await rm(finalPath, { force: true });
  await run("cp", [exePath, finalPath]);
  await chmod(finalPath, 0o755);

  console.log(`Installed: ${finalPath}`);

  // Build a minimal runtime image containing libgomp.so.1
  const dockerfilePath = path.join(OUT_DIR, "Dockerfile");
  const dockerfile = `
FROM --platform=linux/amd64 ubuntu:22.04
# stex 依赖的最小运行库（不同构建可能略有差异；此处按缺失库逐步补齐）
RUN apt-get update && apt-get install -y --no-install-recommends \\
  ca-certificates \\
  libgomp1 \\
  libdrm2 \\
  libgl1 \\
  libopengl0 \\
  libegl1 \\
  libx11-6 \\
  libxext6 \\
  libxrender1 \\
  libxi6 \\
  libxrandr2 \\
  libxfixes3 \\
  libxcursor1 \\
  libxinerama1 \\
  libxxf86vm1 \\
  libxkbcommon0 \\
  libxkbcommon-x11-0 \\
  libxcb-cursor0 \\
  libxcb-icccm4 \\
  libxcb-keysyms1 \\
  libxcb-shape0 \\
  libxcb-xinerama0 \\
  libxcb1 \\
  libsm6 \\
  libice6 \\
  libwayland-egl1 \\
  libwayland-client0 \\
  libwayland-cursor0 \\
  libpng16-16 \\
  zlib1g \\
  libharfbuzz0b \\
  libfreetype6 \\
  libfontconfig1 \\
  libdbus-1-3 \\
  libpcre2-16-0 \\
  && rm -rf /var/lib/apt/lists/*
COPY stex /usr/local/bin/stex
RUN chmod +x /usr/local/bin/stex
WORKDIR /work
ENTRYPOINT ["/usr/local/bin/stex"]
`.trimStart();
  await fs.promises.writeFile(dockerfilePath, dockerfile, "utf8");

  console.log(`Building Docker image ${IMAGE_TAG}...`);
  await run("docker", ["build", "--platform", "linux/amd64", "-t", IMAGE_TAG, OUT_DIR]);

  console.log("Next: start the API and upload a .tex file.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

