const REQUIRED = [
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
]

export function parseEnv(raw) {
  const missing = REQUIRED.filter((k) => !String(raw[k] || '').trim())
  if (missing.length) {
    throw new Error(`Env wajib belum diisi: ${missing.join(', ')}. Salin .env.example ke .env`)
  }
  return {
    sheetsId: raw.GOOGLE_SHEETS_ID.trim(),
    clientEmail: raw.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim(),
    privateKey: raw.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    sheetIbu: (raw.SHEET_IBU || 'Ibu').trim(),
    sheetAnak: (raw.SHEET_ANAK || 'Anak').trim(),
    port: Number(raw.PORT || 8787),
  }
}

export function loadEnv() {
  return parseEnv(process.env)
}
