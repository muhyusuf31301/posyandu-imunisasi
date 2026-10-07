import { loadEnv } from '../../server/lib/env.js'
import { createSheetsRepo } from '../../server/lib/sheets.js'
import * as posyandu from '../../server/lib/posyandu.js'

let repo

function getRepo() {
  if (!repo) repo = createSheetsRepo(loadEnv())
  return repo
}

export function endpoint(fnName) {
  return async function handler(req, res) {
    try {
      if (req.method === 'OPTIONS') {
        res.status(204).end()
        return
      }
      const result = await posyandu[fnName](getRepo(), req.body)
      res.status(200).json(result)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'internal error' })
    }
  }
}

export function getEndpoint() {
  return async function handler(req, res) {
    try {
      if (req.method === 'OPTIONS') { res.status(204).end(); return }
      const result = await posyandu.getData(getRepo())
      res.status(200).json(result)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'internal error' })
    }
  }
}
