/**
 * 预定义骨骼姿态库（归一化坐标 0-1，原点左上角）
 * 人物朝右侧视图，12 种动作，各 4-8 帧关键姿势
 *
 * 关键点遵循 OpenPose 18 点格式：
 * nose, neck,
 * rShoulder, rElbow, rWrist,
 * lShoulder, lElbow, lWrist,
 * rHip, rKnee, rAnkle,
 * lHip, lKnee, lAnkle,
 * rEye, lEye, rEar, lEar
 */

export interface Keypoint { x: number; y: number }

export interface Skeleton {
  nose: Keypoint;  neck: Keypoint;
  rShoulder: Keypoint; rElbow: Keypoint; rWrist: Keypoint;
  lShoulder: Keypoint; lElbow: Keypoint; lWrist: Keypoint;
  rHip: Keypoint; rKnee: Keypoint; rAnkle: Keypoint;
  lHip: Keypoint; lKnee: Keypoint; lAnkle: Keypoint;
  rEye: Keypoint; lEye: Keypoint;
  rEar: Keypoint; lEar: Keypoint;
}

// ── 基础站立姿态 ──────────────────────────────────────────────
const S: Skeleton = {
  nose:      { x: 0.50, y: 0.09 }, neck:      { x: 0.50, y: 0.20 },
  rShoulder: { x: 0.38, y: 0.26 }, rElbow:    { x: 0.30, y: 0.38 }, rWrist:    { x: 0.28, y: 0.52 },
  lShoulder: { x: 0.62, y: 0.26 }, lElbow:    { x: 0.70, y: 0.38 }, lWrist:    { x: 0.72, y: 0.52 },
  rHip:      { x: 0.42, y: 0.52 }, rKnee:     { x: 0.40, y: 0.70 }, rAnkle:    { x: 0.40, y: 0.88 },
  lHip:      { x: 0.58, y: 0.52 }, lKnee:     { x: 0.60, y: 0.70 }, lAnkle:    { x: 0.60, y: 0.88 },
  rEye:      { x: 0.46, y: 0.07 }, lEye:      { x: 0.54, y: 0.07 },
  rEar:      { x: 0.42, y: 0.09 }, lEar:      { x: 0.58, y: 0.09 },
};

function p(overrides: Partial<Skeleton>): Skeleton { return { ...S, ...overrides }; }

// ═══════════════════════════════════════════════════════════════
// 行走 Walk — 8 帧完整循环（步伐交替，手臂自然摆动）
// ═══════════════════════════════════════════════════════════════
const WALK: Skeleton[] = [
  p({ rElbow:{x:0.34,y:0.33}, rWrist:{x:0.38,y:0.47}, lElbow:{x:0.66,y:0.43}, lWrist:{x:0.64,y:0.57}, rKnee:{x:0.36,y:0.67}, rAnkle:{x:0.28,y:0.84}, lKnee:{x:0.64,y:0.66}, lAnkle:{x:0.70,y:0.83} }),
  p({ rElbow:{x:0.32,y:0.36}, rWrist:{x:0.30,y:0.50}, lElbow:{x:0.68,y:0.40}, lWrist:{x:0.70,y:0.54}, rKnee:{x:0.38,y:0.68}, rAnkle:{x:0.36,y:0.86}, lKnee:{x:0.62,y:0.68}, lAnkle:{x:0.62,y:0.86} }),
  p({ rElbow:{x:0.30,y:0.38}, rWrist:{x:0.28,y:0.52}, lElbow:{x:0.70,y:0.38}, lWrist:{x:0.72,y:0.52}, rKnee:{x:0.40,y:0.69}, rAnkle:{x:0.42,y:0.87}, lKnee:{x:0.60,y:0.69}, lAnkle:{x:0.58,y:0.87} }),
  p({ rElbow:{x:0.28,y:0.40}, rWrist:{x:0.26,y:0.54}, lElbow:{x:0.72,y:0.36}, lWrist:{x:0.74,y:0.50}, rKnee:{x:0.42,y:0.68}, rAnkle:{x:0.46,y:0.86}, lKnee:{x:0.58,y:0.67}, lAnkle:{x:0.52,y:0.85} }),
  // 镜像帧（右脚前 → 左脚前）
  p({ rElbow:{x:0.26,y:0.43}, rWrist:{x:0.24,y:0.57}, lElbow:{x:0.68,y:0.34}, lWrist:{x:0.64,y:0.47}, rKnee:{x:0.44,y:0.66}, rAnkle:{x:0.50,y:0.83}, lKnee:{x:0.56,y:0.67}, lAnkle:{x:0.48,y:0.84} }),
  p({ rElbow:{x:0.30,y:0.40}, rWrist:{x:0.28,y:0.54}, lElbow:{x:0.68,y:0.38}, lWrist:{x:0.70,y:0.52}, rKnee:{x:0.42,y:0.68}, rAnkle:{x:0.44,y:0.86}, lKnee:{x:0.58,y:0.68}, lAnkle:{x:0.56,y:0.86} }),
  p({ rElbow:{x:0.32,y:0.38}, rWrist:{x:0.30,y:0.52}, lElbow:{x:0.68,y:0.38}, lWrist:{x:0.70,y:0.52}, rKnee:{x:0.40,y:0.69}, rAnkle:{x:0.40,y:0.87}, lKnee:{x:0.60,y:0.69}, lAnkle:{x:0.60,y:0.87} }),
  p({ rElbow:{x:0.33,y:0.36}, rWrist:{x:0.32,y:0.50}, lElbow:{x:0.68,y:0.39}, lWrist:{x:0.69,y:0.53}, rKnee:{x:0.38,y:0.68}, rAnkle:{x:0.36,y:0.86}, lKnee:{x:0.62,y:0.68}, lAnkle:{x:0.64,y:0.86} }),
];

