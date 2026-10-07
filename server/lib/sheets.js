import { google } from 'googleapis'
import { objectsFromTable, isIbuDataRow, isAnakDataRow } from './rows.js'

const IBU_HEADERS = ['NIK', 'Nama', 'Phone', 'Alamat', 'CreatedAt']
const ANAK_HEADERS = ['NIK_Ibu', 'Nama', 'DOB', 'Gender', 'Vaccines', 'CreatedAt', 'UpdatedAt', '_compositeKey']

function jwt(env) {
  return new google.auth.JWT({
    email: env.clientEmail,
    key: env.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function lineFromRow(headers, row) {
  return headers.map((h) => (row[h] == null ? '' : String(row[h])))
}

export function createSheetsRepo(env) {
  const auth = jwt(env)
  const sheets = google.sheets({ version: 'v4', auth })
  const id = env.sheetsId
  const gidCache = {}

  async function numericSheetId(title) {
    if (gidCache[title] != null) return gidCache[title]
    const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties' })
    for (const s of meta.data.sheets || []) {
      gidCache[s.properties.title] = s.properties.sheetId
    }
    if (gidCache[title] == null) throw new Error(`Tab spreadsheet tidak ditemukan: ${title}`)
    return gidCache[title]
  }

  async function readTable(title, headers) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `'${title}'!A1:Z`,
    })
    const values = res.data.values || [headers]
    if (!values.length) return objectsFromTable([headers])
    return objectsFromTable(values)
  }

  async function updateRow(title, headers, rowNumber, row) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `'${title}'!A${rowNumber}:${String.fromCharCode(64 + headers.length)}${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [lineFromRow(headers, row)] },
    })
  }

  async function appendRow(title, headers, row) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `'${title}'!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [lineFromRow(headers, row)] },
    })
  }

  async function deleteRow(title, rowNumber) {
    if (rowNumber <= 1) throw new Error('Menolak hapus baris header')
    const sheetId = await numericSheetId(title)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        }],
      },
    })
  }

  return {
    async readIbu() { return readTable(env.sheetIbu, IBU_HEADERS) },
    async readAnak() { return readTable(env.sheetAnak, ANAK_HEADERS) },
    async appendIbu(row) { await appendRow(env.sheetIbu, IBU_HEADERS, row) },
    async updateIbu(n, row) { await updateRow(env.sheetIbu, IBU_HEADERS, n, row) },
    async deleteIbuRow(n) { await deleteRow(env.sheetIbu, n) },
    async appendAnak(row) { await appendRow(env.sheetAnak, ANAK_HEADERS, row) },
    async updateAnak(n, row) { await updateRow(env.sheetAnak, ANAK_HEADERS, n, row) },
    async deleteAnakRow(n) { await deleteRow(env.sheetAnak, n) },
  }
}

export { IBU_HEADERS, ANAK_HEADERS, isIbuDataRow, isAnakDataRow }
