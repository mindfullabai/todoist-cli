# @mindfullabai/todoist-cli

AI-native Todoist CLI. Self-describing for AI agents via `--ai` flag. **~84% fewer tokens than MCP.**

## Why not MCP?

MCP servers load their complete tool schema into the AI's context window at conversation start. For Todoist, that's **4,243 tokens** for 14 tools - before any work happens.

This CLI uses **205 tokens** for the same discovery. Per-operation savings: **65%**. Total session savings: **84% (6.2x)**.

See [our benchmark](#benchmark) for real numbers.

## Install

```bash
npm install -g @mindfullabai/todoist-cli
```

Set your API token:
```bash
export TODOIST_API_TOKEN="your-token-here"
```

## Usage

### Tasks
```bash
todoist tasks                              # Today + overdue
todoist tasks --project "1. Building"      # Filter by project name
todoist tasks --all                        # All active tasks
todoist task create "Deploy v2" --project "1. Building" --due "friday" --priority 3
todoist task complete <id>
todoist task update <id> --due "next monday"
todoist task move <id> --project "0. Career"
todoist task delete <id>
todoist task reopen <id>
```

### Completed Tasks
```bash
todoist completed                          # Today
todoist completed --week                   # This week
todoist completed --since 2026-03-01 --until 2026-03-19
todoist completed --project "1. Building"
```

### Projects
```bash
todoist projects                           # List all
todoist project <id>                       # Details
todoist project create "New Project" --color berry_red
todoist project update <id> --name "Renamed"
todoist project delete <id>
```

## AI Agent Integration

This CLI is designed to be used by AI agents (Claude Code, Cursor, etc.) as a more efficient alternative to MCP.

### Discovery

```bash
todoist --ai              # Full JSON manifest (all commands, params, examples)
todoist --ai brief        # One-liner per command (~205 tokens)
todoist --ai examples     # Usage examples
todoist --ai tasks        # Schema for specific command
```

### Claude Code Setup

```bash
todoist setup-claude      # Installs skill + permissions automatically
```

This creates a skill file at `~/.claude/skills/todoist-cli/SKILL.md` and adds `Bash(todoist:*)` permission.

### Output Format

Default output is **plain text**, optimized for minimal token usage:

```
# Tasks - today + overdue
- [6g64wC7x3] Deploy v2 (due: 2026-03-20, p3, labels: Task#1, project: 1. Building)
- [6g7R3FXpC] Fix auth bug (due: 2026-03-19, p4, project: 1. Building)
```

Use `--json` flag for structured JSON output when needed.

## Benchmark

Real measurements comparing this CLI vs the equivalent MCP server (same Todoist account, same operations):

| Metric | MCP | CLI | Savings |
|--------|-----|-----|---------|
| Discovery (per conversation) | 4,243 tokens | 205 tokens | **95%** |
| "List today's tasks" (5 tasks) | ~530 tokens | ~183 tokens | **65%** |
| Per-task response | ~96 tokens | ~32 tokens | **67%** |
| Typical session (5 ops) | 6,893 tokens | 1,120 tokens | **84%** |

## Part of the AI-Native CLI Pattern

This tool follows the **AI-native CLI** pattern: command-line tools that self-describe via `--ai` flag for AI agent consumption.

Other tools using this pattern:
- [@mindfullabai/ai-vision-cli](https://github.com/mindfullabai/ai-vision-cli) - Image/video analysis with Gemini

## License

MIT