// ═══════════════════════════════════════════════════════════════
// 奔跑 Run — 8 帧，大步幅，身体前倾
// ═══════════════════════════════════════════════════════════════
const RUN: Skeleton[] = [
  p({ nose:{x:0.54,y:0.08}, neck:{x:0.54,y:0.19}, rElbow:{x:0.38,y:0.28}, rWrist:{x:0.42,y:0.40}, lElbow:{x:0.66,y:0.46}, lWrist:{x:0.62,y:0.60}, rKnee:{x:0.28,y:0.60}, rAnkle:{x:0.20,y:0.78}, lKnee:{x:0.72,y:0.56}, lAnkle:{x:0.78,y:0.72} }),
  p({ nose:{x:0.53,y:0.07}, neck:{x:0.53,y:0.18}, rElbow:{x:0.34,y:0.30}, rWrist:{x:0.30,y:0.42}, lElbow:{x:0.68,y:0.36}, lWrist:{x:0.72,y:0.50}, rKnee:{x:0.36,y:0.58}, rAnkle:{x:0.32,y:0.76}, lKnee:{x:0.64,y:0.58}, lAnkle:{x:0.68,y:0.76} }),
  p({ nose:{x:0.52,y:0.07}, neck:{x:0.52,y:0.18}, rElbow:{x:0.30,y:0.32}, rWrist:{x:0.26,y:0.46}, lElbow:{x:0.70,y:0.32}, lWrist:{x:0.74,y:0.46}, rKnee:{x:0.38,y:0.58}, rAnkle:{x:0.34,y:0.76}, lKnee:{x:0.62,y:0.58}, lAnkle:{x:0.66,y:0.76} }),
  p({ nose:{x:0.54,y:0.08}, neck:{x:0.54,y:0.19}, rElbow:{x:0.36,y:0.46}, rWrist:{x:0.32,y:0.60}, lElbow:{x:0.64,y:0.28}, lWrist:{x:0.58,y:0.40}, rKnee:{x:0.72,y:0.56}, rAnkle:{x:0.78,y:0.72}, lKnee:{x:0.28,y:0.60}, lAnkle:{x:0.20,y:0.78} }),
  p({ nose:{x:0.55,y:0.08}, neck:{x:0.55,y:0.19}, rElbow:{x:0.40,y:0.26}, rWrist:{x:0.44,y:0.38}, lElbow:{x:0.64,y:0.48}, lWrist:{x:0.60,y:0.62}, rKnee:{x:0.26,y:0.58}, rAnkle:{x:0.18,y:0.76}, lKnee:{x:0.74,y:0.54}, lAnkle:{x:0.80,y:0.70} }),
  p({ nose:{x:0.53,y:0.07}, neck:{x:0.53,y:0.18}, rElbow:{x:0.32,y:0.28}, rWrist:{x:0.28,y:0.40}, lElbow:{x:0.68,y:0.38}, lWrist:{x:0.72,y:0.52}, rKnee:{x:0.36,y:0.56}, rAnkle:{x:0.30,y:0.74}, lKnee:{x:0.64,y:0.56}, lAnkle:{x:0.68,y:0.74} }),
  p({ nose:{x:0.52,y:0.07}, neck:{x:0.52,y:0.18}, rElbow:{x:0.28,y:0.30}, rWrist:{x:0.24,y:0.44}, lElbow:{x:0.72,y:0.30}, lWrist:{x:0.76,y:0.44}, rKnee:{x:0.38,y:0.56}, rAnkle:{x:0.32,y:0.74}, lKnee:{x:0.62,y:0.56}, lAnkle:{x:0.68,y:0.74} }),
  p({ nose:{x:0.54,y:0.08}, neck:{x:0.54,y:0.19}, rElbow:{x:0.34,y:0.48}, rWrist:{x:0.30,y:0.62}, lElbow:{x:0.66,y:0.26}, lWrist:{x:0.60,y:0.38}, rKnee:{x:0.74,y:0.54}, rAnkle:{x:0.80,y:0.70}, lKnee:{x:0.26,y:0.58}, lAnkle:{x:0.18,y:0.76} }),
];

