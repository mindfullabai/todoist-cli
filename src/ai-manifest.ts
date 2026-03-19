export const AI_MANIFEST = {
  name: 'todoist',
  version: '1.0.0',
  description: 'AI-native Todoist CLI. Manage tasks, projects and completed items. ~90% fewer tokens than MCP.',
  env: {
    TODOIST_API_TOKEN: { required: true, description: 'Todoist API token from todoist.com/app/settings/integrations' },
  },
  commands: [
    {
      name: 'tasks',
      aliases: [],
      description: 'List tasks. Default: today + overdue. Filter by project, or show all.',
      when_to_use: 'When you need to see what tasks are due today, check overdue items, or list tasks for a specific project.',
      args: [],
      options: [
        { flag: '--project', type: 'string', required: false, description: 'Project name (fuzzy match: exact, case-insensitive, partial)' },
        { flag: '--project-id', type: 'string', required: false, description: 'Project ID (precise, no ambiguity)' },
        { flag: '--all', type: 'boolean', required: false, description: 'Show all active tasks' },
        { flag: '--json', type: 'boolean', required: false, description: 'Output JSON array' },
      ],
      output: 'Plain text list: "- [id] content (due: date, p<priority>, labels: ..., project: ...)"',
      examples: [
        { description: 'Today and overdue tasks', command: 'todoist tasks' },
        { description: 'Tasks in a project', command: 'todoist tasks --project "1. Building"' },
        { description: 'All active tasks as JSON', command: 'todoist tasks --all --json' },
      ],
    },
    {
      name: 'task create',
      aliases: [],
      description: 'Create a new task with optional project, due date, priority and labels.',
      when_to_use: 'When the user wants to add a new task to Todoist.',
      args: [
        { name: 'content', type: 'string', required: true, description: 'Task title/content' },
      ],
      options: [
        { flag: '--project', type: 'string', required: false, description: 'Project name' },
        { flag: '--project-id', type: 'string', required: false, description: 'Project ID' },
        { flag: '--due', type: 'string', required: false, description: 'Due date (e.g. "tomorrow", "friday", "2026-03-25")' },
        { flag: '--priority', type: 'number', required: false, description: 'Priority 1=normal, 2=medium, 3=high, 4=urgent (default: 4=normal in Todoist API)' },
        { flag: '--labels', type: 'string', required: false, description: 'Comma-separated labels' },
        { flag: '--description', type: 'string', required: false, description: 'Task description' },
        { flag: '--json', type: 'boolean', required: false, description: 'Output JSON' },
      ],
      output: 'Plain text: "Created: [id] content"',
      examples: [
        { description: 'Create a task', command: 'todoist task create "Fix login bug" --project "1. Building" --due "tomorrow" --priority 3' },
        { description: 'Create with labels', command: 'todoist task create "Deploy v2" --project "1. Building" --labels "Commander\'s Intent,Task#1"' },
      ],
    },
    {
      name: 'task complete',
      aliases: [],
      description: 'Mark a task as completed.',
      when_to_use: 'When the user has finished a task and wants to mark it done.',
      args: [
        { name: 'id', type: 'string', required: true, description: 'Task ID (get from todoist tasks)' },
      ],
      options: [],
      output: 'Plain text: "Completed: <id>"',
      examples: [
        { description: 'Complete a task', command: 'todoist task complete 8765432100' },
      ],
    },
    {
      name: 'task reopen',
      aliases: [],
      description: 'Reopen a completed task.',
      when_to_use: 'When a task was completed by mistake or needs to be worked on again.',
      args: [
        { name: 'id', type: 'string', required: true, description: 'Task ID' },
      ],
      options: [],
      output: 'Plain text: "Reopened: <id>"',
      examples: [
        { description: 'Reopen a task', command: 'todoist task reopen 8765432100' },
      ],
    },
    {
      name: 'task update',
      aliases: [],
      description: 'Update task content, due date, priority, labels or description.',
      when_to_use: 'When you need to modify an existing task.',
      args: [
        { name: 'id', type: 'string', required: true, description: 'Task ID' },
      ],
      options: [
        { flag: '--content', type: 'string', required: false, description: 'New title' },
        { flag: '--due', type: 'string', required: false, description: 'New due date' },
        { flag: '--priority', type: 'number', required: false, description: 'New priority 1-4' },
        { flag: '--labels', type: 'string', required: false, description: 'New labels (replaces all)' },
        { flag: '--description', type: 'string', required: false, description: 'New description' },
      ],
      output: 'Plain text: "Updated: [id] content"',
      examples: [
        { description: 'Reschedule a task', command: 'todoist task update 8765432100 --due "friday"' },
        { description: 'Rename a task', command: 'todoist task update 8765432100 --content "New name"' },
      ],
    },
    {
      name: 'task move',
      aliases: [],
      description: 'Move a task to a different project.',
      when_to_use: 'When you need to reassign a task to another project.',
      args: [
        { name: 'id', type: 'string', required: true, description: 'Task ID' },
      ],
      options: [
        { flag: '--project', type: 'string', required: false, description: 'Target project name' },
        { flag: '--project-id', type: 'string', required: false, description: 'Target project ID' },
      ],
      output: 'Plain text: "Moved: <id> -> project <projectId>"',
      examples: [
        { description: 'Move to project', command: 'todoist task move 8765432100 --project "0. Career Survival"' },
      ],
    },
    {
      name: 'task delete',
      aliases: [],
      description: 'Permanently delete a task.',
      when_to_use: 'When a task needs to be removed (not completed, but deleted).',
      args: [
        { name: 'id', type: 'string', required: true, description: 'Task ID' },
      ],
      options: [],
      output: 'Plain text: "Deleted: <id>"',
      examples: [
        { description: 'Delete a task', command: 'todoist task delete 8765432100' },
      ],
    },
    {
      name: 'completed',
      aliases: [],
      description: 'List completed tasks. Default: today. Use --week for weekly summary.',
      when_to_use: 'When checking scorecard, reviewing what was accomplished today or this week.',
      args: [],
      options: [
        { flag: '--week', type: 'boolean', required: false, description: 'Tasks completed this week (Monday to today)' },
        { flag: '--since', type: 'string', required: false, description: 'Start date YYYY-MM-DD' },
        { flag: '--until', type: 'string', required: false, description: 'End date YYYY-MM-DD' },
        { flag: '--project', type: 'string', required: false, description: 'Filter by project name' },
        { flag: '--project-id', type: 'string', required: false, description: 'Filter by project ID' },
        { flag: '--json', type: 'boolean', required: false, description: 'Output JSON' },
      ],
      output: 'Plain text list of completed tasks with completion date.',
      examples: [
        { description: "Today's completed tasks", command: 'todoist completed' },
        { description: "This week's completed tasks", command: 'todoist completed --week' },
        { description: 'Completed in range', command: 'todoist completed --since 2026-03-01 --until 2026-03-19' },
        { description: 'Completed in project', command: 'todoist completed --project "1. Building"' },
      ],
    },
    {
      name: 'projects',
      aliases: [],
      description: 'List all Todoist projects with ID, name and color.',
      when_to_use: 'When you need to see available projects or find a project ID for other commands.',
      args: [],
      options: [
        { flag: '--json', type: 'boolean', required: false, description: 'Output JSON array' },
      ],
      output: 'Plain text list: "- [id] name (color: ...)"',
      examples: [
        { description: 'List all projects', command: 'todoist projects' },
        { description: 'Projects as JSON', command: 'todoist projects --json' },
      ],
    },
  ],
}

