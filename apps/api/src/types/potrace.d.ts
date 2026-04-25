declare module 'potrace' {
  export type PotraceOptions = {
    turdSize?: number;
    optTolerance?: number;
    blackOnWhite?: boolean;
  };

  export function trace(
    input: Buffer | string,
    options: PotraceOptions,
    cb: (err: Error | null, svg: string) => void,
  ): void;
  export function trace(
    input: Buffer | string,
    cb: (err: Error | null, svg: string) => void,
  ): void;

  declare const potrace: {
    trace: typeof trace;
  };

  export default potrace;
}
