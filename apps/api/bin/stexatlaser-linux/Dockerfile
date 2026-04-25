FROM --platform=linux/amd64 ubuntu:22.04
# stex 依赖的最小运行库（不同构建可能略有差异；此处按缺失库逐步补齐）
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  libgomp1 \
  libdrm2 \
  libgl1 \
  libopengl0 \
  libegl1 \
  libx11-6 \
  libxext6 \
  libxrender1 \
  libxi6 \
  libxrandr2 \
  libxfixes3 \
  libxcursor1 \
  libxinerama1 \
  libxxf86vm1 \
  libxkbcommon0 \
  libxkbcommon-x11-0 \
  libxcb-cursor0 \
  libxcb-icccm4 \
  libxcb-keysyms1 \
  libxcb-shape0 \
  libxcb-xinerama0 \
  libxcb1 \
  libsm6 \
  libice6 \
  libwayland-egl1 \
  libwayland-client0 \
  libwayland-cursor0 \
  libpng16-16 \
  zlib1g \
  libharfbuzz0b \
  libfreetype6 \
  libfontconfig1 \
  libdbus-1-3 \
  libpcre2-16-0 \
  && rm -rf /var/lib/apt/lists/*
COPY stex /usr/local/bin/stex
RUN chmod +x /usr/local/bin/stex
WORKDIR /work
ENTRYPOINT ["/usr/local/bin/stex"]
