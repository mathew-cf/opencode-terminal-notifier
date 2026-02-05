# opencode-terminal-notifier

Get notified when OpenCode needs your attention - even when you've switched to another app.

This plugin alerts you with a sound, dock bounce, or desktop notification when:
- OpenCode needs permission to proceed
- A task finishes
- An error occurs
- OpenCode has a question for you

No setup required for most users. Just install and go.

## Installation

Add one line to your OpenCode config file (`opencode.json` or `opencode.jsonc`):

```json
{
  "plugin": ["@mathew-cf/opencode-terminal-notifier@0.1.2"]
}
```

Then restart OpenCode. That's it!

> **Where's my config file?** It's usually at `~/.config/opencode/opencode.json` (Mac/Linux) or in your project folder.

## How It Works

When you switch away from your terminal to do other work, this plugin will get your attention when OpenCode needs you:

- **Sound or dock bounce** - Works in any terminal
- **Desktop notifications** - Appear in your notification center (supported terminals only)

The plugin automatically detects your terminal and uses the best notification method available.

### Supported Terminals

| Terminal | What You'll Get |
|----------|-----------------|
| **Ghostty** | Desktop notifications |
| **iTerm2** | Desktop notifications |
| **Kitty** | Desktop notifications |
| **WezTerm** | Desktop notifications |
| **All others** | Sound + dock bounce |

## Configuration (Optional)

The plugin works without any configuration. But if you want to customize it, create a file at `~/.config/opencode/terminal-notifier.json`:

```json
{
  "enabled": true,
  "events": {
    "permission": true,
    "complete": false,
    "subagent_complete": false,
    "error": true,
    "question": true
  }
}
```

### Turn Off Specific Notifications

Don't want to be notified when tasks complete? Just disable that event:

```json
{
  "events": {
    "complete": false
  }
}
```

### Customize Notification Messages

```json
{
  "messages": {
    "permission": "Action required",
    "complete": "Done!",
    "error": "Something went wrong",
    "question": "Input needed"
  }
}
```

### All Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Turn all notifications on/off |
| `method` | `"auto"` | How to notify (usually leave as `auto`) |
| `showProjectName` | `true` | Show project folder name in notifications |

## Troubleshooting

### I don't hear anything

1. Make sure your system volume isn't muted
2. Check your terminal's sound/bell settings (look in Preferences)
3. Some terminals flash the screen instead of playing a sound - this is called "visual bell"

### Desktop notifications aren't showing

1. Make sure your terminal has notification permissions (check System Settings > Notifications on Mac)
2. Your terminal might not support desktop notifications - the plugin will fall back to sound/dock bounce

### Test if it's working

Run this command, then quickly switch to another app:

```bash
sleep 2 && echo -e "\a"
```

If your terminal is set up correctly, you'll hear a sound or see your dock icon bounce after 2 seconds.

---

## Advanced Configuration

<details>
<summary>Click to expand advanced options</summary>

### Notification Methods

The plugin supports several notification methods:

| Method | Description | Terminals |
|--------|-------------|-----------|
| `auto` | Automatically choose the best method | All |
| `bell` | Terminal bell (sound/visual) | All |
| `osc9` | Desktop notifications | iTerm2 |
| `osc777` | Desktop notifications | Ghostty, rxvt-unicode |
| `osc99` | Desktop notifications | Kitty, WezTerm, foot |

### Per-Event Method Override

Use a different notification method for specific events:

```json
{
  "events": {
    "permission": { "enabled": true, "method": "osc9" },
    "complete": { "enabled": true },
    "error": { "enabled": true, "method": "bell" },
    "question": { "enabled": true }
  }
}
```

### Terminal-Specific Setup

#### iTerm2

1. Open **iTerm2 > Preferences > Profiles > Terminal**
2. Enable **"Notifications"** or configure notification triggers

#### Kitty

Works automatically. See [Kitty Desktop Notifications](https://sw.kovidgoyal.net/kitty/desktop-notifications/) for advanced options.

#### Ghostty

Works automatically with OSC 777 notifications.

### Check Your Terminal Type

To see what terminal the plugin detects:

```bash
echo $TERM_PROGRAM
```

### Test Specific Notification Methods

Switch to another app after running these commands:

```bash
# Test bell
sleep 2 && echo -e "\a"

# Test OSC 9 (iTerm2)
sleep 2 && echo -e "\e]9;Test notification\e\\"

# Test OSC 99 (Kitty)
sleep 2 && echo -e "\e]99;d=0;Test notification\e\\"
```

</details>

---

## Comparison with opencode-notifier

| | opencode-notifier | opencode-terminal-notifier |
|---|-------------------|----------------------------|
| Desktop notifications | Yes (via OS) | Yes (via terminal) |
| Sound support | Bundled sounds | Terminal bell |
| Dependencies | `node-notifier` | None |
| Setup complexity | More options | Simpler |

Choose **this plugin** if you want something lightweight that just works. Choose **opencode-notifier** if you want more control over system notifications and custom sounds.

---

## Development

Want to contribute or modify this plugin? Here's how to set it up locally.

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or later

### Setup

```bash
git clone https://github.com/mathew-cf/opencode-terminal-notifier.git
cd opencode-terminal-notifier
bun install
```

### Build

```bash
bun run build
```

### Type Check

```bash
bun run typecheck
```

### Project Structure

```
src/
  index.ts     # Plugin entry point and event handlers
  config.ts    # Configuration loading and validation
  notify.ts    # Notification methods (bell, OSC sequences)
dist/          # Compiled output (generated by build)
```

### Test Locally

1. Build the plugin: `bun run build`
2. Point OpenCode to your local copy:
   ```json
   {
     "plugin": ["/path/to/opencode-terminal-notifier"]
   }
   ```
3. Restart OpenCode

---

## License

Apache 2.0
