/**
 * Minimal CSV helpers (no deps). Status → stderr; structured results returned to callers.
 */
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'

export function sha256Buffer(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

export async function sha256File(filePath) {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath)
  for await (const chunk of stream) hash.update(chunk)
  return hash.digest('hex')
}

/** Parse one CSV line with basic quote support. */
export function parseCsvLine(line, delimiter = ',') {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export function detectDelimiter(headerLine) {
  const candidates = [',', '\t', ';', '|']
  let best = ','
  let bestCount = -1
  for (const d of candidates) {
    const count = parseCsvLine(headerLine, d).length
    if (count > bestCount) {
      bestCount = count
      best = d
    }
  }
  return best
}

/**
 * Read CSV into { headers, rows, delimiter, encodingNote }.
 * Soft limit protects memory; set maxRows = Infinity to load all.
 */
export async function readCsv(filePath, { maxRows = 100_000, delimiter } = {}) {
  const raw = await readFile(filePath)
  let text = raw.toString('utf8')
  let encodingNote = 'utf8'
  if (raw[0] === 0xff && raw[1] === 0xfe) {
    text = raw.toString('utf16le')
    encodingNote = 'utf16le'
  } else if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
    encodingNote = 'utf8-bom'
  }

  const lines = text.split(/\r\n|\n|\r/).filter((l, idx, arr) => !(idx === arr.length - 1 && l === ''))
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: ',', encodingNote, lineCount: 0, truncated: false }
  }

  const delim = delimiter ?? detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delim).map((h) => h.trim())
  const rows = []
  const dataLines = lines.slice(1)
  const limit = Math.min(dataLines.length, maxRows)
  for (let i = 0; i < limit; i++) {
    if (dataLines[i].trim() === '') continue
    const cells = parseCsvLine(dataLines[i], delim)
    const row = {}
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = cells[c] ?? ''
    }
    rows.push(row)
  }

  return {
    headers,
    rows,
    delimiter: delim,
    encodingNote,
    lineCount: dataLines.filter((l) => l.trim() !== '').length,
    truncated: dataLines.length > maxRows,
    byteSize: raw.length,
  }
}

/** Stream-count data rows without loading all into memory. */
export async function countCsvDataRows(filePath) {
  const rl = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }), crlfDelay: Infinity })
  let n = -1
  for await (const line of rl) {
    if (n < 0) {
      n = 0
      continue
    }
    if (line.trim() !== '') n++
  }
  return Math.max(0, n)
}

export async function fileMeta(filePath) {
  const st = await stat(filePath)
  const hash = await sha256File(filePath)
  return {
    path: filePath,
    size: st.size,
    mtime: st.mtime.toISOString(),
    sha256: hash,
  }
}

export function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === ''
}

export function missingRates(headers, rows) {
  const total = rows.length || 1
  return headers.map((h) => {
    const missing = rows.filter((r) => isBlank(r[h])).length
    return {
      field: h,
      missing,
      rate: Number((missing / total).toFixed(6)),
    }
  })
}

export function duplicateStats(rows, keyFields) {
  if (!keyFields?.length) return null
  const map = new Map()
  for (const row of rows) {
    const key = keyFields.map((k) => String(row[k] ?? '')).join('\u0001')
    map.set(key, (map.get(key) || 0) + 1)
  }
  let dupGroups = 0
  let dupRows = 0
  for (const c of map.values()) {
    if (c > 1) {
      dupGroups++
      dupRows += c
    }
  }
  return {
    keyFields,
    uniqueKeys: map.size,
    duplicateGroups: dupGroups,
    duplicateRows: dupRows,
    duplicateRowRate: rows.length ? Number((dupRows / rows.length).toFixed(6)) : 0,
  }
}
