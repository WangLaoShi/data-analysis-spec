# 示例：如何用本 Spec 跑完一次专题分析

以「2026 Q3 销售业绩专题」为例（虚构，演示流程）。

## 0. 开工

复制 `docs/templates/00-intake-checklist.md`，确认原始销售明细、需求文档、Q3 目标、渠道字典齐全。

## 1–3. 数据就绪

1. `data-intake`：备份为 `原始数据_未处理_20261001_销售明细.csv`，填元信息台账  
2. `data-structuring`：统一 `下单日期`、`实付金额`、`渠道名称`；多表合并留 `数据来源`  
3. `data-cleaning`：按主键 `订单ID` 去重；异常未来日期隔离；渠道名映射字典；写清洗日志  

## 4–6. 指标与提纲

4. `derived-metrics`：生成年季月、环比同比、渠道占比、头腰尾客户标签  
5. `analysis-decomposition`：四向提纲（大盘 GMV/目标完成；渠道结构；周趋势异动；新老客对比）  
6. `metrics-calculation`：填口径字典并出本期结果表，底稿可回溯订单行  

## 7–10. 分析到建议

7. `multidimensional-analysis`：六视角全覆盖；某周下滑先查是否漏导数据，再查渠道投放  
8. `data-visualization`：折线（趋势）+ 条形（渠道）+ 堆叠（结构），原图进 `04_charts/`  
9. `insight-conclusion`：现状/亮点/问题结论卡（四要素齐全）  
10. `actionable-recommendations`：每条建议对应问题 ID，带预期指标与验证窗口  

## 11–12. 报告与交付

11. `analysis-report`：按九章骨架成文  
12. `delivery-archive`：按 §9 目录打包，AC-01～07 勾选通过后标记可交付  

总控技能：`/data-analysis` 或安装后由代理按调度表执行。
