#!/usr/bin/env node
// postbuild: render public/sw.js with this build's BUILD_ID and a complete precache list (C2, C3).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const STATIC_EXTRA = ['/shell', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

export function listStatic(nextDir) {
  const out = []
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p, `${rel}/${e.name}`)
      else if (!e.name.endsWith('.map')) out.push(`/_next/static${rel}/${e.name}`)
    }
  }
  walk(path.join(nextDir, 'static'), '')
  return out.sort()
}

export function renderSw({ buildId, precache, template }) {
  return template.replace('__BUILD_ID__', buildId).replace('__PRECACHE__', JSON.stringify(precache))
}

export function build(nextDir = path.join(root, '.next')) {
  const buildId = fs.readFileSync(path.join(nextDir, 'BUILD_ID'), 'utf8').trim()
  const shellHtml = path.join(nextDir, 'server/app/shell.html')
  if (!fs.existsSync(shellHtml)) throw new Error(`shell not prerendered: ${shellHtml}`)
  const precache = [...STATIC_EXTRA, ...listStatic(nextDir)]
  const html = fs.readFileSync(shellHtml, 'utf8')
  // Vercel/Next append ?dpl=<deployment> to asset URLs (skew protection); the SW matches ignoring the query.
  const referenced = [...new Set((html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []).map((u) => u.split('?')[0]))]
  const missing = referenced.filter((u) => !precache.includes(u))
  if (missing.length) throw new Error(`shell references assets missing from precache: ${missing.join(', ')}`)
  const template = fs.readFileSync(path.join(root, 'scripts/sw/sw.template.js'), 'utf8')
  fs.writeFileSync(path.join(root, 'public/sw.js'), renderSw({ buildId, precache, template }))
  return { buildId, count: precache.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { buildId, count } = build()
  console.log(`sw.js: build ${buildId}, ${count} precache entries`)
}
