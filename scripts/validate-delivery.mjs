#!/usr/bin/env node
/**
 * Validate a deliverables_* package against Spec §9 / §5.12.
 *
 * Usage:
 *   node scripts/validate-delivery.mjs --dir deliverables_YYYYMMDD [--strict]
 *
 * Checks directory presence and non-empty critical slots (heuristic by filename patterns).
 */
import path from 'node:path'
import { DELIVERABLE_DIRS, exists, fail, listFilesRecursive, printJson, printStatus } from './lib/io.mjs'

function parseArgs(argv) {
  const args = { dir: null, strict: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dir') args.dir = argv[++i]
    else if (a === '--strict') args.strict = true
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

function matchAny(files, patterns) {
  return files.filter((f) => patterns.some((re) => re.test(f)))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.dir) {
    printStatus('Usage: node scripts/validate-delivery.mjs --dir <deliverables_DIR> [--strict]')
    if (!args.dir) process.exitCode = args.help ? 0 : 1
    return
  }

  const root = path.resolve(args.dir)
  printStatus(`validate-delivery: ${root}`)

  if (!(await exists(root))) {
    fail('目录不存在', { root })
    return
  }

  const missingDirs = []
  for (const d of DELIVERABLE_DIRS) {
    if (!(await exists(path.join(root, d)))) missingDirs.push(d)
  }

  const files = (await listFilesRecursive(root)).map((f) => path.relative(root, f))

  const checks = [
    {
      id: 'raw_backup',
      label: '原始未处理备份',
      files: matchAny(files, [/^00_raw\/.*原始数据_未处理/i, /^00_raw\/.*\.(csv|xlsx|xls|parquet)$/i]),
    },
    {
      id: 'meta_or_checklist',
      label: '元信息/开工清单',
      files: matchAny(files, [/^00_raw\/.*meta/i, /^00_raw\/.*intake/i, /^00_raw\/01-meta/i, /^00_raw\/00-intake/i]),
    },
    {
      id: 'cleaned_dataset',
      label: '清洗后数据集',
      files: matchAny(files, [/^02_cleaned\/.*\.(csv|xlsx|xls|parquet)$/i, /清洗完成/i]),
    },
    {
      id: 'cleaning_log',
      label: '清洗日志',
      files: matchAny(files, [/cleaning-log/i, /清洗日志/i, /^02_cleaned\/03-cleaning/i]),
    },
    {
      id: 'metrics_workbook',
      label: '指标/底稿',
      files: matchAny(files, [/^03_metrics\/.*\.(csv|xlsx|xls|md)$/i, /底稿/i, /metric/i, /口径/i]),
    },
    {
      id: 'charts',
      label: '图表原图',
      files: matchAny(files, [/^04_charts\/.*\.(png|svg|jpg|jpeg|pdf|webp)$/i]),
    },
    {
      id: 'report',
      label: '分析报告',
      files: matchAny(files, [/^05_report\/.*\.(md|docx|pdf)$/i, /报告/i]),
    },
    {
      id: 'dictionary_logs',
      label: '口径+日志归档',
      files: matchAny(files, [/^06_dictionary_and_logs\//i, /10-delivery/i]),
    },
  ]

  const results = checks.map((c) => ({
    id: c.id,
    label: c.label,
    ok: c.files.length > 0,
    files: c.files,
  }))

  const failed = results.filter((r) => !r.ok)
  const ok = missingDirs.length === 0 && (args.strict ? failed.length === 0 : failed.filter((f) => ['raw_backup', 'cleaned_dataset', 'report'].includes(f.id)).length === 0)

  const report = {
    ok,
    strict: args.strict,
    root,
    missingDirs,
    checks: results,
    fileCount: files.length,
    note: args.strict
      ? 'strict：全部槽位都需有匹配文件'
      : '默认：至少要求 raw_backup + cleaned_dataset + report；其它为警告',
  }

  printJson(report)
  process.exitCode = ok ? 0 : 2
}

main().catch((err) => fail(err.message, { stack: err.stack }))
