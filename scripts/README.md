# scripts/

可复现工具集（Node ≥ 18，零第三方依赖）。状态信息写 **stderr**，机器可读结果写 **stdout JSON**（`render-cleaning-log` 在未指定 `--out` 时 stdout 为 Markdown）。

## 命令一览

| 命令 | 用途 | Spec |
|------|------|------|
| `scaffold-deliverables.mjs` | 创建 `deliverables_YYYYMMDD/` 并复制模板 | §9 / 5.12 |
| `backup-raw.mjs` | 原始文件只读备份 + `.sha256` | 5.1 |
| `intake-check.mjs` | CSV 接收校验（字段/行数/日期覆盖） | 5.1 |
| `profile-csv.mjs` | 缺失率、主键重复、数值极值、未来日期 | 5.3 / EDA |
| `render-cleaning-log.mjs` | 由 profile JSON 生成清洗日志草稿 | 5.3 |
| `check-metric-dictionary.mjs` | 检查口径字典 Markdown 表 | 5.6 |
| `validate-delivery.mjs` | 校验交付包目录与关键文件槽 | 5.12 |
| `validate-skills.mjs` | 校验仓库内全部 `SKILL.md` | 工程 |
| `list-skills.mjs` | 同 `validate-skills` | 工程 |

## npm scripts

在仓库根目录：

```bash
npm run scaffold -- --out ./deliverables_20260920
npm run backup -- --file ./raw.csv --out-dir ./deliverables_20260920/00_raw --source 销售
npm run intake -- --file ./raw.csv --required-fields 订单ID,实付金额 --date-field 下单日期
npm run profile -- --file ./raw.csv --keys 订单ID --out /tmp/profile.json
npm run cleaning-log -- --profile /tmp/profile.json --critical-fields 订单ID --out ./03-cleaning-log.md
npm run check:metrics -- --file ./docs/templates/05-metric-dictionary.md
npm run validate:delivery -- --dir ./deliverables_20260920
npm run validate:skills
```

## 推荐流水线

```bash
npm run scaffold -- --date 20260920
npm run backup -- --file data.csv --out-dir deliverables_20260920/00_raw
npm run intake -- --file data.csv --required-fields 订单ID,实付金额
npm run profile -- --file data.csv --keys 订单ID --out /tmp/profile.json
npm run cleaning-log -- --profile /tmp/profile.json --critical-fields 订单ID \
  --out deliverables_20260920/02_cleaned/03-cleaning-log.md
# … 分析完成后
npm run validate:delivery -- --dir deliverables_20260920 --strict
```

## Skill 内入口

以下 skill 提供同名包装脚本（自动定位仓库 `scripts/`；也可设 `DATA_ANALYSIS_SPEC_ROOT`）：

- `skills/data-intake/scripts/{intake-check,backup-raw}.mjs`
- `skills/data-cleaning/scripts/{profile-csv,render-cleaning-log}.mjs`
- `skills/metrics-calculation/scripts/check-metric-dictionary.mjs`
- `skills/delivery-archive/scripts/{scaffold-deliverables,validate-delivery}.mjs`
- `skills/data-analysis/scripts/{scaffold-deliverables,validate-skills}.mjs`
- `skills/exploratory-data-analysis/scripts/profile-csv.mjs`

代理示例：

```bash
node skills/data-cleaning/scripts/profile-csv.mjs --file data.csv --keys 订单ID
```

## 约定

- 不修改原始输入文件（备份用复制）
- Excel 请先导出 CSV 再跑 intake/profile（当前不解析 xlsx）
- 大文件用 `--max-rows` 控制内存；`intake-check` 会在截断时另行精确计数行数
