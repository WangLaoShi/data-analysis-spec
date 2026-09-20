---
name: data-analysis
description: >-
  按 data-analysis-spec V1.1 执行完整业务数据分析：接收→结构化→清洗→衍生→拆解→指标→多维分析→可视化→结论→建议→报告→归档。
  在用户说「按 Spec 做数据分析」「业务专题分析」「销售/运营复盘」「出完整分析报告」或启动整套分析流程时使用。
license: MIT
metadata:
  author: WangLaoShi
  version: "0.2.0"
  category: data-analysis
  spec: "V1.1"
---

# 数据分析任务 Spec（总控）V1.1

按主规范跑通闭环。原文：`docs/spec-data-analysis.md`。过程模板：`docs/templates/`。

## 阶段调度（按序）

| 序 | Spec | Skill | 模板 |
|----|------|-------|------|
| 0 | 开工闸门 | （本 skill 检查） | `00-intake-checklist.md` |
| 1 | 5.1 | `data-intake` | `01-meta-intake.md` |
| 2 | 5.2 | `data-structuring` | `02-field-mapping.md` |
| 3 | 5.3 | `data-cleaning` | `03-cleaning-log.md` |
| 4 | 5.4 | `derived-metrics` | （并入口径附录） |
| 5 | 5.5 | `analysis-decomposition` | `04-analysis-outline.md` |
| 6 | 5.6 | `metrics-calculation` | `05-metric-dictionary.md` |
| 7 | 5.7 | `multidimensional-analysis` | — |
| 7+ | 补充 | `exploratory-data-analysis` / `statistical-analysis` | — |
| 8 | 5.8 | `data-visualization` | `06-chart-inventory.md` |
| 9 | 5.9 | `insight-conclusion` | `07-conclusion-cards.md` |
| 10 | 5.10 | `actionable-recommendations` | `08-recommendation-cards.md` |
| 11 | 5.11 | `analysis-report` | `09-report-outline.md` |
| 12 | 5.12 | `delivery-archive` | `10-delivery-checklist.md` |

**规则：** 上一阶段 DoD 未满足，不进入下一阶段；阻断项必须标红并请需求方确认。

## 目标 / 非目标 / 输入

与 Spec §2–§4 一致。缺原始数据、需求或口径 → **阻断**。

## 执行摘要（要点）

1. **接收**：原始只读备份 `原始数据_未处理_YYYYMMDD`；台账齐全  
2. **结构化**：去噪音、标准表头、类型统一、多表合并留来源  
3. **清洗**：缺失/重复/异常/映射/一致性；优先标记隔离；写清洗日志  
4. **衍生**：时间、增长、结构、统计、分层标签  
5. **拆解**：大盘 / 结构 / 趋势异动 / 分层对比 四向提纲  
6. **指标**：总量/质量/增长/结构；公式入口径；底稿可回溯  
7. **多维**：趋势、结构、对比、相关、二八、异常归因（先数据后业务）  
8. **可视化**：选型与标题/单位/周期/来源；原图归档  
9. **结论**：现象+对比+支撑+解读 → 现状/亮点/问题  
10. **建议**：可落地可执行可量化；禁空泛话术  
11. **报告**：摘要→说明→大盘→分维→归因→亮点→策略→风险→附录  
12. **归档**：六类交付 + AC-01～07 全过  

## 验收 AC（必须全过）

- AC-01 交付齐全  
- AC-02 清洗留痕  
- AC-03 口径可回溯  
- AC-04 图表匹配  
- AC-05 结论有支撑  
- AC-06 建议可量化  
- AC-07 逻辑闭环  

## 约束

真实数据、操作留痕、口径对齐、交付脱敏。详见 Spec §7。

## 代理执行提示

1. 先填开工检查清单，再逐步调用上表 skill（或按本章节内联执行）。  
2. 每阶段结束输出：DoD 勾选 + 交付路径 + 待确认项。  
3. 数字变更必须同步底稿与图表清单，禁止口头改数。  

## 脚本（强烈推荐）

仓库根目录零依赖 Node 脚本，详见 `scripts/README.md`。

```bash
npm run scaffold -- --date YYYYMMDD
npm run backup -- --file raw.csv --out-dir deliverables_YYYYMMDD/00_raw
npm run intake -- --file raw.csv --required-fields 订单ID,实付金额
npm run profile -- --file data.csv --keys 订单ID --out /tmp/profile.json
npm run cleaning-log -- --profile /tmp/profile.json --critical-fields 订单ID --out deliverables_YYYYMMDD/02_cleaned/03-cleaning-log.md
npm run validate:delivery -- --dir deliverables_YYYYMMDD
npm run validate:skills
```

Skill 包装入口：`skills/data-analysis/scripts/scaffold-deliverables.mjs`、`validate-skills.mjs`。  
