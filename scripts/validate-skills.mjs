#!/usr/bin/env node
/**
 * Validate skills SKILL.md frontmatter against Agent Skills basics.
 *
 * Usage:
 *   node scripts/validate-skills.mjs
 */
import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { fail, printJson, printStatus, repoRoot } from './lib/io.mjs'

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end < 0) return null
  const block = text.slice(4, end).trim()
  const data = {}
  let currentKey = null
  let multiline = false
  let multiBuf = []
  let indent = null

  const flush = () => {
    if (currentKey && multiline) {
      data[currentKey] = multiBuf.join(' ').replace(/\s+/g, ' ').trim()
    }
    currentKey = null
    multiline = false
    multiBuf = []
    indent = null
  }

  for (const line of block.split('\n')) {
    if (multiline) {
      if (indent === null && line.trim() !== '') {
        const mIndent = line.match(/^(\s+)/)
        indent = mIndent ? mIndent[1].length : 0
      }
      const isNewKey = /^[A-Za-z0-9_-]+:\s*/.test(line) && !/^\s/.test(line)
      if (isNewKey) {
        flush()
      } else {
        multiBuf.push(line.trim())
        continue
      }
    }

    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!m) {
      // nested metadata key under indent — capture flat if simple
      const nested = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/)
      if (nested) {
        const [, nk, nv] = nested
        if (nk === 'spec_section' || nk === 'version' || nk === 'category' || nk === 'author' || nk === 'spec') {
          data[nk] = nv.replace(/^["']|["']$/g, '').trim()
        }
      }
      continue
    }
    const [, key, raw] = m
    if (/^[>|][+-]?$/.test(raw.trim())) {
      currentKey = key
      multiline = true
      multiBuf = []
      indent = null
    } else {
      data[key] = raw.replace(/^["']|["']$/g, '').trim()
    }
  }
  flush()
  return data
}

async function main() {
  const root = repoRoot()
  const skillsDir = path.join(root, 'skills')
  const entries = await readdir(skillsDir, { withFileTypes: true })
  const problems = []
  const skills = []

  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const name = ent.name
    const skillMd = path.join(skillsDir, name, 'SKILL.md')
    let text
    try {
      text = await readFile(skillMd, 'utf8')
    } catch {
      problems.push({ skill: name, error: '缺少 SKILL.md' })
      continue
    }
    const fm = parseFrontmatter(text)
    if (!fm) {
      problems.push({ skill: name, error: '无法解析 YAML frontmatter' })
      continue
    }
    const localProblems = []
    if (!fm.name) localProblems.push('缺少 name')
    if (!fm.description) localProblems.push('缺少 description')
    if (fm.name && fm.name !== name) localProblems.push(`name "${fm.name}" 与目录名不一致`)
    if (fm.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.name)) localProblems.push('name 须为 kebab-case')
    if (fm.description && fm.description.length > 1024) localProblems.push('description 超过 1024 字符')
    if (localProblems.length) problems.push({ skill: name, error: localProblems.join('; ') })
    skills.push({
      name: fm.name || name,
      description: fm.description || '',
      spec_section: fm.spec_section || null,
      hasScripts: false,
    })
  }

  // annotate scripts
  for (const s of skills) {
    try {
      const scripts = await readdir(path.join(skillsDir, s.name, 'scripts'))
      s.hasScripts = scripts.some((f) => f.endsWith('.mjs') || f.endsWith('.sh') || f.endsWith('.py'))
      s.scripts = scripts
    } catch {
      s.scripts = []
    }
  }

  const ok = problems.length === 0
  printStatus(`validate-skills: ${skills.length} skills, ${problems.length} problems`)
  printJson({ ok, count: skills.length, skills, problems })
  process.exitCode = ok ? 0 : 2
}

main().catch((err) => fail(err.message, { stack: err.stack }))
