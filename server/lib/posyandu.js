import { isIbuDataRow, isAnakDataRow } from './rows.js'

function httpError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

function parseVaccines(raw) {
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw || '[]') } catch { return [] }
}

function compositeKey(nikIbu, name) {
  return `${String(nikIbu).trim()}|${String(name).trim()}`
}

export async function getData(repo) {
  const [ibuRows, anakRows] = await Promise.all([repo.readIbu(), repo.readAnak()])
  const ibus = ibuRows.filter(isIbuDataRow)
  const anaks = anakRows.filter(isAnakDataRow)
  const mothers = ibus.map((ibu) => {
    const children = anaks
      .filter((a) => String(a.NIK_Ibu).trim() === String(ibu.NIK).trim())
      .map((a) => ({
        name: a.Nama || '',
        dob: a.DOB || '',
        gender: a.Gender || 'P',
        vaccines: parseVaccines(a.Vaccines),
        createdAt: a.CreatedAt || '',
      }))
    return {
      name: ibu.Nama || '',
      nik: String(ibu.NIK || ''),
      phone: ibu.Phone || '',
      alamat: ibu.Alamat || '',
      createdAt: ibu.CreatedAt || '',
      children,
    }
  })
  return { mothers }
}

export async function saveIbu(repo, body) {
  const nik = String(body?.nik || '').trim()
  if (!nik) throw httpError(400, 'nik wajib')
  const row = {
    NIK: nik,
    Nama: body.name || '',
    Phone: body.phone || '',
    Alamat: body.alamat || '',
    CreatedAt: body.createdAt || new Date().toISOString(),
  }
  const existing = (await repo.readIbu()).filter(isIbuDataRow)
    .find((r) => String(r.NIK).trim() === nik)
  if (existing) {
    await repo.updateIbu(existing._rowNumber, { ...existing, ...row, CreatedAt: existing.CreatedAt || row.CreatedAt })
    return { success: true, mode: 'update' }
  }
  await repo.appendIbu(row)
  return { success: true, mode: 'append' }
}

export async function saveAnak(repo, body) {
  const nikIbu = String(body?.nikIbu || '').trim()
  const name = String(body?.name || '').trim()
  if (!nikIbu || !name) throw httpError(400, 'nikIbu dan name wajib')
  const searchName = String(body.originalName || body.name).trim()
  const vac = JSON.stringify(body.vaccines || [])
  const row = {
    NIK_Ibu: nikIbu,
    Nama: name,
    DOB: body.dob || '',
    Gender: body.gender || 'P',
    Vaccines: vac,
    CreatedAt: body.createdAt || new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    _compositeKey: compositeKey(nikIbu, name),
  }
  const existing = (await repo.readAnak()).filter(isAnakDataRow).find((r) =>
    String(r.NIK_Ibu).trim() === nikIbu && String(r.Nama).trim() === searchName
  )
  if (existing) {
    await repo.updateAnak(existing._rowNumber, { ...existing, ...row, CreatedAt: existing.CreatedAt || row.CreatedAt })
    return { success: true, mode: 'update' }
  }
  await repo.appendAnak(row)
  return { success: true, mode: 'append' }
}

export async function deleteAnak(repo, body) {
  const nikIbu = String(body?.nikIbu || '').trim()
  const name = String(body?.name || '').trim()
  const match = (await repo.readAnak()).filter(isAnakDataRow).find((r) =>
    String(r.NIK_Ibu).trim() === nikIbu && String(r.Nama).trim() === name
  )
  if (!match) throw httpError(404, `Anak tidak ditemukan: ${name}`)
  await repo.deleteAnakRow(match._rowNumber)
  return { success: true }
}

export async function deleteIbu(repo, body) {
  const nik = String(body?.nik || '').trim()
  const ibuRows = (await repo.readIbu()).filter(isIbuDataRow)
  const ibuMatch = ibuRows.find((r) => String(r.NIK).trim() === nik)
  if (!ibuMatch) throw httpError(404, `NIK tidak ditemukan: ${nik}`)
  const anakMatches = (await repo.readAnak()).filter(isAnakDataRow)
    .filter((r) => String(r.NIK_Ibu).trim() === nik)
    .sort((a, b) => b._rowNumber - a._rowNumber)
  for (const a of anakMatches) {
    await repo.deleteAnakRow(a._rowNumber)
  }
  await repo.deleteIbuRow(ibuMatch._rowNumber)
  return { success: true }
}
