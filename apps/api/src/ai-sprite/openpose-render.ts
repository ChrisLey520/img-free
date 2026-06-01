import sharp from 'sharp';
import type { Skeleton } from './skeleton-poses.js';

/** OpenPose 标准配色（RGB 十六进制） */
const COLORS = {
  neck:      '#ff0000',
  rShoulder: '#ff5500', rElbow: '#ffaa00', rWrist: '#ffff00',
  lShoulder: '#00ff00', lElbow: '#00ffaa', lWrist: '#00ffff',
  rHip:      '#0055ff', rKnee:  '#0000ff', rAnkle: '#aa00ff',
  lHip:      '#ff00ff', lKnee:  '#ff0088', lAnkle: '#ff00cc',
  nose:      '#ffffff',
  rEye:      '#dddddd', lEye:   '#dddddd',
  rEar:      '#aaaaaa', lEar:   '#aaaaaa',
};

/** 骨骼连接关系：[from, to, color] */
const LIMBS: [keyof Skeleton, keyof Skeleton, string][] = [
  ['nose',      'neck',      '#ffffff'],
  ['neck',      'rShoulder', '#ff2200'],
  ['rShoulder', 'rElbow',    '#ff7700'],
  ['rElbow',    'rWrist',    '#ffcc00'],
  ['neck',      'lShoulder', '#00cc00'],
  ['lShoulder', 'lElbow',    '#00ffaa'],
  ['lElbow',    'lWrist',    '#00ccff'],
  ['neck',      'rHip',      '#3366ff'],
  ['rHip',      'rKnee',     '#0033ff'],
  ['rKnee',     'rAnkle',    '#8800ff'],
  ['neck',      'lHip',      '#ff00cc'],
  ['lHip',      'lKnee',     '#ff0066'],
  ['lKnee',     'lAnkle',    '#ff3399'],
  ['nose',      'rEye',      '#eeeeee'],
  ['rEye',      'rEar',      '#cccccc'],
  ['nose',      'lEye',      '#eeeeee'],
  ['lEye',      'lEar',      '#cccccc'],
];

/**
 * 将骨骼数据渲染为 OpenPose 风格的 PNG 图（黑底彩色关节+肢体）。
 * @param skeleton  归一化骨骼坐标（0-1）
 * @param size      目标图片尺寸（正方形，像素）
 */
export async function renderOpenPose(skeleton: Skeleton, size: number): Promise<Buffer> {
  const r = (v: number) => (v * size).toFixed(1);
  const kp = skeleton;

  const JOINT_R = Math.max(3, size * 0.012);
  const STROKE  = Math.max(2, size * 0.008);

  const limbs = LIMBS.map(([from, to, color]) => {
    const a = kp[from], b = kp[to];
    return `<line x1="${r(a.x)}" y1="${r(a.y)}" x2="${r(b.x)}" y2="${r(b.y)}"
      stroke="${color}" stroke-width="${STROKE.toFixed(1)}" stroke-linecap="round"/>`;
  }).join('\n');

  const joints = (Object.entries(kp) as [keyof Skeleton, { x: number; y: number }][])
    .map(([name, pt]) => {
      const c = COLORS[name as keyof typeof COLORS] ?? '#ffffff';
      return `<circle cx="${r(pt.x)}" cy="${r(pt.y)}" r="${JOINT_R.toFixed(1)}" fill="${c}" />`;
    }).join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="black"/>
  ${limbs}
  ${joints}
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
