import 'dotenv/config'
import express from 'express'
import { loadEnv } from './lib/env.js'
import { createSheetsRepo } from './lib/sheets.js'
import { getData, saveIbu, saveAnak, deleteIbu, deleteAnak } from './lib/posyandu.js'

const env = loadEnv()
const repo = createSheetsRepo(env)
const app = express()
app.use(express.json({ limit: '1mb' }))

function send(res, promise) {
  promise.then((body) => res.json(body)).catch((err) => {
    const status = err.status || 500
    res.status(status).json({ error: err.message || 'internal error' })
  })
}

app.get('/api/posyandu/data', (_req, res) => send(res, getData(repo)))
app.post('/api/posyandu/ibu', (req, res) => send(res, saveIbu(repo, req.body)))
app.post('/api/posyandu/anak', (req, res) => send(res, saveAnak(repo, req.body)))
app.post('/api/posyandu/delete-ibu', (req, res) => send(res, deleteIbu(repo, req.body)))
app.post('/api/posyandu/delete-anak', (req, res) => send(res, deleteAnak(repo, req.body)))

app.listen(env.port, () => {
  console.log(`posyandu api http://127.0.0.1:${env.port}`)
})
