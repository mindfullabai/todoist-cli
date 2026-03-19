export function formatTask(task: {
  id: string
  content: string
  due?: { date: string; string?: string } | null
  priority: number
  labels: string[]
  projectId: string
  projectName?: string
  description?: string
}): string {
  const parts: string[] = [`- [${task.id}] ${task.content}`]
  const meta: string[] = []

  if (task.due?.date) meta.push(`due: ${task.due.date}`)
  meta.push(`p${task.priority}`)
  if (task.labels.length > 0) meta.push(`labels: ${task.labels.join(', ')}`)
  if (task.projectName) meta.push(`project: ${task.projectName}`)

  if (meta.length > 0) {
    parts.push(`(${meta.join(', ')})`)
  }

  return parts.join(' ')
}

export function formatProject(project: {
  id: string
  name: string
  color: string
  isFavorite: boolean
  isInboxProject?: boolean
}): string {
  const flags: string[] = []
  if (project.isFavorite) flags.push('favorite')
  if (project.isInboxProject) flags.push('inbox')
  const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : ''
  return `- [${project.id}] ${project.name} (color: ${project.color})${flagStr}`
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

export function printError(msg: string): void {
  console.error(`Error: ${msg}`)
}
