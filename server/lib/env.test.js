import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseEnv } from './env.js'

test('parseEnv: error jika field wajib kosong', () => {
  assert.throws(() => parseEnv({}), /GOOGLE_SHEETS_ID/)
})

test('parseEnv: ganti \\n pada private key', () => {
  const env = parseEnv({
    GOOGLE_SHEETS_ID: 'abc',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'sa@x.iam.gserviceaccount.com',
    GOOGLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nLINE\\n-----END PRIVATE KEY-----\\n',
    SHEET_IBU: 'Ibu',
    SHEET_ANAK: 'Anak',
    PORT: '8787',
  })
  assert.equal(env.sheetsId, 'abc')
  assert.ok(env.privateKey.includes('\n'))
  assert.equal(env.sheetIbu, 'Ibu')
  assert.equal(env.port, 8787)
})
