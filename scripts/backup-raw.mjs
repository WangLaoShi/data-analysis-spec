#!/usr/bin/env node
/**
 * Backup raw file with Spec naming + sha256 sidecar.
 *
 * Usage:
 *   node scripts/backup-raw.mjs --file raw.csv [--out-dir DIR] [--source 销售明细] [--date YYYYMMDD]
 *
 * Does NOT modify the source file.
 */
import path from 'node:path'
import { copyFile } from 'node:fs/promises'
import { fileMeta } from './lib/csv.mjs'
import { ensureDir, fail, printJson, printStatus, todayStamp, writeText } from './lib/io.mjs'

function parseArgs(argv) {
  const args = { file: null, outDir: null, source: null, date: todayStamp() }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file') args.file = argv[++i]
    else if (a === '--out-dir') args.outDir = argv[++i]
    else if (a === '--source') args.source = argv[++i]
    else if (a === '--date') args.date = argv[++i]
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.file) {
    printStatus('Usage: node scripts/backup-raw.mjs --file <path> [--out-dir DIR] [--source TAG] [--date YYYYMMDD]')
    if (!args.file) process.exitCode = args.help ? 0 : 1
    return
  }

  const src = path.resolve(args.file)
  const ext = path.extname(src) || '.csv'
  const tag = args.source ? `_${args.source}` : ''
  const outDir = path.resolve(args.outDir || path.join(process.cwd(), '00_raw'))
  await ensureDir(outDir)

  const destName = `原始数据_未处理_${args.date}${tag}${ext}`
  const dest = path.join(outDir, destName)
  await copyFile(src, dest)

  const meta = await fileMeta(dest)
  const sidecar = `${dest}.sha256`
  await writeText(sidecar, `${meta.sha256}  ${destName}\n`)

  printStatus(`已备份: ${dest}`)
  printJson({
    ok: true,
    source: src,
    backup: dest,
    sha256File: sidecar,
    meta,
  })
}

main().catch((err) => fail(err.message, { stack: err.stack }))
