#!/usr/bin/env node
/**
 * Profile CSV for cleaning: missing rates, duplicates, basic numeric extremes.
 *
 * Usage:
 *   node scripts/profile-csv.mjs --file data.csv [--keys id,订单ID] [--max-rows 100000] [--out report.json]
 */
import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { duplicateStats, isBlank, missingRates, readCsv } from './lib/csv.mjs'
import { fail, printJson, printStatus } from './lib/io.mjs'

function parseArgs(argv) {
  const args = { file: null, keys: [], maxRows: 100_000, out: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file') args.file = argv[++i]
    else if (a === '--keys') args.keys = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '--max-rows') args.maxRows = Number(argv[++i])
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

function numericProfile(headers, rows) {
  const out = []
  for (const h of headers) {
    const nums = []
    let nonNumeric = 0
    for (const r of rows) {
      const raw = String(r[h] ?? '').trim().replace(/,/g, '')
      if (raw === '') continue
      const n = Number(raw)
      if (Number.isFinite(n)) nums.push(n)
      else nonNumeric++
    }
    if (nums.length < Math.max(5, rows.length * 0.5)) continue
    nums.sort((a, b) => a - b)
    const q = (p) => nums[Math.min(nums.length - 1, Math.floor(p * (nums.length - 1)))]
    out.push({
      field: h,
      count: nums.length,
      nonNumeric,
      min: nums[0],
      p25: q(0.25),
      median: q(0.5),
      p75: q(0.75),
      max: nums[nums.length - 1],
      zeros: nums.filter((n) => n === 0).length,
      negatives: nums.filter((n) => n < 0).length,
    })
  }
  return out
}

function futureDateFlags(headers, rows, today = new Date()) {
  const flags = []
  const todayTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  for (const h of headers) {
    if (!/日期|时间|date|time|日/i.test(h)) continue
    let future = 0
    let parsed = 0
    for (const r of rows) {
      const s = String(r[h] ?? '').trim()
      if (!s) continue
      const d = new Date(s.replace(/\./g, '-').replace(/\//g, '-'))
      if (Number.isNaN(d.getTime())) continue
      parsed++
      if (d.getTime() > todayTime + 86400000) future++
    }
    if (parsed && future) flags.push({ field: h, futureCount: future, parsed })
  }
  return flags
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.file) {
    printStatus('Usage: node scripts/profile-csv.mjs --file <csv> [--keys k1,k2] [--out report.json]')
    if (!args.file) process.exitCode = args.help ? 0 : 1
    return
  }

  const filePath = path.resolve(args.file)
  printStatus(`profile-csv: ${filePath}`)
  const csv = await readCsv(filePath, { maxRows: args.maxRows })

  const report = {
    ok: true,
    file: filePath,
    headers: csv.headers,
    profiledRows: csv.rows.length,
    totalLinesApprox: csv.lineCount,
    truncated: csv.truncated,
    delimiter: csv.delimiter,
    encodingNote: csv.encodingNote,
    missing: missingRates(csv.headers, csv.rows),
    duplicates: duplicateStats(csv.rows, args.keys),
    numeric: numericProfile(csv.headers, csv.rows),
    futureDates: futureDateFlags(csv.headers, csv.rows),
    blankRowCount: csv.rows.filter((r) => csv.headers.every((h) => isBlank(r[h]))).length,
  }

  if (args.out) {
    await writeFile(path.resolve(args.out), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    printStatus(`已写入 ${args.out}`)
  }

  printJson(report)
}

main().catch((err) => fail(err.message, { stack: err.stack }))
