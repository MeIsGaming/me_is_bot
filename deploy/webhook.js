#!/usr/bin/env node
// Minimal webhook receiver — runs on the Hetzner server.
// GitHub sends a POST to http://<server>:9001/hook on push to main.
// This script pulls the repo, rebuilds, and restarts the bot via pm2.
//
// Usage: WEBHOOK_SECRET=yourSecret pm2 start deploy/webhook.js --name meisbot-webhook
//
// GitHub Webhook config:
//   Payload URL: http://78.46.91.137:9001/hook
//   Content type: application/json
//   Secret: same value as WEBHOOK_SECRET env var
//   Events: Just the push event

import http from 'http'
import crypto from 'crypto'
import { execSync } from 'child_process'

const PORT           = 9001
const REPO_PATH      = '/home/ashley/meisbot'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? ''

function verify(req, body) {
  if (!WEBHOOK_SECRET) return true
  const sig      = req.headers['x-hub-signature-256'] ?? ''
  const expected = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

function deploy() {
  execSync('git pull origin main',  { cwd: REPO_PATH, stdio: 'inherit' })
  execSync('npm install',           { cwd: REPO_PATH, stdio: 'inherit' })
  execSync('npm run build',         { cwd: REPO_PATH, stdio: 'inherit' })
  execSync('pm2 restart meisbot',   { cwd: REPO_PATH, stdio: 'inherit' })
  console.log('[webhook] deploy done', new Date().toISOString())
}

http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/hook') {
    res.writeHead(404).end()
    return
  }

  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks)

    if (!verify(req, body)) {
      console.warn('[webhook] invalid signature')
      res.writeHead(403).end()
      return
    }

    const payload = JSON.parse(body.toString())
    if (payload.ref !== 'refs/heads/main') {
      res.writeHead(200).end('ignored')
      return
    }

    res.writeHead(200).end('deploying')
    try {
      deploy()
    } catch (e) {
      console.error('[webhook] deploy failed', e)
    }
  })
}).listen(PORT, () => console.log(`[webhook] listening on :${PORT}`))
