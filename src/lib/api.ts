import { TodoistApi } from '@doist/todoist-sdk'
import type { Task, Project } from '@doist/todoist-sdk'

let _client: TodoistApi | null = null

export function getClient(token?: string): TodoistApi {
  const resolvedToken = token || process.env.TODOIST_API_TOKEN
  if (!resolvedToken) {
    console.error('Error: TODOIST_API_TOKEN env var not set. Use --token or set TODOIST_API_TOKEN.')
    process.exit(1)
  }
  if (!_client) {
    _client = new TodoistApi(resolvedToken)
  }
  return _client
}

export function resetClient() {
  _client = null
}

export async function getAllProjects(client: TodoistApi): Promise<Project[]> {
  const res = await client.getProjects()
  return res.results
}

export async function getAllTasks(client: TodoistApi, params?: { projectId?: string }): Promise<Task[]> {
  const res = await client.getTasks(params)
  return res.results
}

export async function getTasksByFilter(client: TodoistApi, query: string): Promise<Task[]> {
  const res = await client.getTasksByFilter({ query })
  return res.results
}
