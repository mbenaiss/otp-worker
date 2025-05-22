declare module 'qrcode-reader' {
  export default class QrReader {
    callback: (error: Error | null, result: { result: string } | null) => void;
    decode: (bitmap: { width: number; height: number; data: Buffer | Uint8Array }) => void;
  }
} 