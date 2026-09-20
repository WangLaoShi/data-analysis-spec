#!/usr/bin/env node
/**
 * Scaffold Spec §9 deliverables directory and copy templates.
 *
 * Usage:
 *   node scripts/scaffold-deliverables.mjs [--out DIR] [--date YYYYMMDD] [--force]
 *
 * stdout: JSON { ok, root, created }
 */
import path from 'node:path'
import {
  DELIVERABLE_DIRS,
  TEMPLATE_MAP,
  copyIfExists,
  ensureDir,
  exists,
  fail,
  printJson,
  printStatus,
  repoRoot,
  todayStamp,
  writeText,
} from './lib/io.mjs'

function parseArgs(argv) {
  const args = { out: null, date: todayStamp(), force: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') args.out = argv[++i]
    else if (a === '--date') args.date = argv[++i]
    else if (a === '--force') args.force = true
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printStatus(`Usage: node scripts/scaffold-deliverables.mjs [--out DIR] [--date YYYYMMDD] [--force]`)
    process.exit(0)
  }

  const root = repoRoot()
  const outRoot = path.resolve(args.out || path.join(process.cwd(), `deliverables_${args.date}`))

  if ((await exists(outRoot)) && !args.force) {
    // allow if empty-ish; block only when README already present without --force
  }

  if ((await exists(path.join(outRoot, 'README.md'))) && !args.force) {
    fail('目标已存在 README.md，使用 --force 覆盖说明文件', { root: outRoot })
    return
  }

  const created = []
  for (const d of DELIVERABLE_DIRS) {
    const p = path.join(outRoot, d)
    await ensureDir(p)
    created.push(d)
  }

  const templatesDir = path.join(root, 'docs', 'templates')
  const copied = []
  for (const [srcName, destRel] of TEMPLATE_MAP) {
    const src = path.join(templatesDir, srcName)
    const dest = path.join(outRoot, destRel)
    if (await copyIfExists(src, dest)) copied.push(destRel)
  }

  const readme = `# 交付包 deliverables_${args.date}

按 data-analysis-spec V1.1 §9 生成。

## 目录

${DELIVERABLE_DIRS.map((d) => `- \`${d}/\``).join('\n')}

## 下一步

1. 将原始备份放入 \`00_raw/\`，填写 \`01-meta-intake.md\`
2. \`npm run intake -- --file <csv> --required-fields ...\`
3. 清洗后更新 \`02_cleaned/03-cleaning-log.md\`
4. 收尾运行 \`npm run validate:delivery -- --dir ${path.basename(outRoot)}\`
`

  await writeText(path.join(outRoot, 'README.md'), readme)
  created.push('README.md')

  printStatus(`已创建交付包: ${outRoot}`)
  printJson({ ok: true, root: outRoot, dirs: created, templatesCopied: copied })
}

main().catch((err) => {
  fail(err.message, { stack: err.stack })
})