export function printAiManifest(subcommand?: string) {
  if (!subcommand) {
    console.log(JSON.stringify(AI_MANIFEST, null, 2))
    return
  }

  if (subcommand === 'examples') {
    for (const cmd of AI_MANIFEST.commands) {
      console.log(`\n## ${cmd.name}`)
      console.log(cmd.when_to_use)
      console.log('')
      for (const ex of cmd.examples) {
        console.log(`  # ${ex.description}`)
        console.log(`  ${ex.command}`)
      }
    }
    return
  }

  if (subcommand === 'brief') {
    console.log(`${AI_MANIFEST.name} v${AI_MANIFEST.version} - ${AI_MANIFEST.description}\n`)
    console.log('Commands:')
    for (const cmd of AI_MANIFEST.commands) {
      console.log(`  ${cmd.name.padEnd(18)} ${cmd.description.substring(0, 78)}`)
    }
    console.log('\nRun with --ai for full JSON schema, --ai examples for usage examples.')
    return
  }

  // specific command
  const cmd = AI_MANIFEST.commands.find(c => c.name === subcommand || c.aliases.includes(subcommand))
  if (cmd) {
    console.log(JSON.stringify(cmd, null, 2))
  } else {
    console.error(`Unknown command: ${subcommand}. Available: ${AI_MANIFEST.commands.map(c => c.name).join(', ')}`)
    process.exit(1)
  }
}
