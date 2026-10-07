async function request(path, options) {
  const r = await fetch(path, options)
  const text = await r.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = { raw: text } }
  if (!r.ok) {
    const msg = (body && body.error) || r.statusText || 'request failed'
    throw new Error(msg)
  }
  return body
}

export const API = {
  getData: () => request('/api/posyandu/data'),
  saveIbu: (ibu) => request('/api/posyandu/ibu', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ibu),
  }),
  saveAnak: (anak) => request('/api/posyandu/anak', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(anak),
  }),
  deleteIbu: (nik) => request('/api/posyandu/delete-ibu', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nik }),
  }),
  deleteAnak: (nikIbu, name) => request('/api/posyandu/delete-anak', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nikIbu, name }),
  }),
}
