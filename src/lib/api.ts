import { TodoistApi } from '@doist/todoist-api-typescript'
import type { Task, Project } from '@doist/todoist-api-typescript'

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

// SDK v6 returns { results: T[], nextCursor: string|null } instead of T[]
type PaginatedResponse<T> = { results: T[]; nextCursor?: string | null } | T[]

export function extractResults<T>(res: PaginatedResponse<T>): T[] {
  if (Array.isArray(res)) return res
  return (res as { results: T[] }).results ?? []
}

export async function getAllProjects(client: TodoistApi): Promise<Project[]> {
  const res = await client.getProjects() as PaginatedResponse<Project>
  return extractResults(res)
}

export async function getAllTasks(client: TodoistApi, params?: { projectId?: string }): Promise<Task[]> {
  const res = await client.getTasks(params) as PaginatedResponse<Task>
  return extractResults(res)
}

export async function getTasksByFilter(client: TodoistApi, query: string): Promise<Task[]> {
  const api = client as unknown as { getTasksByFilter: (p: { query: string }) => Promise<PaginatedResponse<Task>> }
  const res = await api.getTasksByFilter({ query })
  return extractResults(res)
}
