export function attachRowNumbers(values) {
  return values.map((row, i) => ({ ...row, _rowNumber: i + 1 }))
}

export function isIbuDataRow(row) {
  const nik = String(row?.NIK ?? '').trim()
  return nik !== '' && nik !== 'NIK'
}

export function isAnakDataRow(row) {
  const nikIbu = String(row?.NIK_Ibu ?? '').trim()
  return nikIbu !== '' && nikIbu !== 'NIK_Ibu'
}

export function objectsFromTable(headerAndRows) {
  if (!headerAndRows.length) return []
  const headers = headerAndRows[0].map((h) => String(h ?? '').trim())
  const body = headerAndRows.slice(1)
  const objs = body.map((line) => {
    const o = {}
    headers.forEach((h, i) => { o[h] = line[i] ?? '' })
    return o
  })
  return attachRowNumbers([
    Object.fromEntries(headers.map((h) => [h, h])),
    ...objs,
  ])
}
