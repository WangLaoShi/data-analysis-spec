# data-analysis-spec

面向业务专题分析的 [Agent Skills](https://agentskills.io/) 合集。通过 `npx skills` 安装到 Cursor、Claude Code、Codex 等工具后，代理可按统一流程完成数据接收、清洗、指标计算、多维分析与报告归档。

- 分析规范：[docs/spec-data-analysis.md](./docs/spec-data-analysis.md)
- 过程模板：[docs/templates/](./docs/templates/)
- 流程示例：[docs/examples/walkthrough-q3-sales.md](./docs/examples/walkthrough-q3-sales.md)
- **课堂使用方法（含 Google Play 实跑）：** [使用方法.md](./使用方法.md)

## 安装

```bash
# 安装全部 skills
npx skills add WangLaoShi/data-analysis-spec

# 只装总控（会调度各阶段）
npx skills add WangLaoShi/data-analysis-spec --skill data-analysis

# 安装到用户全局目录
npx skills add WangLaoShi/data-analysis-spec -g
```

## Skills 一览

### 总控

| Skill | 对应章节 | 说明 |
|-------|----------|------|
| `data-analysis` | 全文 | 按序调度全流程并做验收 |

### 主流程（对应规范第 5 节）

| Skill | 章节 | 说明 |
|-------|------|------|
| `data-intake` | 5.1 | 接收、备份、校验、元信息 |
| `data-structuring` | 5.2 | 表头/类型规整、多表合并 |
| `data-cleaning` | 5.3 | 缺失/重复/异常/口径/一致性 |
| `derived-metrics` | 5.4 | 衍生维度与分层标签 |
| `analysis-decomposition` | 5.5 | 四向分析提纲 |
| `metrics-calculation` | 5.6 | 四类指标计算与校验 |
| `multidimensional-analysis` | 5.7 | 趋势/结构/对比/相关/二八/归因 |
| `data-visualization` | 5.8 | 选图与出图规范 |
| `insight-conclusion` | 5.9 | 三类结论卡 |
| `actionable-recommendations` | 5.10 | 可量化建议 |
| `analysis-report` | 5.11 | 九章报告结构 |
| `delivery-archive` | 5.12 | 交付包与验收勾选 |

### 补充

| Skill | 说明 |
|-------|------|
| `exploratory-data-analysis` | EDA 探索补充 |
| `statistical-analysis` | 假设检验 / 回归等推断补充 |

## 推荐工作流

```text
开工检查 → 接收 → 结构化 → 清洗 → 衍生
    → 目标拆解 → 指标 → 多维分析 → 可视化
    → 结论 → 建议 → 报告 → 归档验收
```

各阶段可用 `docs/templates/` 中的模板落盘，最终按规范中的交付目录打包。

## 仓库结构

```text
docs/
  spec-data-analysis.md      # 分析规范
  templates/                 # 过程与交付模板
  examples/
scripts/                     # 零依赖可复现工具
  lib/
  *.mjs
skills/
  data-analysis/             # 总控
  data-intake/ …             # 分阶段（部分含 scripts/）
```

## 脚本速用

```bash
npm run scaffold -- --date 20260920
npm run intake -- --file data.csv --required-fields 订单ID,实付金额
npm run profile -- --file data.csv --keys 订单ID --out /tmp/profile.json
npm run cleaning-log -- --profile /tmp/profile.json --critical-fields 订单ID --out log.md
npm run validate:delivery -- --dir deliverables_20260920
npm run validate:skills
```

完整说明见 [scripts/README.md](./scripts/README.md)。

## 本地开发

```bash
npx skills add . --list
npx skills add . --skill data-analysis -y
npm run validate:skills
```

修改规范时：先改 `docs/spec-data-analysis.md` → 再改对应 skill / 模板 / scripts → 更新本 README。详见 [AGENTS.md](./AGENTS.md)。

## License

MIT
