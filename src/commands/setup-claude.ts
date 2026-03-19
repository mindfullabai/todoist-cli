import { Command } from 'commander'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const SKILL_CONTENT = `# Todoist CLI - Task Management

Manage Todoist tasks and projects via CLI. More efficient than MCP (~90% fewer tokens).

## When to use
- Getting/creating/completing Todoist tasks
- Listing projects
- Checking completed tasks for scorecard
- Moving tasks between projects
- Any Todoist operation

## Discovery
Run \`todoist --ai\` for full command manifest.
Run \`todoist --ai brief\` for quick overview.
Run \`todoist --ai examples\` for usage examples.

## Common operations
\`\`\`bash
todoist tasks                                    # Today + overdue tasks
todoist tasks --project "1. Building"            # Tasks in a specific project
todoist tasks --all                              # All active tasks
todoist task create "content" --project "1. Building" --due "tomorrow"
todoist task complete <ID>                       # Complete a task
todoist task update <ID> --due "friday"          # Reschedule
todoist task move <ID> --project "0. Career Survival"
todoist completed                               # Today's completed tasks
todoist completed --week                        # This week's completed
todoist projects                                # List all projects
\`\`\`

## Output format
- Plain text by default (one line per task)
- Use --json for structured data
- Task format: \`- [id] content (due: date, p<priority>, labels: ..., project: ...)\`

## Auth
Set \`TODOIST_API_TOKEN\` env var or use \`--token\` flag.
Get token: https://todoist.com/app/settings/integrations
`

function getClaudeSkillsDir(): string {
  return path.join(os.homedir(), '.claude', 'skills', 'todoist-cli')
}

function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json')
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true } catch { return false }
}

export function registerSetupClaude(program: Command) {
  program
    .command('setup-claude')
    .description('Install Claude Code skill and configure permissions')
    .option('--uninstall', 'Remove the skill and clean up')
    .action(async (opts: { uninstall?: boolean }) => {
      if (opts.uninstall) {
        await uninstall()
        return
      }
      await install()
    })
}

async function install() {
  const skillDir = getClaudeSkillsDir()
  const skillPath = path.join(skillDir, 'SKILL.md')

  console.log('Setting up todoist-cli for Claude Code...\n')

  // Step 1: Install skill
  await fs.mkdir(skillDir, { recursive: true })
  await fs.writeFile(skillPath, SKILL_CONTENT)
  console.log(`  [done] Skill installed: ${skillPath}`)

  // Step 2: Update Claude settings for Bash permission
  const settingsPath = getClaudeSettingsPath()
  if (await fileExists(settingsPath)) {
    try {
      const raw = await fs.readFile(settingsPath, 'utf-8')
      const settings = JSON.parse(raw)

      const permissions = settings.permissions || {}
      const allow: string[] = permissions.allow || []

      if (!allow.some((p: string) => p.includes('todoist'))) {
        allow.push('Bash(todoist:*)')
        permissions.allow = allow
        settings.permissions = permissions
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n')
        console.log(`  [done] Permission added: Bash(todoist:*) in ${settingsPath}`)
      } else {
        console.log(`  [skip] Permission already exists in settings`)
      }
    } catch {
      console.log(`  [warn] Could not update settings.json - add manually:`)
      console.log(`         "Bash(todoist:*)" to permissions.allow`)
    }
  } else {
    console.log(`  [info] No ~/.claude/settings.json found`)
    console.log(`         Add "Bash(todoist:*)" to permissions.allow when you create one`)
  }

  // Step 3: Check API token
  const hasToken = process.env.TODOIST_API_TOKEN
  if (hasToken) {
    console.log(`  [done] TODOIST_API_TOKEN found in environment`)
  } else {
    console.log(`\n  [action needed] Set your Todoist API token:`)
    console.log(`    export TODOIST_API_TOKEN="your-token-here"`)
    console.log(`    # Get it from: https://todoist.com/app/settings/integrations`)
  }

  console.log('\nSetup complete! Restart Claude Code to activate the skill.')
  console.log('Test it: todoist tasks')
}

async function uninstall() {
  const skillDir = getClaudeSkillsDir()
  console.log('Removing todoist-cli from Claude Code...\n')

  if (await fileExists(skillDir)) {
    await fs.rm(skillDir, { recursive: true })
    console.log(`  [done] Skill removed: ${skillDir}`)
  } else {
    console.log(`  [skip] Skill directory not found`)
  }

  const settingsPath = getClaudeSettingsPath()
  if (await fileExists(settingsPath)) {
    try {
      const raw = await fs.readFile(settingsPath, 'utf-8')
      const settings = JSON.parse(raw)
      const allow: string[] = settings.permissions?.allow || []
      const filtered = allow.filter((p: string) => !p.includes('todoist'))
      if (filtered.length !== allow.length) {
        settings.permissions.allow = filtered
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n')
        console.log(`  [done] Permission removed from settings`)
      }
    } catch {
      console.log(`  [warn] Could not update settings.json`)
    }
  }

  console.log('\nUninstall complete. Restart Claude Code to apply.')
}
