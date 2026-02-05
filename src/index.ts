import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { basename } from "path"
import { loadConfig, isEventEnabled, getEventMethod, getMessage } from "./config"
import type { EventType, NotifierConfig } from "./config"
import { sendNotification } from "./notify"

function getNotificationTitle(config: NotifierConfig, projectName: string | null): string {
  if (config.showProjectName && projectName) {
    return `OpenCode (${projectName})`
  }
  return "OpenCode"
}

function handleEvent(
  config: NotifierConfig,
  eventType: EventType,
  projectName: string | null
): void {
  if (!isEventEnabled(config, eventType)) {
    return
  }

  const title = getNotificationTitle(config, projectName)
  const message = getMessage(config, eventType)
  const method = getEventMethod(config, eventType)

  sendNotification(method, title, message)
}

function getSessionIDFromEvent(event: unknown): string | null {
  const sessionID = (event as any)?.properties?.sessionID
  if (typeof sessionID === "string" && sessionID.length > 0) {
    return sessionID
  }
  return null
}

async function isChildSession(
  client: PluginInput["client"],
  sessionID: string
): Promise<boolean> {
  try {
    const response = await client.session.get({ path: { id: sessionID } })
    const parentID = response.data?.parentID
    return !!parentID
  } catch {
    return false
  }
}

export const TerminalNotifierPlugin: Plugin = async ({ client, directory }) => {
  const config = loadConfig()
  const projectName = directory ? basename(directory) : null

  // Don't set up hooks if notifications are globally disabled
  if (!config.enabled) {
    return {}
  }

  return {
    event: async ({ event }) => {
      if (event.type === "permission.updated") {
        handleEvent(config, "permission", projectName)
      }

      if ((event as any).type === "permission.asked") {
        handleEvent(config, "permission", projectName)
      }

      if (event.type === "session.idle") {
        const sessionID = getSessionIDFromEvent(event)
        if (sessionID) {
          const isChild = await isChildSession(client, sessionID)
          if (!isChild) {
            handleEvent(config, "complete", projectName)
          } else {
            handleEvent(config, "subagent_complete", projectName)
          }
        } else {
          handleEvent(config, "complete", projectName)
        }
      }

      if (event.type === "session.error") {
        handleEvent(config, "error", projectName)
      }
    },
    "permission.ask": async () => {
      handleEvent(config, "permission", projectName)
    },
    "tool.execute.before": async (input) => {
      if (input.tool === "question") {
        handleEvent(config, "question", projectName)
      }
    },
  }
}

export default TerminalNotifierPlugin