// ═══════════════════════════════════════════════════════════════
// 待机 Idle — 6 帧，呼吸 + 眼神移动
// ═══════════════════════════════════════════════════════════════
const IDLE: Skeleton[] = [
  p({}),
  p({ nose:{x:0.50,y:0.10}, neck:{x:0.50,y:0.21}, rKnee:{x:0.40,y:0.71}, lKnee:{x:0.60,y:0.71} }),
  p({ rElbow:{x:0.30,y:0.39}, lElbow:{x:0.70,y:0.39} }),
  p({}),
  p({ nose:{x:0.51,y:0.10}, neck:{x:0.51,y:0.21}, rKnee:{x:0.40,y:0.71}, lKnee:{x:0.60,y:0.71} }),
  p({ rElbow:{x:0.29,y:0.38}, lElbow:{x:0.71,y:0.38} }),
];

// ═══════════════════════════════════════════════════════════════
// 跳跃 Jump — 6 帧
// ═══════════════════════════════════════════════════════════════
const JUMP: Skeleton[] = [
  // 蹲下蓄力
  p({ nose:{x:0.50,y:0.18}, neck:{x:0.50,y:0.28}, rShoulder:{x:0.38,y:0.34}, lShoulder:{x:0.62,y:0.34}, rElbow:{x:0.30,y:0.44}, rWrist:{x:0.28,y:0.58}, lElbow:{x:0.70,y:0.44}, lWrist:{x:0.72,y:0.58}, rHip:{x:0.40,y:0.58}, lHip:{x:0.60,y:0.58}, rKnee:{x:0.36,y:0.72}, rAnkle:{x:0.40,y:0.85}, lKnee:{x:0.64,y:0.72}, lAnkle:{x:0.60,y:0.85} }),
  // 腾空上升
  p({ nose:{x:0.50,y:0.06}, neck:{x:0.50,y:0.17}, rElbow:{x:0.34,y:0.26}, rWrist:{x:0.36,y:0.14}, lElbow:{x:0.66,y:0.26}, lWrist:{x:0.64,y:0.14}, rHip:{x:0.42,y:0.48}, lHip:{x:0.58,y:0.48}, rKnee:{x:0.38,y:0.60}, rAnkle:{x:0.42,y:0.74}, lKnee:{x:0.62,y:0.60}, lAnkle:{x:0.58,y:0.74} }),
  // 最高点
  p({ nose:{x:0.50,y:0.05}, neck:{x:0.50,y:0.15}, rElbow:{x:0.30,y:0.22}, rWrist:{x:0.24,y:0.12}, lElbow:{x:0.70,y:0.22}, lWrist:{x:0.76,y:0.12}, rKnee:{x:0.40,y:0.68}, rAnkle:{x:0.40,y:0.84}, lKnee:{x:0.60,y:0.68}, lAnkle:{x:0.60,y:0.84} }),
  // 下落
  p({ nose:{x:0.50,y:0.07}, neck:{x:0.50,y:0.18}, rElbow:{x:0.32,y:0.30}, rWrist:{x:0.28,y:0.44}, lElbow:{x:0.68,y:0.30}, lWrist:{x:0.72,y:0.44}, rKnee:{x:0.40,y:0.64}, rAnkle:{x:0.40,y:0.80}, lKnee:{x:0.60,y:0.64}, lAnkle:{x:0.60,y:0.80} }),
  // 落地缓冲
  p({ nose:{x:0.50,y:0.16}, neck:{x:0.50,y:0.26}, rShoulder:{x:0.38,y:0.32}, lShoulder:{x:0.62,y:0.32}, rElbow:{x:0.32,y:0.44}, rWrist:{x:0.34,y:0.56}, lElbow:{x:0.68,y:0.44}, lWrist:{x:0.66,y:0.56}, rHip:{x:0.40,y:0.56}, lHip:{x:0.60,y:0.56}, rKnee:{x:0.36,y:0.70}, rAnkle:{x:0.40,y:0.84}, lKnee:{x:0.64,y:0.70}, lAnkle:{x:0.60,y:0.84} }),
  // 恢复站立
  p({}),
];

