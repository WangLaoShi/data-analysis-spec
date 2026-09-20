#!/usr/bin/env node
/**
 * Parse frontmatter description length helper + list skills with script entrypoints.
 * Convenience wrapper used by agents / CI.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const child = spawn(process.execPath, [path.join(here, 'validate-skills.mjs')], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))
