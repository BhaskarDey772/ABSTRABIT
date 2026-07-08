import { describe, it, expect } from 'vitest'
import nacl from 'tweetnacl'
import { verifyDiscordRequest } from '../verify'

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

function sign(timestamp: string, body: string, secretKey: Uint8Array): string {
  const signature = nacl.sign.detached(Buffer.from(timestamp + body), secretKey)
  return toHex(signature)
}

describe('verifyDiscordRequest', () => {
  const keyPair = nacl.sign.keyPair()
  const publicKeyHex = toHex(keyPair.publicKey)
  const body = JSON.stringify({ type: 1 })
  const timestamp = '1700000000'

  it('accepts a validly signed request', () => {
    const signature = sign(timestamp, body, keyPair.secretKey)
    expect(verifyDiscordRequest(body, signature, timestamp, publicKeyHex)).toBe(true)
  })

  it('rejects a tampered body', () => {
    const signature = sign(timestamp, body, keyPair.secretKey)
    expect(verifyDiscordRequest(body + 'x', signature, timestamp, publicKeyHex)).toBe(false)
  })

  it('rejects a tampered timestamp', () => {
    const signature = sign(timestamp, body, keyPair.secretKey)
    expect(verifyDiscordRequest(body, signature, '1700000001', publicKeyHex)).toBe(false)
  })

  it('rejects when signed with the wrong key', () => {
    const otherKeyPair = nacl.sign.keyPair()
    const signature = sign(timestamp, body, otherKeyPair.secretKey)
    expect(verifyDiscordRequest(body, signature, timestamp, publicKeyHex)).toBe(false)
  })

  it('rejects missing signature or timestamp headers', () => {
    expect(verifyDiscordRequest(body, null, timestamp, publicKeyHex)).toBe(false)
    expect(verifyDiscordRequest(body, 'deadbeef', null, publicKeyHex)).toBe(false)
  })

  it('rejects malformed hex without throwing', () => {
    expect(verifyDiscordRequest(body, 'not-hex', timestamp, publicKeyHex)).toBe(false)
  })
})
