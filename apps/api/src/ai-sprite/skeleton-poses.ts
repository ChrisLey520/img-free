/**
 * 预定义骨骼姿态库（归一化坐标 0-1，原点左上角）
 * 人物朝右侧视图，7 种动作 × 4 帧
 *
 * 关键点顺序遵循 OpenPose 18 点格式：
 * nose, neck, rShoulder, rElbow, rWrist,
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

// 站立基础姿态（用于插值参考）
const STAND: Skeleton = {
  nose:      { x: 0.50, y: 0.09 }, neck:      { x: 0.50, y: 0.20 },
  rShoulder: { x: 0.38, y: 0.26 }, rElbow:    { x: 0.30, y: 0.38 }, rWrist:    { x: 0.28, y: 0.52 },
  lShoulder: { x: 0.62, y: 0.26 }, lElbow:    { x: 0.70, y: 0.38 }, lWrist:    { x: 0.72, y: 0.52 },
  rHip:      { x: 0.42, y: 0.52 }, rKnee:     { x: 0.40, y: 0.70 }, rAnkle:    { x: 0.40, y: 0.88 },
  lHip:      { x: 0.58, y: 0.52 }, lKnee:     { x: 0.60, y: 0.70 }, lAnkle:    { x: 0.60, y: 0.88 },
  rEye:      { x: 0.46, y: 0.07 }, lEye:      { x: 0.54, y: 0.07 },
  rEar:      { x: 0.42, y: 0.09 }, lEar:      { x: 0.58, y: 0.09 },
};

// ── 行走（4 帧，右脚/左脚交替） ────────────────────────────────
const WALK: Skeleton[] = [
  { // frame 1: 右脚后，左脚前，右臂前，左臂后
    ...STAND,
    rElbow: { x: 0.34, y: 0.34 }, rWrist: { x: 0.38, y: 0.48 },  // 右臂前摆
    lElbow: { x: 0.66, y: 0.42 }, lWrist: { x: 0.64, y: 0.56 },  // 左臂后摆
    rKnee:  { x: 0.36, y: 0.68 }, rAnkle: { x: 0.28, y: 0.85 },  // 右腿后
    lKnee:  { x: 0.64, y: 0.66 }, lAnkle: { x: 0.70, y: 0.84 },  // 左腿前
  },
  { // frame 2: 过渡，双脚收拢
    ...STAND,
    rElbow: { x: 0.32, y: 0.38 }, rWrist: { x: 0.30, y: 0.52 },
    lElbow: { x: 0.68, y: 0.38 }, lWrist: { x: 0.70, y: 0.52 },
    rKnee:  { x: 0.42, y: 0.69 }, rAnkle: { x: 0.42, y: 0.86 },
    lKnee:  { x: 0.58, y: 0.69 }, lAnkle: { x: 0.58, y: 0.86 },
  },
  { // frame 3: 左脚后，右脚前，左臂前，右臂后
    ...STAND,
    rElbow: { x: 0.34, y: 0.42 }, rWrist: { x: 0.36, y: 0.56 },  // 右臂后摆
    lElbow: { x: 0.66, y: 0.34 }, lWrist: { x: 0.62, y: 0.48 },  // 左臂前摆
    rKnee:  { x: 0.64, y: 0.66 }, rAnkle: { x: 0.70, y: 0.84 },  // 右腿前
    lKnee:  { x: 0.36, y: 0.68 }, lAnkle: { x: 0.28, y: 0.85 },  // 左腿后
  },
  { // frame 4: 过渡
    ...STAND,
    rElbow: { x: 0.30, y: 0.38 }, rWrist: { x: 0.28, y: 0.52 },
    lElbow: { x: 0.70, y: 0.38 }, lWrist: { x: 0.72, y: 0.52 },
    rKnee:  { x: 0.40, y: 0.70 }, rAnkle: { x: 0.40, y: 0.88 },
    lKnee:  { x: 0.60, y: 0.70 }, lAnkle: { x: 0.60, y: 0.88 },
  },
];

// ── 奔跑（4 帧，更大步幅） ────────────────────────────────────
const RUN: Skeleton[] = [
  { // frame 1: 大步跨出，身体前倾
    ...STAND,
    nose:   { x: 0.54, y: 0.08 }, neck: { x: 0.54, y: 0.19 },  // 身体前倾
    rElbow: { x: 0.38, y: 0.30 }, rWrist: { x: 0.42, y: 0.42 },  // 右臂高举前摆
    lElbow: { x: 0.66, y: 0.44 }, lWrist: { x: 0.62, y: 0.58 },  // 左臂后摆
    rKnee:  { x: 0.30, y: 0.62 }, rAnkle: { x: 0.22, y: 0.80 },  // 右腿大步后
    lKnee:  { x: 0.70, y: 0.58 }, lAnkle: { x: 0.78, y: 0.75 },  // 左腿大步前
  },
  { // frame 2: 腾空
    ...STAND,
    nose:   { x: 0.52, y: 0.07 }, neck: { x: 0.52, y: 0.18 },
    rElbow: { x: 0.34, y: 0.32 }, rWrist: { x: 0.30, y: 0.44 },
    lElbow: { x: 0.68, y: 0.36 }, lWrist: { x: 0.72, y: 0.50 },
    rKnee:  { x: 0.36, y: 0.60 }, rAnkle: { x: 0.32, y: 0.78 },
    lKnee:  { x: 0.64, y: 0.60 }, lAnkle: { x: 0.68, y: 0.78 },
  },
  { // frame 3: 对称帧（方向互换）
    ...STAND,
    nose:   { x: 0.54, y: 0.08 }, neck: { x: 0.54, y: 0.19 },
    rElbow: { x: 0.36, y: 0.44 }, rWrist: { x: 0.32, y: 0.58 },  // 右臂后摆
    lElbow: { x: 0.64, y: 0.30 }, lWrist: { x: 0.58, y: 0.42 },  // 左臂高举前摆
    rKnee:  { x: 0.70, y: 0.58 }, rAnkle: { x: 0.78, y: 0.75 },  // 右腿前
    lKnee:  { x: 0.30, y: 0.62 }, lAnkle: { x: 0.22, y: 0.80 },  // 左腿后
  },
  { // frame 4: 腾空（对称）
    ...STAND,
    nose:   { x: 0.52, y: 0.07 }, neck: { x: 0.52, y: 0.18 },
    rElbow: { x: 0.34, y: 0.36 }, rWrist: { x: 0.28, y: 0.50 },
    lElbow: { x: 0.68, y: 0.32 }, lWrist: { x: 0.70, y: 0.44 },
    rKnee:  { x: 0.35, y: 0.58 }, rAnkle: { x: 0.30, y: 0.76 },
    lKnee:  { x: 0.65, y: 0.58 }, lAnkle: { x: 0.70, y: 0.76 },
  },
];

// ── 待机（4 帧，轻微摆动） ────────────────────────────────────
const IDLE: Skeleton[] = [
  { ...STAND },
  { ...STAND, nose: { x: 0.50, y: 0.10 }, neck: { x: 0.50, y: 0.21 },  // 轻微下移（呼吸）
    rKnee: { x: 0.40, y: 0.71 }, lKnee: { x: 0.60, y: 0.71 } },
  { ...STAND },
  { ...STAND, nose: { x: 0.51, y: 0.09 }, neck: { x: 0.51, y: 0.20 },
    rElbow: { x: 0.31, y: 0.39 }, lElbow: { x: 0.69, y: 0.39 } },
];

// ── 跳跃（4 帧） ──────────────────────────────────────────────
const JUMP: Skeleton[] = [
  { // frame 1: 蹲下蓄力
    ...STAND,
    nose: { x: 0.50, y: 0.18 }, neck: { x: 0.50, y: 0.28 },
    rShoulder: { x: 0.38, y: 0.34 }, lShoulder: { x: 0.62, y: 0.34 },
    rElbow: { x: 0.30, y: 0.42 }, rWrist: { x: 0.28, y: 0.55 },
    lElbow: { x: 0.70, y: 0.42 }, lWrist: { x: 0.72, y: 0.55 },
    rHip: { x: 0.40, y: 0.58 }, lHip: { x: 0.60, y: 0.58 },
    rKnee: { x: 0.36, y: 0.72 }, rAnkle: { x: 0.40, y: 0.86 },
    lKnee: { x: 0.64, y: 0.72 }, lAnkle: { x: 0.60, y: 0.86 },
  },
  { // frame 2: 腾空上升，手臂上举
    ...STAND,
    nose: { x: 0.50, y: 0.06 }, neck: { x: 0.50, y: 0.17 },
    rElbow: { x: 0.34, y: 0.26 }, rWrist: { x: 0.36, y: 0.14 },  // 手臂上举
    lElbow: { x: 0.66, y: 0.26 }, lWrist: { x: 0.64, y: 0.14 },
    rHip: { x: 0.42, y: 0.48 }, lHip: { x: 0.58, y: 0.48 },
    rKnee: { x: 0.38, y: 0.60 }, rAnkle: { x: 0.42, y: 0.74 },  // 脚收起
    lKnee: { x: 0.62, y: 0.60 }, lAnkle: { x: 0.58, y: 0.74 },
  },
  { // frame 3: 最高点，身体舒展
    ...STAND,
    nose: { x: 0.50, y: 0.05 }, neck: { x: 0.50, y: 0.16 },
    rElbow: { x: 0.30, y: 0.24 }, rWrist: { x: 0.24, y: 0.14 },
    lElbow: { x: 0.70, y: 0.24 }, lWrist: { x: 0.76, y: 0.14 },
    rKnee: { x: 0.40, y: 0.68 }, rAnkle: { x: 0.40, y: 0.84 },
    lKnee: { x: 0.60, y: 0.68 }, lAnkle: { x: 0.60, y: 0.84 },
  },
  { // frame 4: 落地，膝盖弯曲缓冲
    ...STAND,
    nose: { x: 0.50, y: 0.16 }, neck: { x: 0.50, y: 0.26 },
    rShoulder: { x: 0.38, y: 0.32 }, lShoulder: { x: 0.62, y: 0.32 },
    rElbow: { x: 0.32, y: 0.44 }, rWrist: { x: 0.34, y: 0.56 },
    lElbow: { x: 0.68, y: 0.44 }, lWrist: { x: 0.66, y: 0.56 },
    rHip: { x: 0.40, y: 0.56 }, lHip: { x: 0.60, y: 0.56 },
    rKnee: { x: 0.36, y: 0.70 }, rAnkle: { x: 0.40, y: 0.84 },
    lKnee: { x: 0.64, y: 0.70 }, lAnkle: { x: 0.60, y: 0.84 },
  },
];

// ── 攻击（4 帧，单手挥击） ────────────────────────────────────
const ATTACK: Skeleton[] = [
  { // frame 1: 举刀准备
    ...STAND,
    rElbow: { x: 0.36, y: 0.22 }, rWrist: { x: 0.40, y: 0.10 },  // 右手高举
    lElbow: { x: 0.66, y: 0.40 }, lWrist: { x: 0.68, y: 0.54 },
  },
  { // frame 2: 大力挥击
    ...STAND,
    rElbow: { x: 0.56, y: 0.24 }, rWrist: { x: 0.72, y: 0.30 },  // 右手前伸挥击
    lElbow: { x: 0.62, y: 0.40 }, lWrist: { x: 0.66, y: 0.54 },
    nose: { x: 0.54, y: 0.09 }, neck: { x: 0.54, y: 0.20 },  // 身体前倾
  },
  { // frame 3: 全力伸展
    ...STAND,
    rElbow: { x: 0.64, y: 0.28 }, rWrist: { x: 0.82, y: 0.24 },  // 充分伸展
    lElbow: { x: 0.62, y: 0.44 }, lWrist: { x: 0.64, y: 0.58 },
    nose: { x: 0.56, y: 0.09 }, neck: { x: 0.56, y: 0.20 },
  },
  { // frame 4: 收回，回防姿势
    ...STAND,
    rElbow: { x: 0.38, y: 0.32 }, rWrist: { x: 0.36, y: 0.46 },
    lElbow: { x: 0.66, y: 0.32 }, lWrist: { x: 0.68, y: 0.46 },
  },
];

// ── 受伤（4 帧，后退踉跄） ────────────────────────────────────
const HURT: Skeleton[] = [
  { // frame 1: 受击，上身后仰
    ...STAND,
    nose: { x: 0.46, y: 0.10 }, neck: { x: 0.47, y: 0.21 },
    rElbow: { x: 0.32, y: 0.30 }, rWrist: { x: 0.26, y: 0.38 },  // 手臂防御抬起
    lElbow: { x: 0.64, y: 0.28 }, lWrist: { x: 0.60, y: 0.36 },
  },
  { // frame 2: 重心后移
    ...STAND,
    nose: { x: 0.44, y: 0.10 }, neck: { x: 0.45, y: 0.21 },
    rHip: { x: 0.38, y: 0.53 }, lHip: { x: 0.56, y: 0.53 },
    rKnee: { x: 0.34, y: 0.70 }, rAnkle: { x: 0.30, y: 0.86 },
    lKnee: { x: 0.58, y: 0.70 }, lAnkle: { x: 0.56, y: 0.88 },
    rElbow: { x: 0.30, y: 0.30 }, rWrist: { x: 0.24, y: 0.40 },
    lElbow: { x: 0.62, y: 0.30 }, lWrist: { x: 0.58, y: 0.40 },
  },
  { // frame 3: 踉跄恢复
    ...STAND,
    nose: { x: 0.48, y: 0.09 }, neck: { x: 0.49, y: 0.20 },
    rElbow: { x: 0.30, y: 0.36 }, rWrist: { x: 0.28, y: 0.50 },
    lElbow: { x: 0.68, y: 0.36 }, lWrist: { x: 0.70, y: 0.50 },
  },
  { // frame 4: 恢复站立
    ...STAND,
  },
];

// ── 死亡（4 帧，倒地） ────────────────────────────────────────
const DEATH: Skeleton[] = [
  { // frame 1: 踉跄，膝盖弯曲
    ...STAND,
    nose: { x: 0.50, y: 0.18 }, neck: { x: 0.50, y: 0.27 },
    rHip: { x: 0.40, y: 0.56 }, lHip: { x: 0.58, y: 0.56 },
    rKnee: { x: 0.34, y: 0.70 }, rAnkle: { x: 0.38, y: 0.84 },
    lKnee: { x: 0.62, y: 0.72 }, lAnkle: { x: 0.62, y: 0.86 },
    rElbow: { x: 0.30, y: 0.38 }, rWrist: { x: 0.26, y: 0.52 },
    lElbow: { x: 0.64, y: 0.34 }, lWrist: { x: 0.68, y: 0.48 },
  },
  { // frame 2: 跪倒在地
    nose: { x: 0.50, y: 0.48 }, neck: { x: 0.50, y: 0.56 },
    rShoulder: { x: 0.38, y: 0.62 }, rElbow: { x: 0.30, y: 0.72 }, rWrist: { x: 0.26, y: 0.82 },
    lShoulder: { x: 0.62, y: 0.62 }, lElbow: { x: 0.70, y: 0.72 }, lWrist: { x: 0.74, y: 0.82 },
    rHip: { x: 0.40, y: 0.74 }, rKnee: { x: 0.34, y: 0.86 }, rAnkle: { x: 0.30, y: 0.94 },
    lHip: { x: 0.60, y: 0.74 }, lKnee: { x: 0.66, y: 0.86 }, lAnkle: { x: 0.70, y: 0.94 },
    rEye: { x: 0.46, y: 0.46 }, lEye: { x: 0.54, y: 0.46 },
    rEar: { x: 0.42, y: 0.48 }, lEar: { x: 0.58, y: 0.48 },
  },
  { // frame 3: 侧卧
    nose: { x: 0.22, y: 0.82 }, neck: { x: 0.32, y: 0.80 },
    rShoulder: { x: 0.38, y: 0.76 }, rElbow: { x: 0.44, y: 0.82 }, rWrist: { x: 0.50, y: 0.88 },
    lShoulder: { x: 0.42, y: 0.70 }, lElbow: { x: 0.48, y: 0.76 }, lWrist: { x: 0.54, y: 0.82 },
    rHip: { x: 0.56, y: 0.78 }, rKnee: { x: 0.68, y: 0.80 }, rAnkle: { x: 0.80, y: 0.82 },
    lHip: { x: 0.58, y: 0.72 }, lKnee: { x: 0.70, y: 0.74 }, lAnkle: { x: 0.82, y: 0.76 },
    rEye: { x: 0.18, y: 0.80 }, lEye: { x: 0.20, y: 0.78 },
    rEar: { x: 0.14, y: 0.82 }, lEar: { x: 0.16, y: 0.80 },
  },
  { // frame 4: 完全倒地
    nose: { x: 0.18, y: 0.84 }, neck: { x: 0.28, y: 0.82 },
    rShoulder: { x: 0.36, y: 0.78 }, rElbow: { x: 0.48, y: 0.80 }, rWrist: { x: 0.60, y: 0.82 },
    lShoulder: { x: 0.38, y: 0.72 }, lElbow: { x: 0.50, y: 0.74 }, lWrist: { x: 0.62, y: 0.76 },
    rHip: { x: 0.58, y: 0.80 }, rKnee: { x: 0.72, y: 0.82 }, rAnkle: { x: 0.86, y: 0.84 },
    lHip: { x: 0.60, y: 0.74 }, lKnee: { x: 0.74, y: 0.76 }, lAnkle: { x: 0.88, y: 0.78 },
    rEye: { x: 0.14, y: 0.82 }, lEye: { x: 0.16, y: 0.80 },
    rEar: { x: 0.10, y: 0.84 }, lEar: { x: 0.12, y: 0.82 },
  },
];

// ── 导出动作映射 ──────────────────────────────────────────────

export const ACTION_SKELETONS: Record<string, Skeleton[]> = {
  walk: WALK,  run: RUN,  idle: IDLE,
  jump: JUMP,  attack: ATTACK,  hurt: HURT,  death: DEATH,
};

export const ACTION_KEY_MAP: Record<string, string> = {
  '行走': 'walk', '走路': 'walk', 'walking': 'walk', 'walk': 'walk',
  '奔跑': 'run',  '跑步': 'run',  'running':  'run',  'run':  'run',
  '待机': 'idle', '站立': 'idle', 'idle':     'idle', 'standing': 'idle',
  '跳跃': 'jump', 'jumping': 'jump', 'jump':  'jump',
  '攻击': 'attack', 'attacking': 'attack', 'attack': 'attack',
  '受伤': 'hurt',  'hurt': 'hurt', 'hit': 'hurt',
  '死亡': 'death', '倒下': 'death', 'death': 'death', 'die': 'death',
};

export function getSkeletons(action: string, frameCount: number): Skeleton[] {
  const key = ACTION_KEY_MAP[action.toLowerCase().trim()] ?? 'idle';
  const pool = ACTION_SKELETONS[key] ?? IDLE;
  const result: Skeleton[] = [];
  for (let i = 0; i < frameCount; i++) result.push(pool[i % pool.length]);
  return result;
}
