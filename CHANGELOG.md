# Changelog

## [2.0.0] - 2026-05-21

### Breaking Changes
- Migrated from `@doist/todoist-api-typescript@6.4.1` (REST v2 + Sync v9, deprecated) to `@doist/todoist-sdk@10.3.0` (Unified API v1)

### Added
- `todoist task create --reminder <datetime>` — absolute push reminder (e.g. `"2026-05-23 13:30"`)
- `todoist task create --reminder-before <minutes>` — relative push reminder N minutes before due
- `--json` output for `task create` now includes `reminder_id` when a reminder is set

### Fixed
- `todoist task update <id>` — was returning HTTP 400 with legacy SDK, now works correctly with API v1
- `todoist task move <id> --project-id <id>` — was returning HTTP 400 (move via updateTask was removed from API v1); now uses dedicated `moveTask` endpoint

## [1.0.0] - 2026-05-20

Initial release.
