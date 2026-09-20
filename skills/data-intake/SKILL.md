---
name: data-intake
description: >-
  Spec 5.1 数据接收与存档校验：原始文件只读备份、完整性校验、元信息登记。
  在用户说「接收数据」「校验原始数据」「备份数据」「建数据台账」或分析流程刚开始时使用。
license: MIT
metadata:
  author: WangLaoShi
  version: "0.2.0"
  category: data-analysis
  spec_section: "5.1"
---

# 数据接收 & 存档校验（Spec 5.1）

保证原始数据可追溯、可复核，再进入整理与清洗。

**模板：** 仓库内 `docs/templates/01-meta-intake.md`（可复制到交付包 `00_raw/`）。

## 脚本

在仓库根目录（或已设置 `DATA_ANALYSIS_SPEC_ROOT`）执行：

```bash
# 只读备份 + sha256
node scripts/backup-raw.mjs --file ./raw.csv --out-dir ./deliverables_YYYYMMDD/00_raw --source 销售明细

# 接收校验（缺字段则 exit 2）
node scripts/intake-check.mjs --file ./raw.csv \
  --required-fields 订单ID,实付金额,下单日期 \
  --date-field 下单日期 \
  --period-start 2026-07-01 --period-end 2026-09-30
```

Skill 内入口：`scripts/backup-raw.mjs`、`scripts/intake-check.mjs`（相对本 skill 目录）。

stdout 为 JSON：`ok` / `verdict` / `blocking` / `warnings` / `meta`。

## 工作流程

1. **只读原则**：原始文件禁止直接修改；复制备份后再处理。
2. **命名备份**：`原始数据_未处理_YYYYMMDD.csv/xlsx`（多文件加来源后缀）。
3. **完整性校验**：
   - 时间区间是否覆盖需求周期
   - 需求字段是否齐全
   - 文件是否损坏、乱码、编码异常
   - 是否存在重复导出/冗余副本
4. **元信息台账**（写入日志或 README）：

| 项 | 内容 |
|----|------|
| 数据来源 | |
| 导出时间 | |
| 提供人 | |
| 统计周期 | |
| 数据总行数 | |
| 文件清单与哈希/大小（如可知） | |

## 输出

```markdown
## 接收结论
- 通过 / 阻断（缺项列表）

## 备份路径
- ...

## 元信息台账
| ... |

## 待业务确认
- 字段缺失 / 周期缺口 / 可疑重复导出
```

## 原则

- 未通过校验不得进入清洗；缺口先问清再往下做。
- 不改写原始文件内容与文件名（备份用新名）。
