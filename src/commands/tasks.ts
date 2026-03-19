import { Command } from 'commander'
import { getClient, getAllProjects, getAllTasks, getTasksByFilter } from '../lib/api.js'
import { formatTask, printJson, printError } from '../lib/output.js'
import type { Task, Project } from '@doist/todoist-api-typescript'

// Fuzzy match: exact first, then case-insensitive, then partial
function matchProject(projects: Project[], query: string): Project | null {
  let match = projects.find(p => p.name === query)
  if (match) return match

  match = projects.find(p => p.name.toLowerCase() === query.toLowerCase())
  if (match) return match

  const partials = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  if (partials.length === 1) return partials[0]
  if (partials.length > 1) {
    console.error(`Ambiguous project name "${query}". Matches:`)
    for (const p of partials) {
      console.error(`  [${p.id}] ${p.name}`)
    }
    console.error('Use --project-id <id> to specify exactly.')
    process.exit(1)
  }

  return null
}

function buildTaskJson(task: Task, projectName?: string) {
  return {
    id: task.id,
    content: task.content,
    description: task.description || undefined,
    due: task.due?.date ?? null,
    priority: task.priority,
    labels: task.labels,
    projectId: task.projectId,
    project: projectName,
    url: task.url,
  }
}

export function registerTasksCommand(program: Command, token?: string) {
  program
    .command('tasks')
    .description('List tasks (today + overdue by default)')
    .option('--project <name>', 'Filter by project name (fuzzy match)')
    .option('--project-id <id>', 'Filter by project ID')
    .option('--all', 'Show all active tasks')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token (overrides env)')
    .action(async (opts: { project?: string; projectId?: string; all?: boolean; json?: boolean; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        let projectId: string | undefined = opts.projectId
        let projectName: string | undefined

        if (opts.project && !projectId) {
          const projects = await getAllProjects(client)
          const found = matchProject(projects, opts.project)
          if (!found) {
            printError(`Project not found: "${opts.project}"`)
            process.exit(1)
          }
          projectId = found.id
          projectName = found.name
        }

        let tasks: Task[]

        if (opts.all && !projectId) {
          tasks = await getAllTasks(client)
        } else if (projectId) {
          tasks = await getAllTasks(client, { projectId })
          if (!projectName) {
            const projects = await getAllProjects(client)
            projectName = projects.find(p => p.id === projectId)?.name
          }
        } else {
          tasks = await getTasksByFilter(client, 'today|overdue')
        }

        // Sort: by due date asc, then priority desc
        tasks.sort((a, b) => {
          const aDate = a.due?.date ?? '9999-12-31'
          const bDate = b.due?.date ?? '9999-12-31'
          if (aDate !== bDate) return aDate < bDate ? -1 : 1
          return b.priority - a.priority
        })

        if (tasks.length === 0) {
          console.log('No tasks found.')
          return
        }

        const label = projectName
          ? `# Tasks - ${projectName}`
          : opts.all
          ? '# Tasks - all'
          : '# Tasks - today + overdue'

        // Resolve project names when no single project filter
        const projectsMap: Map<string, string> = new Map()
        if (!projectName) {
          const allProjects = await getAllProjects(client)
          for (const p of allProjects) projectsMap.set(p.id, p.name)
        }

        if (opts.json) {
          const out = tasks.map(t => buildTaskJson(t, projectName ?? projectsMap.get(t.projectId)))
          printJson(out)
        } else {
          console.log(label)
          for (const task of tasks) {
            console.log(
              formatTask({
                id: task.id,
                content: task.content,
                due: task.due,
                priority: task.priority,
                labels: task.labels,
                projectId: task.projectId,
                projectName: projectName ?? projectsMap.get(task.projectId),
              })
            )
          }
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}

export function registerTaskCommand(program: Command, token?: string) {
  const taskCmd = program
    .command('task')
    .description('Task operations: get, create, complete, reopen, update, move, delete')

  // todoist task <id> - get single task
  taskCmd
    .command('<id>')
    .description('Get task detail by ID')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { json?: boolean; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        const task = await client.getTask(id)
        const projects = await getAllProjects(client)
        const projectName = projects.find(p => p.id === task.projectId)?.name

        if (opts.json) {
          printJson(buildTaskJson(task, projectName))
        } else {
          console.log(formatTask({
            id: task.id,
            content: task.content,
            due: task.due,
            priority: task.priority,
            labels: task.labels,
            projectId: task.projectId,
            projectName,
            description: task.description,
          }))
          if (task.description) {
            console.log(`  description: ${task.description}`)
          }
          console.log(`  url: ${task.url}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist task create
  taskCmd
    .command('create')
    .description('Create a new task')
    .argument('<content>', 'Task content/title')
    .option('--project <name>', 'Project name (fuzzy match)')
    .option('--project-id <id>', 'Project ID')
    .option('--due <date>', 'Due date (e.g. "tomorrow", "2026-03-25")')
    .option('--priority <n>', 'Priority 1-4 (4=urgent)', '4')
    .option('--labels <labels>', 'Comma-separated labels')
    .option('--description <text>', 'Task description')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (content: string, opts: {
      project?: string; projectId?: string; due?: string; priority?: string;
      labels?: string; description?: string; json?: boolean; token?: string
    }) => {
      const client = getClient(opts.token || token)
      try {
        let projectId: string | undefined = opts.projectId

        if (opts.project && !projectId) {
          const projects = await getAllProjects(client)
          const found = matchProject(projects, opts.project)
          if (!found) {
            printError(`Project not found: "${opts.project}"`)
            process.exit(1)
          }
          projectId = found.id
        }

        const task = await client.addTask({
          content,
          projectId,
          dueString: opts.due,
          priority: opts.priority ? parseInt(opts.priority) : undefined,
          labels: opts.labels ? opts.labels.split(',').map(l => l.trim()) : undefined,
          description: opts.description,
        })

        if (opts.json) {
          printJson(buildTaskJson(task))
        } else {
          console.log(`Created: [${task.id}] ${task.content}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist task complete <id>
  taskCmd
    .command('complete')
    .description('Mark task as complete')
    .argument('<id>', 'Task ID')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        await client.closeTask(id)
        console.log(`Completed: ${id}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist task reopen <id>
  taskCmd
    .command('reopen')
    .description('Reopen a completed task')
    .argument('<id>', 'Task ID')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        await client.reopenTask(id)
        console.log(`Reopened: ${id}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist task update <id>
  taskCmd
    .command('update')
    .description('Update task fields')
    .argument('<id>', 'Task ID')
    .option('--content <text>', 'New content/title')
    .option('--due <date>', 'New due date')
    .option('--priority <n>', 'New priority 1-4')
    .option('--labels <labels>', 'New comma-separated labels')
    .option('--description <text>', 'New description')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: {
      content?: string; due?: string; priority?: string;
      labels?: string; description?: string; json?: boolean; token?: string
    }) => {
      const client = getClient(opts.token || token)
      try {
        const updates: Record<string, unknown> = {}
        if (opts.content) updates.content = opts.content
        if (opts.due) updates.dueString = opts.due
        if (opts.priority) updates.priority = parseInt(opts.priority)
        if (opts.labels) updates.labels = opts.labels.split(',').map(l => l.trim())
        if (opts.description !== undefined) updates.description = opts.description

        const task = await client.updateTask(id, updates)

        if (opts.json) {
          printJson(buildTaskJson(task))
        } else {
          console.log(`Updated: [${task.id}] ${task.content}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist task move <id> --project "name"
  taskCmd
    .command('move')
    .description('Move task to another project')
    .argument('<id>', 'Task ID')
    .option('--project <name>', 'Target project name (fuzzy match)')
    .option('--project-id <id>', 'Target project ID')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { project?: string; projectId?: string; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        let projectId: string | undefined = opts.projectId

        if (opts.project && !projectId) {
          const projects = await getAllProjects(client)
          const found = matchProject(projects, opts.project)
          if (!found) {
            printError(`Project not found: "${opts.project}"`)
            process.exit(1)
          }
          projectId = found.id
        }

        if (!projectId) {
          printError('Specify --project or --project-id')
          process.exit(1)
        }

        await client.updateTask(id, { projectId })
        console.log(`Moved: ${id} -> project ${projectId}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist task delete <id>
  taskCmd
    .command('delete')
    .description('Delete a task permanently')
    .argument('<id>', 'Task ID')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        await client.deleteTask(id)
        console.log(`Deleted: ${id}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}

export function registerCompletedCommand(program: Command, token?: string) {
  program
    .command('completed')
    .description('List completed tasks (today by default)')
    .option('--week', 'Tasks completed this week')
    .option('--since <date>', 'Start date (YYYY-MM-DD)')
    .option('--until <date>', 'End date (YYYY-MM-DD)')
    .option('--project <name>', 'Filter by project name')
    .option('--project-id <id>', 'Filter by project ID')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (opts: {
      week?: boolean; since?: string; until?: string;
      project?: string; projectId?: string; json?: boolean; token?: string
    }) => {
      const client = getClient(opts.token || token)
      try {
        const now = new Date()
        let since: string
        let until: string

        if (opts.since && opts.until) {
          since = opts.since
          until = opts.until
        } else if (opts.week) {
          const day = now.getDay()
          const diff = (day === 0 ? -6 : 1 - day)
          const monday = new Date(now)
          monday.setDate(now.getDate() + diff)
          since = monday.toISOString().split('T')[0]
          until = now.toISOString().split('T')[0]
        } else {
          since = now.toISOString().split('T')[0]
          until = since
        }

        let projectId: string | undefined = opts.projectId
        let projectName: string | undefined

        if (opts.project && !projectId) {
          const projects = await getAllProjects(client)
          const found = matchProject(projects, opts.project)
          if (!found) {
            printError(`Project not found: "${opts.project}"`)
            process.exit(1)
          }
          projectId = found.id
          projectName = found.name
        }

        // SDK v6 uses getCompletedTasksByCompletionDate
        const completedApi = client as unknown as {
          getCompletedTasksByCompletionDate: (p: Record<string, unknown>) => Promise<{ items: Array<{ id: string; content: string; completedAt?: string; projectId?: string }> }>
        }
        const params: Record<string, unknown> = {
          since: `${since}T00:00:00.000Z`,
          until: `${until}T23:59:59.000Z`,
          limit: 200,
        }
        if (projectId) params.projectId = projectId

        const result = await completedApi.getCompletedTasksByCompletionDate(params)
        const tasks = result.items ?? []

        if (tasks.length === 0) {
          console.log('No completed tasks found.')
          return
        }

        const rangeLabel = opts.week ? 'this week' : opts.since ? `${since} to ${until}` : 'today'
        const label = projectName
          ? `# Completed - ${projectName} (${rangeLabel})`
          : `# Completed (${rangeLabel})`

        if (opts.json) {
          printJson(tasks)
        } else {
          console.log(label)
          for (const task of tasks) {
            const completedAt = task.completedAt
            const completedStr = completedAt ? ` [completed: ${completedAt.split('T')[0]}]` : ''
            console.log(`- [${task.id}] ${task.content}${completedStr}`)
          }
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