// ═══════════════════════════════════════════════════════════════
// 攻击 Attack — 6 帧，单手挥击
// ═══════════════════════════════════════════════════════════════
const ATTACK: Skeleton[] = [
  p({ rElbow:{x:0.36,y:0.22}, rWrist:{x:0.40,y:0.10} }),           // 举刀准备
  p({ nose:{x:0.54,y:0.09}, neck:{x:0.54,y:0.20}, rElbow:{x:0.50,y:0.22}, rWrist:{x:0.66,y:0.26} }),  // 挥击启动
  p({ nose:{x:0.56,y:0.09}, neck:{x:0.56,y:0.20}, rElbow:{x:0.62,y:0.26}, rWrist:{x:0.80,y:0.22} }),  // 全力伸展
  p({ nose:{x:0.55,y:0.09}, neck:{x:0.55,y:0.20}, rElbow:{x:0.58,y:0.30}, rWrist:{x:0.74,y:0.36} }),  // 收力
  p({ rElbow:{x:0.40,y:0.36}, rWrist:{x:0.38,y:0.50} }),           // 回收
  p({}),                                                              // 恢复防御
];

// ═══════════════════════════════════════════════════════════════
// 受伤 Hurt — 4 帧
// ═══════════════════════════════════════════════════════════════
const HURT: Skeleton[] = [
  p({ nose:{x:0.46,y:0.10}, neck:{x:0.47,y:0.21}, rElbow:{x:0.32,y:0.28}, rWrist:{x:0.26,y:0.36}, lElbow:{x:0.64,y:0.26}, lWrist:{x:0.60,y:0.34} }),
  p({ nose:{x:0.44,y:0.10}, neck:{x:0.45,y:0.21}, rHip:{x:0.38,y:0.53}, lHip:{x:0.56,y:0.53}, rKnee:{x:0.34,y:0.70}, rAnkle:{x:0.30,y:0.86}, lKnee:{x:0.58,y:0.70}, lAnkle:{x:0.56,y:0.88}, rElbow:{x:0.30,y:0.28}, rWrist:{x:0.24,y:0.38}, lElbow:{x:0.62,y:0.28}, lWrist:{x:0.58,y:0.38} }),
  p({ nose:{x:0.48,y:0.09}, neck:{x:0.49,y:0.20}, rElbow:{x:0.30,y:0.36}, rWrist:{x:0.28,y:0.50}, lElbow:{x:0.68,y:0.36}, lWrist:{x:0.70,y:0.50} }),
  p({}),
];

