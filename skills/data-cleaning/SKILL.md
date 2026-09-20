---
name: data-cleaning
description: >-
  Spec 5.3 数据清洗：缺失/重复/异常/脏数据与口径统一、一致性校验，并留存可追溯清洗日志。
  在用户说「清洗数据」「处理缺失值」「去重」「修异常值」「口径统一」「一致性校验」时使用。
license: MIT
metadata:
  author: WangLaoShi
  version: "0.2.0"
  category: data-analysis
  spec_section: "5.3"
---

# 数据清洗规则（Spec 5.3）

在 `data-structuring` 之后执行。原始与结构化中间结果只读；清洗输出新文件。

**模板：** `docs/templates/03-cleaning-log.md`。

## 脚本

```bash
# 画像：缺失率 / 主键重复 / 数值极值 / 未来日期
node scripts/profile-csv.mjs --file ./structured.csv --keys 订单ID --out /tmp/profile.json

# 由画像生成清洗日志草稿
node scripts/render-cleaning-log.mjs --profile /tmp/profile.json \
  --critical-fields 订单ID,实付金额 \
  --out ./deliverables_YYYYMMDD/02_cleaned/03-cleaning-log.md
```

Skill 内入口：`scripts/profile-csv.mjs`、`scripts/render-cleaning-log.mjs`。

草稿须人工确认「剔行 / 隔离 / 排序键」后再执行真实清洗。

## 规则

### 缺失值

- 业务关键字段缺失 → **剔除该行**，清洗日志记录剔除行数  
- 非关键字段缺失 → 标记 `[缺失]`，该条不参与对应指标统计  
- 统计各字段缺失率，写入报告「数据说明」

### 重复值

- 按唯一主键校验  
- 重复保留**最新一条**有效记录  
- 统计重复条数与占比，写入清洗日志

### 异常值

- 识别：不合理 0、极端值、未来时间、过期脏数据  
- 原则：**优先标记隔离并备注，不直接暴力删除**  
- 严重脏数据确认后剔除，留存剔除记录

### 脏数据 & 口径统一

- 清除乱码、换行、异常特殊符号  
- 维度值按字典统一（渠道、地区、业务状态等）  
- 状态码、分类编码与官方字典对齐

### 一致性校验

- 明细求和 ≈ 汇总统计  
- 同比、环比、层级维度逻辑不自洽 → 标记并核查修正

## 输出文件

`数据集_清洗完成_带衍生字段_YYYYMMDD.xlsx`（衍生字段也可交由 `derived-metrics` 下一步生成；本步至少输出清洗完成集）

## 输出模板

```markdown
## 清洗规则与影响
| 问题类型 | 规则 | 影响行数/占比 |

## 清洗日志摘要
- 剔除 / 标记 / 映射 / 一致性差异

## 输出路径
## 待确认项
```

## 原则

- 高风险删除先说明影响再执行。  
- 所有操作可脚本化复现；禁止只改 Excel 不留痕。  
