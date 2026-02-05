# opencode-terminal-notifier

OpenCode plugin that sends native terminal notifications when permission is needed, generation completes, errors occur, or the question tool is invoked.

Unlike system notification plugins, this uses terminal escape sequences that work directly in your terminal emulator - no external dependencies required.

> **Note:** These notifications are most useful when your terminal is out of focus (e.g., you've switched to another app). The bell will alert you via sound or dock bounce, and OSC notifications will show system notifications - allowing you to know when OpenCode needs attention without constantly watching the terminal.

## Notification Methods

| Method | Description | Terminal Support |
|--------|-------------|------------------|
| `auto` | Auto-detect best method (default) | See below |
| `bell` | Terminal bell (BEL character) | All terminals |
| `osc9` | OSC 9 notifications | iTerm2 |
| `osc777` | OSC 777 notifications | Ghostty, rxvt-unicode, urxvt |
| `osc99` | OSC 99 desktop notifications | Kitty, WezTerm, foot |

### Auto-detection

When `method` is set to `"auto"` (the default), the plugin reads `TERM_PROGRAM` to detect your terminal and choose the best notification method:

| Terminal | TERM_PROGRAM | Method Used |
|----------|--------------|-------------|
| Kitty | `kitty` | `osc99` |
| WezTerm | `wezterm` | `osc99` |
| foot | `foot` | `osc99` |
| Ghostty | `ghostty` | `osc777` |
| iTerm2 | `iTerm.app` | `osc9` |
| All others | — | `bell` |

This means you typically don't need any configuration - the plugin will automatically use desktop notifications if your terminal supports them, or fall back to the terminal bell.

## Installation

Add the plugin to your `opencode.json` or `opencode.jsonc`:

```json
{
  "plugin": ["@mathew-cf/opencode-terminal-notifier@latest"]
}
```

Or for a specific version:

```json
{
  "plugin": ["@mathew-cf/opencode-terminal-notifier@0.1.0"]
}
```

Restart OpenCode. The plugin will be automatically installed and loaded.

## Configuration

To customize the plugin, create `~/.config/opencode/terminal-notifier.json`:

```json
{
  "enabled": true,
  "method": "auto",
  "showProjectName": true,
  "events": {
    "permission": { "enabled": true },
    "complete": { "enabled": true },
    "subagent_complete": { "enabled": false },
    "error": { "enabled": true },
    "question": { "enabled": true }
  },
  "messages": {
    "permission": "Session needs permission",
    "complete": "Session has finished",
    "subagent_complete": "Subagent task completed",
    "error": "Session encountered an error",
    "question": "Session has a question"
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Global toggle for all notifications |
| `method` | string | `"auto"` | Notification method (`auto`, `bell`, `osc9`, `osc777`, `osc99`) |
| `showProjectName` | boolean | `true` | Include project folder name in notification title |

### Events

Control notifications separately for each event:

```json
{
  "events": {
    "permission": { "enabled": true, "method": "osc9" },
    "complete": { "enabled": true },
    "subagent_complete": { "enabled": false },
    "error": { "enabled": true, "method": "bell" },
    "question": { "enabled": true }
  }
}
```

Or use a boolean to toggle:

```json
{
  "events": {
    "permission": true,
    "complete": true,
    "subagent_complete": false,
    "error": true,
    "question": true
  }
}
```

Each event can override the global `method` setting.

### Messages

Customize notification text:

```json
{
  "messages": {
    "permission": "Action required",
    "complete": "Done!",
    "subagent_complete": "Subagent finished",
    "error": "Something went wrong",
    "question": "Input needed"
  }
}
```

## Terminal Setup

### Bell (`bell`)

Works out of the box on all terminals. When the terminal is **out of focus**, your terminal may:
- Play a system sound
- Flash the window/tab
- Bounce the dock icon (macOS)
- Show in the taskbar (Windows/Linux)

Configure bell behavior in your terminal's preferences. Most terminals have options for what happens when a bell is received while the window is not focused.

### iTerm2 (`osc9`)

1. Open **iTerm2 > Preferences > Profiles > Terminal**
2. Check **"Enable notifications"** or configure notification triggers
3. Set `"method": "osc9"` in your config

### Kitty (`osc99`)

Kitty supports desktop notifications natively. Set `"method": "osc99"` in your config.

See [Kitty Desktop Notifications](https://sw.kovidgoyal.net/kitty/desktop-notifications/) for more options.

### Ghostty (`osc777`)

Ghostty supports OSC 777 desktop notifications natively. The plugin will auto-detect Ghostty and use this method automatically.

### rxvt-unicode (`osc777`)

If using rxvt-unicode with a notification extension, set `"method": "osc777"`.

## Comparison with opencode-notifier

| Feature | opencode-notifier | opencode-terminal-notifier |
|---------|-------------------|----------------------------|
| System notifications | Yes | No (uses terminal escapes) |
| Sound support | Yes (bundled WAV files) | No (use terminal bell) |
| External dependencies | `node-notifier` | None |
| Custom commands | Yes | No |
| Works in all terminals | N/A | Bell works everywhere |
| Zero config notifications | via OS | via terminal |

This plugin is ideal if you:
- Want lightweight, dependency-free notifications
- Prefer terminal-native solutions
- Use a terminal that supports OSC notifications
- Just need a simple bell/alert when tasks complete
- Often switch away from the terminal while waiting for OpenCode to finish

## Troubleshooting

### Check which method auto-detection chooses

To see what `TERM_PROGRAM` your terminal sets (which determines auto-detection):

```bash
echo $TERM_PROGRAM
```

### Bell not working

1. Check your terminal's bell settings (often under Preferences > Terminal or Audio)
2. Make sure system volume is not muted
3. Some terminals have "visual bell" - check if the window flashes instead

### OSC notifications not showing

1. Verify your terminal supports the chosen OSC method
2. Check terminal notification permissions in System Preferences (macOS)
3. Try using `bell` as a fallback

### Testing notifications

You can test terminal escape sequences directly. **Switch to another application after running the command** to see the notification effect (dock bounce, system notification, etc.):

```bash
# Test bell - switch away from terminal within 2 seconds to see the effect
sleep 2 && echo -e "\a"

# Test OSC 9 (iTerm2) - switch away from terminal within 2 seconds
sleep 2 && echo -e "\e]9;Test notification\e\\"

# Test OSC 99 (Kitty) - switch away from terminal within 2 seconds
sleep 2 && echo -e "\e]99;d=0;Test notification\e\\"
```

These tests give you 2 seconds to switch to another app before the notification fires, so you can verify your terminal alerts you when it's not focused.

## License

MIT
