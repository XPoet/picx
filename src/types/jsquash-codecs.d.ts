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
