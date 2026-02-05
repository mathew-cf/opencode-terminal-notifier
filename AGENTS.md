# AGENTS.md

Best practices for AI agents working on this codebase.

## Project Overview

This is an OpenCode plugin that sends terminal notifications (bell, OSC escape sequences) when OpenCode events occur. It's a TypeScript project using Bun as the runtime/bundler.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun run build` | Build to `dist/` |
| `bun run typecheck` | Type check without emitting |
| `bun run sync-version` | Sync version from package.json to README |

## Architecture

```
src/
  index.ts   # Plugin entry point, event handlers, exports Plugin interface
  config.ts  # Config loading, terminal detection, type definitions
  notify.ts  # Notification methods (bell, OSC9, OSC777, OSC99)
```

### Key Concepts

- **Plugin interface**: Exports `TerminalNotifierPlugin` implementing `@opencode-ai/plugin` Plugin type
- **Event types**: `permission`, `complete`, `subagent_complete`, `error`, `question`
- **Notification methods**: `bell` (universal), `osc9` (iTerm2), `osc777` (Ghostty), `osc99` (Kitty/WezTerm)
- **Config file**: User config at `~/.config/opencode/terminal-notifier.json`

## Code Style

- Use TypeScript strict mode
- Prefer explicit types for function parameters and return values
- Use `type` imports for type-only imports
- Keep functions small and focused
- No external runtime dependencies (only dev/peer deps)

## Common Tasks

### Adding a New Event Type

1. Add type to `EventType` union in `config.ts:5-10`
2. Add to `NotifierConfig.events` interface in `config.ts:23-28`
3. Add to `NotifierConfig.messages` interface in `config.ts:30-36`
4. Add default config in `DEFAULT_CONFIG` in `config.ts:90-108`
5. Handle the event in `index.ts` event handler

### Adding a New Notification Method

1. Add to `NotificationMethod` type in `config.ts:12`
2. Add detection logic in `detectBestMethod()` in `config.ts:58-84`
3. Implement the method in `notify.ts`
4. Add case to switch in `sendNotification()` in `notify.ts:72-86`
5. Update `isValidMethod()` in `config.ts:114-119`

### Testing Locally

1. Build: `bun run build`
2. Add to OpenCode config:
   ```json
   { "plugin": ["/path/to/opencode-terminal-notifier"] }
   ```
3. Restart OpenCode

## Gotchas

- **No tests**: This project doesn't have automated tests. Manual testing in different terminals is required.
- **OSC escape sequences**: Each terminal has different support. Always test changes in multiple terminals.
- **Debouncing**: `notify.ts` has a 1-second debounce to prevent notification spam. Be aware when testing rapid events.
- **Session detection**: `isChildSession()` makes an async API call - be mindful of error handling.
- **Config parsing**: `loadConfig()` silently returns defaults on any parse error. This is intentional for UX.

## Terminal Compatibility

When modifying notification logic, test with:
- iTerm2 (OSC 9)
- Kitty (OSC 99)
- Ghostty (OSC 777)
- Terminal.app or Alacritty (bell fallback)

## Publishing

1. Update version in `package.json` (use `npm version patch/minor/major` to auto-sync README)
2. `bun run build` (also runs via `prepublishOnly`)
3. `npm publish`

The `version` npm lifecycle hook automatically runs `sync-version` and stages the README.
