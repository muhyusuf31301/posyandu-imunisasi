import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attachRowNumbers, isIbuDataRow, isAnakDataRow } from './rows.js'

test('attachRowNumbers: index 0 = sheet row 1 (header)', () => {
  const rows = attachRowNumbers([
    { NIK: 'NIK', Nama: 'Nama' },
    { NIK: 'A001', Nama: 'Siti' },
  ])
  assert.equal(rows[0]._rowNumber, 1)
  assert.equal(rows[1]._rowNumber, 2)
})

test('isIbuDataRow: tolak header dan NIK kosong', () => {
  assert.equal(isIbuDataRow({ NIK: 'NIK', Nama: 'Nama' }), false)
  assert.equal(isIbuDataRow({ NIK: '', Nama: 'Siti' }), false)
  assert.equal(isIbuDataRow({ NIK: '   ', Nama: 'Siti' }), false)
  assert.equal(isIbuDataRow({ NIK: 'A001', Nama: 'Siti' }), true)
})

test('isAnakDataRow: tolak header NIK_Ibu', () => {
  assert.equal(isAnakDataRow({ NIK_Ibu: 'NIK_Ibu', Nama: 'Nama' }), false)
  assert.equal(isAnakDataRow({ NIK_Ibu: '', Nama: 'Budi' }), false)
  assert.equal(isAnakDataRow({ NIK_Ibu: 'A001', Nama: 'Budi' }), true)
})