// ═══════════════════════════════════════════════════════════════
// 死亡 Death — 4 帧，缓缓倒地
// ═══════════════════════════════════════════════════════════════
const DEATH: Skeleton[] = [
  p({ nose:{x:0.50,y:0.18}, neck:{x:0.50,y:0.27}, rHip:{x:0.40,y:0.56}, lHip:{x:0.58,y:0.56}, rKnee:{x:0.34,y:0.70}, rAnkle:{x:0.38,y:0.84}, lKnee:{x:0.62,y:0.72}, lAnkle:{x:0.62,y:0.86}, rElbow:{x:0.30,y:0.38}, rWrist:{x:0.26,y:0.52}, lElbow:{x:0.64,y:0.34}, lWrist:{x:0.68,y:0.48} }),
  { nose:{x:0.50,y:0.48}, neck:{x:0.50,y:0.56}, rShoulder:{x:0.38,y:0.62}, rElbow:{x:0.30,y:0.72}, rWrist:{x:0.26,y:0.82}, lShoulder:{x:0.62,y:0.62}, lElbow:{x:0.70,y:0.72}, lWrist:{x:0.74,y:0.82}, rHip:{x:0.40,y:0.74}, rKnee:{x:0.34,y:0.86}, rAnkle:{x:0.30,y:0.94}, lHip:{x:0.60,y:0.74}, lKnee:{x:0.66,y:0.86}, lAnkle:{x:0.70,y:0.94}, rEye:{x:0.46,y:0.46}, lEye:{x:0.54,y:0.46}, rEar:{x:0.42,y:0.48}, lEar:{x:0.58,y:0.48} },
  { nose:{x:0.22,y:0.82}, neck:{x:0.32,y:0.80}, rShoulder:{x:0.38,y:0.76}, rElbow:{x:0.44,y:0.82}, rWrist:{x:0.50,y:0.88}, lShoulder:{x:0.42,y:0.70}, lElbow:{x:0.48,y:0.76}, lWrist:{x:0.54,y:0.82}, rHip:{x:0.56,y:0.78}, rKnee:{x:0.68,y:0.80}, rAnkle:{x:0.80,y:0.82}, lHip:{x:0.58,y:0.72}, lKnee:{x:0.70,y:0.74}, lAnkle:{x:0.82,y:0.76}, rEye:{x:0.18,y:0.80}, lEye:{x:0.20,y:0.78}, rEar:{x:0.14,y:0.82}, lEar:{x:0.16,y:0.80} },
  { nose:{x:0.18,y:0.84}, neck:{x:0.28,y:0.82}, rShoulder:{x:0.36,y:0.78}, rElbow:{x:0.48,y:0.80}, rWrist:{x:0.60,y:0.82}, lShoulder:{x:0.38,y:0.72}, lElbow:{x:0.50,y:0.74}, lWrist:{x:0.62,y:0.76}, rHip:{x:0.58,y:0.80}, rKnee:{x:0.72,y:0.82}, rAnkle:{x:0.86,y:0.84}, lHip:{x:0.60,y:0.74}, lKnee:{x:0.74,y:0.76}, lAnkle:{x:0.88,y:0.78}, rEye:{x:0.14,y:0.82}, lEye:{x:0.16,y:0.80}, rEar:{x:0.10,y:0.84}, lEar:{x:0.12,y:0.82} },
];

// ═══════════════════════════════════════════════════════════════
// 防御 Guard — 4 帧，举盾格挡姿势
// ═══════════════════════════════════════════════════════════════
const GUARD: Skeleton[] = [
  p({ rElbow:{x:0.40,y:0.28}, rWrist:{x:0.46,y:0.20}, lElbow:{x:0.62,y:0.32}, lWrist:{x:0.66,y:0.22}, rKnee:{x:0.38,y:0.68}, lKnee:{x:0.58,y:0.68} }),  // 举盾防御
  p({ nose:{x:0.46,y:0.09}, neck:{x:0.46,y:0.20}, rElbow:{x:0.38,y:0.26}, rWrist:{x:0.44,y:0.18}, lElbow:{x:0.60,y:0.30}, lWrist:{x:0.64,y:0.20}, rKnee:{x:0.36,y:0.66}, lKnee:{x:0.56,y:0.66} }),  // 受击身体后退
  p({ rElbow:{x:0.40,y:0.28}, rWrist:{x:0.46,y:0.20}, lElbow:{x:0.62,y:0.32}, lWrist:{x:0.66,y:0.22} }),  // 稳住
  p({}),  // 恢复
];

// ═══════════════════════════════════════════════════════════════
// 蹲伏 Crouch — 4 帧，低姿态潜行
// ═══════════════════════════════════════════════════════════════
const CROUCH: Skeleton[] = [
  p({ nose:{x:0.50,y:0.28}, neck:{x:0.50,y:0.36}, rShoulder:{x:0.38,y:0.40}, lShoulder:{x:0.62,y:0.40}, rElbow:{x:0.30,y:0.50}, rWrist:{x:0.28,y:0.62}, lElbow:{x:0.70,y:0.50}, lWrist:{x:0.72,y:0.62}, rHip:{x:0.40,y:0.62}, lHip:{x:0.60,y:0.62}, rKnee:{x:0.34,y:0.74}, rAnkle:{x:0.38,y:0.86}, lKnee:{x:0.64,y:0.74}, lAnkle:{x:0.60,y:0.86} }),
  p({ nose:{x:0.50,y:0.28}, neck:{x:0.50,y:0.36}, rShoulder:{x:0.38,y:0.40}, lShoulder:{x:0.62,y:0.40}, rElbow:{x:0.34,y:0.48}, rWrist:{x:0.36,y:0.60}, lElbow:{x:0.66,y:0.48}, lWrist:{x:0.68,y:0.60}, rHip:{x:0.40,y:0.62}, lHip:{x:0.60,y:0.62}, rKnee:{x:0.36,y:0.74}, rAnkle:{x:0.40,y:0.86}, lKnee:{x:0.62,y:0.74}, lAnkle:{x:0.58,y:0.86} }),
  p({ nose:{x:0.50,y:0.28}, neck:{x:0.50,y:0.36}, rShoulder:{x:0.38,y:0.40}, lShoulder:{x:0.62,y:0.40}, rElbow:{x:0.30,y:0.50}, rWrist:{x:0.26,y:0.60}, lElbow:{x:0.70,y:0.50}, lWrist:{x:0.74,y:0.60}, rHip:{x:0.40,y:0.62}, lHip:{x:0.60,y:0.62}, rKnee:{x:0.34,y:0.74}, rAnkle:{x:0.36,y:0.86}, lKnee:{x:0.64,y:0.74}, lAnkle:{x:0.62,y:0.86} }),
  p({}),  // 站起
];

