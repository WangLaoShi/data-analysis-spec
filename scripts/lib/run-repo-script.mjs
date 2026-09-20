import path from 'node:path'
import { access } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Resolve repo scripts/*.mjs from a skill script location or cwd.
 */
export async function resolveRepoScript(scriptName, fromDir = path.dirname(fileURLToPath(import.meta.url))) {
  const candidates = []

  if (process.env.DATA_ANALYSIS_SPEC_ROOT) {
    candidates.push(path.join(process.env.DATA_ANALYSIS_SPEC_ROOT, 'scripts', scriptName))
  }

  // skills/<name>/scripts → ../../../scripts
  candidates.push(path.resolve(fromDir, '../../../scripts', scriptName))
  // already at repo scripts/lib
  candidates.push(path.resolve(fromDir, '../', scriptName))
  candidates.push(path.resolve(process.cwd(), 'scripts', scriptName))

  let dir = fromDir
  for (let i = 0; i < 10; i++) {
    candidates.push(path.join(dir, 'scripts', scriptName))
    dir = path.dirname(dir)
  }

  for (const p of candidates) {
    try {
      await access(p)
      return p
    } catch {
      /* try next */
    }
  }
  return null
}

export async function runRepoScript(scriptName, argv = [], fromDir) {
  const script = await resolveRepoScript(scriptName, fromDir)
  if (!script) {
    console.error(
      `[data-analysis-spec] 找不到 scripts/${scriptName}。请在仓库根目录运行，或设置 DATA_ANALYSIS_SPEC_ROOT。`,
    )
    process.exit(1)
  }
  const child = spawn(process.execPath, [script, ...argv], { stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 1))
}
