import CID from 'cids'

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import _Block from '@ipld/block/defaults.js'

export type Codec = any

export interface Reader<T> {
  get(path: string): { value: T; remainderPath?: string }
  links(): IterableIterator<[string, CID]>
  tree(): IterableIterator<string>
}

export interface Options {
  source?: object
  data?: Uint8Array
  codec?: string
  cid?: CID | string
  algo?: string
}

export interface Block<T = any> {
  opts: Options
  readonly codec: string
  source(): T | null
  cid(): Promise<CID>
  validate(): boolean
  encode(): Uint8Array
  encodeUnsafe(): Uint8Array
  decode(): T
  decodeUnsafe(): T
  reader(): Reader<T>
}

export interface BlockConstructor {
  new <T>(opts: Options): Block<T>
  getCodec(codec: string): Codec
  encoder<T>(source: T, codec: string, algorithm?: string): Block<T>
  decoder<T = any>(data: Uint8Array, codec: string, algorithm?: string): Block<T>
  create<T = any>(data: Uint8Array, cid: CID): Block<T>
}

export const Block: BlockConstructor = _Block