// ═══════════════════════════════════════════════════════════════
// 翻滚/闪避 Roll — 6 帧
// ═══════════════════════════════════════════════════════════════
const ROLL: Skeleton[] = [
  p({ nose:{x:0.54,y:0.16}, neck:{x:0.54,y:0.24}, rShoulder:{x:0.42,y:0.28}, lShoulder:{x:0.66,y:0.28}, rElbow:{x:0.36,y:0.38}, rWrist:{x:0.32,y:0.50}, lElbow:{x:0.72,y:0.34}, lWrist:{x:0.78,y:0.44}, rHip:{x:0.44,y:0.50}, lHip:{x:0.64,y:0.50}, rKnee:{x:0.38,y:0.64}, rAnkle:{x:0.32,y:0.78}, lKnee:{x:0.68,y:0.60}, lAnkle:{x:0.74,y:0.74} }),
  p({ nose:{x:0.58,y:0.24}, neck:{x:0.56,y:0.32}, rShoulder:{x:0.44,y:0.34}, lShoulder:{x:0.68,y:0.36}, rElbow:{x:0.36,y:0.44}, rWrist:{x:0.30,y:0.54}, lElbow:{x:0.74,y:0.44}, lWrist:{x:0.80,y:0.52}, rHip:{x:0.46,y:0.54}, lHip:{x:0.66,y:0.56}, rKnee:{x:0.36,y:0.68}, rAnkle:{x:0.28,y:0.80}, lKnee:{x:0.70,y:0.68}, lAnkle:{x:0.76,y:0.80} }),
  // 翻滚中间
  { nose:{x:0.50,y:0.52}, neck:{x:0.50,y:0.60}, rShoulder:{x:0.38,y:0.62}, rElbow:{x:0.32,y:0.70}, rWrist:{x:0.28,y:0.78}, lShoulder:{x:0.62,y:0.62}, lElbow:{x:0.68,y:0.70}, lWrist:{x:0.72,y:0.78}, rHip:{x:0.40,y:0.72}, rKnee:{x:0.34,y:0.82}, rAnkle:{x:0.30,y:0.92}, lHip:{x:0.60,y:0.72}, lKnee:{x:0.66,y:0.82}, lAnkle:{x:0.70,y:0.92}, rEye:{x:0.46,y:0.50}, lEye:{x:0.54,y:0.50}, rEar:{x:0.42,y:0.52}, lEar:{x:0.58,y:0.52} },
  p({ nose:{x:0.48,y:0.16}, neck:{x:0.48,y:0.24}, rShoulder:{x:0.36,y:0.28}, lShoulder:{x:0.60,y:0.28}, rElbow:{x:0.30,y:0.38}, rWrist:{x:0.26,y:0.50}, lElbow:{x:0.66,y:0.36}, lWrist:{x:0.70,y:0.46}, rHip:{x:0.38,y:0.52}, lHip:{x:0.58,y:0.52}, rKnee:{x:0.34,y:0.66}, rAnkle:{x:0.30,y:0.80}, lKnee:{x:0.62,y:0.62}, lAnkle:{x:0.68,y:0.76} }),
  p({ rKnee:{x:0.38,y:0.68}, rAnkle:{x:0.38,y:0.84}, lKnee:{x:0.60,y:0.68}, lAnkle:{x:0.60,y:0.84} }),
  p({}),
];

