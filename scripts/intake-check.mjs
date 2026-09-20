#!/usr/bin/env node
/**
 * Spec 5.1 intake check for a tabular file (CSV focus).
 *
 * Usage:
 *   node scripts/intake-check.mjs --file data.csv \
 *     [--required-fields a,b,c] [--period-start YYYY-MM-DD] [--period-end YYYY-MM-DD] \
 *     [--date-field 下单日期] [--max-rows 100000]
 *
 * stdout: JSON report { ok, blocking[], warnings[], meta, columns }
 */
import path from 'node:path'
import { countCsvDataRows, fileMeta, readCsv } from './lib/csv.mjs'
import { fail, printJson, printStatus } from './lib/io.mjs'

function parseArgs(argv) {
  const args = {
    file: null,
    requiredFields: [],
    periodStart: null,
    periodEnd: null,
    dateField: null,
    maxRows: 100_000,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file') args.file = argv[++i]
    else if (a === '--required-fields') args.requiredFields = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '--period-start') args.periodStart = argv[++i]
    else if (a === '--period-end') args.periodEnd = argv[++i]
    else if (a === '--date-field') args.dateField = argv[++i]
    else if (a === '--max-rows') args.maxRows = Number(argv[++i])
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

function parseDate(v) {
  const s = String(v).trim()
  if (!s) return null
  // Excel serial (rough)
  if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 20000 && Number(s) < 60000) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    return new Date(excelEpoch + Number(s) * 86400000)
  }
  const d = new Date(s.replace(/\./g, '-').replace(/\//g, '-'))
  return Number.isNaN(d.getTime()) ? null : d
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.file) {
    printStatus(`Usage: node scripts/intake-check.mjs --file <csv> [--required-fields a,b] [--date-field col] [--period-start YYYY-MM-DD] [--period-end YYYY-MM-DD]`)
    if (!args.file) process.exitCode = args.help ? 0 : 1
    return
  }

  const filePath = path.resolve(args.file)
  printStatus(`intake-check: ${filePath}`)

  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.xlsx' || ext === '.xls') {
    fail('暂不直接解析 Excel，请先导出 CSV 后再校验', { file: filePath })
    return
  }

  const meta = await fileMeta(filePath)
  const csv = await readCsv(filePath, { maxRows: args.maxRows })
  const totalRows = csv.truncated ? await countCsvDataRows(filePath) : csv.lineCount

  const blocking = []
  const warnings = []

  if (csv.headers.length === 0) blocking.push('表头为空或文件无法解析为 CSV')
  if (totalRows === 0) blocking.push('数据行为 0')

  const headerSet = new Set(csv.headers)
  const missingFields = args.requiredFields.filter((f) => !headerSet.has(f))
  if (missingFields.length) blocking.push(`缺少必需字段: ${missingFields.join(', ')}`)

  // suspicious encoding / replacement chars
  const sample = csv.headers.join(',') + csv.rows.slice(0, 20).map((r) => Object.values(r).join(',')).join('')
  if (sample.includes('\uFFFD')) warnings.push('检测到替换字符 U+FFFD，可能存在乱码')

  let dateCoverage = null
  if (args.dateField) {
    if (!headerSet.has(args.dateField)) {
      blocking.push(`日期字段不存在: ${args.dateField}`)
    } else {
      const dates = csv.rows.map((r) => parseDate(r[args.dateField])).filter(Boolean)
      if (!dates.length) warnings.push(`日期字段 ${args.dateField} 无法解析出有效日期（抽样 ${csv.rows.length} 行）`)
      else {
        const min = new Date(Math.min(...dates.map((d) => d.getTime())))
        const max = new Date(Math.max(...dates.map((d) => d.getTime())))
        dateCoverage = { min: min.toISOString().slice(0, 10), max: max.toISOString().slice(0, 10), parsedRows: dates.length }
        if (args.periodStart && min < new Date(args.periodStart)) {
          warnings.push(`最早日期 ${dateCoverage.min} 早于需求开始 ${args.periodStart}`)
        }
        if (args.periodEnd && max > new Date(args.periodEnd)) {
          warnings.push(`最晚日期 ${dateCoverage.max} 晚于需求结束 ${args.periodEnd}`)
        }
        if (args.periodStart && max < new Date(args.periodStart)) {
          blocking.push(`数据日期整体早于需求周期开始 ${args.periodStart}`)
        }
        if (args.periodEnd && min > new Date(args.periodEnd)) {
          blocking.push(`数据日期整体晚于需求周期结束 ${args.periodEnd}`)
        }
      }
    }
  }

  const ok = blocking.length === 0
  const report = {
    ok,
    verdict: ok ? (warnings.length ? 'pass_with_warnings' : 'pass') : 'block',
    blocking,
    warnings,
    meta: {
      ...meta,
      encodingNote: csv.encodingNote,
      delimiter: csv.delimiter,
      headerCount: csv.headers.length,
      dataRows: totalRows,
      profiledRows: csv.rows.length,
      truncated: csv.truncated,
    },
    columns: csv.headers,
    dateCoverage,
    suggestedBackupName: `原始数据_未处理_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${ext || '.csv'}`,
  }

  printJson(report)
  process.exitCode = ok ? 0 : 2
}

main().catch((err) => fail(err.message, { stack: err.stack }))
