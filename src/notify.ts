import type { NotificationMethod } from "./config"

type ResolvedMethod = Exclude<NotificationMethod, "auto">

const DEBOUNCE_MS = 1000

const lastNotificationTime: Record<string, number> = {}

/**
 * Send a terminal bell (BEL character \x07)
 * This is the most widely supported method - works in virtually all terminals.
 * The terminal will typically flash or play a system sound.
 */
function sendBell(): void {
  process.stdout.write("\x07")
}

/**
 * Send an OSC 9 notification (iTerm2 style)
 * Format: ESC ] 9 ; message ST
 * Supported by: iTerm2, Hyper, some other terminals
 * This displays a native macOS notification from iTerm2.
 */
function sendOSC9(message: string): void {
  // OSC 9 ; message ST (where ST = ESC \)
  const escaped = message.replace(/[\x00-\x1f\x7f]/g, "")
  process.stdout.write(`\x1b]9;${escaped}\x1b\\`)
}

/**
 * Send an OSC 777 notification (rxvt-unicode style)
 * Format: ESC ] 777 ; notify ; title ; message ST
 * Supported by: rxvt-unicode, some other terminals
 */
function sendOSC777(title: string, message: string): void {
  // OSC 777 ; notify ; title ; body ST
  const escapedTitle = title.replace(/[\x00-\x1f\x7f;]/g, "")
  const escapedMessage = message.replace(/[\x00-\x1f\x7f;]/g, "")
  process.stdout.write(`\x1b]777;notify;${escapedTitle};${escapedMessage}\x1b\\`)
}

/**
 * Send an OSC 99 notification (Kitty style)
 * Format: ESC ] 99 ; i=id:d=0:p=body ; message ST
 * Supported by: Kitty terminal
 * See: https://sw.kovidgoyal.net/kitty/desktop-notifications/
 */
function sendOSC99(title: string, message: string): void {
  // Simple version: just title and body
  // Full spec supports more options like icons, urgency, etc.
  const escapedTitle = title.replace(/[\x00-\x1f\x7f;]/g, "")
  const escapedMessage = message.replace(/[\x00-\x1f\x7f;]/g, "")
  // Format: \e]99;i=<id>:d=0;title\e\\  for title
  //         \e]99;i=<id>:d=1:p=body;message\e\\  for body
  // Simplified: \e]99;d=0;title - message\e\\
  process.stdout.write(`\x1b]99;d=0;${escapedTitle} - ${escapedMessage}\x1b\\`)
}

export function sendNotification(
  method: ResolvedMethod,
  title: string,
  message: string
): void {
  const key = `${method}:${message}`
  const now = Date.now()

  if (lastNotificationTime[key] && now - lastNotificationTime[key] < DEBOUNCE_MS) {
    return
  }
  lastNotificationTime[key] = now

  switch (method) {
    case "bell":
      sendBell()
      break
    case "osc9":
      // OSC 9 only supports a single message (no separate title)
      sendOSC9(`${title}: ${message}`)
      break
    case "osc777":
      sendOSC777(title, message)
      break
    case "osc99":
      sendOSC99(title, message)
      break
  }
}
