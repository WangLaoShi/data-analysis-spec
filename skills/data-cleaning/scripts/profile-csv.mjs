#!/usr/bin/env node
import { access } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = 'profile-csv.mjs'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function resolve(scriptName) {
  const candidates = []
  if (process.env.DATA_ANALYSIS_SPEC_ROOT) {
    candidates.push(path.join(process.env.DATA_ANALYSIS_SPEC_ROOT, 'scripts', scriptName))
  }
  candidates.push(path.resolve(__dirname, '../../../scripts', scriptName))
  candidates.push(path.resolve(process.cwd(), 'scripts', scriptName))
  let dir = __dirname
  for (let i = 0; i < 10; i++) {
    candidates.push(path.join(dir, 'scripts', scriptName))
    dir = path.dirname(dir)
  }
  for (const p of candidates) {
    try {
      await access(p)
      return p
    } catch {
      /* next */
    }
  }
  return null
}

const script = await resolve(SCRIPT)
if (!script) {
  console.error(`[data-analysis-spec] 找不到 scripts/${SCRIPT}。请在仓库根目录运行，或设置 DATA_ANALYSIS_SPEC_ROOT。`)
  process.exit(1)
}
const child = spawn(process.execPath, [script, ...process.argv.slice(2)], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))
