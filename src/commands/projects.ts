import { Command } from 'commander'
import { getClient, getAllProjects } from '../lib/api.js'
import { formatProject, printJson, printError } from '../lib/output.js'

export function registerProjectsCommand(program: Command, token?: string) {
  // todoist projects - list all
  program
    .command('projects')
    .description('List all projects')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (opts: { json?: boolean; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        const projects = await getAllProjects(client)

        if (projects.length === 0) {
          console.log('No projects found.')
          return
        }

        if (opts.json) {
          printJson(projects.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            isFavorite: p.isFavorite,
            isInboxProject: p.isInboxProject,
          })))
        } else {
          console.log('# Projects')
          for (const project of projects) {
            console.log(formatProject(project))
          }
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}

export function registerProjectCommand(program: Command, token?: string) {
  const projectCmd = program
    .command('project')
    .description('Project operations: get, create, update, delete')

  // todoist project <id> - get detail
  projectCmd
    .command('<id>')
    .description('Get project detail by ID')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { json?: boolean; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        const project = await client.getProject(id)

        if (opts.json) {
          printJson(project)
        } else {
          console.log(formatProject(project))
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist project create "Nome" [--color berry_red]
  projectCmd
    .command('create')
    .description('Create a new project')
    .argument('<name>', 'Project name')
    .option('--color <color>', 'Project color (e.g. berry_red, blue, green)')
    .option('--favorite', 'Mark as favorite')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (name: string, opts: { color?: string; favorite?: boolean; json?: boolean; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        const project = await client.addProject({
          name,
          color: opts.color,
          isFavorite: opts.favorite,
        })

        if (opts.json) {
          printJson(project)
        } else {
          console.log(`Created: [${project.id}] ${project.name}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist project update <id>
  projectCmd
    .command('update')
    .description('Update project fields')
    .argument('<id>', 'Project ID')
    .option('--name <name>', 'New name')
    .option('--color <color>', 'New color')
    .option('--favorite', 'Mark as favorite')
    .option('--json', 'Output JSON')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { name?: string; color?: string; favorite?: boolean; json?: boolean; token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        const updates: Record<string, unknown> = {}
        if (opts.name) updates.name = opts.name
        if (opts.color) updates.color = opts.color
        if (opts.favorite !== undefined) updates.isFavorite = opts.favorite

        const project = await client.updateProject(id, updates)

        if (opts.json) {
          printJson(project)
        } else {
          console.log(`Updated: [${project.id}] ${project.name}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  // todoist project delete <id>
  projectCmd
    .command('delete')
    .description('Delete a project permanently')
    .argument('<id>', 'Project ID')
    .option('--token <token>', 'Todoist API token')
    .action(async (id: string, opts: { token?: string }) => {
      const client = getClient(opts.token || token)
      try {
        await client.deleteProject(id)
        console.log(`Deleted: ${id}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
