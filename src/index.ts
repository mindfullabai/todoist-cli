import { Command } from 'commander'
import { printAiManifest } from './ai-manifest.js'
import { registerTasksCommand, registerTaskCommand, registerCompletedCommand } from './commands/tasks.js'
import { registerProjectsCommand, registerProjectCommand } from './commands/projects.js'
import { registerSetupClaude } from './commands/setup-claude.js'

// Handle --ai flag before commander parses (no API token needed for this)
const aiIndex = process.argv.indexOf('--ai')
if (aiIndex !== -1) {
  const subcommand = process.argv[aiIndex + 1]
  // Avoid treating another flag as subcommand
  const sub = subcommand && !subcommand.startsWith('-') ? subcommand : undefined
  printAiManifest(sub)
  process.exit(0)
}

// Extract global --token option early for client init
const tokenIndex = process.argv.indexOf('--token')
const globalToken = tokenIndex !== -1 ? process.argv[tokenIndex + 1] : undefined

const program = new Command()

program
  .name('todoist')
  .version('1.0.0')
  .description(
    'AI-native Todoist CLI. Manage tasks and projects from the command line.\n\n' +
    'AI Agent? Run: todoist --ai (JSON schema) | --ai brief | --ai examples'
  )
  .addHelpText(
    'after',
    '\nAI Agent Integration:\n' +
    '  --ai              Full JSON schema for all commands\n' +
    '  --ai brief        One-liner per command\n' +
    '  --ai examples     Usage examples for all commands\n' +
    '  --ai <command>    Schema for a specific command'
  )

registerTasksCommand(program, globalToken)
registerTaskCommand(program, globalToken)
registerCompletedCommand(program, globalToken)
registerProjectsCommand(program, globalToken)
registerProjectCommand(program, globalToken)
registerSetupClaude(program)

program.parse()
