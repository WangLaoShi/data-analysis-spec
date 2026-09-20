import { mkdir, copyFile, access, writeFile, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function repoRoot() {
  return path.resolve(__dirname, '../..')
}

export function todayStamp(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export async function exists(p) {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function ensureDir(p) {
  await mkdir(p, { recursive: true })
}

export async function copyIfExists(src, dest) {
  if (!(await exists(src))) return false
  await ensureDir(path.dirname(dest))
  await copyFile(src, dest)
  return true
}

export async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath))
  await writeFile(filePath, content, 'utf8')
}

export function printStatus(msg) {
  process.stderr.write(`${msg}\n`)
}

export function printJson(obj) {
  process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`)
}

export function fail(message, extra = {}) {
  printJson({ ok: false, error: message, ...extra })
  process.exitCode = 1
}

export const DELIVERABLE_DIRS = [
  '00_raw',
  '01_structured',
  '02_cleaned',
  '03_metrics',
  '04_charts',
  '05_report',
  '06_dictionary_and_logs',
]

export const TEMPLATE_MAP = [
  ['00-intake-checklist.md', '00_raw/00-intake-checklist.md'],
  ['01-meta-intake.md', '00_raw/01-meta-intake.md'],
  ['02-field-mapping.md', '01_structured/02-field-mapping.md'],
  ['03-cleaning-log.md', '02_cleaned/03-cleaning-log.md'],
  ['04-analysis-outline.md', '03_metrics/04-analysis-outline.md'],
  ['05-metric-dictionary.md', '03_metrics/05-metric-dictionary.md'],
  ['06-chart-inventory.md', '04_charts/06-chart-inventory.md'],
  ['07-conclusion-cards.md', '05_report/07-conclusion-cards.md'],
  ['08-recommendation-cards.md', '05_report/08-recommendation-cards.md'],
  ['09-report-outline.md', '05_report/09-report-outline.md'],
  ['10-delivery-checklist.md', '06_dictionary_and_logs/10-delivery-checklist.md'],
]

export async function listFilesRecursive(dir) {
  const out = []
  if (!(await exists(dir))) return out
  const entries = await readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...(await listFilesRecursive(full)))
    else out.push(full)
  }
  return out
}
