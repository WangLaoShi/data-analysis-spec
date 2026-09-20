#!/usr/bin/env node
/**
 * Lightweight check for metric dictionary markdown (Spec 5.6 template).
 *
 * Usage:
 *   node scripts/check-metric-dictionary.mjs --file docs/templates/05-metric-dictionary.md
 *
 * Expects a markdown table with header containing 指标名 / 公式 (flexible).
 */
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fail, printJson, printStatus } from './lib/io.mjs'

function parseArgs(argv) {
  const args = { file: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file') args.file = argv[++i]
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

function extractTables(md) {
  const lines = md.split(/\r\n|\n|\r/)
  const tables = []
  let buf = []
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      buf.push(line)
    } else if (buf.length) {
      tables.push(buf)
      buf = []
    }
  }
  if (buf.length) tables.push(buf)
  return tables
}

function parseTable(lines) {
  const rows = lines
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim()),
    )
    .filter((cells) => !cells.every((c) => /^:?-{1,}:?$/.test(c)))
  if (rows.length < 2) return null
  const headers = rows[0]
  const body = rows.slice(1)
  return { headers, body }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.file) {
    printStatus('Usage: node scripts/check-metric-dictionary.mjs --file <metric-dictionary.md>')
    if (!args.file) process.exitCode = args.help ? 0 : 1
    return
  }

  const filePath = path.resolve(args.file)
  const md = await readFile(filePath, 'utf8')
  const tables = extractTables(md).map(parseTable).filter(Boolean)

  const warnings = []
  const blocking = []

  const metricTable = tables.find((t) => t.headers.some((h) => /指标/.test(h)))
  if (!metricTable) {
    blocking.push('未找到含「指标」列的 Markdown 表格')
  } else {
    const idxName = metricTable.headers.findIndex((h) => /指标名|指标/.test(h))
    const idxFormula = metricTable.headers.findIndex((h) => /公式|口径/.test(h))
    if (idxName < 0) blocking.push('缺少指标名列')
    if (idxFormula < 0) warnings.push('未检测到公式/口径列')

    const filled = metricTable.body.filter((r) => r[idxName] && r[idxName] !== '' && !r[idxName].includes('（'))
    if (filled.length === 0) warnings.push('指标表尚无填入的数据行（模板空表可忽略）')

    for (const row of filled) {
      if (idxFormula >= 0 && (!row[idxFormula] || row[idxFormula] === '')) {
        warnings.push(`指标「${row[idxName]}」缺少公式`)
      }
    }
  }

  const ok = blocking.length === 0
  printJson({
    ok,
    file: filePath,
    tableCount: tables.length,
    blocking,
    warnings,
  })
  process.exitCode = ok ? 0 : 2
}

main().catch((err) => fail(err.message, { stack: err.stack }))
