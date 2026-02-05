import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export type EventType =
  | "permission"
  | "complete"
  | "subagent_complete"
  | "error"
  | "question";

export type NotificationMethod = "bell" | "osc9" | "osc777" | "osc99" | "auto";

export interface EventConfig {
  enabled: boolean;
  method?: NotificationMethod;
}

export interface NotifierConfig {
  enabled: boolean;
  method: NotificationMethod;
  showProjectName: boolean;
  events: {
    permission: EventConfig;
    complete: EventConfig;
    subagent_complete: EventConfig;
    error: EventConfig;
    question: EventConfig;
  };
  messages: {
    permission: string;
    complete: string;
    subagent_complete: string;
    error: string;
    question: string;
  };
}

/**
 * Detect the best notification method based on TERM_PROGRAM.
 * Prefers OSC notifications with title+body support where available.
 *
 * OSC 99 support (title + body desktop notifications):
 * - Kitty: Native support (protocol originator)
 * - WezTerm: Native support
 * - foot: Native support
 *
 * OSC 777 support (title + body desktop notifications):
 * - Ghostty: Native support
 * - rxvt-unicode (urxvt): Native support (protocol originator)
 *
 * OSC 9 support (single message notifications):
 * - iTerm2: Native support (protocol originator)
 *
 * Bell fallback (works everywhere):
 * - Alacritty, Terminal.app, and other terminals without OSC notification support
 */
export function detectBestMethod(): Exclude<NotificationMethod, "auto"> {
  const termProgram = process.env.TERM_PROGRAM?.toLowerCase() ?? "";

  // Terminals with OSC 99 support (title + body desktop notifications)
  // Prefer this when available as it provides richer notifications
  if (
    termProgram === "kitty" ||
    termProgram === "wezterm" ||
    termProgram === "foot"
  ) {
    return "osc99";
  }

  // Terminals with OSC 777 support (title + body desktop notifications)
  // Ghostty supports both OSC 9 and OSC 777; prefer OSC 777 for title+body
  if (termProgram === "ghostty") {
    return "osc777";
  }

  // Terminals with OSC 9 support (single message notifications)
  if (termProgram === "iterm.app") {
    return "osc9";
  }

  // Default to bell - works in all terminals
  return "bell";
}

const DEFAULT_EVENT_CONFIG: EventConfig = {
  enabled: true,
};

const DEFAULT_CONFIG: NotifierConfig = {
  enabled: true,
  method: "auto",
  showProjectName: true,
  events: {
    permission: { ...DEFAULT_EVENT_CONFIG },
    complete: { enabled: false },
    subagent_complete: { enabled: false },
    error: { ...DEFAULT_EVENT_CONFIG },
    question: { ...DEFAULT_EVENT_CONFIG },
  },
  messages: {
    permission: "Session needs permission",
    complete: "Session has finished",
    subagent_complete: "Subagent task completed",
    error: "Session encountered an error",
    question: "Session has a question",
  },
};

function getConfigPath(): string {
  return join(homedir(), ".config", "opencode", "terminal-notifier.json");
}

function isValidMethod(method: unknown): method is NotificationMethod {
  return (
    typeof method === "string" &&
    ["bell", "osc9", "osc777", "osc99", "auto"].includes(method)
  );
}

function parseEventConfig(
  userEvent:
    | boolean
    | { enabled?: boolean; method?: NotificationMethod }
    | undefined,
  defaultConfig: EventConfig,
): EventConfig {
  if (userEvent === undefined) {
    return defaultConfig;
  }

  if (typeof userEvent === "boolean") {
    return {
      enabled: userEvent,
    };
  }

  return {
    enabled: userEvent.enabled ?? defaultConfig.enabled,
    method: isValidMethod(userEvent.method) ? userEvent.method : undefined,
  };
}

export function loadConfig(): NotifierConfig {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const fileContent = readFileSync(configPath, "utf-8");
    const userConfig = JSON.parse(fileContent);

    const globalEnabled = userConfig.enabled ?? DEFAULT_CONFIG.enabled;
    const globalMethod = isValidMethod(userConfig.method)
      ? userConfig.method
      : DEFAULT_CONFIG.method;

    const defaultWithGlobal: EventConfig = {
      enabled: globalEnabled,
    };

    return {
      enabled: globalEnabled,
      method: globalMethod,
      showProjectName:
        userConfig.showProjectName ?? DEFAULT_CONFIG.showProjectName,
      events: {
        permission: parseEventConfig(
          userConfig.events?.permission,
          defaultWithGlobal,
        ),
        complete: parseEventConfig(
          userConfig.events?.complete,
          defaultWithGlobal,
        ),
        subagent_complete: parseEventConfig(
          userConfig.events?.subagent_complete,
          { enabled: false },
        ),
        error: parseEventConfig(userConfig.events?.error, defaultWithGlobal),
        question: parseEventConfig(
          userConfig.events?.question,
          defaultWithGlobal,
        ),
      },
      messages: {
        permission:
          userConfig.messages?.permission ?? DEFAULT_CONFIG.messages.permission,
        complete:
          userConfig.messages?.complete ?? DEFAULT_CONFIG.messages.complete,
        subagent_complete:
          userConfig.messages?.subagent_complete ??
          DEFAULT_CONFIG.messages.subagent_complete,
        error: userConfig.messages?.error ?? DEFAULT_CONFIG.messages.error,
        question:
          userConfig.messages?.question ?? DEFAULT_CONFIG.messages.question,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function isEventEnabled(
  config: NotifierConfig,
  event: EventType,
): boolean {
  return config.events[event].enabled;
}

export function getEventMethod(
  config: NotifierConfig,
  event: EventType,
): Exclude<NotificationMethod, "auto"> {
  const method = config.events[event].method ?? config.method;
  if (method === "auto") {
    return detectBestMethod();
  }
  return method;
}

export function getMessage(config: NotifierConfig, event: EventType): string {
  return config.messages[event];
}
