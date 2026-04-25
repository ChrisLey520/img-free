declare module 'imagetracerjs' {
  export type ImageDataLike = {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };

  export type ImageTracerOptions = {
    numberofcolors?: number;
    pathomit?: number;
    ltres?: number;
    qtres?: number;
    [k: string]: unknown;
  };

  declare const ImageTracer: {
    imagedataToSVG: (
      imageData: ImageDataLike,
      options?: ImageTracerOptions,
    ) => string;
  };

  export default ImageTracer;
}
