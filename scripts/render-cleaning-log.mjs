#!/usr/bin/env node
/**
 * Render a Spec 5.3 cleaning-log markdown draft from profile-csv JSON.
 *
 * Usage:
 *   node scripts/profile-csv.mjs --file data.csv --keys 订单ID --out /tmp/profile.json
 *   node scripts/render-cleaning-log.mjs --profile /tmp/profile.json [--out cleaning-log.md]
 */
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fail, printJson, printStatus, writeText } from './lib/io.mjs'

function parseArgs(argv) {
  const args = { profile: null, out: null, critical: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--profile') args.profile = argv[++i]
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--critical-fields') args.critical = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

function render(profile, criticalFields) {
  const crit = new Set(criticalFields)
  const missingRows = (profile.missing || [])
    .map((m) => `| ${m.field} | ${(m.rate * 100).toFixed(2)}% | ${crit.has(m.field) ? '是' : '否'} | ${crit.has(m.field) ? '剔行' : '标记[缺失]'} | ${m.missing} |`)
    .join('\n')

  const dup = profile.duplicates
  const dupSection = dup
    ? `| ${(dup.keyFields || []).join('+')} | ${dup.duplicateGroups} | ${dup.duplicateRows} | ${(dup.duplicateRowRate * 100).toFixed(2)}% | 最新一条（按 ___） | |`
    : '| （未指定 --keys） | | | | | |'

  const numericFlags = (profile.numeric || [])
    .filter((n) => n.zeros || n.negatives || n.max > n.p75 * 10)
    .map((n) => `| ${n.field} | min=${n.min}, max=${n.max}, zeros=${n.zeros}, negatives=${n.negatives} | 待确认 | 标记隔离 | |`)
    .join('\n')

  const future = (profile.futureDates || [])
    .map((f) => `| ${f.field} | 未来日期 ${f.futureCount}/${f.parsed} | 待确认 | 标记隔离 | |`)
    .join('\n')

  const anomaly = [numericFlags, future].filter(Boolean).join('\n') || '| | | | | |'

  return `# 清洗日志（由 profile 自动生成草稿）

**输入：** \`${profile.file}\`  
**画像行数：** ${profile.profiledRows}${profile.truncated ? '（已截断，需加大 --max-rows 复跑）' : ''}  
**分隔符 / 编码：** ${profile.delimiter} / ${profile.encodingNote}

> 本文件为草稿：规则与「最新一条」排序键须人工确认后再执行删除。

## 1. 缺失值

| 字段 | 缺失率 | 关键? | 处理 | 影响行数 |
|------|--------|-------|------|----------|
${missingRows || '| | | | | |'}

## 2. 重复值

| 主键 | 重复组数 | 重复行数 | 占比 | 保留规则 | 处理后行数 |
|------|----------|----------|------|----------|------------|
${dupSection}

## 3. 异常值（自动提示）

| 字段/规则 | 识别条件 | 条数 | 处理 | 隔离表路径 |
|-----------|----------|------|------|------------|
${anomaly}

## 4. 口径与映射

| 维度字段 | 原值示例 | 标准值 | 字典来源 | 未映射值处理 |
|----------|----------|--------|----------|--------------|
| | | | | |

## 5. 一致性校验

| 检查项 | 明细侧 | 汇总侧 | 差异 | 处理 |
|--------|--------|--------|------|------|
| 总和核对 | | | | |
| 层级逻辑 | | | | |

## 6. 行数流水

| 阶段 | 行数 |
|------|------|
| 画像抽样 | ${profile.profiledRows} |
| 结构化后 | |
| 去缺失后 | |
| 去重后 | |
| 剔异常后 | |
| 最终清洗集 | |

## 待业务确认

- [ ] 关键字段列表是否正确：${criticalFields.join(', ') || '（未指定 --critical-fields）'}
- [ ] 去重排序键
- [ ] 异常隔离 vs 剔除
`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.profile) {
    printStatus('Usage: node scripts/render-cleaning-log.mjs --profile profile.json [--critical-fields a,b] [--out cleaning-log.md]')
    if (!args.profile) process.exitCode = args.help ? 0 : 1
    return
  }

  const profile = JSON.parse(await readFile(path.resolve(args.profile), 'utf8'))
  const md = render(profile, args.critical)
  const out = args.out ? path.resolve(args.out) : null
  if (out) {
    await writeText(out, md)
    printStatus(`已写入 ${out}`)
  } else {
    process.stdout.write(md)
  }
  printJson({ ok: true, out, profiledRows: profile.profiledRows })
}

main().catch((err) => fail(err.message, { stack: err.stack }))
