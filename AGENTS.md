# AGENTS.md

给在本仓库中编辑/新增 skill 与 Spec 的 AI 代理与贡献者使用。

## 仓库定位

- **主规范**：`docs/spec-data-analysis.md`（当前 V1.1）  
- **模板**：`docs/templates/00`–`10`  
- **可安装单元**：`skills/*/SKILL.md`  

```bash
npx skills add WangLaoShi/data-analysis-spec
```

## 变更同步顺序（强制）

1. 更新 `docs/spec-data-analysis.md`（含版本表）  
2. 更新对应 `docs/templates/`  
3. 更新对应 `skills/*/SKILL.md` 与总控 `skills/data-analysis/SKILL.md`  
4. 若影响可复现流程：更新 `scripts/` 与 `scripts/README.md`  
5. 更新根目录 `README.md` 技能表  
6. 如有破坏性变更，抬高 `package.json` 的 `version`

## 目录结构

```text
skills/
  {skill-name}/
    SKILL.md
    scripts/              # 可选：包装入口，定位仓库 scripts/
docs/
  spec-data-analysis.md
  templates/
scripts/                  # 规范配套可执行工具（零依赖）
  lib/
  *.mjs
```

## 脚本约定

- 实现放在仓库根 `scripts/`（唯一真相来源）  
- Skill 内 `scripts/*.mjs` 仅为包装器，便于代理从 skill 目录调用  
- stderr = 人类状态；stdout = JSON（除非工具另有说明）  
- 验证：`npm run validate:skills`  

本地验证：

```bash
npx skills add . --list
npm run validate:skills
npm run scaffold -- --out /tmp/da-demo --force
```

## 新增 Skill

1. 确认 Spec 中有对应章节或先补 Spec  
2. 创建 `skills/{name}/SKILL.md`，`name` 与目录一致  
3. `description` 写清能力 + 触发话术；`metadata.spec_section` 填章节号  
4. 主体 < 500 行；细节进 `references/` 或 `docs/templates/`  
5. 总控调度表与 README 各加一行  

### Frontmatter 模板

```markdown
---
name: my-skill-name
description: >-
  Spec x.x …。在用户说「…」时使用。
license: MIT
metadata:
  author: WangLaoShi
  version: "0.2.0"
  category: data-analysis
  spec_section: "5.x"
---
```

## 写作约定

- 中文为主；保留 EDA、AC、DoD 等术语  
- 输出用可复制的标题/表格/清单  
- 原始只读、规则可脚本化、结论区分事实与推断  
- 不写入真实隐私或密钥  

## 本地验证

```bash
npx skills add . --list
npx skills add . --skill data-analysis -y
npm run validate:skills
```

期望：`data-analysis` + §5 全部分阶段 skill + 2 个补充 skill 均可被列出；scripts 校验通过。