// ═══════════════════════════════════════════════════════════════
// 施法 Spellcast — 6 帧
// ═══════════════════════════════════════════════════════════════
const SPELLCAST: Skeleton[] = [
  p({ rElbow:{x:0.36,y:0.30}, rWrist:{x:0.40,y:0.20} }),  // 双手开始蓄力
  p({ rElbow:{x:0.34,y:0.26}, rWrist:{x:0.38,y:0.14}, lElbow:{x:0.66,y:0.26}, lWrist:{x:0.62,y:0.14} }),  // 双手举起
  p({ nose:{x:0.50,y:0.08}, neck:{x:0.50,y:0.19}, rElbow:{x:0.32,y:0.22}, rWrist:{x:0.36,y:0.10}, lElbow:{x:0.68,y:0.22}, lWrist:{x:0.64,y:0.10} }),  // 充能高峰
  p({ rElbow:{x:0.56,y:0.22}, rWrist:{x:0.72,y:0.18}, lElbow:{x:0.64,y:0.28}, lWrist:{x:0.70,y:0.20} }),  // 释放魔法
  p({ nose:{x:0.52,y:0.09}, neck:{x:0.52,y:0.20}, rElbow:{x:0.48,y:0.30}, rWrist:{x:0.60,y:0.26}, lElbow:{x:0.66,y:0.34}, lWrist:{x:0.72,y:0.28} }),  // 余波
  p({}),  // 恢复
];

// ═══════════════════════════════════════════════════════════════
// 推/拉 Push — 4 帧
// ═══════════════════════════════════════════════════════════════
const PUSH: Skeleton[] = [
  p({ nose:{x:0.54,y:0.09}, neck:{x:0.54,y:0.20}, rElbow:{x:0.46,y:0.28}, rWrist:{x:0.58,y:0.28}, lElbow:{x:0.68,y:0.28}, lWrist:{x:0.80,y:0.28}, rKnee:{x:0.42,y:0.70}, lKnee:{x:0.62,y:0.70} }),
  p({ nose:{x:0.56,y:0.09}, neck:{x:0.56,y:0.20}, rElbow:{x:0.50,y:0.26}, rWrist:{x:0.64,y:0.26}, lElbow:{x:0.72,y:0.26}, lWrist:{x:0.86,y:0.26}, rKnee:{x:0.44,y:0.70}, lKnee:{x:0.64,y:0.70} }),
  p({ nose:{x:0.58,y:0.10}, neck:{x:0.58,y:0.21}, rElbow:{x:0.52,y:0.28}, rWrist:{x:0.66,y:0.28}, lElbow:{x:0.74,y:0.28}, lWrist:{x:0.88,y:0.28} }),
  p({}),
];

// ═══════════════════════════════════════════════════════════════
// 爬行 Crawl — 4 帧，俯身爬
// ═══════════════════════════════════════════════════════════════
const CRAWL: Skeleton[] = [
  { nose:{x:0.24,y:0.64}, neck:{x:0.34,y:0.60}, rShoulder:{x:0.40,y:0.56}, rElbow:{x:0.44,y:0.68}, rWrist:{x:0.38,y:0.76}, lShoulder:{x:0.50,y:0.52}, lElbow:{x:0.56,y:0.64}, lWrist:{x:0.52,y:0.72}, rHip:{x:0.58,y:0.60}, rKnee:{x:0.66,y:0.72}, rAnkle:{x:0.62,y:0.82}, lHip:{x:0.66,y:0.56}, lKnee:{x:0.76,y:0.66}, lAnkle:{x:0.74,y:0.76}, rEye:{x:0.20,y:0.62}, lEye:{x:0.22,y:0.60}, rEar:{x:0.16,y:0.64}, lEar:{x:0.18,y:0.62} },
  { nose:{x:0.24,y:0.66}, neck:{x:0.34,y:0.62}, rShoulder:{x:0.40,y:0.58}, rElbow:{x:0.34,y:0.68}, rWrist:{x:0.28,y:0.76}, lShoulder:{x:0.50,y:0.54}, lElbow:{x:0.56,y:0.64}, lWrist:{x:0.62,y:0.70}, rHip:{x:0.58,y:0.62}, rKnee:{x:0.66,y:0.74}, rAnkle:{x:0.72,y:0.80}, lHip:{x:0.66,y:0.58}, lKnee:{x:0.74,y:0.68}, lAnkle:{x:0.68,y:0.78}, rEye:{x:0.20,y:0.64}, lEye:{x:0.22,y:0.62}, rEar:{x:0.16,y:0.66}, lEar:{x:0.18,y:0.64} },
  { nose:{x:0.26,y:0.64}, neck:{x:0.36,y:0.60}, rShoulder:{x:0.42,y:0.56}, rElbow:{x:0.46,y:0.68}, rWrist:{x:0.40,y:0.76}, lShoulder:{x:0.52,y:0.52}, lElbow:{x:0.58,y:0.64}, lWrist:{x:0.54,y:0.72}, rHip:{x:0.60,y:0.60}, rKnee:{x:0.68,y:0.72}, rAnkle:{x:0.64,y:0.82}, lHip:{x:0.68,y:0.56}, lKnee:{x:0.78,y:0.66}, lAnkle:{x:0.76,y:0.76}, rEye:{x:0.22,y:0.62}, lEye:{x:0.24,y:0.60}, rEar:{x:0.18,y:0.64}, lEar:{x:0.20,y:0.62} },
  { nose:{x:0.24,y:0.64}, neck:{x:0.34,y:0.60}, rShoulder:{x:0.40,y:0.56}, rElbow:{x:0.36,y:0.68}, rWrist:{x:0.30,y:0.76}, lShoulder:{x:0.50,y:0.52}, lElbow:{x:0.56,y:0.62}, lWrist:{x:0.60,y:0.68}, rHip:{x:0.58,y:0.60}, rKnee:{x:0.64,y:0.72}, rAnkle:{x:0.70,y:0.80}, lHip:{x:0.66,y:0.56}, lKnee:{x:0.72,y:0.66}, lAnkle:{x:0.66,y:0.76}, rEye:{x:0.20,y:0.62}, lEye:{x:0.22,y:0.60}, rEar:{x:0.16,y:0.64}, lEar:{x:0.18,y:0.62} },
];

