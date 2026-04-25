# stexatlaser（二进制）放置说明

本项目用 `stexatlaser` 来把《饥荒 / DST》导出的 `.tex` 纹理解码成 PNG（再进入后续格式转换流程）。

## macOS（推荐）：Docker 一键安装（不需要你理解）
前提：已安装 Docker Desktop。

在项目根目录执行：

```bash
pnpm -C apps/api run setup:stex
```

它会把 Linux 版 Stex 下载到：`apps/api/bin/stexatlaser-linux/stex`，之后 API 会在 macOS 上自动用 Docker 跑它来解码 `.tex`。

### Apple Silicon（M1/M2/M3）额外一步
如果你的 Mac 是 Apple Silicon，Docker 需要开启 x86/amd64 模拟（Rosetta/QEMU）。若未开启会看到 `rosetta error`。

- 打开 Docker Desktop 设置，启用 **x86/amd64 emulation / Rosetta**（具体名称随版本略有不同）

## 方式一：放到固定路径（推荐）
- 将 `stexatlaser` 可执行文件放到：`apps/api/bin/stexatlaser`
- macOS/Linux 需要确保它有可执行权限：`chmod +x apps/api/bin/stexatlaser`

## 方式二：使用环境变量
- 设置 `STEXATLASER_BIN=/abs/path/to/stexatlaser`

## 子命令差异（可选）
不同版本可能参数不同，你可以用环境变量覆盖 TEX=>PNG 的参数模板：

- `STEXATLASER_TEX_TO_PNG_ARGS="decompress -i {input} -o output.png"`
- `STEXATLASER_TEX_TO_PNG_ARGS="decompress -s -i {input} -o output.png"`

## 校验
启动 API 后，上传 `.tex` 文件进行转换；若缺少二进制或命令不匹配，会返回错误提示。

