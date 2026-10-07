import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getData, saveIbu, saveAnak, deleteIbu, deleteAnak } from './posyandu.js'

function memoryRepo(seed = { ibu: [], anak: [] }) {
  let ibu = seed.ibu.map((r) => ({ ...r }))
  let anak = seed.anak.map((r) => ({ ...r }))
  const nextRow = (rows) => 1 + rows.reduce((m, r) => Math.max(m, r._rowNumber || 1), 1)
  return {
    async readIbu() { return ibu.map((r) => ({ ...r })) },
    async readAnak() { return anak.map((r) => ({ ...r })) },
    async appendIbu(row) {
      const rec = { ...row, _rowNumber: nextRow(ibu) }
      ibu.push(rec)
      return rec
    },
    async updateIbu(rowNumber, row) {
      ibu = ibu.map((r) => r._rowNumber === rowNumber ? { ...r, ...row } : r)
    },
    async deleteIbuRow(rowNumber) {
      ibu = ibu.filter((r) => r._rowNumber !== rowNumber)
    },
    async appendAnak(row) {
      const rec = { ...row, _rowNumber: nextRow(anak) }
      anak.push(rec)
      return rec
    },
    async updateAnak(rowNumber, row) {
      anak = anak.map((r) => r._rowNumber === rowNumber ? { ...r, ...row } : r)
    },
    async deleteAnakRow(rowNumber) {
      anak = anak.filter((r) => r._rowNumber !== rowNumber)
    },
    dump() { return { ibu, anak } },
  }
}

test('getData: gabung anak ke ibu by NIK, skip header', async () => {
  const repo = memoryRepo({
    ibu: [
      { _rowNumber: 1, NIK: 'NIK', Nama: 'Nama', Phone: 'Phone', Alamat: 'Alamat', CreatedAt: 'CreatedAt' },
      { _rowNumber: 2, NIK: 'A001', Nama: 'Siti', Phone: '08', Alamat: 'RT1', CreatedAt: 't1' },
    ],
    anak: [
      { _rowNumber: 1, NIK_Ibu: 'NIK_Ibu', Nama: 'Nama', DOB: 'DOB', Gender: 'Gender', Vaccines: 'Vaccines', CreatedAt: 'CreatedAt' },
      { _rowNumber: 2, NIK_Ibu: 'A001', Nama: 'Budi', DOB: '2026-01-01', Gender: 'L', Vaccines: '[{"id":"hb0","date":"2026-01-02"}]', CreatedAt: 't2' },
    ],
  })
  const data = await getData(repo)
  assert.equal(data.mothers.length, 1)
  assert.equal(data.mothers[0].name, 'Siti')
  assert.equal(data.mothers[0].nik, 'A001')
  assert.equal(data.mothers[0].children.length, 1)
  assert.equal(data.mothers[0].children[0].name, 'Budi')
  assert.deepEqual(data.mothers[0].children[0].vaccines, [{ id: 'hb0', date: '2026-01-02' }])
})

test('saveIbu: append jika NIK baru, update jika NIK ada', async () => {
  const repo = memoryRepo({ ibu: [], anak: [] })
  await saveIbu(repo, { nik: 'A001', name: 'Siti', phone: '08', alamat: 'RT1', createdAt: 't1' })
  await saveIbu(repo, { nik: 'A001', name: 'Siti R', phone: '09', alamat: 'RT2', createdAt: 't1' })
  const { ibu } = repo.dump()
  assert.equal(ibu.length, 1)
  assert.equal(ibu[0].Nama, 'Siti R')
  assert.equal(ibu[0].Phone, '09')
})

test('saveAnak: cari pakai originalName jika nama berubah', async () => {
  const repo = memoryRepo({
    ibu: [],
    anak: [{
      _rowNumber: 2, NIK_Ibu: 'A001', Nama: 'Budi', DOB: '2026-01-01', Gender: 'L',
      Vaccines: '[]', CreatedAt: 't2', UpdatedAt: '', _compositeKey: 'A001|Budi',
    }],
  })
  await saveAnak(repo, {
    nikIbu: 'A001', name: 'Budi Santoso', originalName: 'Budi',
    dob: '2026-01-01', gender: 'L', vaccines: [], createdAt: 't2',
  })
  const { anak } = repo.dump()
  assert.equal(anak.length, 1)
  assert.equal(anak[0].Nama, 'Budi Santoso')
  assert.equal(anak[0]._compositeKey, 'A001|Budi Santoso')
})

test('deleteAnak: hapus baris yang cocok, bukan header / bukan baris di atasnya', async () => {
  const repo = memoryRepo({
    ibu: [],
    anak: [
      { _rowNumber: 1, NIK_Ibu: 'NIK_Ibu', Nama: 'Nama' },
      { _rowNumber: 2, NIK_Ibu: 'A001', Nama: 'Andi' },
      { _rowNumber: 3, NIK_Ibu: 'A001', Nama: 'Budi' },
    ],
  })
  await deleteAnak(repo, { nikIbu: 'A001', name: 'Budi' })
  const { anak } = repo.dump()
  const names = anak.filter((r) => r.NIK_Ibu !== 'NIK_Ibu').map((r) => r.Nama)
  assert.deepEqual(names, ['Andi'])
})

test('deleteIbu: hapus anak dari row terbesar dulu, lalu ibu; 404 jika NIK tidak ada', async () => {
  const deleted = []
  const repo = memoryRepo({
    ibu: [{ _rowNumber: 2, NIK: 'A001', Nama: 'Siti' }],
    anak: [
      { _rowNumber: 2, NIK_Ibu: 'A001', Nama: 'Andi' },
      { _rowNumber: 5, NIK_Ibu: 'A001', Nama: 'Budi' },
      { _rowNumber: 4, NIK_Ibu: 'Z999', Nama: 'Citra' },
    ],
  })
  const origDeleteAnak = repo.deleteAnakRow.bind(repo)
  repo.deleteAnakRow = async (n) => { deleted.push(n); return origDeleteAnak(n) }
  await deleteIbu(repo, { nik: 'A001' })
  assert.deepEqual(deleted, [5, 2])
  const dump = repo.dump()
  assert.equal(dump.ibu.length, 0)
  assert.equal(dump.anak.length, 1)
  assert.equal(dump.anak[0].Nama, 'Citra')
  await assert.rejects(() => deleteIbu(repo, { nik: 'NOPE' }), (e) => e.status === 404)
})
