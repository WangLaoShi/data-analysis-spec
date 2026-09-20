---
name: delivery-archive
description: >-
  Spec 5.12 交付物归档：核对原始备份、清洗集、底稿、图表、报告、口径与清洗日志是否齐全可追溯。
  在用户说「归档」「交付清单」「验收交付」「打包分析结果」或收尾时使用。
license: MIT
metadata:
  author: WangLaoShi
  version: "0.3.0"
  category: data-analysis
  spec_section: "5.12"
---

# 交付物归档清单（Spec 5.12）

收尾验收：文件齐、可打开、可回溯、已脱敏。

**模板：** `docs/templates/10-delivery-checklist.md`。

## 脚本

```bash
# 创建 §9 目录树并复制 templates
node scripts/scaffold-deliverables.mjs --date 20260920 --out ./deliverables_20260920

# 校验交付包（默认要求 raw + cleaned + report；--strict 全槽位）
node scripts/validate-delivery.mjs --dir ./deliverables_20260920
node scripts/validate-delivery.mjs --dir ./deliverables_20260920 --strict
```

Skill 内入口：`scripts/scaffold-deliverables.mjs`、`scripts/validate-delivery.mjs`。

## 必备交付物

- [ ] 原始未处理数据备份  
- [ ] 清洗后标准数据集（含衍生字段）  
- [ ] 指标 & 计算底稿  
- [ ] 可视化图表原图包  
- [ ] 完整分析报告文档  
- [ ] 指标口径 + 清洗日志文档  

## 工作流程

1. 按清单逐项核对路径、命名、日期戳。  
2. 抽查：报告中的关键数字能否在底稿/数据集复现。  
3. 敏感字段脱敏检查（交付版不得含未脱敏隐私）。  
4. 对照验收 AC（见总控 `data-analysis`）：AC-01～AC-07。  
5. 运行 `validate-delivery` 并输出交付索引。  

## 输出

```markdown
## 交付索引
| 类别 | 路径 | 说明 | 状态 |

## 抽查复核
- 指标 X ← 底稿行/查询 …

## 脱敏与权限说明
## 未完成项 / 风险
```

## 建议目录

```
deliverables_YYYYMMDD/
  00_raw/
  01_structured/
  02_cleaned/
  03_metrics/
  04_charts/
  05_report/
  06_dictionary_and_logs/
```

## 原则

- 缺一项标红阻断「可交付」状态，除非业务书面豁免。  
- 只交付约定版本；过程临时文件不混入正式包。  
