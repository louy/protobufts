export type Base64String = string;
export type ByteBuffer = Buffer;

export interface MessageConstructor<T> {
  new (message: T): Message<T>;

  decode(encoded: ByteBuffer | Buffer| Array<number>): T;
  decode64(b64: Base64String): T;
}

export interface Message<T> {
  encode(): ByteBuffer;

  toBuffer(decoded: T): Buffer;
  toArrayBuffer(decoded: T): Array<number>;
  toBase64(decoded: T): Base64String;
}
