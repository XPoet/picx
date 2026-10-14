interface JSquashCodecModule {
  encode: (imageData: ImageData) => Promise<ArrayBuffer>
}

declare module '@jsquash/avif' {
  export const encode: JSquashCodecModule['encode']
}

declare module '@jsquash/jpeg' {
  export const encode: JSquashCodecModule['encode']
}

declare module '@jsquash/webp' {
  export const encode: JSquashCodecModule['encode']
}

declare module '@jsquash/oxipng' {
  export interface OptimiseOptions {
    interlace: boolean
    level: number
    optimiseAlpha: boolean
  }

  export function optimise(data: ArrayBuffer | ImageData, options?: Partial<OptimiseOptions>): Promise<ArrayBuffer>
}