// ═══════════════════════════════════════════════════════════════
// 胜利 Victory — 4 帧，举手欢呼
// ═══════════════════════════════════════════════════════════════
const VICTORY: Skeleton[] = [
  p({ rElbow:{x:0.30,y:0.18}, rWrist:{x:0.26,y:0.08}, lElbow:{x:0.70,y:0.20}, lWrist:{x:0.74,y:0.10} }),
  p({ nose:{x:0.50,y:0.07}, neck:{x:0.50,y:0.18}, rElbow:{x:0.28,y:0.16}, rWrist:{x:0.22,y:0.06}, lElbow:{x:0.72,y:0.16}, lWrist:{x:0.78,y:0.06} }),
  p({ rElbow:{x:0.30,y:0.18}, rWrist:{x:0.26,y:0.08}, lElbow:{x:0.70,y:0.18}, lWrist:{x:0.74,y:0.08} }),
  p({}),
];

// ═══════════════════════════════════════════════════════════════
// 导出动作映射
// ═══════════════════════════════════════════════════════════════
export const ACTION_SKELETONS: Record<string, Skeleton[]> = {
  walk: WALK, run: RUN, idle: IDLE, jump: JUMP, attack: ATTACK,
  hurt: HURT, death: DEATH, guard: GUARD, crouch: CROUCH,
  roll: ROLL, spellcast: SPELLCAST, push: PUSH, crawl: CRAWL, victory: VICTORY,
};

export const ACTION_KEY_MAP: Record<string, string> = {
  '行走': 'walk', '走路': 'walk', 'walking': 'walk', 'walk': 'walk',
  '奔跑': 'run',  '跑步': 'run',  'running': 'run',  'run': 'run',
  '待机': 'idle', '站立': 'idle', 'idle': 'idle',    'standing': 'idle',
  '跳跃': 'jump', 'jumping': 'jump', 'jump': 'jump',
  '攻击': 'attack', 'attacking': 'attack', 'attack': 'attack',
  '受伤': 'hurt',   'hurt': 'hurt', 'hit': 'hurt',
  '死亡': 'death',  '倒下': 'death', 'death': 'death', 'die': 'death',
  '防御': 'guard',  '格挡': 'guard', 'guard': 'guard', 'block': 'guard',
  '蹲伏': 'crouch', '潜行': 'crouch', 'crouch': 'crouch', 'sneak': 'crouch',
  '翻滚': 'roll',   '闪避': 'roll', 'roll': 'roll', 'dodge': 'roll',
  '施法': 'spellcast', '魔法': 'spellcast', 'spellcast': 'spellcast', 'cast': 'spellcast', 'magic': 'spellcast',
  '推': 'push', '推动': 'push', 'push': 'push',
  '爬行': 'crawl', '爬': 'crawl', 'crawl': 'crawl',
  '胜利': 'victory', '欢呼': 'victory', 'victory': 'victory', 'celebrate': 'victory',
};

export function getSkeletons(action: string, frameCount: number): Skeleton[] {
  const key = ACTION_KEY_MAP[action.toLowerCase().trim()] ?? 'idle';
  const pool = ACTION_SKELETONS[key] ?? IDLE;
  return Array.from({ length: frameCount }, (_, i) => pool[i % pool.length]);
}
