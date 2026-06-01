declare module 'gif-encoder-2' {
  import { Readable } from 'stream';
  class GIFEncoder {
    constructor(
      width: number,
      height: number,
      algorithm?: 'neuquant' | 'octree',
      useOptimizer?: boolean,
      totalFrames?: number,
    );
    start(): void;
    finish(): void;
    addFrame(pixels: Buffer | Uint8ClampedArray): void;
    setDelay(ms: number): void;
    setFramesPerSecond(fps: number): void;
    setRepeat(times: number): void;
    setQuality(quality: number): void;
    createReadStream(): Readable;
  }
  export = GIFEncoder;
}
