import { keys } from "libp2p-crypto"
import multibase from "multibase"
import { PrivateKey, PublicKey } from "./interfaces"
import { encodePrivateKey, encodePublicKey, KeyType } from "./proto.keys"
import { ensureKey, sha256Multihash } from "./utils"

// import * as ed from 'noble-ed25519'
const ed = keys.supportedKeys.ed25519

export const constants = {
  PUBLIC_KEY_BYTE_LENGTH: 32,
  PRIVATE_KEY_BYTE_LENGTH: 32,
  SEED_BYTE_LENGTH: 32,
  SIGN_BYTE_LENGTH: 64,
  HASH_BYTE_LENGTH: 64,
}

export class Ed25519PublicKey implements PublicKey {
  constructor(private publicKey: Uint8Array) {
    this.publicKey = ensureKey(publicKey, constants.PUBLIC_KEY_BYTE_LENGTH)
  }

  async verify(data: Uint8Array, sig: Uint8Array): Promise<boolean> {
    // return ed.verify(sig, data, this.publicKey)
    const key = new ed.Ed25519PublicKey(this.buffer)
    return key.verify(Buffer.from(data), Buffer.from(sig))
  }

  marshal(): Uint8Array {
    return new Uint8Array(this.publicKey)
  }

  get buffer(): Buffer {
    return Buffer.from(this.publicKey)
  }

  get bytes(): Uint8Array {
    return encodePublicKey({
      Type: KeyType.Ed25519,
      Data: this.marshal(),
    })
  }

  equals(key: PublicKey): boolean {
    const bytes = key.bytes
    return this.bytes.every((value, index) => value === bytes[index])
  }

  async hash(): Promise<Uint8Array> {
    return sha256Multihash(this.bytes)
  }
}

export class Ed25519PrivateKey implements PrivateKey {
  /**
   * Construct a Ed25519 private key.
   * @param key 64 byte Uint8Array or Buffer containing private key
   * @param publicKey 32 byte Uint8Array or Buffer containing public key
   */
  constructor(private privateKey: Uint8Array, private publicKey: Uint8Array) {
    this.privateKey = ensureKey(privateKey, constants.PRIVATE_KEY_BYTE_LENGTH)
    this.publicKey = ensureKey(publicKey, constants.PUBLIC_KEY_BYTE_LENGTH)
  }

  async sign(message: Uint8Array): Promise<Buffer> {
    // return ed.sign(message, this.privateKey)
    const privateKey = Buffer.concat([
      this.privateKeyBuffer,
      this.publicKeyBuffer,
    ])
    const key = new ed.Ed25519PrivateKey(privateKey, this.publicKeyBuffer)
    return key.sign(Buffer.from(message))
  }

  get public(): Ed25519PublicKey {
    return new Ed25519PublicKey(this.publicKey)
  }

  marshal(): Uint8Array {
    // ED25519 private keys are represented by two 32-bytes curve points (private and public
    // components)
    const full = new Uint8Array(
      this.privateKey.byteLength + this.publicKey.byteLength * 2
    )
    full.set(this.privateKey)
    full.set(this.publicKey, this.privateKey.byteLength)
    // @note To match the output of libp2p-crypto, we also append redundant public key bytes
    full.set(
      this.publicKey,
      this.privateKey.byteLength + this.publicKey.byteLength
    )
    return full
  }

  get publicKeyBuffer(): Buffer {
    return Buffer.from(this.publicKey)
  }

  get privateKeyBuffer(): Buffer {
    return Buffer.from(this.privateKey)
  }

  get bytes(): Uint8Array {
    return encodePrivateKey({
      Type: KeyType.Ed25519,
      Data: this.marshal(),
    })
  }

  equals(key: PrivateKey): boolean {
    const bytes = key.bytes
    return this.bytes.every((value, index) => value === bytes[index])
  }

  async hash(): Promise<Uint8Array> {
    return sha256Multihash(this.bytes)
  }

  /**
   * Gets the ID of the key.
   *
   * The key id is the base58 encoding of the SHA-256 multihash of its public key.
   * The public key is a protobuf encoding containing a type and the DER encoding
   * of the PKCS SubjectPublicKeyInfo.
   */
  async id(): Promise<string> {
    const hash = await this.public.hash()
    return multibase
      .encode("base58btc", hash as Buffer)
      .toString()
      .slice(1)
  }
}

export async function unmarshalEd25519PrivateKey(
  bytes: Uint8Array
): Promise<Ed25519PrivateKey> {
  // We might have the public key bytes appended twice, but we can ignore the extra public
  // bytes on the end (no need to check it either)
  const privateKeyBytes = bytes.slice(0, constants.PRIVATE_KEY_BYTE_LENGTH)
  const publicKeyBytes = bytes.slice(
    constants.PRIVATE_KEY_BYTE_LENGTH,
    constants.PRIVATE_KEY_BYTE_LENGTH + constants.PUBLIC_KEY_BYTE_LENGTH
  )
  return new Ed25519PrivateKey(privateKeyBytes, publicKeyBytes)
}

export function unmarshalEd25519PublicKey(bytes: Uint8Array): Ed25519PublicKey {
  return new Ed25519PublicKey(bytes)
}

export async function generateKeyPair(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bytesLength = constants.PRIVATE_KEY_BYTE_LENGTH
): Promise<Ed25519PrivateKey> {
  // const privateKey = ed.utils.randomPrivateKey(bytesLength)
  // const publicKey = await ed.getPublicKey(privateKey)
  const key = await ed.generateKeyPair()
  const bytes = key.marshal()
  const privateKey = bytes.slice(0, constants.PRIVATE_KEY_BYTE_LENGTH)
  const publicKey = bytes.slice(
    constants.PRIVATE_KEY_BYTE_LENGTH,
    constants.PRIVATE_KEY_BYTE_LENGTH + constants.PUBLIC_KEY_BYTE_LENGTH
  )
  return new Ed25519PrivateKey(privateKey, publicKey)
}
