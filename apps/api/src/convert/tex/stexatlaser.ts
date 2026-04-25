import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { access } from 'fs/promises';

function getStexatlaserBin(): string {
  return (
    process.env.STEXATLASER_BIN ??
    path.resolve(
      process.cwd(),
      'bin',
      process.platform === 'win32' ? 'stexatlaser.exe' : 'stexatlaser',
    )
  );
}

function getBundledLinuxStexPath(): string {
  return path.resolve(process.cwd(), 'bin', 'stexatlaser-linux', 'stex');
}

function getBundledLinuxStexImage(): string {
  return 'img-free/stexatlaser:0.6';
}

function getStexatlaserTexToPngArgs(inputPath: string): string[] {
  // Stex v0.6：单张 TEX => PNG 使用 decompress
  // 允许通过环境变量覆盖（用于兼容不同版本/工具）：
  // 例子：STEXATLASER_TEX_TO_PNG_ARGS="decompress -i {input} -o output.png"
  // 例子：STEXATLASER_TEX_TO_PNG_ARGS="decompress -s -i {input} -o output.png"
  const tpl = process.env.STEXATLASER_TEX_TO_PNG_ARGS?.trim();
  if (!tpl) return ['decompress', '-i', inputPath, '-o', 'output.png'];
  return tpl.split(/\s+/).map((x) => x.replaceAll('{input}', inputPath));
}

function run(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeoutMs: number },
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const t = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`stexatlaser timeout after ${opts.timeoutMs}ms`));
    }, opts.timeoutMs);

    child.stdout.on('data', (d) => stdout.push(Buffer.from(d)));
    child.stderr.on('data', (d) => stderr.push(Buffer.from(d)));
    child.on('error', (err) => {
      clearTimeout(t);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) return resolve();
      reject(
        new Error(
          `stexatlaser failed (code=${code})\n${Buffer.concat(stdout).toString('utf8')}\n${Buffer.concat(stderr).toString('utf8')}`,
        ),
      );
    });
  });
}

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function runViaDocker(
  localLinuxExe: string,
  args: string[],
  workDir: string,
  timeoutMs: number,
) {
  // 在 macOS 上使用 Docker 运行 Linux 版本 Stex，避免用户编译工具。
  // 需要先运行 `pnpm -C apps/api run setup:stex`，会同时构建运行时镜像（包含 libgomp1）。
  // -v 将 workDir 挂载到 /work。
  void localLinuxExe; // 保留参数用于 exists 判断，实际运行使用镜像中的 stex

  const dockerArgs = [
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '-v',
    `${workDir}:/work`,
    '-w',
    '/work',
    getBundledLinuxStexImage(),
    ...args,
  ];

  await run('docker', dockerArgs, { cwd: workDir, timeoutMs });
}

/**
 * Decode Klei/DST .tex into a PNG buffer.
 *
 * 约定：
 * - 优先使用本机 stexatlaser 二进制（通过 STEXATLASER_BIN 或 apps/api/bin/stexatlaser）
 * - macOS 可选走 Docker：先运行 `pnpm -C apps/api run setup:stex` 下载 Linux 二进制到 `apps/api/bin/stexatlaser-linux/stex`
 * - 输出文件名使用输入同名 .png（工具默认行为）
 */
export async function decodeKleiTexToPng(texBuffer: Buffer): Promise<Buffer> {
  const workId = randomUUID();
  const workDir = path.join(tmpdir(), `img-free-${workId}`);
  await mkdir(workDir, { recursive: true });

  try {
    const inputPath = path.join(workDir, 'input.tex');
    await writeFile(inputPath, texBuffer);

    const stexatlaser = getStexatlaserBin();
    const linuxStex = getBundledLinuxStexPath();

    // stexatlaser 支持“解包 tex 到 png”的子命令在不同版本可能不同；
    // 这里采用最保守策略：让工具在工作目录中输出。
    //
    // 若你使用的 stexatlaser 版本参数不同，可在此处统一调整。
    const argsHost = getStexatlaserTexToPngArgs(inputPath);
    const argsDocker = getStexatlaserTexToPngArgs('/work/input.tex');

    if (await exists(stexatlaser)) {
      await run(stexatlaser, argsHost, { cwd: workDir, timeoutMs: 20_000 });
    } else if (process.platform === 'darwin' && (await exists(linuxStex))) {
      await runViaDocker(linuxStex, argsDocker, workDir, 60_000);
    } else {
      throw new Error(
        `stexatlaser not found. On macOS, run: pnpm -C apps/api run setup:stex (requires Docker). Or set STEXATLASER_BIN.`,
      );
    }

    const outPath = path.join(workDir, 'output.png');
    return await readFile(outPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
